import {useEffect, useMemo, useState} from "react";
import "./EmployeeDashboard.css";
import {EmployeeOverview, ProductsPage} from "./EmployeeOverviewProducts.jsx";

const API = "http://localhost:8080/api";

const MENU = [
    {id: "dashboard", icon: "▦", label: "Tổng quan"},
    {id: "ban-hang", icon: "🛒", label: "Bán hàng tại quầy"},
    {id: "don-online", icon: "▤", label: "Đơn online"},
    {id: "hoa-don", icon: "▧", label: "Hóa đơn"},
    {id: "khach-hang", icon: "◎", label: "Khách hàng"},
    {id: "san-pham", icon: "□", label: "Sản phẩm"},
];

const STATUS_LABEL = {
    CHO_XAC_NHAN: "Chờ xác nhận",
    DA_XAC_NHAN: "Đã xác nhận",
    DANG_CHUAN_BI: "Đang chuẩn bị",
    DANG_GIAO: "Đang giao",
    DA_GIAO: "Đã giao",
    DA_THANH_TOAN: "Đã thanh toán",
    DA_HUY: "Đã hủy",
};

const STATUS_CLASS = {
    CHO_XAC_NHAN: "pending",
    DA_XAC_NHAN: "confirmed",
    DANG_CHUAN_BI: "processing",
    DANG_GIAO: "shipping",
    DA_GIAO: "done",
    DA_THANH_TOAN: "paid",
    DA_HUY: "cancelled",
};

function formatMoney(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN");
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
            data?.message ||
            data?.error ||
            text ||
            "Không thể kết nối máy chủ"
        );
    }

    return data;
}

function StatusBadge({value}) {
    return (
        <span className={`employee-status ${STATUS_CLASS[value] || ""}`}>
            {STATUS_LABEL[value] || value || "-"}
        </span>
    );
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

function CounterSale({products, onRefresh}) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("Tất cả");
    const [cart, setCart] = useState([]);
    const [loadingVariant, setLoadingVariant] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("TIEN_MAT");
    const [variantMap, setVariantMap] = useState({});

    const categories = useMemo(() => {
        const values = products
            .map((p) => p.danhMuc?.tenDanhMuc)
            .filter(Boolean);
        return ["Tất cả", ...new Set(values)];
    }, [products]);

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
                        const data = await readJson(`${API}/san-pham/${product.id}/chi-tiet`);
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

const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return products.filter((product) => {
        const name = String(product.tenSanPham || "").toLowerCase();
        const code = String(product.maSanPham || "").toLowerCase();
        const brand = String(product.thuongHieu?.tenThuongHieu || "").toLowerCase();
        const cat = product.danhMuc?.tenDanhMuc || "";
        return (
            (!keyword || name.includes(keyword) || code.includes(keyword) || brand.includes(keyword)) &&
            (category === "Tất cả" || cat === category)
        );
    });
}, [products, search, category]);

const addProduct = async (product) => {
    try {
        setLoadingVariant(true);
        const cachedVariants = variantMap[product.id];
        const variants = cachedVariants
            ? cachedVariants
            : await readJson(`${API}/san-pham/${product.id}/chi-tiet`);
        const list = Array.isArray(variants) ? variants : [];

        const available = list.find((item) => Number(item.soLuongTon || 0) > 0);

        if (!available) {
            alert("Sản phẩm này hiện không còn tồn kho.");
            return;
        }

        setCart((old) => {
            const existing = old.find((item) => item.variant.id === available.id);
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
                {
                    product,
                    variant: available,
                    quantity: 1,
                },
            ];
        });
    } catch (error) {
        alert(error.message || "Không thể lấy biến thể sản phẩm.");
    } finally {
        setLoadingVariant(false);
    }
};

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

const total = cart.reduce(
    (sum, item) => sum + Number(item.variant.giaBan || 0) * item.quantity,
    0
);

