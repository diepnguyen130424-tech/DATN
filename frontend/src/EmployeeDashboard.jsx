import {useEffect, useMemo, useState} from "react";
import "./EmployeeDashboard.css";
import EmployeeChat from "./EmployeeChat";
import { BanHangTaiQuayContent } from "./AdminDashboard";
import Returns from "./Returns";
import AdminProducts from "./AdminProducts";
import AdminKho from "./AdminKho";
import AdminVoucher from "./AdminVoucher";
import AdminKhuyenMai from "./AdminKhuyenMai";
import AdminDanhMuc from "./AdminDanhMuc";
import AdminThuongHieu from "./AdminThuongHieu";
import AdminKichCo from "./AdminKichCo";
import AdminMauSac from "./AdminMauSac";
import AdminSettings from "./AdminSettings";
import { DashboardContent, ThanhToanContent, CustomerContent, EmployeeContent } from "./AdminDashboard";
import {
    CompactPager,
    DateRangeFilter,
    LichSuHoaDonList,
    ThongTinGiaoHang,
    layThongTinKhach,
    trongKhoangNgay,
} from "./HoaDonShared.jsx";

const API = "http://localhost:8080/api";
const PAGINATION_PAGE_SIZE = 5;
const MENU = [
    {id: "dashboard", icon: "▦", label: "Tổng quan"},
    {id: "ban-hang", icon: "🛒", label: "Bán hàng tại quầy"},
    {id: "san-pham", icon: "□", label: "Sản phẩm"},
    {id: "kho", icon: "▣", label: "Kho hàng"},
    {id: "danh-muc", icon: "▤", label: "Danh mục"},
    {id: "thuong-hieu", icon: "◇", label: "Thương hiệu"},
    // {id: "kich-co", icon: "↔", label: "Kích cỡ"},
    // {id: "mau-sac", icon: "●", label: "Màu sắc"},
    // {id: "voucher", icon: "◇", label: "Voucher"},
    // {id: "khuyen-mai", icon: "✦", label: "Khuyến mãi"},
    // {id: "don-online", icon: "▤", label: "Đơn online"},
    {id: "hoa-don", icon: "▧", label: "Hóa đơn"},
    {id: "tra-hang", icon: "↩", label: "Đổi trả hàng"},
    {id: "thanh-toan", icon: "▤", label: "Thanh toán"},
    {id: "khach-hang", icon: "◎", label: "Khách hàng"},
    {id: "phan-hoi", icon: "✉", label: "Phản hồi khách hàng"},
    // {id: "nhan-vien", icon: "♙", label: "Quản lý nhân viên"},
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

function Pagination({page, totalPages, onPageChange}) {
    return (
        <div className="employee-pagination">
            <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
            >
                ←
            </button>

            {Array.from(
                {length: totalPages},
                (_, index) => index + 1
            ).map((number) => (
                <button
                    key={number}
                    type="button"
                    className={page === number ? "active" : ""}
                    onClick={() => onPageChange(number)}
                >
                    {number}
                </button>
            ))}

            <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
            >
                →
            </button>
        </div>
    );
}

function OnlineOrders({orders, onUpdateOrder, onOpenDetail}) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("Tất cả");
    const [khoang, setKhoang] = useState({from: "", to: ""});
    const [page, setPage] = useState(1);
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
        const kh = layThongTinKhach(item);
        const matchSearch =
            !keyword ||
            String(item.maHoaDon || "").toLowerCase().includes(keyword) ||
            kh.ten.toLowerCase().includes(keyword) ||
            kh.sdt.toLowerCase().includes(keyword);
        const selected = filters.find((row) => row[0] === filter)?.[1];
        return (
            matchSearch &&
            (!selected || item.trangThai === selected) &&
            trongKhoangNgay(item.ngayLap, khoang.from, khoang.to)
        );
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGINATION_PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pageItems = filtered.slice(
        (safePage - 1) * PAGINATION_PAGE_SIZE,
        safePage * PAGINATION_PAGE_SIZE
    );
    useEffect(() => {
        setPage(1);
    }, [search, filter, khoang.from, khoang.to]);
    useEffect(() => {
        setPage((current) => Math.min(current, totalPages));
    }, [totalPages]);
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
                <div className="hd-toolbar">
                    <input
                        className="hd-search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="⌕ Tìm mã đơn, tên, SĐT..."
                    />
                    <DateRangeFilter from={khoang.from} to={khoang.to} onChange={setKhoang}/>
                    <button type="button" className="hd-btn ghost" onClick={() => window.location.reload()}>
                        ↻ Làm mới
                    </button>
                </div>
                <div className="employee-table-wrapper">
                    <table className="employee-table hd-table">
                        <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Khách hàng</th>
                            <th>Tổng tiền</th>
                            <th>Thanh toán</th>
                            <th>Trạng thái</th>
                            <th>Ngày đặt</th>
                            <th>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length ? (
                            pageItems.map((order) => {
                                const kh = layThongTinKhach(order);
                                return (
                                    <tr key={order.id}>
                                        <td className="hd-code">{order.maHoaDon}</td>
                                        <td className="hd-cell-customer">
                                            {kh.ten}{kh.id ? <span style={{color: "#98a2b3"}}> #{kh.id}</span> : null}
                                            {kh.sdt && <small>{kh.sdt}</small>}
                                        </td>
                                        <td className="hd-nowrap"><strong>{formatMoney(order.tongThanhToan)}</strong></td>
                                        <td className="hd-nowrap">{order.thanhToan?.trangThai === "DA_THANH_TOAN" ? "Đã thanh toán" : "Chờ thanh toán"}</td>
                                        <td><StatusBadge value={order.trangThai}/></td>
                                        <td className="hd-nowrap">{formatDate(order.ngayLap)}</td>
                                        <td className="employee-actions">
                                            <button type="button" onClick={() => onOpenDetail(order)}>Xem</button>
                                            {order.trangThai === "CHO_XAC_NHAN" && (
                                                <button type="button" className="primary"
                                                        onClick={() => onUpdateOrder(order, "DA_XAC_NHAN")}>
                                                    Xác nhận
                                                </button>
                                            )}
                                            {order.trangThai === "CHO_XAC_NHAN" && (
                                                <button type="button"
                                                        onClick={() => {
                                                            if (window.confirm("Hủy đơn này? Sau khi hủy sẽ không thể khôi phục.")) {
                                                                onUpdateOrder(order, "DA_HUY");
                                                            }
                                                        }}>
                                                    Hủy
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
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" className="employee-empty">Không có đơn online phù hợp.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                    <CompactPager page={safePage} totalPages={totalPages} onPageChange={setPage}/>
                </div>
            </section>
        </div>
    );
}

const HD_PAGE_SIZE = 10;

const HD_BADGE_STYLE = {
    CHO_XAC_NHAN: {background: "#fff3e0", color: "#ef6c00"},
    DA_XAC_NHAN: {background: "#e8f5e9", color: "#2e7d32"},
    DANG_CHUAN_BI: {background: "#ffebee", color: "#e53935"},
    DANG_GIAO: {background: "#f3e5f5", color: "#7e57c2"},
    DA_GIAO: {background: "#e8f5e9", color: "#2e9d5b"},
    DA_THANH_TOAN: {background: "#e8f5e9", color: "#2e7d32"},
    DA_HUY: {background: "#ffebee", color: "#c62828"},
};

const HD_LOAI_LABEL = {ONLINE: "Online", TAI_QUAY: "Tại quầy"};

const HD_PHUONG_THUC_LABEL = {
    COD: "Thanh toán khi nhận hàng",
    TIEN_MAT: "Tiền mặt",
    CHUYEN_KHOAN: "Chuyển khoản",
    VNPAY: "VNPay",
    MOMO: "MoMo",
};

const HD_TT_THANH_TOAN_LABEL = {
    CHO_THANH_TOAN: "Chờ thanh toán",
    DA_THANH_TOAN: "Đã thanh toán",
    THAT_BAI: "Thanh toán thất bại",
};

function HdBadge({value, style}) {
    return (
        <span
            className="hd-badge"
            style={{
                ...(HD_BADGE_STYLE[value] || {background: "#f5f5f5", color: "#666"}),
                ...style,
            }}
        >
            {STATUS_LABEL[value] || value || "-"}
        </span>
    );
}

function HoaDonPage({orders, onOpenDetail, onRefresh, refreshing}) {
    const [search, setSearch] = useState("");
    const [filterLoai, setFilterLoai] = useState("");
    const [filterTrangThai, setFilterTrangThai] = useState("");
    const [khoang, setKhoang] = useState({from: "", to: ""});
    const [page, setPage] = useState(1);
    const filtered = orders.filter((item) => {
        if (filterLoai && item.loaiHoaDon !== filterLoai) return false;
        if (filterTrangThai && item.trangThai !== filterTrangThai) return false;
        if (!trongKhoangNgay(item.ngayLap, khoang.from, khoang.to)) return false;
        const keyword = search.trim().toLowerCase();
        if (!keyword) return true;
        const kh = layThongTinKhach(item);
        return (
            String(item?.maHoaDon || "").toLowerCase().includes(keyword) ||
            String(kh.id || "").includes(keyword) ||
            kh.ten.toLowerCase().includes(keyword) ||
            kh.sdt.toLowerCase().includes(keyword)
        );
    });
    const tongTien = filtered.reduce(
        (sum, item) => (item.trangThai === "DA_HUY" ? sum : sum + Number(item.tongThanhToan || 0)),
        0
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / HD_PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pageItems = filtered.slice((safePage - 1) * HD_PAGE_SIZE, safePage * HD_PAGE_SIZE);
    useEffect(() => {
        setPage(1);
    }, [search, filterLoai, filterTrangThai, khoang.from, khoang.to]);
    useEffect(() => {
        setPage((current) => Math.min(current, totalPages));
    }, [totalPages]);
    return (
        <div className="employee-content hd-staff">
            <div className="hd-page-head">
                <div>
                    <div className="hd-eyebrow">FSHOP NHÂN VIÊN</div>
                    <h1>Hóa đơn</h1>
                </div>
                {onRefresh && (
                    <button type="button" className="hd-btn ghost" onClick={onRefresh} disabled={refreshing}>
                        {refreshing ? "Đang tải..." : "↻ Làm mới"}
                    </button>
                )}
            </div>

            <section className="hd-card hd-card-filter">
                <div className="hd-toolbar">
                    <input
                        className="hd-search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm mã hóa đơn, tên, SĐT, ID khách..."
                    />
                    <select value={filterTrangThai} onChange={(e) => setFilterTrangThai(e.target.value)}>
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(STATUS_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <select value={filterLoai} onChange={(e) => setFilterLoai(e.target.value)}>
                        <option value="">Tất cả loại</option>
                        <option value="ONLINE">Online</option>
                        <option value="TAI_QUAY">Tại quầy</option>
                    </select>
                </div>
                <div className="hd-toolbar" style={{marginBottom: 0}}>
                    <DateRangeFilter from={khoang.from} to={khoang.to} onChange={setKhoang}/>
                </div>
            </section>

            <section className="hd-card">
                <p className="hd-summary">
                    <strong>{filtered.length}</strong> hóa đơn
                    {" · "}tổng giá trị (không tính đơn hủy): <strong>{formatMoney(tongTien)}</strong>
                </p>
                {filtered.length === 0 ? (
                    <div className="hd-empty">Không có hóa đơn phù hợp.</div>
                ) : (
                    <div style={{overflowX: "auto"}}>
                        <table className="hd-table">
                            <thead>
                            <tr>
                                <th>Mã hóa đơn</th>
                                <th>Khách hàng</th>
                                <th>Ngày lập</th>
                                <th>Loại</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {pageItems.map((item) => {
                                const kh = layThongTinKhach(item);
                                return (
                                    <tr key={item.id}>
                                        <td className="hd-code">{item?.maHoaDon || `HD${item?.id || ""}`}</td>
                                        <td className="hd-cell-customer">
                                            {kh.ten}
                                            {kh.id ? <span style={{color: "#98a2b3"}}> #{kh.id}</span> : null}
                                            {kh.sdt && <small>{kh.sdt}</small>}
                                        </td>
                                        <td className="hd-nowrap">{formatDate(item?.ngayLap)}</td>
                                        <td className="hd-nowrap">
                                            {HD_LOAI_LABEL[item?.loaiHoaDon] || item?.loaiHoaDon || "-"}
                                        </td>
                                        <td className="hd-nowrap">
                                            <strong>{formatMoney(item?.tongThanhToan || 0)}</strong>
                                        </td>
                                        <td><HdBadge value={item?.trangThai}/></td>
                                        <td style={{textAlign: "right"}}>
                                            <button
                                                type="button"
                                                className="hd-btn ghost"
                                                onClick={() => onOpenDetail(item)}
                                            >
                                                Xem
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                        <CompactPager page={safePage} totalPages={totalPages} onPageChange={setPage}/>
                    </div>
                )}
            </section>
        </div>
    );
}

function OrderDetailModal({order, actor, onClose, onOrderChanged}) {
    const [detail, setDetail] = useState([]);
    const [payment, setPayment] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const orderId = order?.id;
    const loadHistory = async () => {
        const data = await readJson(`${API}/hoa-don/${orderId}/lich-su`).catch(() => []);
        setHistory(Array.isArray(data) ? data : []);
    };
    useEffect(() => {
        if (!orderId) return;
        let mounted = true;
        setLoading(true);
        Promise.all([
            readJson(`${API}/hoa-don/${orderId}/chi-tiet`).catch(() => []),
            readJson(`${API}/hoa-don/${orderId}/thanh-toan`).catch(() => null),
            readJson(`${API}/hoa-don/${orderId}/lich-su`).catch(() => []),
        ])
            .then(([details, paymentData, historyData]) => {
                if (!mounted) return;
                setDetail(Array.isArray(details) ? details : []);
                setPayment(paymentData);
                setHistory(Array.isArray(historyData) ? historyData : []);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, [orderId]);
    if (!order) return null;
    const kh = layThongTinKhach(order);
    return (
        <div className="hd-modal-backdrop" onClick={onClose}>
            <div className="hd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="hd-modal-head">
                    <div>
                        <div className="hd-modal-eyebrow">CHI TIẾT HÓA ĐƠN</div>
                        <h2>
                            {order.maHoaDon}
                            <HdBadge
                                value={order.trangThai}
                                style={{marginLeft: 10, fontSize: 12, verticalAlign: "middle"}}
                            />
                        </h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Đóng chi tiết hóa đơn"
                        title="Đóng"
                        onClick={onClose}
                        className="hd-btn ghost hd-modal-close"
                    >
                        ×
                    </button>
                </div>

                <div className="hd-info hd-info-4" style={{marginBottom: 16}}>
                    <div><span>Khách hàng</span><strong>{kh.ten}</strong></div>
                    <div><span>Ngày lập</span><strong>{formatDate(order.ngayLap)}</strong></div>
                    <div><span>Loại</span><strong>{HD_LOAI_LABEL[order.loaiHoaDon] || order.loaiHoaDon || "-"}</strong></div>
                    <div><span>Tổng tiền</span><strong style={{color: "#e53935"}}>{formatMoney(order.tongThanhToan)}</strong></div>
                </div>

                <ThongTinGiaoHang
                    order={order}
                    api={API}
                    actor={actor}
                    onSaved={(updated) => {
                        onOrderChanged?.(updated);
                        loadHistory();
                    }}
                />

                <section className="hd-section">
                    <div className="hd-section-head"><h3>Chi tiết sản phẩm</h3></div>
                    {loading ? (
                        <div className="hd-muted">Đang tải...</div>
                    ) : detail.length === 0 ? (
                        <div className="hd-muted">Không có sản phẩm.</div>
                    ) : (
                        <div style={{overflowX: "auto"}}>
                            <table className="hd-table">
                                <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>SKU</th>
                                    <th>SL</th>
                                    <th>Đơn giá</th>
                                    <th>Thành tiền</th>
                                </tr>
                                </thead>
                                <tbody>
                                {detail.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            {item.sanPhamChiTiet?.sanPham?.tenSanPham ||
                                                item.sanPham?.tenSanPham ||
                                                "Sản phẩm"}
                                        </td>
                                        <td>{item.sanPhamChiTiet?.maSku || "-"}</td>
                                        <td>{item.soLuong}</td>
                                        <td className="hd-nowrap">{formatMoney(item.donGia)}</td>
                                        <td className="hd-nowrap">
                                            <strong>
                                                {formatMoney(
                                                    item.thanhTien ||
                                                    Number(item.donGia || 0) * Number(item.soLuong || 0)
                                                )}
                                            </strong>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="hd-section">
                    <div className="hd-section-head"><h3>Thanh toán</h3></div>
                    {payment ? (
                        <div className="hd-info hd-info-4">
                            <div><span>Phương thức</span><strong>{HD_PHUONG_THUC_LABEL[payment.phuongThuc] || payment.phuongThuc || "-"}</strong></div>
                            <div><span>Số tiền</span><strong>{formatMoney(payment.soTien)}</strong></div>
                            <div><span>Trạng thái</span><strong>{HD_TT_THANH_TOAN_LABEL[payment.trangThai] || payment.trangThai || "-"}</strong></div>
                            <div><span>Ngày thanh toán</span><strong>{formatDate(payment.ngayThanhToan)}</strong></div>
                        </div>
                    ) : (
                        <div className="hd-muted">Chưa có thông tin thanh toán.</div>
                    )}
                </section>

                <section className="hd-section" style={{marginBottom: 0}}>
                    <div className="hd-section-head"><h3>Lịch sử hóa đơn</h3></div>
                    <LichSuHoaDonList
                        items={history}
                        tenTrangThai={(value) => STATUS_LABEL[value] || value || "-"}
                        formatNgay={formatDate}
                    />
                </section>
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
    const [chatUnread, setChatUnread] = useState(0);

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

    // Đếm tin nhắn khách chưa đọc để hiện huy hiệu ở menu (khi không ở trang Phản hồi)
    useEffect(() => {
        if (activeMenu === "phan-hoi") return undefined;
        let stop = false;
        const fetchUnread = async () => {
            try {
                const data = await readJson(`${API}/chat/hoi-thoai/chua-doc`);
                if (!stop) setChatUnread(Number(data?.tong || 0));
            } catch {
                /* bỏ qua lỗi mạng tạm thời */
            }
        };
        fetchUnread();
        const timer = setInterval(fetchUnread, 8000);
        return () => {
            stop = true;
            clearInterval(timer);
        };
    }, [activeMenu]);

    // Người đang thao tác → ghi vào lịch sử đơn
    const actor = useMemo(
        () => ({
            nhanVienId: currentEmployee?.id || null,
            taiKhoanId: taiKhoan?.id || null,
            nguoiThucHien: currentEmployee?.hoTen || taiKhoan?.tenDangNhap || "Nhân viên",
            vaiTro: "NHAN_VIEN",
        }),
        [currentEmployee, taiKhoan]
    );
    const updateOrderStatus = async (order, status) => {
        try {
            const params = new URLSearchParams({
                trangThai: status,
                ghiChu: `Nhân viên cập nhật: ${STATUS_LABEL[status] || status}`,
                vaiTro: actor.vaiTro,
                nguoiThucHien: actor.nguoiThucHien,
            });
            if (actor.nhanVienId) params.set("nhanVienId", String(actor.nhanVienId));
            if (actor.taiKhoanId) params.set("taiKhoanId", String(actor.taiKhoanId));
            const updated = await readJson(
                `${API}/hoa-don/${order.id}/trang-thai?${params.toString()}`,
                {method: "PUT"}
            );
            setOrders((old) =>
                old.map((item) => (item.id === order.id ? updated : item))
            );
            setSelectedOrder((current) =>
                current && current.id === order.id ? updated : current
            );
        } catch (err) {
            alert(err.message || "Không thể cập nhật đơn hàng.");
        }
    };
    const onOrderChanged = (updated) => {
        setOrders((old) =>
            old.map((item) => (item.id === updated.id ? updated : item))
        );
        setSelectedOrder(updated);
    };
    const goTo = (menu, preset = null) => {
        setProductPreset(preset);
        setActiveMenu(menu);
    };

    const activeLabel = activeMenu === "cai-dat"
        ? "Cài đặt"
        : MENU.find((item) => item.id === activeMenu)?.label || "Tổng quan";

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
                            {item.id === "phan-hoi" && chatUnread > 0 && (
                                <span className="employee-nav-badge">{chatUnread > 99 ? "99+" : chatUnread}</span>
                            )}
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
                                <DashboardContent
                                    eyebrow="FSHOP NHÂN VIÊN"
                                    onViewAll={() => goTo("hoa-don")}
                                />
                            )}

                            {activeMenu === "ban-hang" && (
                                <BanHangTaiQuayContent />
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
                                    onRefresh={() => loadData()}
                                    refreshing={loading}
                                />
                            )}

                            {activeMenu === "tra-hang" && (
                                <Returns
                                    mode="counter"
                                    taiKhoan={taiKhoan}
                                    onBack={() => goTo("hoa-don")}
                                />
                            )}

                            {activeMenu === "khach-hang" && <CustomerContent />}

                            {activeMenu === "phan-hoi" && (
                                <EmployeeChat
                                    nhanVienId={currentEmployee?.id}
                                    onUnreadChange={setChatUnread}
                                />
                            )}

                            {activeMenu === "san-pham" && <AdminProducts />}
                            {activeMenu === "kho" && <AdminKho />}
                            {activeMenu === "danh-muc" && <AdminDanhMuc />}
                            {activeMenu === "thuong-hieu" && <AdminThuongHieu />}
                            {activeMenu === "kich-co" && <AdminKichCo />}
                            {activeMenu === "mau-sac" && <AdminMauSac />}
                            {activeMenu === "voucher" && <AdminVoucher />}
                            {activeMenu === "khuyen-mai" && <AdminKhuyenMai />}
                            {activeMenu === "thanh-toan" && <ThanhToanContent taiKhoan={taiKhoan} />}
                            {activeMenu === "nhan-vien" && <EmployeeContent />}
                            {activeMenu === "cai-dat" && <AdminSettings /> }
                        </>
                    )}
                </div>
            </main>

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    actor={actor}
                    onClose={() => setSelectedOrder(null)}
                    onOrderChanged={onOrderChanged}
                />
            )}
        </div>
    );
}
