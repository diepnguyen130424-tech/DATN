import {useEffect, useMemo, useState} from "react";
import "./EmployeeCounterSale.css";

const API = "http://localhost:8080/api";

/* =========================================================
   CẤU HÌNH NGÂN HÀNG ĐỂ SINH QR (VietQR)
   👉 Thay bằng thông tin ngân hàng thật của bạn
   ========================================================= */
const BANK_CONFIG = {
    bankId: "970436",                       // BIN ngân hàng (VCB)
    accountNo: "1234567890",                // Số tài khoản
    accountName: "CONG TY TNHH FSHOP",      // Tên chủ TK
    template: "compact2",                   // compact | compact2 | qr_only
};

/* Danh sách bankId tham khảo:
   - 970436  Vietcombank
   - 970415  VietinBank
   - 970407  Techcombank
   - 970422  MB Bank
   - 970416  ACB
   - 970432  VPBank
   - 970418  BIDV
*/

/* =========================================================
   HELPERS
   ========================================================= */

function formatMoney(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function parseMoneyInput(value) {
    // "1.000.000" → 1000000
    return Number(String(value || "").replace(/[^\d]/g, "")) || 0;
}

function formatMoneyInput(value) {
    // 1000000 → "1.000.000"
    const n = parseMoneyInput(value);
    return n ? n.toLocaleString("vi-VN") : "";
}

async function readJson(url, options) {
    const response = await fetch(url, options);
    const text = await response.text();
    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(
            data?.message || data?.error || text || "Không thể kết nối máy chủ"
        );
    }

    return data;
}

function PageHeading({eyebrow = "FSHOP NHÂN VIÊN", title, description, action}) {
    return (
        <div className="employee-heading">
            <div>
                <span className="employee-eyebrow">{eyebrow}</span>
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            {action}
        </div>
    );
}

