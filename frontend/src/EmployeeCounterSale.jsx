import {memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState} from "react";
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
    template: "compact2",
};

/* =========================================================
   CẤU HÌNH CỬA HÀNG (in trên hóa đơn)
   ========================================================= */
const SHOP_CONFIG = {
    ten: "FSHOP",
    diaChi: "123 Đường ABC, Quận 1, TP.HCM",
    dienThoai: "1900 1234",
    website: "fshop.vn",
};

/* =========================================================
   HELPERS
   ========================================================= */

function formatMoney(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function parseMoneyInput(value) {
    return Number(String(value || "").replace(/[^\d]/g, "")) || 0;
}

function formatMoneyInput(value) {
    const n = parseMoneyInput(value);
    return n ? n.toLocaleString("vi-VN") : "";
}

function formatDateTime(value) {
    if (!value) return "-";
    const d = new Date(value);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
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

/* SĐT người mua: để trống = bỏ qua; nhập thì phải đúng định dạng VN */
function isValidPhone(value) {
    const v = String(value || "").replace(/[\s.\-()]/g, "");
    if (!v) return true;
    return /^(0|\+84|84)\d{9}$/.test(v);
}

function methodLabel(method) {
    if (method === "TIEN_MAT") return "Tiền mặt";
    if (method === "CHUYEN_KHOAN") return "Chuyển khoản";
    return method;
}

/* =========================================================
   MODAL HÓA ĐƠN — HIỂN THỊ + IN
   ========================================================= */

function InvoiceModal({invoice, onClose}) {
    if (!invoice) return null;

    const handlePrint = () => {
        window.print();
    };

    const subtotal = invoice.chiTiet.reduce(
        (s, i) => s + Number(i.thanhTien || 0),
        0
    );

    return (
        <div className="invoice-modal-backdrop">
            <div className="invoice-modal">
                {/* ---------- VÙNG IN ---------- */}
                <div className="invoice-print-area" id="invoice-print-area">
                    {/* Header cửa hàng */}
                    <div className="invoice-header">
                        <div className="invoice-logo">
                            <div className="invoice-logo-mark">F</div>
                            <div>
                                <h1>{SHOP_CONFIG.ten}</h1>
                                <p>{SHOP_CONFIG.diaChi}</p>
                                <p>
                                    ĐT: {SHOP_CONFIG.dienThoai} ·{" "}
                                    {SHOP_CONFIG.website}
                                </p>
                            </div>
                        </div>

                        <div className="invoice-title">
                            <h2>HÓA ĐƠN BÁN HÀNG</h2>
                            <span>#{invoice.maHoaDon}</span>
                        </div>
                    </div>

                    {/* Thông tin hóa đơn */}
                    <div className="invoice-meta">
                        <div>
                            <span>Ngày lập</span>
                            <strong>{formatDateTime(invoice.ngayLap)}</strong>
                        </div>
                        <div>
                            <span>Phương thức</span>
                            <strong>
                                {methodLabel(invoice.phuongThucThanhToan)}
                            </strong>
                        </div>
                        <div>
                            <span>Thu ngân</span>
                            <strong>{invoice.nhanVien || "Nhân viên"}</strong>
                        </div>
                        {invoice.maKhachHang && (
                            <div>
                                <span>ID khách hàng</span>
                                <strong>#{invoice.maKhachHang}</strong>
                            </div>
                        )}
                        {invoice.tenKhach && (
                            <div>
                                <span>Khách hàng</span>
                                <strong>{invoice.tenKhach}</strong>
                            </div>
                        )}
                        {invoice.soDienThoaiKhach && (
                            <div>
                                <span>SĐT khách</span>
                                <strong>{invoice.soDienThoaiKhach}</strong>
                            </div>
                        )}
                        <div>
                            <span>Trạng thái</span>
                            <strong className="invoice-paid">
                                ✓ Đã thanh toán
                            </strong>
                        </div>
                    </div>

                    {/* Bảng sản phẩm */}
                    <table className="invoice-table">
                        <thead>
                        <tr>
                            <th style={{width: "40px"}}>#</th>
                            <th>Sản phẩm</th>
                            <th style={{width: "70px"}}>SL</th>
                            <th style={{width: "110px"}}>Đơn giá</th>
                            <th style={{width: "120px"}}>Thành tiền</th>
                        </tr>
                        </thead>
                        <tbody>
                        {invoice.chiTiet.map((item, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>
                                    <strong>{item.tenSanPham}</strong>
                                    <small>
                                        {item.maSanPham || ""}
                                        {item.kichCo ? ` · Size ${item.kichCo}` : ""}
                                        {item.mauSac ? ` · ${item.mauSac}` : ""}
                                    </small>
                                </td>
                                <td style={{textAlign: "center"}}>
                                    {item.soLuong}
                                </td>
                                <td style={{textAlign: "right"}}>
                                    {formatMoney(item.donGia)}
                                </td>
                                <td style={{textAlign: "right"}}>
                                    <strong>
                                        {formatMoney(item.thanhTien)}
                                    </strong>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {/* Tổng kết */}
                    <div className="invoice-total">
                        <div>
                            <span>Tạm tính</span>
                            <strong>{formatMoney(subtotal)}</strong>
                        </div>
                        <div>
                            <span>Giảm giá</span>
                            <strong>0đ</strong>
                        </div>
                        <div className="invoice-total-final">
                            <span>TỔNG THANH TOÁN</span>
                            <strong>
                                {formatMoney(invoice.tongThanhToan)}
                            </strong>
                        </div>
                    </div>

                    {/* Lời cảm ơn */}
                    <div className="invoice-footer">
                        <p>
                            <strong>Cảm ơn quý khách đã mua hàng!</strong>
                        </p>
                        <p>
                            Hóa đơn chỉ có giá trị trong ngày. Vui lòng giữ
                            hóa đơn để đổi trả trong vòng 7 ngày.
                        </p>
                    </div>
                </div>

                {/* ---------- FOOTER MODAL (không in) ---------- */}
                <div className="invoice-modal-footer no-print">
                    <button
                        type="button"
                        className="invoice-btn-close"
                        onClick={onClose}
                    >
                        Đóng
                    </button>
                    <button
                        type="button"
                        className="invoice-btn-print"
                        onClick={handlePrint}
                    >
                        🖨 In hóa đơn
                    </button>
                </div>
            </div>
        </div>
    );
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
    const [payCode, setPayCode] = useState("");
    const [buyerName, setBuyerName] = useState("");
    const [phone, setPhone] = useState("");
    const [autoName, setAutoName] = useState("");   // tên được tự điền theo SĐT
    const [customerId, setCustomerId] = useState(null); // ID khách đã biết (nếu SĐT trùng)
    const [customerIsAccount, setCustomerIsAccount] = useState(false); // true = khách có tài khoản
    const autoNameRef = useRef("");

    useEffect(() => {
        if (open) {
            setCashReceived("");
            setBuyerName("");
            setPhone("");
            setAutoName("");
            setCustomerId(null);
            setCustomerIsAccount(false);
            autoNameRef.current = "";
            setNote("");
            setPaidConfirmed(false);
            setPayCode(`POS${Date.now().toString().slice(-6)}`);
        }
    }, [open, method]);

    const received = parseMoneyInput(cashReceived);
    const change = received - total;
    const isCashEnough = received >= total;

    const transferContent = `${note.trim() || "Thanh toan don hang"} ${payCode}`;

    const qrUrl = useMemo(
        () => buildVietQrUrl(total, transferContent),
        [total, transferContent]
    );

    // Gợi ý mệnh giá làm tròn lên theo tổng tiền
    const quickCash = useMemo(() => {
        const set = new Set();
        [50000, 100000, 200000, 500000].forEach((step) =>
            set.add(Math.ceil(total / step) * step)
        );
        return [...set].filter((v) => v > total).slice(0, 4);
    }, [total]);

    const phoneValid = isValidPhone(phone);

    /* Nhập đủ SĐT → tự tra tên khách đã biết và điền vào ô tên.
       Chỉ ghi đè khi ô tên đang trống hoặc đang là tên tự điền trước đó. */
    useEffect(() => {
        if (!open) return undefined;

        const digits = phone.replace(/[\s.\-()]/g, "");

        const clearAuto = () => {
            setCustomerId(null);
            setCustomerIsAccount(false);
            const prev = autoNameRef.current;
            if (!prev) return;
            autoNameRef.current = "";
            setAutoName("");
            setBuyerName((cur) => (cur === prev ? "" : cur));
        };

        if (!digits || !isValidPhone(phone)) {
            clearAuto();
            return undefined;
        }

        const ctrl = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${API}/hoa-don/tra-cuu-sdt?sdt=${encodeURIComponent(digits)}`,
                    {signal: ctrl.signal}
                );
                if (!res.ok) return;
                const data = await res.json();
                const found = data?.tenKhach?.trim();

                // Khách có ID nhưng chưa có tên: vẫn hiện ID
                if (!found) {
                    clearAuto();
                    if (data?.maKhachHang) {
                        setCustomerId(data.maKhachHang);
                        setCustomerIsAccount(data?.nguon === "KHACH_HANG");
                    }
                    return;
                }

                const prev = autoNameRef.current;
                autoNameRef.current = found;
                setAutoName(found);
                setCustomerId(data?.maKhachHang || null);
                setCustomerIsAccount(data?.nguon === "KHACH_HANG");
                setBuyerName((cur) =>
                    !cur.trim() || cur === prev ? found : cur
                );
            } catch {
                /* lỗi mạng/hủy: bỏ qua, nhân viên vẫn nhập tay được */
            }
        }, 350);

        return () => {
            clearTimeout(timer);
            ctrl.abort();
        };
    }, [phone, open]);

    const canConfirm =
        (method === "TIEN_MAT" ? isCashEnough : paidConfirmed) && phoneValid;

    // Enter = xác nhận · Esc = đóng
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape" && !loading) onClose();
            if (e.key === "Enter" && canConfirm && !loading) {
                e.preventDefault();
                onConfirm({method, total, phone, name: buyerName});
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, canConfirm, loading, method, total, phone, buyerName, onClose, onConfirm]);

    if (!open) return null;

    return (
        <div className="pos-pay-backdrop" onClick={onClose}>
            <div className="pos-pay-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pos-pay-modal-head">
                    <div>
                        <span className="employee-eyebrow">
                            XÁC NHẬN THANH TOÁN
                        </span>
                        <h2>
                            {method === "TIEN_MAT"
                                ? "💵 Tiền mặt"
                                : "🏦 Chuyển khoản ngân hàng"}
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

                <div className="pos-pay-amount">
                    <span>Số tiền cần thanh toán</span>
                    <strong>{formatMoney(total)}</strong>
                </div>

                <div className="pos-pay-phone">
                    <label className="pos-pay-label" htmlFor="pos-buyer-name">
                        👤 Tên khách hàng{" "}
                        <small>(không bắt buộc)</small>
                    </label>
                    <input
                        id="pos-buyer-name"
                        type="text"
                        maxLength={100}
                        className="pos-pay-phone-input"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Nhập tên khách (để trống = Khách lẻ)"
                    />
                    {autoName && buyerName === autoName && (
                        <span className="pos-pay-phone-hint">
                            ✓ Khách quen — đã tự điền tên theo SĐT
                        </span>
                    )}
                    {customerId && (
                        <span className="pos-pay-phone-hint">
                            🆔 ID khách hàng:{" "}
                            <strong>#{customerId}</strong>{" "}
                            {customerIsAccount
                                ? "(gắn vào tài khoản đã đăng ký)"
                                : "(khách đã mua tại quầy)"}
                        </span>
                    )}

                    <label
                        className="pos-pay-label"
                        htmlFor="pos-buyer-phone"
                        style={{marginTop: 6}}
                    >
                        📱 Số điện thoại người mua{" "}
                        <small>(không bắt buộc)</small>
                    </label>
                    <input
                        id="pos-buyer-phone"
                        type="tel"
                        inputMode="tel"
                        maxLength={15}
                        className={`pos-pay-phone-input ${
                            phoneValid ? "" : "invalid"
                        }`}
                        value={phone}
                        onChange={(e) =>
                            setPhone(e.target.value.replace(/[^\d+\s.]/g, ""))
                        }
                        placeholder="Xin SĐT khách để gắn vào hóa đơn"
                    />
                    {!phoneValid && (
                        <span className="pos-pay-phone-error">
                            SĐT chưa đúng (cần 10 chữ số, bắt đầu bằng 0)
                        </span>
                    )}
                </div>

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

                        <div className="pos-quick-cash">
                            {quickCash.map((amt) => (
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

                {method === "CHUYEN_KHOAN" && (
                    <div className="pos-pay-body pos-pay-qr-body">
                        <div className="pos-qr-wrapper">
                            <img
                                src={qrUrl}
                                alt="QR thanh toán"
                                className="pos-qr-image"
                            />
                            <span className="pos-qr-badge">VietQR</span>
                        </div>

                        <div className="pos-bank-info">
                            <div>
                                <span>Ngân hàng</span>
                                <strong>Vietcombank</strong>
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
                        onClick={() => onConfirm({method, total, phone, name: buyerName})}
                    >
                        {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
                    </button>
                </div>
            </div>
        </div>
    );
}
/* =========================================================
   MODAL CHỌN BIẾN THỂ (MÀU SẮC + KÍCH THƯỚC)
   ========================================================= */
function VariantPickerModal({open, product, variants, onClose, onConfirm}) {
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);

    // Danh sách màu duy nhất — sắp xếp theo thứ tự cố định
    const colors = useMemo(() => {
        const order = ["Đen", "Trắng"];   // ⭐ Thứ tự màu bạn muốn
        const unique = [...new Set(variants.map(v => v.mauSac?.tenMau).filter(Boolean))];
        // Sắp xếp: màu nào có trong order thì xếp theo order, còn lại đẩy xuống cuối
        return unique.sort((a, b) => {
            const ia = order.indexOf(a);
            const ib = order.indexOf(b);
            if (ia === -1 && ib === -1) return a.localeCompare(b);
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
        });
    }, [variants]);

    // Danh sách size theo màu đang chọn — sắp xếp theo số tăng dần
    const sizes = useMemo(() => {
        if (!selectedColor) return [];
        return variants
            .filter(v => v.mauSac?.tenMau === selectedColor)
            .map(v => ({
                size: v.kichCo?.tenKichCo,
                stock: Number(v.soLuongTon || 0),
                variant: v,
            }))
            .sort((a, b) => {
                // So sánh theo số (nếu size là số) — nếu là chữ thì so sánh chuỗi
                const na = Number(a.size);
                const nb = Number(b.size);
                if (!isNaN(na) && !isNaN(nb)) return na - nb;
                return String(a.size).localeCompare(String(b.size));
            });
    }, [variants, selectedColor]);

    // Biến thể đang chọn
    const currentVariant = useMemo(() => {
        return variants.find(
            v => v.mauSac?.tenMau === selectedColor && v.kichCo?.tenKichCo === selectedSize
        );
    }, [variants, selectedColor, selectedSize]);

    // ⭐ Reset state khi mở sản phẩm mới (chỉ 1 useEffect duy nhất)
    useEffect(() => {
        if (!open || !variants.length) {
            setSelectedColor(null);
            setSelectedSize(null);
            return;
        }

        // Chọn màu đầu tiên có tồn kho
        const firstColor = colors.find(c =>
            variants.some(v => v.mauSac?.tenMau === c && Number(v.soLuongTon) > 0)
        ) || colors[0];

        // Chọn size đầu tiên còn hàng của màu đó
        const firstSize = variants
                .filter(v => v.mauSac?.tenMau === firstColor)
                .find(v => Number(v.soLuongTon) > 0)?.kichCo?.tenKichCo
            || variants.find(v => v.mauSac?.tenMau === firstColor)?.kichCo?.tenKichCo
            || null;

        setSelectedColor(firstColor);
        setSelectedSize(firstSize);
    }, [open, variants, colors]);

    // ⭐ Tự chọn size đầu tiên còn hàng khi người dùng ĐỔI MÀU
    const handleSelectColor = (color) => {
        setSelectedColor(color);
        const firstSize = variants
                .filter(v => v.mauSac?.tenMau === color)
                .find(v => Number(v.soLuongTon) > 0)?.kichCo?.tenKichCo
            || variants.find(v => v.mauSac?.tenMau === color)?.kichCo?.tenKichCo
            || null;
        setSelectedSize(firstSize);
    };

    // Enter = thêm vào giỏ · Esc = đóng
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            if (
                e.key === "Enter" &&
                currentVariant &&
                Number(currentVariant.soLuongTon || 0) > 0
            ) {
                e.preventDefault();
                onConfirm(currentVariant);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, currentVariant, onClose, onConfirm]);

    if (!open || !product) return null;

    const handleConfirm = () => {
        if (!currentVariant) return;
        if (Number(currentVariant.soLuongTon || 0) <= 0) {
            alert("Biến thể này đã hết hàng, vui lòng chọn size/màu khác.");
            return;
        }
        onConfirm(currentVariant);
    };

    return (
        <div className="variant-modal-backdrop" onClick={onClose}>
            <div className="variant-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header sản phẩm */}
                <div className="variant-modal-header">
                    <img
                        src={product.hinhAnh || "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=300&q=80"}
                        alt={product.tenSanPham}
                    />
                    <div>
                        <h3>{product.tenSanPham}</h3>
                        <p>Đang chọn: {selectedSize || "—"} · {selectedColor || "—"}</p>
                    </div>
                    <button type="button" className="variant-modal-close" onClick={onClose}>×</button>
                </div>

                {/* Màu sắc */}
                <div className="variant-section">
                    <h4>MÀU SẮC</h4>
                    <div className="variant-options">
                        {colors.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={`variant-option ${selectedColor === color ? "active" : ""}`}
                                onClick={() => handleSelectColor(color)}
                            >
                                {color}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Kích thước */}
                <div className="variant-section">
                    <h4>KÍCH THƯỚC</h4>
                    <div className="variant-options">
                        {sizes.map(({size, stock}) => (
                            <button
                                key={size}
                                type="button"
                                disabled={stock <= 0}
                                className={`variant-option ${selectedSize === size ? "active" : ""} ${stock <= 0 ? "disabled" : ""}`}
                                onClick={() => stock > 0 && setSelectedSize(size)}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tồn kho & giá */}
                <div className="variant-info">
                    <span>Còn lại: <b>{currentVariant ? currentVariant.soLuongTon : 0}</b> sản phẩm</span>
                    <span>Giá: <b>{formatMoney(currentVariant?.giaBan || 0)}</b></span>
                </div>

                <button
                    type="button"
                    className="variant-btn-confirm"
                    disabled={!currentVariant || Number(currentVariant.soLuongTon) <= 0}
                    onClick={handleConfirm}
                >
                    Thêm vào giỏ hàng
                </button>
            </div>
        </div>
    );
}
/* =========================================================
   COMPONENT CHÍNH — BÁN TẠI QUẦY (POS)
   Ưu tiên tốc độ xử lý:
   - 1 request duy nhất để tải toàn bộ biến thể (thay vì N request)
   - Quét mã SKU / nhập mã + Enter là thêm vào giỏ ngay
   - Sản phẩm chỉ có 1 biến thể còn hàng → thêm thẳng, không hỏi
   - Nhiều hóa đơn chờ (tab), giữ giỏ khi tải lại trang
   - Phím tắt: F2 tìm kiếm · F4 hóa đơn mới · F8 đổi PT thanh toán · F9 thanh toán
   ========================================================= */

const STORAGE_KEY = "fshop_pos_orders_v1";
const MAX_TABS = 5;
const PAGE_SIZE = 40;
const FALLBACK_IMG =
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80";

const isSellable = (v) =>
    Number(v?.soLuongTon || 0) > 0 &&
    ["HOAT_DONG", "ACTIVE"].includes(String(v?.trangThai || "").toUpperCase());

function createOrder(id) {
    return {id, cart: [], method: "TIEN_MAT"};
}

function loadSavedOrders() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.orders?.length) return null;
        return parsed;
    } catch {
        return null;
    }
}

async function fetchAllVariants(products) {
    // Cách nhanh: 1 request cho tất cả biến thể
    try {
        const all = await readJson(`${API}/san-pham-chi-tiet`);
        if (Array.isArray(all)) {
            const map = {};
            products.forEach((p) => (map[p.id] = []));
            all.forEach((v) => {
                const pid = v.sanPham?.id;
                if (pid != null && map[pid]) map[pid].push(v);
            });
            return map;
        }
    } catch {
        /* rơi xuống cách dự phòng */
    }

    // Dự phòng: gọi theo từng sản phẩm
    const entries = await Promise.all(
        products.map(async (p) => {
            try {
                const data = await readJson(`${API}/san-pham/${p.id}/chi-tiet`);
                return [p.id, Array.isArray(data) ? data : []];
            } catch {
                return [p.id, []];
            }
        })
    );
    return Object.fromEntries(entries);
}

const ProductCard = memo(function ProductCard({product, stats, onSelect}) {
    const {loaded, minPrice, stock} = stats;
    const out = loaded && stock <= 0;
    const low = loaded && stock > 0 && stock <= 5;
    const price = minPrice > 0 ? minPrice : Number(product.giaBan || 0);

    return (
        <button
            type="button"
            className={`pos-product-card ${out ? "sold-out" : ""}`}
            onClick={() => onSelect(product)}
        >
            <div className="pos-product-image">
                <img
                    src={product.hinhAnh || FALLBACK_IMG}
                    alt={product.tenSanPham}
                    loading="lazy"
                    decoding="async"
                />
                <span className="pos-product-add">＋</span>
            </div>

            <div className="pos-product-brand">
                {product.thuongHieu?.tenThuongHieu || "FShop"}
            </div>

            <strong>{product.tenSanPham}</strong>

            <span className="pos-product-code">{product.maSanPham || "-"}</span>

            <div className="pos-product-price">
                {price > 0 ? formatMoney(price) : "Chưa có giá"}
            </div>

            <div className="pos-product-meta">
                <span className={`pos-stock-dot ${out ? "out" : low ? "low" : ""}`}></span>
                <span>
                    {!loaded
                        ? "Đang tải..."
                        : out
                            ? "Hết hàng"
                            : low
                                ? `Sắp hết (${stock})`
                                : `Còn hàng (${stock})`}
                </span>
            </div>

            <div className="pos-product-bottom">
                <small>Thêm vào giỏ</small>
                <span>＋</span>
            </div>
        </button>
    );
});

export default function EmployeeCounterSale({products = [], onRefresh}) {
    const saved = useMemo(() => loadSavedOrders(), []);

    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search);
    const [category, setCategory] = useState("Tất cả");
    const [pageState, setPageState] = useState({key: "", count: PAGE_SIZE});

    const [orders, setOrders] = useState(saved?.orders || [createOrder(1)]);
    const [activeId, setActiveId] = useState(saved?.activeId || 1);
    const nextIdRef = useRef(
        Math.max(1, ...(saved?.orders || [{id: 1}]).map((o) => o.id)) + 1
    );

    const [variantMap, setVariantMap] = useState({});
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [invoice, setInvoice] = useState(null);
    const [variantModal, setVariantModal] = useState({
        open: false,
        product: null,
        variants: [],
    });
    const [toast, setToast] = useState(null);

    const searchRef = useRef(null);
    const toastTimer = useRef(null);

    const activeOrder = orders.find((o) => o.id === activeId) || orders[0];
    const cart = activeOrder.cart;
    const paymentMethod = activeOrder.method;

    /* ---------- TOAST (thay alert, không chặn thao tác) ---------- */
    const showToast = useCallback((message, type = "warn") => {
        setToast({message, type});
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 2600);
    }, []);

    useEffect(() => () => clearTimeout(toastTimer.current), []);

    /* ---------- LƯU HÓA ĐƠN CHỜ (giữ khi F5) ---------- */
    useEffect(() => {
        try {
            sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({orders, activeId})
            );
        } catch {
            /* bỏ qua nếu storage không khả dụng */
        }
    }, [orders, activeId]);

    const patchActive = useCallback(
        (patch) =>
            setOrders((old) =>
                old.map((o) =>
                    o.id === activeId
                        ? {...o, ...(typeof patch === "function" ? patch(o) : patch)}
                        : o
                )
            ),
        [activeId]
    );

    /* ---------- TẢI BIẾN THỂ (1 REQUEST) ---------- */
    useEffect(() => {
        let cancelled = false;
        if (!products.length) return undefined;

        fetchAllVariants(products).then((map) => {
            if (!cancelled) setVariantMap(map);
        });

        return () => {
            cancelled = true;
        };
    }, [products]);

    /* ---------- CHỈ MỤC / THỐNG KÊ (tính 1 lần) ---------- */
    const {productStats, variantById, skuIndex, searchText} = useMemo(() => {
        const stats = {};
        const byId = new Map();
        const skus = new Map();
        const text = {};

        products.forEach((p) => {
            const vs = variantMap[p.id];
            if (!vs) {
                stats[p.id] = {loaded: false, minPrice: 0, stock: 0};
                text[p.id] = "";
                return;
            }
            let stock = 0;
            let min = 0;
            const skuList = [];
            vs.forEach((v) => {
                byId.set(v.id, v);
                stock += Number(v.soLuongTon || 0);
                const price = Number(v.giaBan || 0);
                if (price > 0 && (min === 0 || price < min)) min = price;
                if (v.maSku) {
                    const key = String(v.maSku).toLowerCase();
                    skus.set(key, {product: p, variant: v});
                    skuList.push(key);
                }
            });
            stats[p.id] = {loaded: true, minPrice: min, stock};
            text[p.id] = skuList.join(" ");
        });

        return {
            productStats: stats,
            variantById: byId,
            skuIndex: skus,
            searchText: text,
        };
    }, [products, variantMap]);

    /* ---------- THƯƠNG HIỆU ---------- */
    // Nhóm bộ lọc bên trái theo thương hiệu thay vì danh mục sản phẩm.
    const {categories, categoryCount} = useMemo(() => {
        const count = {};
        products.forEach((p) => {
            const brand = p.thuongHieu?.tenThuongHieu?.trim();
            if (brand) count[brand] = (count[brand] || 0) + 1;
        });
        return {categories: ["Tất cả", ...Object.keys(count).sort((a, b) => a.localeCompare(b, "vi"))], categoryCount: count};
    }, [products]);

    /* ---------- LỌC SẢN PHẨM THEO THƯƠNG HIỆU ---------- */
    const filteredProducts = useMemo(() => {
        const keyword = deferredSearch.trim().toLowerCase();
        return products.filter((product) => {
            if (
                category !== "Tất cả" &&
                (product.thuongHieu?.tenThuongHieu || "") !== category
            ) {
                return false;
            }
            if (!keyword) return true;
            return (
                String(product.tenSanPham || "").toLowerCase().includes(keyword) ||
                String(product.maSanPham || "").toLowerCase().includes(keyword) ||
                String(product.thuongHieu?.tenThuongHieu || "")
                    .toLowerCase()
                    .includes(keyword) ||
                (searchText[product.id] || "").includes(keyword)
            );
        });
    }, [products, deferredSearch, category, searchText]);

    const filterKey = `${deferredSearch}|${category}`;
    const visibleCount =
        pageState.key === filterKey ? pageState.count : PAGE_SIZE;

    const visibleProducts = filteredProducts.slice(0, visibleCount);

    /* ---------- GIỎ HÀNG ---------- */
    const liveStock = useCallback(
        (variant) =>
            Number((variantById.get(variant.id) || variant).soLuongTon || 0),
        [variantById]
    );

    const addToCart = useCallback(
        (product, variant, qty = 1) => {
            const stock = liveStock(variant);
            const existing = cart.find((i) => i.variant.id === variant.id);
            const current = existing ? existing.quantity : 0;

            if (current + qty > stock) {
                showToast(`Chỉ còn ${stock} sản phẩm (${variant.maSku || "biến thể này"}).`);
                return false;
            }

            patchActive((o) => ({
                cart: existing
                    ? o.cart.map((i) =>
                        i.variant.id === variant.id
                            ? {...i, quantity: i.quantity + qty}
                            : i
                    )
                    : [...o.cart, {product, variant, quantity: qty}],
            }));
            showToast(
                `Đã thêm ${product.tenSanPham} · Size ${variant.kichCo?.tenKichCo || "-"}`,
                "ok"
            );
            return true;
        },
        [cart, liveStock, patchActive, showToast]
    );

    const updateQty = (variantId, delta) => {
        const item = cart.find((i) => i.variant.id === variantId);
        if (!item) return;
        const next = item.quantity + delta;
        if (next > liveStock(item.variant)) {
            showToast(`Chỉ còn ${liveStock(item.variant)} sản phẩm.`);
            return;
        }
        patchActive((o) => ({
            cart: o.cart
                .map((i) => (i.variant.id === variantId ? {...i, quantity: next} : i))
                .filter((i) => i.quantity > 0),
        }));
    };

    const removeItem = (variantId) =>
        patchActive((o) => ({cart: o.cart.filter((i) => i.variant.id !== variantId)}));

    const total = useMemo(
        () =>
            cart.reduce(
                (sum, item) => sum + Number(item.variant.giaBan || 0) * item.quantity,
                0
            ),
        [cart]
    );
    const totalQty = cart.reduce((s, i) => s + i.quantity, 0);

    /* ---------- CHỌN SẢN PHẨM ---------- */
    const selectProduct = useCallback(
        async (product) => {
            let variants = variantMap[product.id];

            if (!variants) {
                try {
                    const data = await readJson(`${API}/san-pham/${product.id}/chi-tiet`);
                    variants = Array.isArray(data) ? data : [];
                } catch (e) {
                    showToast(e.message || "Không thể lấy biến thể sản phẩm.");
                    return;
                }
            }

            if (!variants.length) {
                showToast("Sản phẩm này chưa có biến thể.");
                return;
            }

            const sellable = variants.filter(isSellable);
            if (!sellable.length) {
                showToast("Sản phẩm này hiện không còn tồn kho.");
                return;
            }

            // Chỉ có 1 lựa chọn → thêm thẳng, bỏ bước chọn
            if (sellable.length === 1) {
                addToCart(product, sellable[0]);
                return;
            }

            setVariantModal({open: true, product, variants});
        },
        [variantMap, addToCart, showToast]
    );

    const closeVariantModal = useCallback(
        () => setVariantModal({open: false, product: null, variants: []}),
        []
    );

    const addVariantFromModal = useCallback(
        (variant) => {
            const ok = addToCart(variantModal.product, variant);
            if (ok) closeVariantModal();
        },
        [addToCart, variantModal.product, closeVariantModal]
    );

    /* ---------- ENTER Ở Ô TÌM KIẾM (máy quét mã vạch) ---------- */
    const handleSearchKeyDown = (e) => {
        if (e.key === "Escape") {
            setSearch("");
            return;
        }
        if (e.key !== "Enter") return;

        const kw = search.trim().toLowerCase();
        if (!kw) return;
        e.preventDefault();

        // 1) Trùng SKU → thêm thẳng biến thể
        const hit = skuIndex.get(kw);
        if (hit) {
            if (isSellable(hit.variant)) {
                addToCart(hit.product, hit.variant);
            } else {
                showToast(`${hit.variant.maSku} đã hết hàng hoặc ngừng bán.`);
            }
            setSearch("");
            return;
        }

        // 2) Trùng mã sản phẩm, hoặc chỉ còn 1 kết quả → chọn sản phẩm đó
        const exact = products.find(
            (p) => String(p.maSanPham || "").toLowerCase() === kw
        );
        const target = exact || (filteredProducts.length === 1 ? filteredProducts[0] : null);

        if (target) {
            selectProduct(target);
            setSearch("");
        } else if (!filteredProducts.length) {
            showToast("Không tìm thấy sản phẩm / mã SKU này.");
        }
    };

    /* ---------- HÓA ĐƠN CHỜ ---------- */
    const newOrderTab = useCallback(() => {
        if (orders.length >= MAX_TABS) {
            showToast(`Tối đa ${MAX_TABS} hóa đơn chờ.`);
            return;
        }
        const id = nextIdRef.current++;
        setOrders((old) => [...old, createOrder(id)]);
        setActiveId(id);
    }, [orders.length, showToast]);

    const closeOrderTab = (id) => {
        const target = orders.find((o) => o.id === id);
        if (
            target?.cart.length &&
            !window.confirm("Hóa đơn này còn sản phẩm trong giỏ. Bạn muốn xóa?")
        ) {
            return;
        }
        const rest = orders.filter((o) => o.id !== id);
        if (!rest.length) {
            const fresh = createOrder(nextIdRef.current++);
            setOrders([fresh]);
            setActiveId(fresh.id);
            return;
        }
        setOrders(rest);
        if (activeId === id) setActiveId(rest[0].id);
    };

    /* ---------- THANH TOÁN ---------- */
    const openPaymentModal = useCallback(() => {
        if (!cart.length) return;
        setShowPayment(true);
    }, [cart.length]);

    const confirmPayment = async ({phone, name} = {}) => {
        if (loadingCheckout || !cart.length) return;

        try {
            setLoadingCheckout(true);

            const payload = {
                phuongThucThanhToan: paymentMethod,
                tenKhach: name?.trim() || null,
                soDienThoaiKhach: phone?.trim() || null,
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

            const cartSnapshot = [...cart];
            const totalPaid = Number(result?.tongThanhToan || total);

            setShowPayment(false);
            setInvoice({
                maHoaDon: result?.maHoaDon || `HD${Date.now()}`,
                ngayLap: result?.ngayLap || new Date().toISOString(),
                phuongThucThanhToan: paymentMethod,
                tenKhach: result?.tenKhach || null,
                maKhachHang: result?.maKhachHang || null,
                soDienThoaiKhach: result?.soDienThoaiKhach || null,
                tongThanhToan: totalPaid,
                chiTiet: cartSnapshot.map((item) => ({
                    tenSanPham: item.product.tenSanPham,
                    maSanPham: item.product.maSanPham,
                    kichCo: item.variant.kichCo?.tenKichCo,
                    mauSac: item.variant.mauSac?.tenMau,
                    soLuong: item.quantity,
                    donGia: Number(item.variant.giaBan || 0),
                    thanhTien: Number(item.variant.giaBan || 0) * item.quantity,
                })),
            });

            // Trừ tồn kho ngay trên giao diện (không phải tải lại toàn bộ)
            setVariantMap((old) => {
                const next = {...old};
                cartSnapshot.forEach(({product, variant, quantity}) => {
                    if (!next[product.id]) return;
                    next[product.id] = next[product.id].map((v) =>
                        v.id === variant.id
                            ? {...v, soLuongTon: Math.max(0, Number(v.soLuongTon || 0) - quantity)}
                            : v
                    );
                });
                return next;
            });

            patchActive({cart: []});
        } catch (err) {
            console.error(err);
            showToast(err.message || "Không thể tạo hóa đơn tại quầy.", "error");
        } finally {
            setLoadingCheckout(false);
        }
    };

    const closeInvoice = useCallback(() => {
        setInvoice(null);
        // Đồng bộ dữ liệu ở nền — không chặn nhân viên bán đơn kế tiếp
        if (onRefresh) {
            Promise.resolve(onRefresh()).catch((e) => console.error(e));
        }
        setTimeout(() => searchRef.current?.focus(), 0);
    }, [onRefresh]);

    /* ---------- PHÍM TẮT ---------- */
    useEffect(() => {
        searchRef.current?.focus();
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if (invoice) {
                if (e.key === "Escape" || e.key === "Enter") {
                    e.preventDefault();
                    closeInvoice();
                }
                return;
            }
            if (variantModal.open || showPayment) return;

            if (e.key === "F2") {
                e.preventDefault();
                searchRef.current?.focus();
                searchRef.current?.select();
            } else if (e.key === "F4") {
                e.preventDefault();
                newOrderTab();
            } else if (e.key === "F8") {
                e.preventDefault();
                patchActive((o) => ({
                    method: o.method === "TIEN_MAT" ? "CHUYEN_KHOAN" : "TIEN_MAT",
                }));
            } else if (e.key === "F9") {
                e.preventDefault();
                openPaymentModal();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [
        invoice,
        variantModal.open,
        showPayment,
        closeInvoice,
        newOrderTab,
        patchActive,
        openPaymentModal,
    ]);

    /* =========================================================
       RENDER
       ========================================================= */
    return (
        <div className="employee-content">
            <PageHeading
                title="Bán hàng tại quầy"
                description="Quét mã SKU hoặc tìm sản phẩm, thêm vào giỏ và thanh toán."
                action={
                    <div className="pos-shortcuts">
                        <span><kbd>F2</kbd> Tìm</span>
                        <span><kbd>F4</kbd> Đơn mới</span>
                        <span><kbd>F8</kbd> Đổi thanh toán</span>
                        <span><kbd>F9</kbd> Thanh toán</span>
                    </div>
                }
            />

            {/* ---------- HÓA ĐƠN CHỜ ---------- */}
            <div className="pos-tabs">
                {orders.map((o, idx) => {
                    const qty = o.cart.reduce((s, i) => s + i.quantity, 0);
                    return (
                        <div
                            key={o.id}
                            className={`pos-tab ${o.id === activeId ? "active" : ""}`}
                        >
                            <button type="button" onClick={() => setActiveId(o.id)}>
                                Đơn {idx + 1}
                                {qty > 0 && <b>{qty}</b>}
                            </button>
                            {(orders.length > 1 || o.cart.length > 0) && (
                                <button
                                    type="button"
                                    className="pos-tab-close"
                                    title="Xóa hóa đơn này"
                                    onClick={() => closeOrderTab(o.id)}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    );
                })}
                <button
                    type="button"
                    className="pos-tab-add"
                    onClick={newOrderTab}
                    title="Hóa đơn mới (F4)"
                >
                    ＋
                </button>
            </div>

            {/* ⭐ BẮT ĐẦU KHUNG NỀN TRẮNG CHUNG */}
            <div className="pos-main-container">
                <div className="pos-layout">
                    {/* ---------- CỘT 1: THƯƠNG HIỆU ---------- */}
                    <aside className="pos-category-panel">
                    <div className="pos-category-heading">
                        <span className="pos-category-icon">☷</span>
                        <div>
                            <h2>Thương hiệu</h2>
                            <p>{Math.max(categories.length - 1, 0)} thương hiệu</p>
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
                                    {item === "Tất cả" ? products.length : categoryCount[item]}
                                </small>
                            </button>
                        ))}
                    </div>
                </aside>

                    {/* ---------- CỘT 2: SẢN PHẨM ---------- */}
                    <section className="pos-products">
                    <div className="pos-products-head">
                        <div>
                            <h2>Sản phẩm</h2>
                            <p>Nhấn Enter khi nhập đúng mã SKU để thêm ngay vào hóa đơn</p>
                        </div>
                        <span className="pos-product-count">
                            {filteredProducts.length} sản phẩm
                        </span>
                    </div>

                    <div className="pos-search-box">
                        <span>⌕</span>
                        <input
                            ref={searchRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Quét mã SKU hoặc tìm theo tên, mã sản phẩm, thương hiệu... (F2)"
                        />
                        {search && (
                            <button type="button" onClick={() => setSearch("")}>
                                ×
                            </button>
                        )}
                    </div>

                    <div className="pos-product-grid">
                        {visibleProducts.length ? (
                            visibleProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    stats={productStats[product.id]}
                                    onSelect={selectProduct}
                                />
                            ))
                        ) : (
                            <div className="pos-no-products">
                                <div>⌕</div>
                                <strong>Không tìm thấy sản phẩm</strong>
                            </div>
                        )}
                    </div>

                    {filteredProducts.length > visibleCount && (
                        <button
                            type="button"
                            className="pos-load-more"
                            onClick={() =>
                                setPageState({key: filterKey, count: visibleCount + PAGE_SIZE})
                            }
                        >
                            Xem thêm {filteredProducts.length - visibleCount} sản phẩm
                        </button>
                    )}
                </section>

                    {/* ---------- CỘT 3: GIỎ HÀNG ---------- */}
                    <aside className="pos-cart">
                    <div className="employee-card-heading">
                        <div>
                            <h2>Giỏ hàng ({totalQty})</h2>
                            <p>Hóa đơn tại quầy</p>
                        </div>
                        {cart.length > 0 && (
                            <button
                                type="button"
                                className="employee-link"
                                onClick={() => patchActive({cart: []})}
                            >
                                Xóa tất cả
                            </button>
                        )}
                    </div>

                    <div className="pos-cart-list">
                        {cart.length ? (
                            cart.map((item) => (
                                <div className="pos-cart-item" key={item.variant.id}>
                                    <img
                                        src={item.product.hinhAnh || FALLBACK_IMG}
                                        alt={item.product.tenSanPham}
                                    />
                                    <div className="pos-cart-info">
                                        <strong>{item.product.tenSanPham}</strong>
                                        <small>
                                            Size {item.variant.kichCo?.tenKichCo || "-"} ·{" "}
                                            {item.variant.mauSac?.tenMau || "-"}
                                        </small>
                                        <b>
                                            {formatMoney(
                                                Number(item.variant.giaBan || 0) * item.quantity
                                            )}
                                        </b>

                                        <div className="quantity-control">
                                            <button
                                                type="button"
                                                onClick={() => updateQty(item.variant.id, -1)}
                                            >
                                                −
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateQty(item.variant.id, 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="pos-remove"
                                        onClick={() => removeItem(item.variant.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="pos-empty-cart">
                                <div>🛒</div>
                                <strong>Chưa có sản phẩm</strong>
                                <span>Quét mã hoặc chọn sản phẩm bên trái.</span>
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
                            <span>Phương thức thanh toán (F8)</span>
                        </div>

                        <div className="pos-payment-options">
                            {[
                                ["TIEN_MAT", "💵", "Tiền mặt"],
                                ["CHUYEN_KHOAN", "🏦", "Chuyển khoản"],
                            ].map(([value, icon, label]) => (
                                <button
                                    type="button"
                                    key={value}
                                    className={`pos-payment-option ${
                                        paymentMethod === value ? "active" : ""
                                    }`}
                                    onClick={() => patchActive({method: value})}
                                >
                                    <span className="pos-payment-icon">{icon}</span>
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
                        <strong>Thanh toán (F9)</strong>
                        <b>{formatMoney(total)}</b>
                    </button>

                        <small className="pos-note">
                            * Hóa đơn tại quầy được ghi trực tiếp vào database.
                        </small>
                    </aside>
                </div>
            </div>
            {/* ⭐ KẾT THÚC KHUNG NỀN TRẮNG CHUNG */}

            {toast && (
                <div className={`pos-toast ${toast.type}`} role="status">
                    {toast.message}
                </div>
            )}

            <PaymentModal
                open={showPayment}
                onClose={() => !loadingCheckout && setShowPayment(false)}
                method={paymentMethod}
                total={total}
                loading={loadingCheckout}
                onConfirm={confirmPayment}
            />

            <InvoiceModal invoice={invoice} onClose={closeInvoice} />

            <VariantPickerModal
                open={variantModal.open}
                product={variantModal.product}
                variants={variantModal.variants}
                onClose={closeVariantModal}
                onConfirm={addVariantFromModal}
            />
        </div>
    );
}
