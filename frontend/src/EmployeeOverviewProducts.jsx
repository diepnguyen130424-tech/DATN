import {useEffect, useMemo, useState} from "react";
import "./EmployeeOverviewProducts.css";

const API = "http://localhost:8080/api";
const LOW_STOCK = 5; // cùng ngưỡng với màn Bán hàng tại quầy
const PAGE_SIZE = 5;
const PLACEHOLDER_IMG = "";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function formatMoney(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatDateTime(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function timeAgo(value) {
    if (!value) return "";
    const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
}

async function readJson(url) {
    const response = await fetch(url);
    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }
    if (!response.ok) throw new Error(data?.message || text || "Không thể kết nối máy chủ");
    return data;
}

const STATUS_LABEL = {
    CHO_XAC_NHAN: "Chờ xác nhận",
    CHO_THANH_TOAN: "Chờ thanh toán",
    DA_XAC_NHAN: "Đã xác nhận",
    DANG_CHUAN_BI: "Đang chuẩn bị",
    DANG_GIAO: "Đang giao",
    DA_GIAO: "Đã giao",
    DA_THANH_TOAN: "Đã thanh toán",
    DA_HUY: "Đã hủy",
};

const STATUS_CLASS = {
    CHO_XAC_NHAN: "pending",
    CHO_THANH_TOAN: "pending",
    DA_XAC_NHAN: "confirmed",
    DANG_CHUAN_BI: "processing",
    DANG_GIAO: "shipping",
    DA_GIAO: "done",
    DA_THANH_TOAN: "paid",
    DA_HUY: "cancelled",
};

// dùng lại class .employee-status đã có trong EmployeeDashboard.css
function StatusBadge({value}) {
    return (
        <span className={`employee-status ${STATUS_CLASS[value] || ""}`}>
            {STATUS_LABEL[value] || value || "-"}
        </span>
    );
}

function orderTime(order) {
    return order.ngayLap || order.ngayCapNhat || 0;
}

function customerName(order) {
    return order.khachHang?.hoTen || order.diaChi?.tenNguoiNhan || "Khách lẻ";
}

/* ------------------------------------------------------------------ */
/* Tổng quan                                                            */
/* ------------------------------------------------------------------ */

const RANGES = [
    {id: "today", label: "Hôm nay", days: 1, prev: "hôm qua"},
    {id: "7d", label: "7 ngày", days: 7, prev: "7 ngày trước"},
    {id: "30d", label: "30 ngày", days: 30, prev: "30 ngày trước"},
];

const NOT_REVENUE = new Set(["DA_HUY", "CHO_XAC_NHAN", "CHO_THANH_TOAN"]);
const DONE_STATUS = new Set(["DA_THANH_TOAN", "DA_GIAO"]);
const WAITING_STATUS = new Set(["CHO_XAC_NHAN", "CHO_THANH_TOAN"]);

function rangeBounds(days, offset = 0) {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1 - offset * days);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    return [start.getTime(), end.getTime()];
}

function pickRange(orders, [from, to]) {
    return orders.filter((order) => {
        const t = new Date(orderTime(order)).getTime();
        return t >= from && t < to;
    });
}

function summarize(list) {
    const valid = list.filter((o) => o.trangThai !== "DA_HUY");
    const revenue = list
        .filter((o) => !NOT_REVENUE.has(o.trangThai))
        .reduce((sum, o) => sum + Number(o.tongThanhToan || 0), 0);
    const customers = new Set(valid.map((o) => o.khachHang?.id).filter(Boolean));
    return {count: valid.length, revenue, customers: customers.size, valid};
}

function Delta({current, previous, label}) {
    if (!previous) {
        return <span className="ev-delta ev-delta-flat">Chưa có dữ liệu {label}</span>;
    }
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) return <span className="ev-delta ev-delta-flat">Bằng {label}</span>;
    return (
        <span className={`ev-delta ${pct > 0 ? "ev-delta-up" : "ev-delta-down"}`}>
            {pct > 0 ? "▲" : "▼"} {Math.abs(pct)}% so với {label}
        </span>
    );
}