return (
    <div className="employee-content">
        <PageHeading
            title="Bán hàng tại quầy"
            description="Chọn sản phẩm, thêm vào giỏ hàng và chuẩn bị thanh toán."
        />

        <div className="pos-layout">
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
                                        (product) =>
                                            product.danhMuc?.tenDanhMuc === item
                                    ).length}
                            </small>
                        </button>
                    ))}
                </div>
            </aside>

            <section className="employee-card pos-products">
                <div className="pos-products-head">
                    <div>
                        <h2>Sản phẩm</h2>
                        <p>Chọn sản phẩm để thêm vào hóa đơn tại quầy</p>
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
                            aria-label="Xóa tìm kiếm"
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
                                className={`pos-product-card ${
                                    (() => {
                                        const variants = variantMap[product.id] || [];
                                        const stock = variants.reduce(
                                            (sum, item) => sum + Number(item.soLuongTon || 0),
                                            0
                                        );
                                        return variants.length && stock <= 0 ? "sold-out" : "";
                                    })()
                                }`}
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
                                    <span className="pos-product-add">＋</span>
                                </div>

                                <div className="pos-product-brand">
                                    {product.thuongHieu?.tenThuongHieu || "FShop"}
                                </div>

                                <strong>{product.tenSanPham}</strong>

                                <span className="pos-product-code">
                                        {product.maSanPham || "-"}
                                    </span>

                                <div className="pos-product-price">
                                    {(() => {
                                        const variants = variantMap[product.id] || [];
                                        const prices = variants
                                            .map((item) => Number(item.giaBan || 0))
                                            .filter((value) => value > 0);
                                        const minPrice = prices.length
                                            ? Math.min(...prices)
                                            : Number(product.giaBan || 0);
                                        return minPrice > 0
                                            ? formatMoney(minPrice)
                                            : "Chưa có giá";
                                    })()}
                                </div>
                                <div className="pos-product-meta">
                                    {(() => {
                                        const variants = variantMap[product.id] || [];
                                        const stock = variants.reduce(
                                            (sum, item) => sum + Number(item.soLuongTon || 0),
                                            0
                                        );
                                        const soldOut = variants.length > 0 && stock <= 0;
                                        return (
                                            <>
                                                    <span
                                                        className={`pos-stock-dot ${soldOut ? "out" : stock <= 5 ? "low" : ""}`}></span>
                                                <span>
                                                        {variants.length
                                                            ? soldOut
                                                                ? "Hết hàng"
                                                                : stock <= 5
                                                                    ? `Sắp hết (${stock})`
                                                                    : `Còn hàng (${stock})`
                                                            : "Đang tải tồn kho..."}
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
                            <span>Hãy thử từ khóa hoặc danh mục khác.</span>
                        </div>
                    )}
                </div>
            </section>

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
                            <div className="pos-cart-item" key={item.variant.id}>
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
                                        Size {item.variant.kichCo?.tenKichCo || "-"} ·{" "}
                                        {item.variant.mauSac?.tenMau || "-"}
                                    </small>
                                    <b>{formatMoney(item.variant.giaBan)}</b>

                                    <div className="quantity-control">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateQty(item.variant.id, -1)
                                            }
                                        >
                                            −
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateQty(item.variant.id, 1)
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
                                                (row) =>
                                                    row.variant.id !==
                                                    item.variant.id
                                            )
                                        )
                                    }
                                    aria-label="Xóa sản phẩm"
                                >
                                    ×
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="pos-empty-cart">
                            <div>🛒</div>
                            <strong>Chưa có sản phẩm</strong>
                            <span>Chọn sản phẩm bên trái để thêm vào giỏ.</span>
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
                            ["CHUYEN_KHOAN", "▣", "Chuyển khoản"],
                            ["MOMO", "◈", "Ví điện tử (MoMo)"],
                        ].map(([value, icon, label]) => (
                            <button
                                type="button"
                                key={value}
                                className={`pos-payment-option ${
                                    paymentMethod === value ? "active" : ""
                                }`}
                                onClick={() => setPaymentMethod(value)}
                            >
                                    <span className="pos-payment-radio">
                                        {paymentMethod === value ? "●" : "○"}
                                    </span>
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
                    onClick={() =>
                        alert(
                            `Đã chọn ${paymentMethod}. Giao diện bán hàng tại quầy đã kết nối sản phẩm và tồn kho từ database. Backend hiện tại chưa có API riêng để tạo hóa đơn TAI_QUAY từ giỏ POS.`
                        )
                    }
                >
                    <span>▣</span>
                    <strong>Thanh toán</strong>
                    <b>{formatMoney(total)}</b>
                </button>

                <small className="pos-note">
                    * Hóa đơn tại quầy sẽ được ghi vào database sau khi nối API
                    tạo đơn TAI_QUAY.
                </small>
            </aside>
        </div>
    </div>
);
}