function buildVietQrUrl(amount, content) {
    const base = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png`;
    const params = new URLSearchParams({
        amount: String(amount),
        addInfo: content,
        accountName: BANK_CONFIG.accountName,
    });
    return `${base}?${params.toString()}`;
}

/* =========================================================
   MODAL THANH TOÁN
   ========================================================= */

function PaymentModal({
                          open,
                          onClose,
                          method,
                          total,
                          onConfirm,
                          loading,
                      }) {
    const [cashReceived, setCashReceived] = useState("");
    const [note, setNote] = useState("");
    const [paidConfirmed, setPaidConfirmed] = useState(false);

    // -----------------------------------------------------
    // RESET KHI MỞ MODAL
    // -----------------------------------------------------
    useEffect(() => {
        if (open) {
            setCashReceived("");
            setNote("");
            setPaidConfirmed(false);
        }
    }, [open, method]);

    // -----------------------------------------------------
    // TÍNH TOÁN — ĐẶT TRƯỚC EARLY RETURN (Rules of Hooks)
    // -----------------------------------------------------
    const received = parseMoneyInput(cashReceived);
    const change = received - total;
    const isCashEnough = received >= total;

    const transferContent = useMemo(() => {
        const base = note.trim() || "Thanh toan don hang";
        const code = `POS${Date.now().toString().slice(-6)}`;
        return `${base} ${code}`;
    }, [note]);

    const qrUrl = useMemo(
        () => buildVietQrUrl(total, transferContent),
        [total, transferContent]
    );

    // -----------------------------------------------------
    // EARLY RETURN — SAU KHI ĐÃ GỌI HẾT HOOK
    // -----------------------------------------------------
    if (!open) return null;

    const QUICK_CASH = [1500000, 2000000, 2500000, 3000000];


    const canConfirm =
        method === "TIEN_MAT" ? isCashEnough : paidConfirmed;

    return (
        <div className="pos-pay-backdrop" onClick={onClose}>
            <div className="pos-pay-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="pos-pay-modal-head">
                    <div>
                        <span className="employee-eyebrow">
                            XÁC NHẬN THANH TOÁN
                        </span>
                        <h2>
                            {method === "TIEN_MAT"
                                ? "💵 Tiền mặt"
                                : method === "CHUYEN_KHOAN"
                                    ? "🏦 Chuyển khoản ngân hàng"
                                    : "📱 Ví điện tử MoMo"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        className="pos-pay-close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                {/* Tổng tiền */}
                <div className="pos-pay-amount">
                    <span>Số tiền cần thanh toán</span>
                    <strong>{formatMoney(total)}</strong>
                </div>

                {/* ============== TIỀN MẶT ============== */}
                {method === "TIEN_MAT" && (
                    <div className="pos-pay-body">
                        <label className="pos-pay-label">
                            Tiền khách đưa
                        </label>
                        <div className="pos-pay-cash-input">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={cashReceived}
                                onChange={(e) =>
                                    setCashReceived(
                                        formatMoneyInput(e.target.value)
                                    )
                                }
                                placeholder="Nhập số tiền khách đưa"
                                autoFocus
                            />
                            <span>đ</span>
                        </div>

                        {/* Nút chọn nhanh */}
                        <div className="pos-quick-cash">
                            {QUICK_CASH.map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() =>
                                        setCashReceived(
                                            formatMoneyInput(String(amt))
                                        )
                                    }
                                >
                                    {formatMoney(amt)}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="exact"
                                onClick={() =>
                                    setCashReceived(
                                        formatMoneyInput(String(total))
                                    )
                                }
                            >
                                Đủ tiền
                            </button>
                        </div>

                        {/* Tiền thừa */}
                        <div
                            className={`pos-change ${
                                isCashEnough ? "ok" : "warn"
                            }`}
                        >
                            <span>Tiền thừa trả khách</span>
                            <strong>
                                {isCashEnough
                                    ? formatMoney(change)
                                    : received > 0
                                        ? `Còn thiếu ${formatMoney(
                                            total - received
                                        )}`
                                        : "—"}
                            </strong>
                        </div>
                    </div>
                )}

                {/* ============== CHUYỂN KHOẢN / MOMO ============== */}
                {(method === "CHUYEN_KHOAN" || method === "MOMO") && (
                    <div className="pos-pay-body pos-pay-qr-body">
                        <div className="pos-qr-wrapper">
                            <img
                                src={qrUrl}
                                alt="QR thanh toán"
                                className="pos-qr-image"
                            />
                            <span className="pos-qr-badge">
                                {method === "MOMO" ? "MoMo" : "VietQR"}
                            </span>
                        </div>

                        <div className="pos-bank-info">
                            <div>
                                <span>Ngân hàng</span>
                                <strong>
                                    {method === "MOMO"
                                        ? "Ví MoMo"
                                        : "Vietcombank"}
                                </strong>
                            </div>
                            <div>
                                <span>Số tài khoản</span>
                                <strong>{BANK_CONFIG.accountNo}</strong>
                            </div>
                            <div>
                                <span>Chủ tài khoản</span>
                                <strong>{BANK_CONFIG.accountName}</strong>
                            </div>
                            <div>
                                <span>Số tiền</span>
                                <strong className="highlight">
                                    {formatMoney(total)}
                                </strong>
                            </div>
                            <div>
                                <span>Nội dung CK</span>
                                <strong className="content">
                                    {transferContent}
                                </strong>
                            </div>
                        </div>

                        <input
                            type="text"
                            className="pos-pay-note-input"
                            placeholder="Ghi chú (tuỳ chọn)"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />

                        <label className="pos-paid-checkbox">
                            <input
                                type="checkbox"
                                checked={paidConfirmed}
                                onChange={(e) =>
                                    setPaidConfirmed(e.target.checked)
                                }
                            />
                            <span>
                                Tôi đã xác nhận khách đã chuyển khoản thành
                                công
                            </span>
                        </label>
                    </div>
                )}

                {/* Footer */}
                <div className="pos-pay-modal-footer">
                    <button
                        type="button"
                        className="pos-btn-cancel"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="pos-btn-confirm"
                        disabled={!canConfirm || loading}
                        onClick={() => onConfirm({method, total})}
                    >
                        {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   COMPONENT CHÍNH
   ========================================================= */

export default function EmployeeCounterSale({products, onRefresh}) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("Tất cả");
    const [cart, setCart] = useState([]);
    const [loadingVariant, setLoadingVariant] = useState(false);
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("TIEN_MAT");
    const [variantMap, setVariantMap] = useState({});
    const [showPayment, setShowPayment] = useState(false);

    // -----------------------------------------------------
    // DANH MỤC
    // -----------------------------------------------------
    const categories = useMemo(() => {
        const values = products
            .map((p) => p.danhMuc?.tenDanhMuc)
            .filter(Boolean);
        return ["Tất cả", ...new Set(values)];
    }, [products]);

    // -----------------------------------------------------
    // LOAD BIẾN THỂ
    // -----------------------------------------------------
    useEffect(() => {
        let cancelled = false;

        async function loadVariants() {
            if (!products.length) {
                setVariantMap({});
                return;
            }

            const entries = await Promise.all(
                products.map(async (product) => {
                    try {
                        const data = await readJson(
                            `${API}/san-pham/${product.id}/chi-tiet`
                        );
                        return [product.id, Array.isArray(data) ? data : []];
                    } catch {
                        return [product.id, []];
                    }
                })
            );

            if (!cancelled) {
                setVariantMap(Object.fromEntries(entries));
            }
        }

        loadVariants();

        return () => {
            cancelled = true;
        };
    }, [products]);

    // -----------------------------------------------------
    // LỌC SẢN PHẨM
    // -----------------------------------------------------
    const filteredProducts = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return products.filter((product) => {
            const name = String(product.tenSanPham || "").toLowerCase();
            const code = String(product.maSanPham || "").toLowerCase();
            const brand = String(
                product.thuongHieu?.tenThuongHieu || ""
            ).toLowerCase();
            const cat = product.danhMuc?.tenDanhMuc || "";
            return (
                (!keyword ||
                    name.includes(keyword) ||
                    code.includes(keyword) ||
                    brand.includes(keyword)) &&
                (category === "Tất cả" || cat === category)
            );
        });
    }, [products, search, category]);

    // -----------------------------------------------------
    // THÊM SẢN PHẨM VÀO GIỎ
    // -----------------------------------------------------
    const addProduct = async (product) => {
        try {
            setLoadingVariant(true);
            const cachedVariants = variantMap[product.id];
            const variants = cachedVariants
                ? cachedVariants
                : await readJson(`${API}/san-pham/${product.id}/chi-tiet`);
            const list = Array.isArray(variants) ? variants : [];

            const available = list.find(
                (item) => Number(item.soLuongTon || 0) > 0
            );

            if (!available) {
                alert("Sản phẩm này hiện không còn tồn kho.");
                return;
            }

            setCart((old) => {
                const existing = old.find(
                    (item) => item.variant.id === available.id
                );
                if (existing) {
                    if (existing.quantity >= Number(available.soLuongTon || 0)) {
                        alert(`Chỉ còn ${available.soLuongTon} sản phẩm.`);
                        return old;
                    }
                    return old.map((item) =>
                        item.variant.id === available.id
                            ? {...item, quantity: item.quantity + 1}
                            : item
                    );
                }

                return [
                    ...old,
                    {product, variant: available, quantity: 1},
                ];
            });
        } catch (error) {
            alert(error.message || "Không thể lấy biến thể sản phẩm.");
        } finally {
            setLoadingVariant(false);
        }
    };

    // -----------------------------------------------------
    // CẬP NHẬT SỐ LƯỢNG
    // -----------------------------------------------------
    const updateQty = (variantId, delta) => {
        setCart((old) =>
            old
                .map((item) => {
                    if (item.variant.id !== variantId) return item;
                    const max = Number(item.variant.soLuongTon || 0);
                    const next = item.quantity + delta;
                    if (next > max) {
                        alert(`Chỉ còn ${max} sản phẩm.`);
                        return item;
                    }
                    return {...item, quantity: next};
                })
                .filter((item) => item.quantity > 0)
        );
    };

    // -----------------------------------------------------
    // TÍNH TỔNG TIỀN
    // -----------------------------------------------------
    const total = cart.reduce(
        (sum, item) => sum + Number(item.variant.giaBan || 0) * item.quantity,
        0
    );

    // -----------------------------------------------------
    // MỞ MODAL THANH TOÁN
    // -----------------------------------------------------
    const openPaymentModal = () => {
        if (!cart.length) return;
        setShowPayment(true);
    };

    // -----------------------------------------------------
    // XÁC NHẬN THANH TOÁN (gọi API tạo hóa đơn)
    // -----------------------------------------------------
    const confirmPayment = async () => {
        if (loadingCheckout) return;

        try {
            setLoadingCheckout(true);

            const payload = {
                phuongThucThanhToan: paymentMethod,
                chiTiet: cart.map((item) => ({
                    sanPhamChiTietId: item.variant.id,
                    soLuong: item.quantity,
                })),
            };

            const result = await readJson(`${API}/hoa-don/tao-tai-quay`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });

            const methodLabel =
                paymentMethod === "TIEN_MAT"
                    ? "Tiền mặt"
                    : paymentMethod === "CHUYEN_KHOAN"
                        ? "Chuyển khoản"
                        : "MoMo";

            alert(
                `✅ Thanh toán thành công!\n` +
                `Phương thức: ${methodLabel}\n` +
                `Mã hóa đơn: ${result.maHoaDon}\n` +
                `Tổng tiền: ${formatMoney(result.tongThanhToan)}`
            );

            setShowPayment(false);
            setCart([]);
            setVariantMap({});

            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error(err);
            alert(err.message || "Không thể tạo hóa đơn tại quầy.");
        } finally {
            setLoadingCheckout(false);
        }
    };

    /* =========================================================
       RENDER
       ========================================================= */
    return (
        <div className="employee-content">
            <PageHeading
                title="Bán hàng tại quầy"
                description="Chọn sản phẩm, thêm vào giỏ hàng và tiến hành thanh toán."
            />

            <div className="pos-layout">
                {/* ---------- DANH MỤC ---------- */}
                <aside className="employee-card pos-category-panel">
                    <div className="pos-category-heading">
                        <span className="pos-category-icon">☷</span>
                        <div>
                            <h2>Danh mục</h2>
                            <p>{Math.max(categories.length - 1, 0)} danh mục</p>
                        </div>
                    </div>

                    <div className="pos-category-list">
                        {categories.map((item) => (
                            <button
                                type="button"
                                key={item}
                                className={category === item ? "active" : ""}
                                onClick={() => setCategory(item)}
                            >
                                <span>{item === "Tất cả" ? "▦" : "□"}</span>
                                <strong>{item}</strong>
                                <small>
                                    {item === "Tất cả"
                                        ? products.length
                                        : products.filter(
                                            (p) =>
                                                p.danhMuc?.tenDanhMuc === item
                                        ).length}
                                </small>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* ---------- SẢN PHẨM ---------- */}
                <section className="employee-card pos-products">
                    <div className="pos-products-head">
                        <div>
                            <h2>Sản phẩm</h2>
                            <p>Chọn sản phẩm để thêm vào hóa đơn</p>
                        </div>
                        <span className="pos-product-count">
                            {filteredProducts.length} sản phẩm
                        </span>
                    </div>

                    <div className="pos-search-box">
                        <span>⌕</span>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm sản phẩm, mã sản phẩm, thương hiệu..."
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {loadingVariant && (
                        <div className="employee-loading-inline">
                            Đang lấy biến thể sản phẩm...
                        </div>
                    )}

                    <div className="pos-product-grid">
                        {filteredProducts.length ? (
                            filteredProducts.map((product) => (
                                <button
                                    type="button"
                                    className={`pos-product-card ${(() => {
                                        const variants =
                                            variantMap[product.id] || [];
                                        const stock = variants.reduce(
                                            (s, i) =>
                                                s + Number(i.soLuongTon || 0),
                                            0
                                        );
                                        return variants.length && stock <= 0
                                            ? "sold-out"
                                            : "";
                                    })()}`}
                                    key={product.id}
                                    onClick={() => addProduct(product)}
                                >
                                    <div className="pos-product-image">
                                        <img
                                            src={
                                                product.hinhAnh ||
                                                "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80"
                                            }
                                            alt={product.tenSanPham}
                                        />
                                        <span className="pos-product-add">
                                            ＋
                                        </span>
                                    </div>

                                    <div className="pos-product-brand">
                                        {product.thuongHieu?.tenThuongHieu ||
                                            "FShop"}
                                    </div>

                                    <strong>{product.tenSanPham}</strong>

                                    <span className="pos-product-code">
                                        {product.maSanPham || "-"}
                                    </span>

                                    <div className="pos-product-price">
                                        {(() => {
                                            const variants =
                                                variantMap[product.id] || [];
                                            const prices = variants
                                                .map((i) =>
                                                    Number(i.giaBan || 0)
                                                )
                                                .filter((v) => v > 0);
                                            const min = prices.length
                                                ? Math.min(...prices)
                                                : Number(product.giaBan || 0);
                                            return min > 0
                                                ? formatMoney(min)
                                                : "Chưa có giá";
                                        })()}
                                    </div>

                                    <div className="pos-product-meta">
                                        {(() => {
                                            const variants =
                                                variantMap[product.id] || [];
                                            const stock = variants.reduce(
                                                (s, i) =>
                                                    s +
                                                    Number(i.soLuongTon || 0),
                                                0
                                            );
                                            const out =
                                                variants.length > 0 &&
                                                stock <= 0;
                                            return (
                                                <>
                                                    <span
                                                        className={`pos-stock-dot ${
                                                            out
                                                                ? "out"
                                                                : stock <= 5
                                                                    ? "low"
                                                                    : ""
                                                        }`}
                                                    ></span>
                                                    <span>
                                                        {variants.length
                                                            ? out
                                                                ? "Hết hàng"
                                                                : stock <= 5
                                                                    ? `Sắp hết (${stock})`
                                                                    : `Còn hàng (${stock})`
                                                            : "Đang tải..."}
                                                    </span>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <div className="pos-product-bottom">
                                        <small>Thêm vào giỏ</small>
                                        <span>＋</span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="pos-no-products">
                                <div>⌕</div>
                                <strong>Không tìm thấy sản phẩm</strong>
                            </div>
                        )}
                    </div>
                </section>

                {/* ---------- GIỎ HÀNG ---------- */}
                <aside className="employee-card pos-cart">
                    <div className="employee-card-heading">
                        <div>
                            <h2>Giỏ hàng ({cart.length})</h2>
                            <p>Hóa đơn tại quầy</p>
                        </div>
                        {cart.length > 0 && (
                            <button
                                type="button"
                                className="employee-link"
                                onClick={() => setCart([])}
                            >
                                Xóa tất cả
                            </button>
                        )}
                    </div>

                    <div className="pos-cart-list">
                        {cart.length ? (
                            cart.map((item) => (
                                <div
                                    className="pos-cart-item"
                                    key={item.variant.id}
                                >
                                    <img
                                        src={
                                            item.product.hinhAnh ||
                                            "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=300&q=80"
                                        }
                                        alt={item.product.tenSanPham}
                                    />
                                    <div className="pos-cart-info">
                                        <strong>{item.product.tenSanPham}</strong>
                                        <small>
                                            Size{" "}
                                            {item.variant.kichCo?.tenKichCo ||
                                                "-"}{" "}
                                            ·{" "}
                                            {item.variant.mauSac?.tenMau || "-"}
                                        </small>
                                        <b>{formatMoney(item.variant.giaBan)}</b>

                                        <div className="quantity-control">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateQty(
                                                        item.variant.id,
                                                        -1
                                                    )
                                                }
                                            >
                                                −
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateQty(
                                                        item.variant.id,
                                                        1
                                                    )
                                                }
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="pos-remove"
                                        onClick={() =>
                                            setCart((old) =>
                                                old.filter(
                                                    (r) =>
                                                        r.variant.id !==
                                                        item.variant.id
                                                )
                                            )
                                        }
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="pos-empty-cart">
                                <div>🛒</div>
                                <strong>Chưa có sản phẩm</strong>
                                <span>Chọn sản phẩm bên trái.</span>
                            </div>
                        )}
                    </div>

                    <div className="pos-summary">
                        <div>
                            <span>Tạm tính</span>
                            <strong>{formatMoney(total)}</strong>
                        </div>
                        <div>
                            <span>Giảm giá</span>
                            <strong>0đ</strong>
                        </div>
                        <div className="pos-total">
                            <span>Tổng tiền</span>
                            <strong>{formatMoney(total)}</strong>
                        </div>
                    </div>

                    <div className="pos-payment-section">
                        <div className="pos-payment-title">
                            <span>Phương thức thanh toán</span>
                        </div>

                        <div className="pos-payment-options">
                            {[
                                ["TIEN_MAT", "💵", "Tiền mặt"],
                                ["CHUYEN_KHOAN", "🏦", "Chuyển khoản"],
                                ["MOMO", "📱", "MoMo"],
                            ].map(([value, icon, label]) => (
                                <button
                                    type="button"
                                    key={value}
                                    className={`pos-payment-option ${
                                        paymentMethod === value ? "active" : ""
                                    }`}
                                    onClick={() => setPaymentMethod(value)}
                                >
                                    <span className="pos-payment-icon">
                                        {icon}
                                    </span>
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="pos-pay-button"
                        disabled={!cart.length}
                        onClick={openPaymentModal}
                    >
                        <span>▣</span>
                        <strong>Thanh toán</strong>
                        <b>{formatMoney(total)}</b>
                    </button>

                    <small className="pos-note">
                        * Hóa đơn tại quầy được ghi trực tiếp vào database.
                    </small>
                </aside>
            </div>

            {/* MODAL THANH TOÁN */}
            <PaymentModal
                open={showPayment}
                onClose={() => !loadingCheckout && setShowPayment(false)}
                method={paymentMethod}
                total={total}
                loading={loadingCheckout}
                onConfirm={confirmPayment}
            />
        </div>
    );
}