export function EmployeeOverview({
                                     orders,
                                     products,
                                     variants,
                                     onMenu,
                                     onOpenDetail,
                                     onUpdateOrder,
                                     onRefresh,
                                 }) {
    const [rangeId, setRangeId] = useState("today");
    const [busyId, setBusyId] = useState(null);
    const [sold, setSold] = useState(null);

    const range = RANGES.find((r) => r.id === rangeId);

    const current = useMemo(
        () => summarize(pickRange(orders, rangeBounds(range.days))),
        [orders, range]
    );
    const previous = useMemo(
        () => summarize(pickRange(orders, rangeBounds(range.days, 1))),
        [orders, range]
    );

    // Số sản phẩm đã bán = tổng số lượng trong chi tiết hóa đơn của khoảng đang xem
    useEffect(() => {
        let cancelled = false;
        const targets = current.valid.slice(0, 60);
        if (!targets.length) {
            Promise.resolve().then(() => !cancelled && setSold(0));
            return () => {
                cancelled = true;
            };
        }
        Promise.all(
            targets.map((o) => readJson(`${API}/hoa-don/${o.id}/chi-tiet`).catch(() => []))
        ).then((lists) => {
            if (cancelled) return;
            setSold(
                lists.reduce(
                    (sum, list) =>
                        sum +
                        (Array.isArray(list)
                            ? list.reduce((n, row) => n + Number(row.soLuong || 0), 0)
                            : 0),
                    0
                )
            );
        });
        return () => {
            cancelled = true;
        };
    }, [current]);

    const pendingOnline = useMemo(
        () =>
            orders
                .filter((o) => o.loaiHoaDon === "ONLINE" && o.trangThai === "CHO_XAC_NHAN")
                .sort((a, b) => new Date(orderTime(b)) - new Date(orderTime(a))),
        [orders]
    );

    const lowStock = useMemo(
        () =>
            variants
                .filter((v) => Number(v.soLuongTon || 0) <= LOW_STOCK)
                .sort((a, b) => Number(a.soLuongTon || 0) - Number(b.soLuongTon || 0)),
        [variants]
    );

    const breakdown = useMemo(() => {
        const list = pickRange(orders, rangeBounds(range.days));
        return {
            done: list.filter((o) => DONE_STATUS.has(o.trangThai)).length,
            waiting: list.filter((o) => WAITING_STATUS.has(o.trangThai)).length,
            progress: list.filter(
                (o) =>
                    !DONE_STATUS.has(o.trangThai) &&
                    !WAITING_STATUS.has(o.trangThai) &&
                    o.trangThai !== "DA_HUY"
            ).length,
            cancelled: list.filter((o) => o.trangThai === "DA_HUY").length,
            total: list.length,
        };
    }, [orders, range]);

    const recent = useMemo(
        () =>
            [...orders]
                .sort((a, b) => new Date(orderTime(b)) - new Date(orderTime(a)))
                .slice(0, 6),
        [orders]
    );

    const confirmOrder = async (order) => {
        setBusyId(order.id);
        try {
            await onUpdateOrder(order, "DA_XAC_NHAN");
        } finally {
            setBusyId(null);
        }
    };

    const todayLabel = new Date().toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "numeric",
        year: "numeric",
    });

    return (
        <div className="employee-content ev-page">
            <header className="ev-head">
                <div>
                    <h1>Tổng quan</h1>
                    <p>{todayLabel}</p>
                </div>
                <div className="ev-head-tools">
                    <div className="ev-segment" role="tablist" aria-label="Khoảng thời gian">
                        {RANGES.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                role="tab"
                                aria-selected={rangeId === item.id}
                                className={rangeId === item.id ? "active" : ""}
                                onClick={() => setRangeId(item.id)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <button type="button" className="ev-btn" onClick={onRefresh}>
                        Làm mới
                    </button>
                </div>
            </header>

            <section className="ev-kpis" aria-label="Chỉ số chính">
                <div className="ev-kpi">
                    <span>Doanh thu</span>
                    <strong>{formatMoney(current.revenue)}</strong>
                    <Delta current={current.revenue} previous={previous.revenue} label={range.prev}/>
                </div>
                <div className="ev-kpi">
                    <span>Đơn hàng</span>
                    <strong>{current.count}</strong>
                    <Delta current={current.count} previous={previous.count} label={range.prev}/>
                </div>
                <div className="ev-kpi">
                    <span>Khách có tài khoản</span>
                    <strong>{current.customers}</strong>
                    <small>Không tính khách lẻ</small>
                </div>
                <div className="ev-kpi">
                    <span>Sản phẩm đã bán</span>
                    <strong>{sold === null ? "…" : sold}</strong>
                    <small>Đôi giày trong các đơn hợp lệ</small>
                </div>
            </section>

            <div className="ev-grid-2">
                <section className="ev-panel">
                    <div className="ev-panel-head">
                        <div>
                            <h2>Đơn online chờ xác nhận</h2>
                            <p>
                                {pendingOnline.length
                                    ? `${pendingOnline.length} đơn đang chờ bạn xử lý`
                                    : "Không có đơn nào đang chờ"}
                            </p>
                        </div>
                        <button type="button" className="ev-link" onClick={() => onMenu("don-online")}>
                            Mở danh sách đơn
                        </button>
                    </div>

                    {pendingOnline.length ? (
                        <ul className="ev-list">
                            {pendingOnline.slice(0, 4).map((order) => (
                                <li key={order.id}>
                                    <div className="ev-list-main">
                                        <strong>{order.maHoaDon || `HD${order.id}`}</strong>
                                        <span>
                                            {customerName(order)} · {timeAgo(orderTime(order))}
                                        </span>
                                    </div>
                                    <b className="ev-money">{formatMoney(order.tongThanhToan)}</b>
                                    <div className="ev-list-actions">
                                        <button type="button" className="ev-btn" onClick={() => onOpenDetail(order)}>
                                            Xem
                                        </button>
                                        <button
                                            type="button"
                                            className="ev-btn ev-btn-primary"
                                            disabled={busyId === order.id}
                                            onClick={() => confirmOrder(order)}
                                        >
                                            {busyId === order.id ? "Đang xác nhận…" : "Xác nhận"}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="ev-empty">
                            <strong>Đã xử lý hết đơn online</strong>
                            <span>Đơn mới từ website sẽ hiện ở đây.</span>
                        </div>
                    )}
                </section>

                <section className="ev-panel">
                    <div className="ev-panel-head">
                        <div>
                            <h2>Sắp hết hàng</h2>
                            <p>
                                {lowStock.length
                                    ? `${lowStock.length} biến thể còn từ ${LOW_STOCK} đôi trở xuống`
                                    : "Tồn kho đang ổn"}
                            </p>
                        </div>
                        {lowStock.length > 0 && (
                            <button type="button" className="ev-link" onClick={() => onMenu("san-pham", "low")}>
                                Xem trong Sản phẩm
                            </button>
                        )}
                    </div>

                    {lowStock.length ? (
                        <ul className="ev-list">
                            {lowStock.slice(0, 5).map((v) => {
                                const qty = Number(v.soLuongTon || 0);
                                const product =
                                    products.find((p) => p.id === v.sanPham?.id) || v.sanPham;
                                return (
                                    <li key={v.id}>
                                        <div className="ev-list-main">
                                            <strong>{product?.tenSanPham || "Sản phẩm"}</strong>
                                            <span>
                                                Size {v.kichCo?.tenKichCo || "-"} · {v.mauSac?.tenMau || "-"}
                                                {v.maSku ? ` · ${v.maSku}` : ""}
                                            </span>
                                        </div>
                                        <span className={`ep-stock ${qty <= 0 ? "out" : "low"}`}>
                                            {qty <= 0 ? "Hết hàng" : `Còn ${qty}`}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="ev-empty">
                            <strong>Chưa có biến thể nào sắp hết</strong>
                            <span>Cảnh báo sẽ hiện khi tồn kho xuống mức thấp.</span>
                        </div>
                    )}
                </section>
            </div>

            <div className="ev-grid-main">
                <section className="ev-panel">
                    <div className="ev-panel-head">
                        <div>
                            <h2>Hóa đơn gần đây</h2>
                            <p>Bấm vào một dòng để xem chi tiết</p>
                        </div>
                        <button type="button" className="ev-link" onClick={() => onMenu("hoa-don")}>
                            Xem tất cả
                        </button>
                    </div>

                    <div className="ev-table-wrap">
                        <table className="ev-table">
                            <thead>
                            <tr>
                                <th>Mã hóa đơn</th>
                                <th>Khách hàng</th>
                                <th>Loại</th>
                                <th className="num">Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th>Thời gian</th>
                            </tr>
                            </thead>
                            <tbody>
                            {recent.length ? (
                                recent.map((order) => (
                                    <tr
                                        key={order.id}
                                        tabIndex={0}
                                        onClick={() => onOpenDetail(order)}
                                        onKeyDown={(e) => e.key === "Enter" && onOpenDetail(order)}
                                    >
                                        <td><strong>{order.maHoaDon || `HD${order.id}`}</strong></td>
                                        <td>{customerName(order)}</td>
                                        <td>
                                            <span className="ev-tag">
                                                {order.loaiHoaDon === "TAI_QUAY" ? "Tại quầy" : "Online"}
                                            </span>
                                        </td>
                                        <td className="num"><strong>{formatMoney(order.tongThanhToan)}</strong></td>
                                        <td><StatusBadge value={order.trangThai}/></td>
                                        <td className="muted">{formatDateTime(orderTime(order))}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="ev-table-empty">
                                        Chưa có hóa đơn nào. Bắt đầu bằng một đơn bán tại quầy.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <aside className="ev-side">
                    <section className="ev-panel">
                        <div className="ev-panel-head">
                            <div>
                                <h2>Tình trạng đơn</h2>
                                <p>{range.label.toLowerCase()} · {breakdown.total} đơn</p>
                            </div>
                        </div>

                        {breakdown.total ? (
                            <>
                                <div className="ev-bar" role="img"
                                     aria-label={`Hoàn tất ${breakdown.done}, đang xử lý ${breakdown.progress}, chờ ${breakdown.waiting}, hủy ${breakdown.cancelled}`}>
                                    <span className="done" style={{flex: breakdown.done}}/>
                                    <span className="progress" style={{flex: breakdown.progress}}/>
                                    <span className="waiting" style={{flex: breakdown.waiting}}/>
                                    <span className="cancelled" style={{flex: breakdown.cancelled}}/>
                                </div>
                                <ul className="ev-legend">
                                    <li><i className="done"/>Hoàn tất<b>{breakdown.done}</b></li>
                                    <li><i className="progress"/>Đang xử lý<b>{breakdown.progress}</b></li>
                                    <li><i className="waiting"/>Chờ xác nhận<b>{breakdown.waiting}</b></li>
                                    <li><i className="cancelled"/>Đã hủy<b>{breakdown.cancelled}</b></li>
                                </ul>
                            </>
                        ) : (
                            <div className="ev-empty compact">
                                <strong>Chưa có đơn trong khoảng này</strong>
                                <span>Thử chọn 7 ngày hoặc 30 ngày.</span>
                            </div>
                        )}
                    </section>

                    <section className="ev-panel">
                        <div className="ev-panel-head">
                            <div>
                                <h2>Lối tắt</h2>
                            </div>
                        </div>
                        <div className="ev-shortcuts">
                            <button type="button" className="primary" onClick={() => onMenu("ban-hang")}>
                                Tạo hóa đơn tại quầy
                            </button>
                            <button type="button" onClick={() => onMenu("khach-hang")}>
                                Tra cứu khách hàng
                            </button>
                            <button type="button" onClick={() => onMenu("san-pham")}>
                                Xem sản phẩm và tồn kho
                            </button>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Sản phẩm                                                             */
/* ------------------------------------------------------------------ */

function productStatusKey(value) {
    return String(value || "").trim().toUpperCase();
}

function ProductStatus({value}) {
    const key = productStatusKey(value);
    const active = key === "HOAT_DONG";
    const inactive = key === "NGUNG_HOAT_DONG";
    return (
        <span className={`ep-status ${active ? "active" : inactive ? "inactive" : ""}`}>
            <i/>
            {active ? "Hoạt động" : inactive ? "Ngừng hoạt động" : value || "Chưa xác định"}
        </span>
    );
}

function stockState(info) {
    if (!info.count) return "none";
    if (info.stock <= 0) return "out";
    if (info.stock <= LOW_STOCK) return "low";
    return "ok";
}

function StockBadge({info}) {
    const state = stockState(info);
    const text = {
        none: "Chưa có biến thể",
        out: "Hết hàng",
        low: `Sắp hết · ${info.stock}`,
        ok: `Còn ${info.stock}`,
    }[state];
    return <span className={`ep-stock ${state}`}>{text}</span>;
}

function priceText(info, fallback) {
    if (!info.count || !info.max) return fallback ? formatMoney(fallback) : "Chưa có giá";
    if (info.min === info.max) return formatMoney(info.min);
    return `${formatMoney(info.min)} – ${formatMoney(info.max)}`;
}

function Thumb({src, name, size = 44}) {
    const [failed, setFailed] = useState(false);
    const initial = String(name || "?").trim().charAt(0).toUpperCase();
    if (!src || failed || src === PLACEHOLDER_IMG) {
        return (
            <span className="ep-thumb ep-thumb-empty" style={{width: size, height: size}} aria-hidden="true">
                {initial}
            </span>
        );
    }
    return (
        <img
            className="ep-thumb"
            style={{width: size, height: size}}
            src={src}
            alt={name}
            loading="lazy"
            onError={() => setFailed(true)}
        />
    );
}

const SORTS = [
    {id: "ma", label: "Mã sản phẩm"},
    {id: "id", label: "ID sản phẩm"},
    {id: "ten", label: "Tên A → Z"},
    {id: "stock-asc", label: "Tồn kho thấp trước"},
    {id: "stock-desc", label: "Tồn kho cao trước"},
    {id: "price-asc", label: "Giá thấp trước"},
    {id: "price-desc", label: "Giá cao trước"},
];

export function ProductsPage({products, variants, onMenu, preset}) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [brand, setBrand] = useState("all");
    const [status, setStatus] = useState("all");
    const [stock, setStock] = useState(preset || "all");
    const [sort, setSort] = useState("ma");
    const [view, setView] = useState("table");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(null);

    const infoMap = useMemo(() => {
        const map = new Map();
        products.forEach((p) => map.set(p.id, {count: 0, stock: 0, min: 0, max: 0, list: []}));
        variants.forEach((v) => {
            const info = map.get(v.sanPham?.id);
            if (!info) return;
            const price = Number(v.giaBan || 0);
            info.count += 1;
            info.stock += Number(v.soLuongTon || 0);
            if (price > 0) {
                info.min = info.min ? Math.min(info.min, price) : price;
                info.max = Math.max(info.max, price);
            }
            info.list.push(v);
        });
        return map;
    }, [products, variants]);

    const categories = useMemo(
        () => [...new Set(products.map((p) => p.danhMuc?.tenDanhMuc).filter(Boolean))].sort(),
        [products]
    );
    const brands = useMemo(
        () => [...new Set(products.map((p) => p.thuongHieu?.tenThuongHieu).filter(Boolean))].sort(),
        [products]
    );

    const stockCounts = useMemo(() => {
        const counts = {all: products.length, ok: 0, low: 0, out: 0};
        products.forEach((p) => {
            const state = stockState(infoMap.get(p.id));
            if (counts[state] !== undefined) counts[state] += 1;
        });
        return counts;
    }, [products, infoMap]);

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        const list = products.filter((p) => {
            const info = infoMap.get(p.id);
            const matchText =
                !keyword ||
                String(p.id) === keyword ||
                String(p.tenSanPham || "").toLowerCase().includes(keyword) ||
                String(p.maSanPham || "").toLowerCase().includes(keyword) ||
                String(p.thuongHieu?.tenThuongHieu || "").toLowerCase().includes(keyword) ||
                info.list.some((v) => String(v.maSku || "").toLowerCase().includes(keyword));
            return (
                matchText &&
                (category === "all" || p.danhMuc?.tenDanhMuc === category) &&
                (brand === "all" || p.thuongHieu?.tenThuongHieu === brand) &&
                (status === "all" || productStatusKey(p.trangThai) === status) &&
                (stock === "all" || stockState(info) === stock)
            );
        });

        const stockOf = (p) => infoMap.get(p.id).stock;
        const priceOf = (p) => infoMap.get(p.id).min || 0;
        const sorters = {
            id: (a, b) => Number(a.id) - Number(b.id),
            ma: (a, b) =>
                String(a.maSanPham || "").localeCompare(String(b.maSanPham || ""), "vi", {numeric: true}),
            ten: (a, b) => String(a.tenSanPham || "").localeCompare(String(b.tenSanPham || ""), "vi"),
            "stock-asc": (a, b) => stockOf(a) - stockOf(b),
            "stock-desc": (a, b) => stockOf(b) - stockOf(a),
            "price-asc": (a, b) => priceOf(a) - priceOf(b),
            "price-desc": (a, b) => priceOf(b) - priceOf(a),
        };
        return list.sort(sorters[sort]);
    }, [products, infoMap, search, category, brand, status, stock, sort]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, pages);
    const rows = filtered.slice(
        (safePage - 1) * PAGE_SIZE,
        safePage * PAGE_SIZE
    );

    useEffect(() => {
        setPage((current) => Math.min(current, pages));
    }, [pages]);

    const hasFilter =
        search || category !== "all" || brand !== "all" || status !== "all" || stock !== "all";

    // đổi bộ lọc thì quay về trang 1
    const withReset = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    const resetFilters = () => {
        setSearch("");
        setCategory("all");
        setBrand("all");
        setStatus("all");
        setStock("all");
        setPage(1);
    };

    const stockChips = [
        ["all", "Tất cả"],
        ["ok", "Còn hàng"],
        ["low", "Sắp hết"],
        ["out", "Hết hàng"],
    ];

    return (
        <div className="employee-content ev-page ep-page">
            <header className="ev-head">
                <div>
                    <h1>Sản phẩm</h1>
                    <p>Tra cứu sản phẩm, giá và tồn kho theo từng size, màu.</p>
                </div>
                <div className="ev-head-tools">
                    <button type="button" className="ev-btn ev-btn-primary" onClick={() => onMenu("ban-hang")}>
                        Bán tại quầy
                    </button>
                </div>
            </header>

            <section className="ev-panel ep-panel">
                <div className="ep-chips" role="group" aria-label="Lọc theo tồn kho">
                    {stockChips.map(([id, label]) => (
                        <button
                            key={id}
                            type="button"
                            className={`${stock === id ? "active" : ""} ${id}`}
                            aria-pressed={stock === id}
                            onClick={() => withReset(setStock)(id)}
                        >
                            {label}
                            <b>{stockCounts[id]}</b>
                        </button>
                    ))}
                </div>

                <div className="ep-toolbar">
                    <label className="ep-search">
                        <span className="sr-only">Tìm sản phẩm</span>
                        <input
                            value={search}
                            onChange={(e) => withReset(setSearch)(e.target.value)}
                            placeholder="Tìm theo tên, ID, mã sản phẩm, thương hiệu hoặc SKU"
                        />
                        {search && (
                            <button type="button" aria-label="Xóa tìm kiếm" onClick={() => withReset(setSearch)("")}>
                                ×
                            </button>
                        )}
                    </label>

                    <select aria-label="Danh mục" value={category} onChange={(e) => withReset(setCategory)(e.target.value)}>
                        <option value="all">Mọi danh mục</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select aria-label="Thương hiệu" value={brand} onChange={(e) => withReset(setBrand)(e.target.value)}>
                        <option value="all">Mọi thương hiệu</option>
                        {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>

                    <select aria-label="Trạng thái" value={status} onChange={(e) => withReset(setStatus)(e.target.value)}>
                        <option value="all">Mọi trạng thái</option>
                        <option value="HOAT_DONG">Hoạt động</option>
                        <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                    </select>

                    <select aria-label="Sắp xếp" value={sort} onChange={(e) => setSort(e.target.value)}>
                        {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>

                    <div className="ev-segment small" role="group" aria-label="Kiểu hiển thị">
                        <button type="button" className={view === "table" ? "active" : ""} onClick={() => setView("table")}>
                            Bảng
                        </button>
                        <button type="button" className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>
                            Lưới
                        </button>
                    </div>
                </div>

                <div className="ep-resultbar">
                    <span>
                        {filtered.length} / {products.length} sản phẩm
                    </span>
                    {hasFilter && (
                        <button type="button" className="ev-link" onClick={resetFilters}>
                            Xóa bộ lọc
                        </button>
                    )}
                </div>

                {rows.length === 0 ? (
                    <div className="ev-empty">
                        <strong>Không tìm thấy sản phẩm phù hợp</strong>
                        <span>Thử đổi từ khóa hoặc bỏ bớt bộ lọc.</span>
                        {hasFilter && (
                            <button type="button" className="ev-btn" onClick={resetFilters}>
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                ) : view === "table" ? (
                    <div className="ev-table-wrap">
                        <table className="ev-table ep-table">
                            <thead>
                            <tr>
                                <th className="ep-col-id">ID</th>
                                <th>Sản phẩm</th>
                                <th>Thương hiệu</th>
                                <th>Danh mục</th>
                                <th className="num">Giá bán</th>
                                <th>Tồn kho</th>
                                <th>Trạng thái</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map((p) => {
                                const info = infoMap.get(p.id);
                                return (
                                    <tr
                                        key={p.id}
                                        tabIndex={0}
                                        onClick={() => setSelected(p)}
                                        onKeyDown={(e) => e.key === "Enter" && setSelected(p)}
                                    >
                                        <td className="ep-col-id"><span className="ep-id">#{p.id}</span></td>
                                        <td>
                                            <div className="ep-cell-product">
                                                <Thumb src={p.hinhAnh} name={p.tenSanPham}/>
                                                <div>
                                                    <strong>{p.tenSanPham}</strong>
                                                    <small>{p.maSanPham || `SP${p.id}`} · {info.count} biến thể</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{p.thuongHieu?.tenThuongHieu || "-"}</td>
                                        <td>{p.danhMuc?.tenDanhMuc || "-"}</td>
                                        <td className="num"><strong>{priceText(info, p.giaBan)}</strong></td>
                                        <td><StockBadge info={info}/></td>
                                        <td><ProductStatus value={p.trangThai}/></td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="ep-grid">
                        {rows.map((p) => {
                            const info = infoMap.get(p.id);
                            return (
                                <button type="button" className="ep-card" key={p.id} onClick={() => setSelected(p)}>
                                    <Thumb src={p.hinhAnh} name={p.tenSanPham} size={96}/>
                                    <span className="ep-card-brand">{p.thuongHieu?.tenThuongHieu || "FShop"}</span>
                                    <strong>{p.tenSanPham}</strong>
                                    <small>ID #{p.id} · {p.maSanPham || `SP${p.id}`}</small>
                                    <b>{priceText(info, p.giaBan)}</b>
                                    <div className="ep-card-foot">
                                        <StockBadge info={info}/>
                                        <ProductStatus value={p.trangThai}/>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {pages > 1 && (
                    <nav className="employee-pagination" aria-label="Phân trang">
                        <button
                            type="button"
                            disabled={safePage <= 1}
                            onClick={() => setPage(safePage - 1)}
                        >
                            ←
                        </button>

                        {Array.from(
                            {length: pages},
                            (_, index) => index + 1
                        ).map((number) => (
                            <button
                                key={number}
                                type="button"
                                className={safePage === number ? "active" : ""}
                                onClick={() => setPage(number)}
                            >
                                {number}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={safePage >= pages}
                            onClick={() => setPage(safePage + 1)}
                        >
                            →
                        </button>
                    </nav>
                )}
            </section>

            {selected && (
                <ProductDrawer
                    product={selected}
                    info={infoMap.get(selected.id)}
                    onClose={() => setSelected(null)}
                    onSell={() => onMenu("ban-hang")}
                />
            )}
        </div>
    );
}

function ProductDrawer({product, info, onClose, onSell}) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const details = [
        ["Thương hiệu", product.thuongHieu?.tenThuongHieu],
        ["Danh mục", product.danhMuc?.tenDanhMuc],
        ["Chất liệu", product.chatLieu],
        ["Kiểu dáng", product.kieuDang],
        ["Xuất xứ", product.xuatXu],
    ].filter(([, value]) => value);

    const variantList = [...info.list].sort(
        (a, b) =>
            String(a.kichCo?.tenKichCo || "").localeCompare(String(b.kichCo?.tenKichCo || ""), "vi", {numeric: true}) ||
            String(a.mauSac?.tenMau || "").localeCompare(String(b.mauSac?.tenMau || ""), "vi")
    );

    return (
        <div className="ep-backdrop" onClick={onClose}>
            <aside
                className="ep-drawer"
                role="dialog"
                aria-modal="true"
                aria-label={`Chi tiết ${product.tenSanPham}`}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="ep-drawer-head">
                    <Thumb src={product.hinhAnh} name={product.tenSanPham} size={72}/>
                    <div>
                        <h2>{product.tenSanPham}</h2>
                        <p>ID #{product.id} · {product.maSanPham || `SP${product.id}`}</p>
                        <ProductStatus value={product.trangThai}/>
                    </div>
                    <button type="button" className="ep-close" onClick={onClose} aria-label="Đóng">
                        ×
                    </button>
                </header>

                <div className="ep-drawer-body">
                    <div className="ep-drawer-summary">
                        <div>
                            <span>Giá bán</span>
                            <strong>{priceText(info, product.giaBan)}</strong>
                        </div>
                        <div>
                            <span>Tổng tồn kho</span>
                            <strong>{info.count ? `${info.stock} đôi` : "-"}</strong>
                        </div>
                    </div>

                    {details.length > 0 && (
                        <dl className="ep-facts">
                            {details.map(([label, value]) => (
                                <div key={label}>
                                    <dt>{label}</dt>
                                    <dd>{value}</dd>
                                </div>
                            ))}
                        </dl>
                    )}

                    {product.moTa && (
                        <section>
                            <h3>Mô tả</h3>
                            <p className="ep-desc">{product.moTa}</p>
                        </section>
                    )}

                    <section>
                        <h3>Biến thể ({variantList.length})</h3>
                        {variantList.length ? (
                            <div className="ev-table-wrap">
                                <table className="ev-table ep-variants">
                                    <thead>
                                    <tr>
                                        <th>SKU</th>
                                        <th>Size</th>
                                        <th>Màu</th>
                                        <th className="num">Giá</th>
                                        <th className="num">Tồn</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {variantList.map((v) => {
                                        const qty = Number(v.soLuongTon || 0);
                                        return (
                                            <tr key={v.id}>
                                                <td className="muted">{v.maSku || "-"}</td>
                                                <td>{v.kichCo?.tenKichCo || "-"}</td>
                                                <td>{v.mauSac?.tenMau || "-"}</td>
                                                <td className="num">{formatMoney(v.giaBan)}</td>
                                                <td className="num">
                                                    <span className={`ep-qty ${qty <= 0 ? "out" : qty <= LOW_STOCK ? "low" : ""}`}>
                                                        {qty}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="ev-empty compact">
                                <strong>Sản phẩm chưa có biến thể</strong>
                                <span>Nhờ quản trị viên thêm size và màu để có thể bán.</span>
                            </div>
                        )}
                    </section>
                </div>

                <footer className="ep-drawer-foot">
                    <button type="button" className="ev-btn" onClick={onClose}>Đóng</button>
                    <button
                        type="button"
                        className="ev-btn ev-btn-primary"
                        disabled={productStatusKey(product.trangThai) !== "HOAT_DONG" || stockState(info) === "out" || !info.count}
                        onClick={onSell}
                    >
                        Bán tại quầy
                    </button>
                </footer>
            </aside>
        </div>
    );
}
