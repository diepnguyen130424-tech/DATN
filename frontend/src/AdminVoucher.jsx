/* eslint-disable react-hooks/set-state-in-effect, no-empty */
import { useCallback, useEffect, useRef, useState } from "react";

const API = "http://localhost:8080/api";
const CACHE_KEY = "admin_voucher_cache";
const CACHE_TTL = 60 * 1000;

// Hạng khách hàng (mặc định; sẽ được thay bằng dữ liệu từ backend /hang-khach-hang/cac-hang)
const HANG_MAC_DINH = [
    { ma: "BAC", ten: "Bạc", nguong: 2000000 },
    { ma: "VANG", ten: "Vàng", nguong: 5000000 },
    { ma: "KIM_CUONG", ten: "Kim cương", nguong: 10000000 },
];
const tenHangVoucher = (ma) => ({ BAC: "Bạc", VANG: "Vàng", KIM_CUONG: "Kim cương" }[ma] || ma);

function formatSoTienInput(value) {
    if (!value) return "";
    const num = String(value).replace(/\D/g, "");
    if (!num) return "";
    return Number(num).toLocaleString("vi-VN");
}

function parseSoTienInput(value) {
    if (!value) return "";
    return String(value).replace(/\./g, "");
}

const EMPTY_FORM = {
    maVoucher: "",
    tenVoucher: "",
    loaiGiam: "PHAN_TRAM",
    giaTriGiam: "",
    giamToiDa: "",
    donToiThieu: "",
    soLuong: "",
    soLuongDaDung: 0,
    ngayBatDau: "",
    ngayKetThuc: "",
    trangThai: "HOAT_DONG",
    hangToiThieu: "",
};

function formatGia(gia) {
    if (!gia && gia !== 0) return "—";
    return Number(gia).toLocaleString("vi-VN") + "đ";
}

function formatDate(str) {
    if (!str) return "—";
    try {
        return new Date(str).toLocaleDateString("vi-VN");
    } catch {
        return str;
    }
}

function isKichHoat(v) {
    return v.trangThai !== "NGUNG_HOAT_DONG";
}

// Trạng thái THEO THỜI GIAN: sắp diễn ra - đang diễn ra - đã kết thúc
function getComputedStatus(v) {
    const now = Date.now();
    if (v.ngayBatDau) {
        const start = new Date(v.ngayBatDau).getTime();
        if (!Number.isNaN(start) && now < start) return "SAP_DIEN_RA";
    }
    if (v.ngayKetThuc) {
        const end = new Date(v.ngayKetThuc).getTime();
        if (!Number.isNaN(end) && now > end) return "DA_KET_THUC";
    }
    return "DANG_DIEN_RA";
}

function getTrangThaiClass(trangThai) {
    if (trangThai === "DANG_DIEN_RA") return "active";
    if (trangThai === "SAP_DIEN_RA") return "pending";
    if (trangThai === "DA_KET_THUC") return "inactive";
    return "";
}

function getTrangThaiLabel(trangThai) {
    if (trangThai === "DANG_DIEN_RA") return "Đang diễn ra";
    if (trangThai === "SAP_DIEN_RA") return "Sắp diễn ra";
    if (trangThai === "DA_KET_THUC") return "Đã kết thúc";
    return trangThai;
}

const BADGE_BASE = {
    padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
    whiteSpace: "nowrap", display: "inline-block", textAlign: "center",
};

function getTrangThaiBadgeStyle(trangThai) {
    const styles = {
        DANG_DIEN_RA: { background: "#eaf7ed", color: "#24833b" },
        SAP_DIEN_RA: { background: "#fff3cd", color: "#856404" },
        DA_KET_THUC: { background: "#f0f0f0", color: "#666666" },
    };
    return { ...BADGE_BASE, ...(styles[trangThai] || {}) };
}

// Trạng thái HOẠT ĐỘNG (bật/tắt thủ công): hoạt động - không hoạt động
function getHoatDongBadgeStyle(active) {
    return {
        ...BADGE_BASE,
        ...(active
            ? { background: "#eaf7ed", color: "#24833b" }
            : { background: "#fdecea", color: "#c0392b" }),
    };
}

function readCache() {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.time > CACHE_TTL) return null;
        return parsed.data;
    } catch { return null; }
}

