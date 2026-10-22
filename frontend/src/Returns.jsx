import { useEffect, useMemo, useRef, useState } from "react";
import "./Returns.css";

const API = "http://localhost:8080/api";
const ORDER_CACHE_KEY = "fshop_returns_counter_orders_v1";
let cachedOrders = (() => {
    try {
        const raw = localStorage.getItem(ORDER_CACHE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
})();
let ordersRequestPromise = null;
const money = (v) => `${Number(v || 0).toLocaleString("vi-VN")}đ`;
const statusText = { CHO_DUYET: "Chờ duyệt", DA_DUYET: "Đã duyệt", CHO_GUI_HANG: "Chờ gửi hàng", DANG_KIEM_TRA: "Đang kiểm tra", CHO_HOAN_TIEN: "Chờ hoàn tiền", HOAN_TAT: "Đã hoàn tất", TU_CHOI: "Đã từ chối", DA_NHAN_HANG: "Đã nhận hàng" };
const statusClass = (s) => ["HOAN_TAT", "DA_NHAN_HANG"].includes(s) ? "green" : s === "TU_CHOI" ? "red" : ["DA_DUYET", "DANG_KIEM_TRA"].includes(s) ? "blue" : "";

const RETURN_STEPS = [
    { status: "CHO_DUYET", label: "Đã gửi yêu cầu" },
    { status: "DA_DUYET", label: "Đã duyệt" },
    { status: "CHO_GUI_HANG", label: "Chờ gửi hàng" },
    { status: "DA_NHAN_HANG", label: "Đã nhận hàng" },
    { status: "DANG_KIEM_TRA", label: "Đang kiểm tra" },
    { status: "CHO_HOAN_TIEN", label: "Chờ hoàn tiền" },
    { status: "HOAN_TAT", label: "Hoàn tất" },
];

function ReturnProgress({ request }) {
    const status = String(request?.trangThai || "CHO_DUYET").toUpperCase();
    const rejected = status === "TU_CHOI";
    const currentIndex = RETURN_STEPS.findIndex((item) => item.status === status);
    const progress = currentIndex < 0 ? 0 : (currentIndex / (RETURN_STEPS.length - 1)) * 100;

    return (
        <section className="return-progress-card">
            <div className="return-progress-heading">
                <div>
                    <h3>Tiến trình xử lý đổi trả</h3>
                    <p>Mã yêu cầu: <b>{request?.maYeuCau || "—"}</b></p>
                </div>
                <span className={`returns-pill ${statusClass(status)}`}>
                    {statusText[status] || status}
                </span>
            </div>
            {rejected ? (
                <div className="return-rejected">
                    <b>Yêu cầu đã bị từ chối.</b>
                    <p>Vui lòng liên hệ cửa hàng để biết thêm lý do và hướng xử lý.</p>
                </div>
            ) : (
                <div className="return-progress-scroll">
                    <div className="return-progress-track" style={{ "--progress": `${progress}%` }}>
                        {RETURN_STEPS.map((item, index) => {
                            const done = currentIndex >= 0 && index < currentIndex;
                            const active = index === currentIndex;
                            return (
                                <div key={item.status} className={`return-progress-step ${done ? "done" : ""} ${active ? "active" : ""}`}>
                                    <div className="return-progress-dot">{done ? "✓" : index + 1}</div>
                                    <span>{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            <p className="return-progress-note">
                Tiến trình thay đổi theo trạng thái được nhân viên cập nhật.
            </p>
        </section>
    );
}


export default function Returns({ mode = "customer", taiKhoan, hoaDon = null, onBack }) {
    const [orders, setOrders] = useState(() => {
        if (mode !== "counter" || !Array.isArray(cachedOrders)) return [];
        return cachedOrders;
    });
    const [requests, setRequests] = useState([]);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [step, setStep] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedLines, setSelectedLines] = useState([]);
    const [reason, setReason] = useState("SAN_PHAM_LOI");
    const [description, setDescription] = useState("");
    const [refundMethod, setRefundMethod] = useState("CHUYEN_KHOAN");
    const [bank, setBank] = useState("");
    const [images, setImages] = useState([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [detailRequest, setDetailRequest] = useState(null);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const selectedOrderFormRef = useRef(null);

    const loadRequests = async () => {
        try {
            const r = await fetch(`${API}/doi-tra`);
            if (!r.ok) throw new Error("API đổi trả chưa được cài đặt ở backend.");
            const data = await r.json(); setRequests(Array.isArray(data) ? data : []); setError("");
        } catch (e) { setError(e.message || "Không tải được yêu cầu đổi trả."); }
    };
    const loadOrders = async (forceRefresh = false) => {
        const khId = taiKhoan?.khachHangId || taiKhoan?.khachHang?.id;
        if (mode === "customer" && !khId) { setOrders([]); return; }

        // Có cache thì hiển thị ngay, không bắt nhân viên chờ request mới.
        if (mode === "counter" && Array.isArray(cachedOrders) && !forceRefresh) {
            const q = query.trim().toLowerCase();
            const matched = q ? cachedOrders.filter(o => {
                const hay = `${o.maHoaDon || ""} ${o.soDienThoaiKhach || o.soDienThoai || ""} ${o.khachHang?.soDienThoai || ""} ${o.khachHang?.hoTen || o.tenKhach || ""}`.toLowerCase();
                return hay.includes(q);
            }) : cachedOrders;
            setOrders(matched);
            setError(matched.length || !q ? "" : "Không tìm thấy hóa đơn phù hợp. Hãy kiểm tra mã hóa đơn hoặc số điện thoại.");
            return;
        }

        setLoadingOrders(true);
        try {
            let url = `${API}/hoa-don`;
            if (mode === "customer" && khId) url = `${API}/hoa-don/khach-hang/${khId}`;
            // Chỉ gửi một request danh sách tại một thời điểm để tránh gọi API trùng.
            if (mode === "counter" && ordersRequestPromise && !forceRefresh) {
                await ordersRequestPromise;
            } else {
                const request = (async () => {
                    const r = await fetch(url);
                    if (!r.ok) throw new Error("Không tải được danh sách hóa đơn.");
                    const data = await r.json();
                    return (Array.isArray(data) ? data : []).filter(o => !["DA_HUY", "HUY"].includes(String(o.trangThai || "").toUpperCase()));
                })();
                if (mode === "counter") ordersRequestPromise = request;
                try {
                    const validOrders = await request;
                    if (mode === "counter") {
                        cachedOrders = validOrders;
                        try { localStorage.setItem(ORDER_CACHE_KEY, JSON.stringify(validOrders)); } catch { /* Cache is optional. */ }
                    }
                    const q = mode === "counter" ? query.trim().toLowerCase() : "";
                    const matched = q ? validOrders.filter(o => {
                        const hay = `${o.maHoaDon || ""} ${o.soDienThoaiKhach || o.soDienThoai || ""} ${o.khachHang?.soDienThoai || ""} ${o.khachHang?.hoTen || o.tenKhach || ""}`.toLowerCase();
                        return hay.includes(q);
                    }) : validOrders;
                    setOrders(matched);
                    setError(matched.length || !q ? "" : "Không tìm thấy hóa đơn phù hợp. Hãy kiểm tra mã hóa đơn hoặc số điện thoại.");
                } finally {
                    if (mode === "counter") ordersRequestPromise = null;
                }
            }
            // Nếu request đang chạy ở component khác, đọc kết quả đã cache sau khi hoàn tất.
            if (mode === "counter" && Array.isArray(cachedOrders)) {
                const q = query.trim().toLowerCase();
                const matched = q ? cachedOrders.filter(o => `${o.maHoaDon || ""} ${o.soDienThoaiKhach || o.soDienThoai || ""} ${o.khachHang?.soDienThoai || ""} ${o.khachHang?.hoTen || o.tenKhach || ""}`.toLowerCase().includes(q)) : cachedOrders;
                setOrders(matched);
                setError(matched.length || !q ? "" : "Không tìm thấy hóa đơn phù hợp. Hãy kiểm tra mã hóa đơn hoặc số điện thoại.");
            }
        } catch (e) {
            setOrders([]);
            setError(e.message || "Không tải được danh sách hóa đơn.");
        } finally {
            setLoadingOrders(false);
        }
    };
    useEffect(() => {
        loadRequests();
        // Hiện cache ngay lập tức; đồng thời âm thầm cập nhật dữ liệu mới từ backend.
        if (mode === "counter") {
            if (Array.isArray(cachedOrders)) {
                setOrders(cachedOrders);
                setLoadingOrders(false);
                loadOrders(true);
            } else {
                loadOrders();
            }
        } else if (mode !== "customer") loadOrders();
    }, [mode]);

    useEffect(() => {
        if (selectedOrder && mode === "counter") {
            // Form được render phía dưới bảng; đưa nhân viên tới form ngay sau khi chọn hóa đơn.
            requestAnimationFrame(() => selectedOrderFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }
    }, [selectedOrder?.id, mode]);

    useEffect(() => {
        if (mode === "customer") {
            if (hoaDon?.id) startRequest(hoaDon);
            else {
                setSelectedOrder(null);
                setSelectedLines([]);
                setStep(1);
            }
        }
    }, [mode, hoaDon?.id]);
    const filteredRequests = useMemo(() => requests.filter(r => {
        const q = query.trim().toLowerCase(); const hay = `${r.maYeuCau || ""} ${r.maHoaDon || r.hoaDon?.maHoaDon || ""} ${r.tenKhach || r.khachHang?.hoTen || ""}`.toLowerCase();
        return (!q || hay.includes(q)) && (filter === "ALL" || r.trangThai === filter);
    }), [requests, query, filter]);
    const startRequest = async (order) => {
        setSelectedOrder(order); setSelectedLines([]); setStep(1); setNotice(""); setError("");
        try { const r = await fetch(`${API}/hoa-don/${order.id}/chi-tiet`); if (!r.ok) throw new Error("Không lấy được sản phẩm trong hóa đơn."); const data = await r.json(); setSelectedOrder({ ...order, chiTiet: Array.isArray(data) ? data : [] }); }
        catch (e) { setError(e.message); setSelectedOrder({ ...order, chiTiet: [] }); }
    };
    const submitRequest = async () => {
        if (!selectedOrder || selectedLines.length === 0) { setError("Vui lòng chọn ít nhất một sản phẩm cần trả."); return; }
        const activeRequests = requests.filter((request) =>
            Number(request.hoaDonId ?? request.hoaDon?.id) === Number(selectedOrder.id) &&
            !["TU_CHOI", "HOAN_TAT"].includes(String(request.trangThai || "").toUpperCase())
        );
        const alreadyRequestedIds = new Set(activeRequests.flatMap((request) =>
            (request.sanPhamTra || []).map((line) => Number(line.chiTietHoaDonId))
        ));
        if (selectedLines.some((line) => alreadyRequestedIds.has(Number(line.chiTietHoaDonId)))) {
            setError("Đơn hàng này đã có yêu cầu trả hàng cho sản phẩm bạn chọn. Vui lòng theo dõi trạng thái xử lý của yêu cầu hiện tại, bạn không cần gửi lại.");
            return;
        }
        setBusy(true); setError("");
        try {
            const payload = { hoaDonId: selectedOrder.id, loaiYeuCau: mode === "counter" ? "TAI_QUAY" : "ONLINE", lyDo: reason, moTa: description, phuongThucHoanTien: refundMethod, thongTinHoanTien: bank, sanPhamTra: selectedLines, anhMinhChung: images };
            const r = await fetch(`${API}/doi-tra`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const body = await r.json().catch(() => ({})); if (!r.ok) throw new Error(body.message || body.error || "Không gửi được yêu cầu.");
            setNotice(`Đã tạo yêu cầu ${body.maYeuCau || "đổi trả"}.`); setSelectedOrder(null); setStep(1); await loadRequests();
        } catch (e) { setError(`${e.message} Nếu backend chưa có API /api/doi-tra, cần bổ sung backend trước khi lưu dữ liệu thật.`); }
        finally { setBusy(false); }
    };
    const changeStatus = async (item, status) => {
        try { const r = await fetch(`${API}/doi-tra/${item.id}/trang-thai`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trangThai: status }) }); const body = await r.json().catch(() => ({})); if (!r.ok) throw new Error(body.message || "Không cập nhật được trạng thái."); await loadRequests(); setNotice("Đã cập nhật trạng thái yêu cầu."); }
        catch (e) { setError(`${e.message} Chưa thay đổi dữ liệu hóa đơn hoặc tồn kho.`); }
    };
    const title = mode === "admin" ? "Quản lý yêu cầu đổi trả" : mode === "counter" ? "Lập phiếu trả hàng tại quầy" : "Đổi trả hàng của tôi";
    const orderLines = selectedOrder?.chiTiet || [];
    const currentOrderRequests = useMemo(() => {
        const orderId = selectedOrder?.id ?? hoaDon?.id;
        if (orderId == null) return [];
        return requests.filter((item) =>
            Number(item.hoaDonId ?? item.hoaDon?.id) === Number(orderId)
        );
    }, [requests, selectedOrder?.id, hoaDon?.id]);

    const getLineName = (line) => line.sanPhamChiTiet?.sanPham?.tenSanPham || line.sanPham?.tenSanPham || line.tenSanPham || "Sản phẩm giày";
    const getLineVariant = (line) => `Size ${line.sanPhamChiTiet?.kichCo?.tenKichCo || line.kichCo || "—"} | ${line.sanPhamChiTiet?.mauSac?.tenMau || line.mauSac || "—"}`;

    return <main className="returns-page">
        <div className="returns-title"><div><h1>{title}</h1><p>{mode === "customer" ? "Gửi yêu cầu và theo dõi quá trình xử lý đơn hàng." : "Tra cứu hóa đơn, quản lý yêu cầu và cập nhật trạng thái xử lý."}</p></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{onBack && <button className="returns-btn" onClick={onBack}>← Quay lại</button>}<button className="returns-btn" onClick={() => { loadRequests(); if (mode !== "customer") loadOrders(true); }}>↻ Làm mới</button></div></div>
        {notice && <div className="returns-notice">{notice}</div>}{error && <div className="returns-notice" style={{ background: "#fef3f2", color: "#b42318" }}>{error}</div>}
        {mode === "customer" && selectedOrder && currentOrderRequests.length > 0 && (
            <section className="returns-card">
                <h2 style={{ marginTop: 0 }}>Yêu cầu đổi trả của hóa đơn này</h2>
                {currentOrderRequests.map((request) => (
                    <ReturnProgress key={request.id || request.maYeuCau} request={request} />
                ))}
                <p className="returns-notice">
                    Bạn đã gửi yêu cầu đổi trả cho hóa đơn này. Hãy theo dõi tiến trình ở trên; không gửi lại cùng sản phẩm nếu yêu cầu đang được xử lý.
                </p>
            </section>
        )}

        {mode === "customer" && !selectedOrder && (
            <section className="returns-card returns-empty-state">
                <h2 style={{ marginTop: 0 }}>Chưa chọn đơn hàng</h2>
                <p>Vui lòng quay lại chi tiết đơn hàng đã giao thành công và chọn “Yêu cầu trả hàng”.</p>
                {onBack && <button className="returns-btn blue" onClick={onBack}>← Quay lại đơn hàng</button>}
            </section>
        )}
        {(mode === "counter" || mode === "admin") && <><div className="returns-grid"><div className="returns-stat"><span>Chờ duyệt</span><strong>{requests.filter(r => r.trangThai === "CHO_DUYET").length}</strong></div><div className="returns-stat"><span>Đang xử lý</span><strong>{requests.filter(r => ["DA_DUYET", "CHO_GUI_HANG", "DA_NHAN_HANG", "DANG_KIEM_TRA"].includes(r.trangThai)).length}</strong></div><div className="returns-stat"><span>Chờ hoàn tiền</span><strong>{requests.filter(r => r.trangThai === "CHO_HOAN_TIEN").length}</strong></div><div className="returns-stat"><span>Đã hoàn tất</span><strong>{requests.filter(r => r.trangThai === "HOAN_TAT").length}</strong></div></div>
            {mode === "counter" && <section className="returns-card"><h2 style={{ marginTop: 0 }}>Tìm hóa đơn để lập phiếu trả</h2><div style={{ display: "flex", gap: 10 }}><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nhập mã hóa đơn hoặc số điện thoại khách hàng..." style={{ flex: 1, minWidth: 0, padding: 12, border: "1px solid #d0d5dd", borderRadius: 9 }} /><button className="returns-btn blue" onClick={() => loadOrders(false)}>Tìm kiếm</button></div><div className="returns-table-wrap"><table className="returns-table"><thead><tr><th>Mã hóa đơn</th><th>Ngày mua</th><th>Khách hàng</th><th>Tổng tiền</th><th></th></tr></thead><tbody>{orders.map(o => <tr key={o.id}><td>{o.maHoaDon}</td><td>{o.ngayLap ? new Date(o.ngayLap).toLocaleDateString("vi-VN") : "—"}</td><td>{o.khachHang?.hoTen || o.tenKhach || "Khách tại quầy"}</td><td>{money(o.tongThanhToan)}</td><td><button type="button" className="returns-btn blue" onClick={() => { setError(""); setNotice(""); startRequest(o); }}>Chọn hóa đơn</button></td></tr>)}{loadingOrders && orders.length === 0 && <tr><td colSpan="5" style={{ textAlign: "center", padding: 22, color: "#667085" }}>Đang tải hóa đơn lần đầu...</td></tr>}{!loadingOrders && orders.length === 0 && <tr><td colSpan="5" style={{ textAlign: "center", padding: 22, color: "#667085" }}>{query.trim() ? "Chưa tìm thấy hóa đơn phù hợp. Hãy kiểm tra từ khóa rồi bấm Tìm kiếm." : "Không có hóa đơn để hiển thị."}</td></tr>}</tbody></table></div></section>}
            <section className="returns-card"><div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap", alignItems: "center" }}><h2 style={{ margin: 0, fontSize: 19 }}>Danh sách yêu cầu đổi trả</h2><div style={{ display: "flex", gap: 8 }}><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm mã yêu cầu / hóa đơn..." style={{ padding: 10, border: "1px solid #d0d5dd", borderRadius: 8 }} /><select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: 10, border: "1px solid #d0d5dd", borderRadius: 8 }}><option value="ALL">Tất cả trạng thái</option>{Object.entries(statusText).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div></div><div className="returns-table-wrap"><table className="returns-table"><thead><tr><th>Mã yêu cầu</th><th>Mã hóa đơn</th><th>Khách hàng</th><th>Nguồn</th><th>Ngày tạo</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{filteredRequests.map(r => <tr key={r.id}><td><b>{r.maYeuCau}</b></td><td>{r.maHoaDon || r.hoaDon?.maHoaDon || r.hoaDonId}</td><td>{r.tenKhach || r.khachHang?.hoTen || "—"}</td><td>{r.loaiYeuCau === "TAI_QUAY" ? "Tại quầy" : "Online"}</td><td>{r.ngayTao ? new Date(r.ngayTao).toLocaleDateString("vi-VN") : "—"}</td><td><span className={`returns-pill ${statusClass(r.trangThai)}`}>{statusText[r.trangThai] || r.trangThai}</span></td><td><div className="returns-admin-actions"><button type="button" className="returns-btn" onClick={() => setDetailRequest(r)}>Xem chi tiết</button><select aria-label="Cập nhật trạng thái" defaultValue="" onChange={e => { if (e.target.value) changeStatus(r, e.target.value); }}><option value="" disabled>Cập nhật</option>{Object.entries(statusText).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div></td></tr>)}</tbody></table>{filteredRequests.length === 0 && <div className="returns-empty">Chưa có yêu cầu nào. Các yêu cầu sẽ xuất hiện sau khi API đổi trả được tích hợp.</div>}</div></section></>}
        {mode === "admin" && detailRequest && (() => {
            const d = detailRequest;
            let proofImages = [];
            try {
                const parsed = typeof d.anhMinhChung === "string" ? JSON.parse(d.anhMinhChung) : d.anhMinhChung;
                proofImages = Array.isArray(parsed) ? parsed : [];
            } catch { proofImages = []; }
            const returnedProducts = Array.isArray(d.sanPhamTra) ? d.sanPhamTra : [];
            return (
                <div role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetailRequest(null); }} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(16,24,40,.58)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="return-detail-title" className="returns-card" style={{ width: "min(850px, 100%)", maxHeight: "90vh", overflowY: "auto", margin: 0, boxShadow: "0 24px 70px rgba(0,0,0,.25)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, borderBottom: "1px solid #eaecf0", paddingBottom: 16, marginBottom: 18 }}>
                            <div><h2 id="return-detail-title" style={{ margin: 0 }}>Chi tiết yêu cầu đổi trả</h2><p style={{ margin: "7px 0 0", color: "#667085" }}>Mã yêu cầu: <b>{d.maYeuCau || "—"}</b></p></div>
                            <button type="button" className="returns-btn" onClick={() => setDetailRequest(null)}>✕ Đóng</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 18 }}>
                            {[ ["Mã hóa đơn", d.maHoaDon || d.hoaDon?.maHoaDon || d.hoaDonId || "—"], ["Khách hàng", d.tenKhach || d.khachHang?.hoTen || "—"], ["Loại yêu cầu", d.loaiYeuCau === "TAI_QUAY" ? "Tại quầy" : "Online"], ["Ngày tạo", d.ngayTao ? new Date(d.ngayTao).toLocaleString("vi-VN") : "—"], ["Lý do", d.lyDo || "—"], ["Phương thức hoàn tiền", d.phuongThucHoanTien || "—"] ].map(([label, value]) => <div key={label} style={{ padding: 13, border: "1px solid #eaecf0", borderRadius: 10, background: "#fcfcfd" }}><div style={{ color: "#667085", fontSize: 12, marginBottom: 6 }}>{label}</div><div style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{value}</div></div>)}
                        </div>
                        <div style={{ marginBottom: 18 }}><h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Mô tả tình trạng sản phẩm</h3><div style={{ padding: 14, background: "#f9fafb", borderRadius: 9, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{d.moTa || "Khách hàng chưa cung cấp mô tả."}</div></div>
                        {d.thongTinHoanTien && <div style={{ marginBottom: 18 }}><h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Thông tin hoàn tiền</h3><div style={{ padding: 14, background: "#f9fafb", borderRadius: 9, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{d.thongTinHoanTien}</div></div>}
                        <div style={{ marginBottom: 18 }}><h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Sản phẩm được yêu cầu trả</h3>{returnedProducts.length ? <div className="returns-table-wrap"><table className="returns-table"><thead><tr><th>STT</th><th>Mã chi tiết hóa đơn</th><th>Mã sản phẩm chi tiết</th><th>Số lượng trả</th></tr></thead><tbody>{returnedProducts.map((line, i) => <tr key={`${line.chiTietHoaDonId}-${i}`}><td>{i + 1}</td><td>{line.chiTietHoaDonId ?? "—"}</td><td>{line.sanPhamChiTietId ?? "—"}</td><td>{line.soLuong ?? "—"}</td></tr>)}</tbody></table></div> : <p style={{ color: "#667085" }}>Không có thông tin sản phẩm trả trong dữ liệu API.</p>}</div>
                        {proofImages.length > 0 && <div style={{ marginBottom: 18 }}><h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Ảnh minh chứng</h3><div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{proofImages.map((img, i) => { const src = typeof img === "string" ? img : img?.dataUrl || img?.url; return src ? <a key={i} href={src} target="_blank" rel="noreferrer"><img src={src} alt={`Ảnh minh chứng ${i + 1}`} style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 8, border: "1px solid #eaecf0" }} /></a> : <span key={i} style={{ color: "#667085" }}>{typeof img === "object" ? img.tenFile || `Ảnh ${i + 1}` : `Ảnh ${i + 1}`} (chưa có đường dẫn ảnh)</span>; })}</div></div>}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderTop: "1px solid #eaecf0", paddingTop: 16 }}><div><div style={{ color: "#667085", fontSize: 12, marginBottom: 5 }}>Trạng thái hiện tại</div><span className={`returns-pill ${statusClass(d.trangThai)}`}>{statusText[d.trangThai] || d.trangThai || "—"}</span></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><select aria-label="Cập nhật trạng thái yêu cầu đang xem" defaultValue="" onChange={async e => { const next = e.target.value; if (next) { await changeStatus(d, next); setDetailRequest(current => current ? { ...current, trangThai: next } : current); e.target.value = ""; } }} style={{ padding: "10px 12px", border: "1px solid #d0d5dd", borderRadius: 8 }}><option value="" disabled>Cập nhật trạng thái</option>{Object.entries(statusText).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select><button type="button" className="returns-btn blue" onClick={() => setDetailRequest(null)}>Hoàn tất</button></div></div>
                    </section>
                </div>
            );
        })()}

        {selectedOrder && <section ref={selectedOrderFormRef} className="returns-card" style={{ scrollMarginTop: 24 }}><div className="returns-stepper">{["Chọn sản phẩm", "Thông tin trả hàng", "Xác nhận"].map((s, i) => <div key={s} className={`returns-step ${step === i + 1 ? "active" : step > i + 1 ? "done" : ""}`}><b>{step > i + 1 ? "✓" : i + 1}</b>{s}</div>)}</div><div className="returns-order"><div><b>Mã hóa đơn: {selectedOrder.maHoaDon || `HD${selectedOrder.id}`}</b><div style={{ color: "#667085", fontSize: 13, marginTop: 5 }}>Ngày mua: {selectedOrder.ngayLap ? new Date(selectedOrder.ngayLap).toLocaleDateString("vi-VN") : "—"}</div></div><span className="returns-pill green">{selectedOrder.trangThai || "Hóa đơn"}</span></div>
            {step === 1 && <><h3>Chọn sản phẩm muốn trả</h3>{orderLines.length === 0 && <p className="returns-notice">Chưa tải được chi tiết hóa đơn. Kiểm tra API GET /api/hoa-don/{selectedOrder.id}/chi-tiet.</p>}{orderLines.map(line => { const id = line.id || line.sanPhamChiTiet?.id; const checked = selectedLines.some(x => x.chiTietHoaDonId === id); const alreadyRequested = currentOrderRequests.some(request => !["TU_CHOI", "HOAN_TAT"].includes(String(request.trangThai || "").toUpperCase()) && (request.sanPhamTra || []).some(item => Number(item.chiTietHoaDonId) === Number(id))); return <label className="returns-checkline" key={id}><input type="checkbox" checked={checked} disabled={alreadyRequested} onChange={e => setSelectedLines(old => e.target.checked ? [...old, { chiTietHoaDonId: id, sanPhamChiTietId: line.sanPhamChiTiet?.id, soLuong: 1 }] : old.filter(x => x.chiTietHoaDonId !== id))} /><div className="returns-product"><div className="returns-shoe">👟</div><div><b>{getLineName(line)}</b>{alreadyRequested && <small className="returns-already-requested">Đã có yêu cầu đổi trả</small>}<small>{getLineVariant(line)}</small><small>Đơn giá: {money(line.donGia || line.thanhTien)}</small></div></div><div style={{ marginLeft: "auto" }}><small>Số lượng trả</small><input type="number" min="1" max={line.soLuong || 1} value={selectedLines.find(x => x.chiTietHoaDonId === id)?.soLuong || 1} disabled={!checked} onChange={e => setSelectedLines(old => old.map(x => x.chiTietHoaDonId === id ? { ...x, soLuong: Math.max(1, Math.min(Number(e.target.value) || 1, line.soLuong || 1)) } : x))} style={{ width: 64, padding: 7, border: "1px solid #d0d5dd", borderRadius: 7, marginLeft: 8 }} /></div></label>; })}<div className="returns-notice">Vui lòng kiểm tra điều kiện trả hàng theo chính sách cửa hàng trước khi gửi yêu cầu.</div></>}
            {step === 2 && <><h3>Thông tin trả hàng</h3><div className="returns-form-grid"><div className="returns-field"><label>Lý do trả hàng *</label><select value={reason} onChange={e => setReason(e.target.value)}><option value="SAN_PHAM_LOI">Sản phẩm bị lỗi</option><option value="SAI_SAN_PHAM">Giao sai sản phẩm</option><option value="KHONG_VUA_SIZE">Không vừa size</option><option value="KHONG_CON_NHU_CAU">Không còn nhu cầu</option><option value="KHAC">Lý do khác</option></select></div><div className="returns-field"><label>Phương thức hoàn tiền *</label><select value={refundMethod} onChange={e => setRefundMethod(e.target.value)}><option value="CHUYEN_KHOAN">Chuyển khoản ngân hàng</option><option value="VI_CUA_HANG">Ví cửa hàng</option><option value="TIEN_MAT">Tiền mặt (tại quầy)</option></select></div><div className="returns-field full"><label>Mô tả chi tiết *</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả tình trạng sản phẩm và lý do trả..." /></div><div className="returns-field full"><label>Ảnh minh chứng (tối đa 5 ảnh)</label><input type="file" accept="image/*" multiple onChange={e => setImages(Array.from(e.target.files || []).slice(0,5).map(f => ({ tenFile: f.name, dataUrl: "" })))} /><small style={{ color: "#667085" }}>{images.length} ảnh đã chọn. Cần bổ sung API upload ảnh để lưu file thực tế.</small></div>{refundMethod === "CHUYEN_KHOAN" && <div className="returns-field full"><label>Thông tin ngân hàng nhận hoàn tiền *</label><input value={bank} onChange={e => setBank(e.target.value)} placeholder="Tên ngân hàng - số tài khoản - tên chủ tài khoản" /></div>}</div></>}
            {step === 3 && <><h3>Xác nhận thông tin</h3><div className="returns-order"><div><b>{selectedOrder.maHoaDon || `HD${selectedOrder.id}`}</b><div style={{ color: "#667085", marginTop: 6 }}>Sản phẩm được chọn: {selectedLines.length}</div><div style={{ color: "#667085", marginTop: 6 }}>Lý do: {reason}</div><div style={{ color: "#667085", marginTop: 6 }}>Phương thức hoàn tiền: {refundMethod}</div></div><strong>{money(selectedLines.reduce((sum, chosen) => { const line = orderLines.find(x => (x.id || x.sanPhamChiTiet?.id) === chosen.chiTietHoaDonId); return sum + Number(line?.donGia || 0) * chosen.soLuong; }, 0))}</strong></div><div className="returns-notice">Yêu cầu sẽ ở trạng thái chờ duyệt. Hệ thống không tự động hoàn tiền hoặc cộng tồn kho ở bước gửi yêu cầu.</div></>}
            <div className="returns-actions"><button className="returns-btn" onClick={() => {
                if (step > 1) setStep(step - 1);
                else if (mode === "customer" && onBack) onBack();
                else setSelectedOrder(null);
            }}>{step === 1 ? (mode === "customer" ? "Hủy yêu cầu" : "Hủy") : "Quay lại"}</button>{step < 3 ? <button className="returns-btn blue" onClick={() => { if (step === 1 && !selectedLines.length) return setError("Chọn sản phẩm muốn trả trước."); if (step === 2 && (!description.trim() || (refundMethod === "CHUYEN_KHOAN" && !bank.trim()))) return setError("Vui lòng điền mô tả và thông tin hoàn tiền bắt buộc."); setError(""); setStep(step + 1); }}>Tiếp tục →</button> : <button className="returns-btn primary" disabled={busy} onClick={submitRequest}>{busy ? "Đang gửi..." : mode === "counter" ? "Xác nhận trả hàng" : "Gửi yêu cầu"}</button>}</div>
        </section>}
    </main>;
}