function OnlineOrders({orders, onUpdateOrder, onOpenDetail}) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("Tất cả");

    const onlineOrders = orders.filter((item) => item.loaiHoaDon === "ONLINE");

    const filters = [
        ["Tất cả", null],
        ["Chờ xác nhận", "CHO_XAC_NHAN"],
        ["Đã xác nhận", "DA_XAC_NHAN"],
        ["Đang chuẩn bị", "DANG_CHUAN_BI"],
        ["Đang giao", "DANG_GIAO"],
        ["Đã giao", "DA_GIAO"],
        ["Đã hủy", "DA_HUY"],
    ];

    const filtered = onlineOrders.filter((item) => {
        const keyword = search.trim().toLowerCase();
        const customer = item.khachHang?.hoTen || item.diaChi?.tenNguoiNhan || "";
        const matchSearch =
            !keyword ||
            String(item.maHoaDon || "").toLowerCase().includes(keyword) ||
            customer.toLowerCase().includes(keyword);

        const selected = filters.find((row) => row[0] === filter)?.[1];
        return matchSearch && (!selected || item.trangThai === selected);
    });

    return (
        <div className="employee-content">
            <PageHeading
                title="Đơn online"
                description="Theo dõi và xử lý các đơn hàng từ website."
            />

            <section className="employee-card">
                <div className="employee-order-tabs">
                    {filters.map(([label, value]) => (
                        <button
                            type="button"
                            key={label}
                            className={`order-status-tab ${filter === label ? "active" : ""} ${
                                value ? `status-${String(value).toLowerCase()}` : "status-all"
                            }`}
                            onClick={() => setFilter(label)}
                        >
                            {label}
                            <span>
                                {value
                                    ? onlineOrders.filter((item) => item.trangThai === value).length
                                    : onlineOrders.length}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="employee-search-row">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="⌕ Tìm mã đơn, tên khách hàng..."
                    />
                    <button type="button" className="employee-refresh" onClick={() => window.location.reload()}>
                        ↻ Làm mới
                    </button>
                </div>

                <div className="employee-table-wrapper">
                    <table className="employee-table">
                        <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Khách hàng</th>
                            <th>SĐT</th>
                            <th>Tổng tiền</th>
                            <th>Thanh toán</th>
                            <th>Trạng thái</th>
                            <th>Ngày đặt</th>
                            <th>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length ? (
                            filtered.map((order) => (
                                <tr key={order.id}>
                                    <td><strong>{order.maHoaDon}</strong></td>
                                    <td>{order.khachHang?.hoTen || order.diaChi?.tenNguoiNhan || "Khách lẻ"}</td>
                                    <td>{order.khachHang?.soDienThoai || order.diaChi?.soDienThoai || "-"}</td>
                                    <td><strong>{formatMoney(order.tongThanhToan)}</strong></td>
                                    <td>{order.thanhToan?.trangThai === "DA_THANH_TOAN" ? "Đã thanh toán" : "Chờ thanh toán"}</td>
                                    <td><StatusBadge value={order.trangThai}/></td>
                                    <td>{formatDate(order.ngayLap)}</td>
                                    <td className="employee-actions">
                                        <button type="button" onClick={() => onOpenDetail(order)}>Xem</button>
                                        {order.trangThai === "CHO_XAC_NHAN" && (
                                            <button type="button" className="primary"
                                                    onClick={() => onUpdateOrder(order, "DA_XAC_NHAN")}>
                                                Xác nhận
                                            </button>
                                        )}
                                        {order.trangThai === "DA_XAC_NHAN" && (
                                            <button type="button" className="primary"
                                                    onClick={() => onUpdateOrder(order, "DANG_CHUAN_BI")}>
                                                Chuẩn bị
                                            </button>
                                        )}
                                        {order.trangThai === "DANG_CHUAN_BI" && (
                                            <button type="button" className="primary"
                                                    onClick={() => onUpdateOrder(order, "DANG_GIAO")}>
                                                Giao hàng
                                            </button>
                                        )}
                                        {order.trangThai === "DANG_GIAO" && (
                                            <button type="button" className="primary"
                                                    onClick={() => onUpdateOrder(order, "DA_GIAO")}>
                                                Đã giao
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="employee-empty">Không có đơn online phù hợp.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function HoaDonPage({orders, onOpenDetail}) {
    const [search, setSearch] = useState("");

    const filtered = orders.filter((item) => {
        const keyword = search.trim().toLowerCase();

        const maHoaDon = String(item?.maHoaDon || "").toLowerCase();

        const idKhachHang = String(
            item?.khachHang?.id || ""
        ).toLowerCase();

        const hoTen = String(
            item?.khachHang?.hoTen ||
            item?.diaChi?.tenNguoiNhan ||
            ""
        ).toLowerCase();

        const soDienThoai = String(
            item?.khachHang?.soDienThoai ||
            item?.diaChi?.soDienThoai ||
            ""
        ).toLowerCase();

        return (
            !keyword ||
            maHoaDon.includes(keyword) ||
            idKhachHang.includes(keyword) ||
            hoTen.includes(keyword) ||
            soDienThoai.includes(keyword)
        );
    });

    return (
        <div className="employee-content">
            <PageHeading
                title="Hóa đơn"
                description="Tra cứu hóa đơn online và tại quầy."
            />

            <section className="employee-card">
                <div className="employee-search-row">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="⌕ Tìm ID khách hàng, mã hóa đơn, tên khách hàng, SĐT..."
                    />
                </div>

                <div className="employee-table-wrapper">
                    <table
                        className="employee-table"
                        style={{minWidth: "1180px"}}
                    >
                        <thead>
                        <tr>
                            <th>ID KH</th>
                            <th>Mã hóa đơn</th>
                            <th>Khách hàng</th>
                            <th>SĐT</th>
                            <th>Loại</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                            <th>Ngày lập</th>
                            <th>Thao tác</th>
                        </tr>
                        </thead>

                        <tbody>
                        {filtered.length > 0 ? (
                            filtered.map((item) => (
                                <tr key={item.id}>
                                    {/* ID khách hàng lấy trực tiếp từ database */}
                                    <td>
                                        <strong>
                                            {item?.khachHang?.id
                                                ? `#${item.khachHang.id}`
                                                : "-"}
                                        </strong>
                                    </td>

                                    {/* Mã hóa đơn */}
                                    <td>
                                        <strong>
                                            {item?.maHoaDon ||
                                                `HD${item?.id || ""}`}
                                        </strong>
                                    </td>

                                    {/* Khách hàng */}
                                    <td>
                                        {item?.khachHang?.hoTen ||
                                            item?.diaChi?.tenNguoiNhan ||
                                            "Khách lẻ"}
                                    </td>

                                    {/* Số điện thoại */}
                                    <td>
                                        {item?.khachHang?.soDienThoai ||
                                            item?.diaChi?.soDienThoai ||
                                            "-"}
                                    </td>

                                    {/* Loại hóa đơn */}
                                    <td>
                                        <span className="employee-type">
                                            {item?.loaiHoaDon === "TAI_QUAY"
                                                ? "Tại quầy"
                                                : "Online"}
                                        </span>
                                    </td>

                                    {/* Tổng tiền */}
                                    <td>
                                        <strong>
                                            {formatMoney(
                                                item?.tongThanhToan || 0
                                            )}
                                        </strong>
                                    </td>

                                    {/* Trạng thái */}
                                    <td>
                                        <StatusBadge
                                            value={item?.trangThai}
                                        />
                                    </td>

                                    {/* Ngày lập */}
                                    <td>
                                        {formatDate(item?.ngayLap)}
                                    </td>

                                    {/* Thao tác */}
                                    <td>
                                        <button
                                            className="table-view"
                                            type="button"
                                            onClick={() =>
                                                onOpenDetail(item)
                                            }
                                        >
                                            Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="9"
                                    className="employee-empty"
                                >
                                    Không có hóa đơn phù hợp.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function CustomersPage({customers}) {
    const [search, setSearch] = useState("");
    const filtered = customers.filter((item) => {
        const keyword = search.trim().toLowerCase();
        return (
            !keyword ||
            String(item.hoTen || "").toLowerCase().includes(keyword) ||
            String(item.soDienThoai || "").toLowerCase().includes(keyword) ||
            String(item.taiKhoan?.tenDangNhap || "").toLowerCase().includes(keyword)
        );
    });

    return (
        <div className="employee-content">
            <PageHeading title="Khách hàng" description="Tra cứu thông tin khách hàng từ database."/>
            <section className="employee-card">
                <div className="employee-search-row">
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                           placeholder="⌕ Tìm tên, số điện thoại, tài khoản..."/>
                </div>
                <div className="employee-table-wrapper">
                    <table className="employee-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Họ tên</th>
                            <th>Tài khoản</th>
                            <th>Số điện thoại</th>
                            <th>Giới tính</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((item) => (
                            <tr key={item.id}>
                                <td>#{item.id}</td>
                                <td><strong>{item.hoTen}</strong></td>
                                <td>{item.taiKhoan?.tenDangNhap || "-"}</td>
                                <td>{item.soDienThoai || "-"}</td>
                                <td>{item.gioiTinh === "NAM" ? "Nam" : item.gioiTinh === "NU" ? "Nữ" : item.gioiTinh || "-"}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function OrderDetailModal({order, onClose}) {
    const [detail, setDetail] = useState([]);
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!order?.id) return;

        let mounted = true;
        setLoading(true);

        Promise.all([
            readJson(`${API}/hoa-don/${order.id}/chi-tiet`).catch(() => []),
            readJson(`${API}/hoa-don/${order.id}/thanh-toan`).catch(() => null),
        ])
            .then(([details, paymentData]) => {
                if (!mounted) return;
                setDetail(Array.isArray(details) ? details : []);
                setPayment(paymentData);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [order]);

    if (!order) return null;

    return (
        <div className="employee-modal-backdrop" onClick={onClose}>
            <div className="employee-modal" onClick={(e) => e.stopPropagation()}>
                <div className="employee-modal-head">
                    <div>
                        <span className="employee-eyebrow">CHI TIẾT ĐƠN</span>
                        <h2>{order.maHoaDon}</h2>
                    </div>
                    <button type="button" onClick={onClose}>×</button>
                </div>

                <div className="order-detail-grid">
                    <div>
                        <span>Khách hàng</span><strong>{order.khachHang?.hoTen || order.diaChi?.tenNguoiNhan || "Khách lẻ"}</strong>
                    </div>
                    <div>
                        <span>Số điện thoại</span><strong>{order.khachHang?.soDienThoai || order.diaChi?.soDienThoai || "-"}</strong>
                    </div>
                    <div><span>Loại đơn</span><strong>{order.loaiHoaDon === "TAI_QUAY" ? "Tại quầy" : "Online"}</strong>
                    </div>
                    <div><span>Trạng thái</span><StatusBadge value={order.trangThai}/></div>
                </div>

                <h3>Sản phẩm</h3>
                {loading ? (
                    <div className="employee-empty">Đang tải chi tiết...</div>
                ) : (
                    <div className="employee-detail-list">
                        {detail.map((item) => (
                            <div key={item.id} className="employee-detail-item">
                                <div>
                                    <strong>
                                        {item.sanPhamChiTiet?.sanPham?.tenSanPham ||
                                            item.sanPham?.tenSanPham ||
                                            "Sản phẩm"}
                                    </strong>
                                    <small>
                                        SKU: {item.sanPhamChiTiet?.maSku || "-"} · SL: {item.soLuong}
                                    </small>
                                </div>
                                <strong>{formatMoney(item.thanhTien || Number(item.donGia || 0) * Number(item.soLuong || 0))}</strong>
                            </div>
                        ))}
                    </div>
                )}

                <div className="order-detail-total">
                    <span>Thanh toán</span>
                    <strong>{formatMoney(payment?.soTien || order.tongThanhToan)}</strong>
                </div>
            </div>
        </div>
    );
}

export default function EmployeeDashboard({
                                              taiKhoan,
                                              dangXuat,
                                              onBackToShop,
                                          }) {
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [employees, setEmployees] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [variants, setVariants] = useState([]);
    const [productPreset, setProductPreset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [error, setError] = useState("");

    const currentEmployee = useMemo(() => {
        const accountId = taiKhoan?.id;
        return (
            employees.find(
                (item) =>
                    Number(item?.taiKhoan?.id) === Number(accountId)
            ) || null
        );
    }, [employees, taiKhoan]);

    const loadData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            setError("");

            const [employeeData, orderData, customerData, productData, variantData] =
                await Promise.all([
                    readJson(`${API}/nhan-vien`),
                    readJson(`${API}/hoa-don`),
                    readJson(`${API}/khach-hang`),
                    readJson(`${API}/san-pham`),
                    readJson(`${API}/san-pham-chi-tiet`).catch(() => []),
                ]);

            setEmployees(Array.isArray(employeeData) ? employeeData : []);
            setOrders(
                (Array.isArray(orderData) ? orderData : []).sort(
                    (a, b) =>
                        new Date(b.ngayLap || b.ngayCapNhat || 0) -
                        new Date(a.ngayLap || a.ngayCapNhat || 0)
                )
            );
            setCustomers(Array.isArray(customerData) ? customerData : []);
            setProducts(Array.isArray(productData) ? productData : []);
            setVariants(Array.isArray(variantData) ? variantData : []);
        } catch (err) {
            console.error(err);
            setError(err.message || "Không thể tải dữ liệu nhân viên.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const updateOrderStatus = async (order, status) => {
        try {
            const params = new URLSearchParams({
                trangThai: status,
                ghiChu: `Nhân viên cập nhật: ${STATUS_LABEL[status] || status}`,
            });

            const updated = await readJson(
                `${API}/hoa-don/${order.id}/trang-thai?${params.toString()}`,
                {method: "PUT"}
            );

            setOrders((old) =>
                old.map((item) => (item.id === order.id ? updated : item))
            );
        } catch (err) {
            alert(err.message || "Không thể cập nhật đơn hàng.");
        }
    };

    const goTo = (menu, preset = null) => {
        setProductPreset(preset);
        setActiveMenu(menu);
    };

    const activeLabel =
        MENU.find((item) => item.id === activeMenu)?.label || "Tổng quan";

    return (
        <div className="employee-layout">
            <aside className="employee-sidebar">
                <div className="employee-brand">
                    <div className="employee-brand-mark">F</div>
                    <div>
                        <strong>FShop</strong>
                        <span>NHÂN VIÊN</span>
                    </div>
                </div>

                <div className="employee-menu-title">LÀM VIỆC</div>

                <nav className="employee-nav">
                    {MENU.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className={activeMenu === item.id ? "active" : ""}
                            onClick={() => goTo(item.id)}
                        >
                            <span className="employee-nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="employee-sidebar-footer">
                    <button
                        type="button"
                        onClick={onBackToShop}
                        disabled={!onBackToShop}
                    >
                        <span>←</span>
                        Cửa hàng
                    </button>
                    <button type="button" onClick={dangXuat}>
                        <span>↪</span>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <main className="employee-main">
                <header className="employee-topbar">
                    <div className="employee-breadcrumb">
                        FShop <span>/</span> Nhân viên <span>/</span>
                        <strong>{activeLabel}</strong>
                    </div>

                    <div className="employee-account">
                        <button className="employee-notification" type="button">♢</button>
                        <div className="employee-avatar">
                            {(currentEmployee?.hoTen || "NV").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="employee-account-info">
                            <strong>{currentEmployee?.hoTen || "Nhân viên bán hàng"}</strong>
                            <span>{currentEmployee?.chucVu === "NHAN_VIEN_BAN_HANG" ? "NHÂN VIÊN BÁN HÀNG" : currentEmployee?.chucVu || "NHÂN VIÊN"}</span>
                        </div>
                    </div>
                </header>

                <div className="employee-main-body">
                    {error && (
                        <div className="employee-error">
                            {error}
                            <button type="button" onClick={() => loadData()}>Thử lại</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="employee-loading">Đang tải dữ liệu...</div>
                    ) : (
                        <>
                            {activeMenu === "dashboard" && (
                                <EmployeeOverview
                                    orders={orders}
                                    products={products}
                                    variants={variants}
                                    onMenu={goTo}
                                    onOpenDetail={setSelectedOrder}
                                    onUpdateOrder={updateOrderStatus}
                                    onRefresh={() => loadData(true)}
                                />
                            )}

                            {activeMenu === "ban-hang" && (
                                <CounterSale
                                    products={products}
                                    onRefresh={loadData}
                                />
                            )}

                            {activeMenu === "don-online" && (
                                <OnlineOrders
                                    orders={orders}
                                    onUpdateOrder={updateOrderStatus}
                                    onOpenDetail={setSelectedOrder}
                                />
                            )}

                            {activeMenu === "hoa-don" && (
                                <HoaDonPage
                                    orders={orders}
                                    onOpenDetail={setSelectedOrder}
                                />
                            )}

                            {activeMenu === "khach-hang" && (
                                <CustomersPage customers={customers}/>
                            )}

                            {activeMenu === "san-pham" && (
                                <ProductsPage
                                    key={productPreset || "all"}
                                    products={products}
                                    variants={variants}
                                    preset={productPreset}
                                    onMenu={goTo}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
}