function writeCache(data) {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, time: Date.now() }));
    } catch {}
}

function SortIcon({ columnKey, sortConfig }) {
    const isActive = sortConfig.key === columnKey;

    return (
        <span style={{ marginLeft: 4, opacity: isActive ? 1 : 0.3 }}>
            {isActive
                ? (sortConfig.direction === "asc" ? "↑" : "↓")
                : "↕"}
        </span>
    );
}

export default function AdminVoucher() {
    const [danhSach, setDanhSach] = useState(() => readCache() || []);
    const [loading, setLoading] = useState(() => !readCache());
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [toggling, setToggling] = useState(null);
    const [cacHang, setCacHang] = useState(HANG_MAC_DINH);

    const [search, setSearch] = useState("");
    const [filterTrangThai, setFilterTrangThai] = useState("TAT_CA");
    const [filterHoatDong, setFilterHoatDong] = useState("TAT_CA");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const abortRef = useRef(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (abortRef.current) abortRef.current.abort();
        };
    }, []);

    const loadDanhSach = useCallback(async (background = false) => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        let timeoutId;
        try {
            if (!background) {
                const cached = readCache();
                if (!cached || cached.length === 0) setLoading(true);
                setError("");
            }

            timeoutId = setTimeout(() => controller.abort(), 12000);
            const res = await fetch(`${API}/ma-giam-gia`, { signal: controller.signal });

            if (!isMountedRef.current) return;
            if (!res.ok) throw new Error(`Lỗi ${res.status}: Không tải được danh sách`);

            const data = await res.json();
            if (!isMountedRef.current) return;

            const list = Array.isArray(data) ? data : [];
            setDanhSach(list);
            writeCache(list);
            setError("");
        } catch (err) {
            if (err.name === "AbortError") return;
            if (!isMountedRef.current) return;

            if (!background) {
                const cached = readCache();
                if (cached && cached.length > 0) {
                    setDanhSach(cached);
                    setError("");
                } else {
                    let msg = err.message;
                    if (err.message === "Failed to fetch") msg = "Không kết nối được tới máy chủ.";
                    setError(msg);
                }
            }
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            if (isMountedRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadDanhSach();
    }, [loadDanhSach]);

    // Lấy danh sách hạng + mốc chi tiêu từ backend (lỗi thì dùng mặc định)
    useEffect(() => {
        let huy = false;
        fetch(`${API}/hang-khach-hang/cac-hang`)
            .then((r) => (r.ok ? r.json() : null))
            .then((ds) => {
                if (huy || !Array.isArray(ds)) return;
                const loc = ds.filter((h) => h.ma && h.ma !== "THANH_VIEN");
                if (loc.length) setCacHang(loc);
            })
            .catch(() => { /* dùng mặc định */ });
        return () => { huy = true; };
    }, []);

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(""); setShowModal(true); };

    const openEdit = (v) => {
        setEditing(v);
        setForm({
            maVoucher: v.maVoucher || "", tenVoucher: v.tenVoucher || "",
            loaiGiam: v.loaiGiam || "PHAN_TRAM",
            giaTriGiam: v.loaiGiam === "FREESHIP" ? "" : (v.giaTriGiam ?? ""),
            giamToiDa: v.loaiGiam === "FREESHIP" ? "" : (v.giamToiDa ?? ""),
            donToiThieu: v.donToiThieu ?? "", soLuong: v.soLuong ?? "",
            soLuongDaDung: v.soLuongDaDung ?? 0,
            ngayBatDau: v.ngayBatDau ? v.ngayBatDau.slice(0, 16) : "",
            ngayKetThuc: v.ngayKetThuc ? v.ngayKetThuc.slice(0, 16) : "",
            trangThai: v.trangThai === "NGUNG_HOAT_DONG" ? "NGUNG_HOAT_DONG" : "HOAT_DONG",
            hangToiThieu: v.hangToiThieu || "",
        });
        setFormError(""); setShowModal(true);
    };

    const closeModal = () => { if (saving) return; setShowModal(false); setEditing(null); setForm(EMPTY_FORM); setFormError(""); };
    const handleChange = (field, value) => setForm((old) => ({ ...old, [field]: value }));

    const validate = () => {
        if (!form.maVoucher.trim()) return "Vui lòng nhập mã voucher";
        if (!/^[A-Z0-9_]+$/.test(form.maVoucher.trim().toUpperCase())) return "Mã chỉ dùng chữ HOA, số và dấu gạch dưới";
        if (!form.tenVoucher.trim()) return "Vui lòng nhập tên voucher";
        if (form.loaiGiam !== "FREESHIP") {
            if (!form.giaTriGiam || Number(form.giaTriGiam) <= 0) return "Giá trị giảm phải lớn hơn 0";
            if (form.loaiGiam === "PHAN_TRAM" && Number(form.giaTriGiam) > 50) return "Giảm % không được vượt quá 50%";
        }
        if (!form.soLuong || Number(form.soLuong) <= 0) return "Số lượng phải lớn hơn 0";
        return "";
    };

    const handleSave = async () => {
        const err = validate();
        if (err) { setFormError(err); return; }

        setSaving(true); setFormError("");

        try {
            const laFreeship = form.loaiGiam === "FREESHIP";
            const body = {
                maVoucher: form.maVoucher.trim().toUpperCase(), tenVoucher: form.tenVoucher.trim(),
                loaiGiam: form.loaiGiam, giaTriGiam: laFreeship ? 0 : Number(form.giaTriGiam),
                giamToiDa: laFreeship ? null : form.giamToiDa ? Number(form.giamToiDa) : null,
                donToiThieu: form.donToiThieu ? Number(form.donToiThieu) : null,
                hangToiThieu: form.hangToiThieu || null,
                soLuong: Number(form.soLuong), soLuongDaDung: Number(form.soLuongDaDung) || 0,
                ngayBatDau: form.ngayBatDau ? form.ngayBatDau + ":00" : null,
                ngayKetThuc: form.ngayKetThuc ? form.ngayKetThuc + ":00" : null,
                trangThai: form.trangThai,
            };

            const url = editing ? `${API}/ma-giam-gia/${editing.id}` : `${API}/ma-giam-gia`;
            const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

            if (!res.ok) {
                const text = await res.text();
                let msg = "Lưu thất bại";
                try { const j = JSON.parse(text); msg = j.message || msg; } catch { msg = text || msg; }
                throw new Error(msg);
            }

            const savedData = await res.json();
            let newList = editing ? danhSach.map((item) => item.id === savedData.id ? savedData : item) : [savedData, ...danhSach];
            setDanhSach(newList); writeCache(newList); closeModal(); setTimeout(() => loadDanhSach(true), 500);
        } catch (err) { setFormError(err.message); } finally { setSaving(false); }
    };

    const handleDelete = async (v) => {
        if (!window.confirm(`Xóa voucher "${v.maVoucher}"?`)) return;
        const oldList = danhSach;
        const newList = danhSach.filter((item) => item.id !== v.id);
        setDanhSach(newList); writeCache(newList);
        try {
            const res = await fetch(`${API}/ma-giam-gia/${v.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Xóa thất bại");
            setTimeout(() => loadDanhSach(true), 400);
        } catch (err) {
            setDanhSach(oldList); writeCache(oldList); alert(err.message);
        }
    };

    const handleToggleActive = async (v) => {
        const active = isKichHoat(v);
        const confirmMsg = active
            ? `Chuyển voucher "${v.maVoucher}" sang KHÔNG HOẠT ĐỘNG?\n\nKhách hàng sẽ nhận được thông báo và KHÔNG thể sử dụng voucher này nữa.`
            : `Chuyển voucher "${v.maVoucher}" sang HOẠT ĐỘNG?\n\nKhách hàng sẽ nhận được thông báo và có thể sử dụng voucher (nếu còn trong thời gian hiệu lực).`;

        if (!window.confirm(confirmMsg)) return;
        const newTrangThai = active ? "NGUNG_HOAT_DONG" : "HOAT_DONG";
        const oldList = danhSach;
        const newList = danhSach.map((item) => item.id === v.id ? { ...item, trangThai: newTrangThai } : item);

        setDanhSach(newList); writeCache(newList); setToggling(v.id);

        try {
            const res = await fetch(`${API}/ma-giam-gia/${v.id}/kich-hoat`, {
                method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kichHoat: !active }),
            });
            if (!res.ok) {
                const text = await res.text();
                let msg = "Cập nhật thất bại";
                try { const j = JSON.parse(text); msg = j.message || msg; } catch { msg = text || msg; }
                throw new Error(msg);
            }
            const saved = await res.json();
            setDanhSach((prev) => {
                const updated = prev.map((item) => item.id === saved.id ? { ...item, ...saved } : item);
                writeCache(updated); return updated;
            });
        } catch (err) {
            setDanhSach(oldList); writeCache(oldList); alert(err.message);
        } finally { if (isMountedRef.current) setToggling(null); }
    };

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
        setSortConfig({ key, direction });
    };

    const filtered = danhSach.filter((v) => {
        const kw = search.trim().toLowerCase();
        const matchKw = !kw || v.maVoucher?.toLowerCase().includes(kw) || v.tenVoucher?.toLowerCase().includes(kw);
        const computedStatus = getComputedStatus(v);
        const matchTT = filterTrangThai === "TAT_CA" || computedStatus === filterTrangThai;
        const matchHD = filterHoatDong === "TAT_CA" || (filterHoatDong === "HOAT_DONG") === isKichHoat(v);
        let matchTime = true;
        if (v.ngayBatDau) {
            const vDate = new Date(v.ngayBatDau).setHours(0, 0, 0, 0);
            if (filterStartDate) { const fStart = new Date(filterStartDate).setHours(0, 0, 0, 0); if (vDate < fStart) matchTime = false; }
            if (filterEndDate) { const fEnd = new Date(filterEndDate).setHours(23, 59, 59, 999); if (vDate > fEnd) matchTime = false; }
        } else if (filterStartDate || filterEndDate) matchTime = false;
        return matchKw && matchTT && matchHD && matchTime;
    }).sort((a, b) => {
        if (sortConfig.key === "id") return sortConfig.direction === "asc" ? a.id - b.id : b.id - a.id;
        if (sortConfig.key === "maVoucher") {
            const valA = a.maVoucher || "", valB = b.maVoucher || "";
            if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
            if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    useEffect(() => { setCurrentPage(1); }, [search, filterTrangThai, filterHoatDong, filterStartDate, filterEndDate, sortConfig]);
    useEffect(() => { setCurrentPage((page) => Math.min(page, totalPages)); }, [totalPages]);

    const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const showSkeleton = loading && danhSach.length === 0;

    const TOTAL_COLS = 9;
    const tableStyle = { minWidth: "1100px", borderCollapse: "separate", borderSpacing: "0" };

    // Cố định độ rộng cột Trạng thái và Thao tác để không bị ép chữ
    const colStatusStyle = { minWidth: "130px", textAlign: "center" };
    const stickyTh = { position: "sticky", right: 0, background: "#fff7f5", zIndex: 2, boxShadow: "-4px 0 10px rgba(0,0,0,0.05)", minWidth: "260px", textAlign: "center" };
    const stickyTd = { position: "sticky", right: 0, background: "#fff", zIndex: 1, boxShadow: "-4px 0 10px rgba(0,0,0,0.05)", whiteSpace: "nowrap", verticalAlign: "middle" };

    return (
        <div className="admin-voucher">
            <div className="admin-page-heading">
                <div>
                    <div className="admin-eyebrow">Quản lý / Voucher</div>
                    <h1>Quản lý Voucher</h1>
                    <p>Quản lý các mã giảm giá của cửa hàng.</p>
                </div>
                <button className="admin-date-button" onClick={openCreate}>+ Thêm voucher</button>
            </div>

            <div className="admin-filters" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input placeholder="Tìm theo mã hoặc tên voucher..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: "200px" }} />
                <select value={filterTrangThai} onChange={(e) => setFilterTrangThai(e.target.value)}>
                    <option value="TAT_CA">Tất cả trạng thái</option>
                    <option value="SAP_DIEN_RA">Sắp diễn ra</option>
                    <option value="DANG_DIEN_RA">Đang diễn ra</option>
                    <option value="DA_KET_THUC">Đã kết thúc</option>
                </select>
                <select value={filterHoatDong} onChange={(e) => setFilterHoatDong(e.target.value)}>
                    <option value="TAT_CA">Tất cả hoạt động</option>
                    <option value="HOAT_DONG">Hoạt động</option>
                    <option value="NGUNG_HOAT_DONG">Không hoạt động</option>
                </select>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", padding: "0 10px", border: "1px solid #ddd", borderRadius: "4px" }}>
                    <span style={{ fontSize: "13px", color: "#666" }}>Từ ngày:</span>
                    <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} style={{ border: "none", outline: "none", padding: "8px 0", fontSize: "14px" }} />
                    <span style={{ color: "#ccc" }}>|</span>
                    <span style={{ fontSize: "13px", color: "#666" }}>Đến:</span>
                    <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} style={{ border: "none", outline: "none", padding: "8px 0", fontSize: "14px" }} />
                </div>
            </div>

            {showSkeleton && (
                <div className="admin-table-scroll" style={{ overflowX: "auto", width: "100%" }}>
                    <table className="admin-table" style={tableStyle}>
                        <thead>
                        <tr>
                            <th>ID</th><th>Mã</th><th>Tên</th><th>Mức giảm</th><th>Điều kiện</th><th>Thời gian</th><th style={colStatusStyle}>Trạng thái</th><th style={colStatusStyle}>Hoạt động</th>
                            <th style={stickyTh}>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i} className="skeleton-row">
                                {Array.from({ length: TOTAL_COLS }).map((_, j) => (
                                    <td key={j} style={j === TOTAL_COLS - 1 ? stickyTd : {}}><div className="skeleton-bar" /></td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!showSkeleton && error && danhSach.length === 0 && (
                <div className="admin-error-box">
                    <div className="icon">⚠️</div><h3>Không tải được dữ liệu</h3><p>{error}</p>
                </div>
            )}

            {!showSkeleton && danhSach.length > 0 && (
                <div className="admin-table-scroll" style={{ overflowX: "auto", width: "100%" }}>
                    <div className="admin-table-head">
                        <h2>Danh sách voucher</h2><span>{filtered.length} voucher</span>
                    </div>
                    <table className="admin-table" style={tableStyle}>
                        <thead>
                        <tr>
                            <th onClick={() => requestSort("id")} style={{ cursor: "pointer" }}>ID <SortIcon columnKey="id" sortConfig={sortConfig} /></th>
                            <th onClick={() => requestSort("maVoucher")} style={{ cursor: "pointer" }}>Mã <SortIcon columnKey="maVoucher" sortConfig={sortConfig} /></th>
                            <th>Tên</th>
                            <th>Mức giảm</th>
                            <th>Điều kiện</th>
                            <th>Thời gian</th>
                            <th style={colStatusStyle}>Trạng thái</th><th style={colStatusStyle}>Hoạt động</th>
                            <th style={stickyTh}>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {currentItems.map((v) => {
                            const computedStatus = getComputedStatus(v);
                            const active = isKichHoat(v);
                            const isToggling = toggling === v.id;

                            return (
                                <tr key={v.id}>
                                    <td><strong>#{v.id}</strong></td>
                                    <td><strong>{v.maVoucher}</strong></td>
                                    <td>{v.tenVoucher}</td>

                                    <td>
                                        <div style={{ fontWeight: 600 }}>
                                            {v.loaiGiam === "PHAN_TRAM" && `${v.giaTriGiam}%`}
                                            {v.loaiGiam === "SO_TIEN" && formatGia(v.giaTriGiam)}
                                            {v.loaiGiam === "FREESHIP" && "Freeship"}
                                        </div>
                                        {v.giamToiDa && <div style={{ fontSize: 11, color: "#666" }}>Tối đa: {formatGia(v.giamToiDa)}</div>}
                                    </td>

                                    <td>
                                        <div style={{ fontSize: 12 }}>Đơn từ: <strong>{formatGia(v.donToiThieu)}</strong></div>
                                        <div style={{ fontSize: 11, color: "#666" }}>Đã dùng: {v.soLuongDaDung ?? 0}/{v.soLuong ?? 0}</div>
                                        {v.hangToiThieu && (
                                            <div style={{ marginTop: 4 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#fff4e0", color: "#b7791f", whiteSpace: "nowrap" }}>
                                                    ⭐ Hạng {tenHangVoucher(v.hangToiThieu)}+
                                                </span>
                                            </div>
                                        )}
                                    </td>

                                    <td style={{ whiteSpace: "nowrap" }}>
                                        <div style={{ fontSize: 12 }}>BĐ: {formatDate(v.ngayBatDau)}</div>
                                        <div style={{ fontSize: 12, color: "#d94b3f" }}>KT: {formatDate(v.ngayKetThuc)}</div>
                                    </td>

                                    <td style={colStatusStyle}>
                                        <span className={`order-status ${getTrangThaiClass(computedStatus)}`} style={getTrangThaiBadgeStyle(computedStatus)}>
                                            {getTrangThaiLabel(computedStatus)}
                                        </span>
                                    </td>

                                    <td style={colStatusStyle}>
                                        <span style={getHoatDongBadgeStyle(active)}>
                                            {active ? "Hoạt động" : "Không hoạt động"}
                                        </span>
                                    </td>

                                    <td style={stickyTd}>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
                                            <button
                                                type="button" onClick={() => openEdit(v)}
                                                style={{ padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", border: "1px solid #ddd", background: "#fff", color: "#333", cursor: "pointer", transition: "0.2s", whiteSpace: "nowrap" }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                                            >Sửa</button>

                                            <button
                                                type="button" onClick={() => handleDelete(v)}
                                                style={{ padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", border: "1px solid #fadbd8", background: "#fdecea", color: "#c0392b", cursor: "pointer", transition: "0.2s", whiteSpace: "nowrap" }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "#fadbd8"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "#fdecea"}
                                            >Xóa</button>

                                            <div style={{ width: "1px", height: "20px", background: "#eee", margin: "0 4px" }} />

                                            {/* CÔNG TẮC GẠT (TOGGLE SWITCH) */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <button
                                                    type="button" onClick={() => handleToggleActive(v)} disabled={isToggling}
                                                    title={active ? "Chuyển sang không hoạt động" : "Chuyển sang hoạt động"}
                                                    style={{
                                                        width: "36px", height: "20px", borderRadius: "10px", border: "none", position: "relative",
                                                        cursor: isToggling ? "wait" : "pointer", transition: "0.3s",
                                                        background: active ? "#24833b" : "#ccc", opacity: isToggling ? 0.6 : 1,
                                                    }}
                                                >
                                                        <span style={{
                                                            position: "absolute", top: "2px", left: active ? "18px" : "2px",
                                                            width: "16px", height: "16px", borderRadius: "50%", background: "#fff",
                                                            transition: "0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                                                        }} />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={TOTAL_COLS} className="admin-empty">Không có voucher nào phù hợp</td>
                            </tr>
                        )}

                        <tr>
                            <td colSpan={TOTAL_COLS} style={{ textAlign: "center", padding: "16px" }}>
                                {filtered.length > 0 && (
                                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                                        <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ width: 40, height: 40, border: "1px solid #ddd", borderRadius: 8, background: "#fff", fontSize: 16, color: currentPage === 1 ? "#ccc" : "#222", cursor: currentPage === 1 ? "default" : "pointer" }}>←</button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button key={page} type="button" onClick={() => setCurrentPage(page)} style={{ width: 40, height: 40, border: currentPage === page ? "1px solid #d94b3f" : "1px solid #ddd", borderRadius: 8, background: currentPage === page ? "#d94b3f" : "#fff", color: currentPage === page ? "#fff" : "#222", fontWeight: currentPage === page ? 700 : 500, cursor: "pointer" }}>{page}</button>
                                        ))}
                                        <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ width: 40, height: 40, border: "1px solid #ddd", borderRadius: 8, background: "#fff", fontSize: 16, color: currentPage === totalPages ? "#ccc" : "#222", cursor: currentPage === totalPages ? "default" : "pointer" }}>→</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div onClick={closeModal} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 28, width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto" }}>
                        <h2 style={{ marginTop: 0 }}>{editing ? "Sửa voucher" : "Thêm voucher"}</h2>
                        {formError && <div style={{ background: "#fdecea", color: "#c0392b", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{formError}</div>}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            {editing && <Field label="ID"><input className="price-input" type="text" value={editing.id || ""} disabled style={{ background: "#f5f5f5", color: "#666" }} /></Field>}
                            <Field label="Mã voucher *"><input className="price-input" value={form.maVoucher} onChange={(e) => handleChange("maVoucher", e.target.value.toUpperCase())} placeholder="VD: SALE10" /></Field>
                            <Field label="Tên voucher *"><input className="price-input" value={form.tenVoucher} onChange={(e) => handleChange("tenVoucher", e.target.value)} placeholder="VD: Giảm 10%" /></Field>
                            <Field label="Loại giảm">
                                <select className="price-input" value={form.loaiGiam} onChange={(e) => { const l = e.target.value; setForm((o) => ({ ...o, loaiGiam: l, giaTriGiam: l === "FREESHIP" ? "" : o.giaTriGiam, giamToiDa: l === "FREESHIP" ? "" : o.giamToiDa })); }}>
                                    <option value="PHAN_TRAM">Phần trăm (%)</option>
                                    <option value="SO_TIEN">Số tiền (đ)</option>
                                    <option value="FREESHIP">🚚 FREESHIP</option>
                                </select>
                            </Field>
                            {form.loaiGiam !== "FREESHIP" && (
                                <>
                                    <Field label="Giá trị giảm *">
                                        {form.loaiGiam === "SO_TIEN" ? <input className="price-input" type="text" value={formatSoTienInput(form.giaTriGiam)} onChange={(e) => handleChange("giaTriGiam", parseSoTienInput(e.target.value))} placeholder="VD: 10.000" /> : <input className="price-input" type="number" value={form.giaTriGiam} onChange={(e) => handleChange("giaTriGiam", e.target.value)} placeholder="VD: 10" max="50" />}
                                    </Field>
                                    <Field label="Giảm tối đa (đ)"><input className="price-input" type="text" value={formatSoTienInput(form.giamToiDa)} onChange={(e) => handleChange("giamToiDa", parseSoTienInput(e.target.value))} placeholder="VD: 200.000" /></Field>
                                </>
                            )}
                            <Field label="Đơn tối thiểu (đ)"><input className="price-input" type="text" value={formatSoTienInput(form.donToiThieu)} onChange={(e) => handleChange("donToiThieu", parseSoTienInput(e.target.value))} placeholder="VD: 500.000" /></Field>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <Field label="Áp dụng cho hạng khách hàng">
                                    <select className="price-input" value={form.hangToiThieu} onChange={(e) => handleChange("hangToiThieu", e.target.value)}>
                                        <option value="">Tất cả khách hàng</option>
                                        {cacHang.map((h) => (
                                            <option key={h.ma} value={h.ma}>Hạng {h.ten} trở lên (chi tiêu từ {formatGia(h.nguong)})</option>
                                        ))}
                                    </select>
                                    <small style={{ display: "block", marginTop: 4, color: "#888", fontSize: 11 }}>
                                        Hạng tính theo tổng tiền các đơn đã giao / đã thanh toán của khách. Hạng cao dùng được cả voucher của hạng thấp hơn.
                                    </small>
                                </Field>
                            </div>
                            <Field label="Số lượng *"><input className="price-input" type="number" value={form.soLuong} onChange={(e) => handleChange("soLuong", e.target.value)} placeholder="VD: 100" /></Field>
                            <Field label="Ngày bắt đầu"><input className="price-input" type="datetime-local" value={form.ngayBatDau} onChange={(e) => handleChange("ngayBatDau", e.target.value)} /></Field>
                            <Field label="Ngày kết thúc"><input className="price-input" type="datetime-local" value={form.ngayKetThuc} onChange={(e) => handleChange("ngayKetThuc", e.target.value)} /></Field>
                            <Field label="Hoạt động"><select className="price-input" value={form.trangThai} onChange={(e) => handleChange("trangThai", e.target.value)}><option value="HOAT_DONG">Hoạt động</option><option value="NGUNG_HOAT_DONG">Không hoạt động</option></select></Field>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                            <button type="button" onClick={closeModal} disabled={saving} style={{ padding: "10px 20px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", cursor: "pointer" }}>Hủy</button>
                            <button type="button" onClick={handleSave} disabled={saving} style={{ padding: "10px 20px", border: "none", borderRadius: 8, background: "#111", color: "#fff", cursor: "pointer", fontWeight: 700 }}>{saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{label}</label>
            {children}
        </div>
    );
}s