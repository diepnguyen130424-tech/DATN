/* eslint-disable react-hooks/set-state-in-effect, no-empty */
import { useEffect, useRef, useState } from "react";
import "./AdminKhuyenMai.css"; // ⭐ Import file CSS

const API = "http://localhost:8080/api";
const CACHE_KEY = "admin_khuyen_mai_cache";
const CACHE_TTL = 60 * 1000;

const EMPTY_FORM = {
    tenChuongTrinh: "",
    loaiGiam: "PHAN_TRAM",
    giaTriGiam: "",
    ngayBatDau: "",
    ngayKetThuc: "",
    trangThai: "HOAT_DONG",
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

function getTrangThaiThuc(item) {
    if (item?.trangThai === "HET_HAN" || item?.trangThai === "NGUNG_HOAT_DONG") {
        return "HET_HAN";
    }
    const now = new Date();
    if (item?.ngayBatDau) {
        const bd = new Date(item.ngayBatDau);
        if (!Number.isNaN(bd.getTime()) && now < bd) return "HET_HAN";
    }
    if (item?.ngayKetThuc) {
        const kt = new Date(item.ngayKetThuc);
        if (!Number.isNaN(kt.getTime())) {
            const hetHan = new Date(kt);
            hetHan.setHours(23, 59, 59, 999);
            if (now > hetHan) return "HET_HAN";
        }
    }
    return "HOAT_DONG";
}

function getTrangThaiLabel(trangThai) {
    if (trangThai === "HOAT_DONG") return "Hoạt động";
    return "Hết hạn";
}

function readCache() {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.time > CACHE_TTL) return null;
        return parsed.data;
    } catch {
        return null;
    }
}

function writeCache(data) {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, time: Date.now() }));
    } catch {}
}

export default function AdminKhuyenMai() {
    const [danhSach, setDanhSach] = useState(() => readCache() || []);
    const [loading, setLoading] = useState(() => !readCache());
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [sanPhamList, setSanPhamList] = useState([]);
    const [bienTheList, setBienTheList] = useState([]);
    const [activeSanPhamId, setActiveSanPhamId] = useState("");
    const [selectedBienTheIds, setSelectedBienTheIds] = useState([]);

    const [search, setSearch] = useState("");
    const [filterTrangThai, setFilterTrangThai] = useState("TAT_CA");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
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

    const loadDanhSach = async (background = false) => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            if (!background) {
                const cached = readCache();
                if (!cached || cached.length === 0) setLoading(true);
                setError("");
            }
            const timeoutId = setTimeout(() => controller.abort(), 12000);
            const res = await fetch(`${API}/chuong-trinh-giam-gia`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!isMountedRef.current) return;
            if (!res.ok) throw new Error(`Lỗi ${res.status}`);

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
                if (cached && cached.length > 0) setDanhSach(cached);
                else setError(err.message);
            }
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    };

    useEffect(() => {
        fetch(`${API}/san-pham`)
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => setSanPhamList(Array.isArray(d) ? d : []))
            .catch(() => setSanPhamList([]));
    }, []);

    useEffect(() => {
        if (!activeSanPhamId) {
            setBienTheList([]);
            return;
        }
        fetch(`${API}/san-pham-chi-tiet/san-pham/${activeSanPhamId}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => setBienTheList(Array.isArray(d) ? d : []))
            .catch(() => setBienTheList([]));
    }, [activeSanPhamId]);

    useEffect(() => { loadDanhSach(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setActiveSanPhamId("");
        setSelectedBienTheIds([]);
        setBienTheList([]);
        setFormError("");
        setShowModal(true);
    };

    const openEdit = (v) => {
        setEditing(v);
        setForm({
            tenChuongTrinh: v.tenChuongTrinh || "",
            loaiGiam: v.loaiGiam || "PHAN_TRAM",
            giaTriGiam: v.giaTriGiam ?? "",
            ngayBatDau: v.ngayBatDau ? v.ngayBatDau.slice(0, 16) : "",
            ngayKetThuc: v.ngayKetThuc ? v.ngayKetThuc.slice(0, 16) : "",
            trangThai: (v.trangThai === "HET_HAN" || v.trangThai === "NGUNG_HOAT_DONG") ? "HET_HAN" : (v.trangThai || "HOAT_DONG"),
        });

        const btIds = (v.bienThes || []).map((x) => x.sanPhamChiTietId);
        setSelectedBienTheIds(btIds);

        if (v.bienThes && v.bienThes.length > 0) {
            setActiveSanPhamId(v.bienThes[0].sanPhamId);
        } else {
            setActiveSanPhamId("");
        }
        setBienTheList([]);
        setFormError("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setEditing(null);
        setForm(EMPTY_FORM);
        setActiveSanPhamId("");
        setSelectedBienTheIds([]);
        setBienTheList([]);
        setFormError("");
    };

    const handleChange = (field, value) => {
        setForm((old) => ({ ...old, [field]: value }));
    };

    const validate = () => {
        if (!form.tenChuongTrinh.trim()) return "Vui lòng nhập tên chương trình";
        if (!form.giaTriGiam || Number(form.giaTriGiam) <= 0) return "Giá trị giảm phải lớn hơn 0";
        if (form.loaiGiam === "PHAN_TRAM" && Number(form.giaTriGiam) > 60)
            return "Giảm % không được vượt quá 60%";
        if (!form.ngayBatDau) return "Vui lòng chọn ngày bắt đầu";
        if (!form.ngayKetThuc) return "Vui lòng chọn ngày kết thúc";
        if (new Date(form.ngayBatDau) >= new Date(form.ngayKetThuc))
            return "Ngày kết thúc phải sau ngày bắt đầu";
        if (selectedBienTheIds.length === 0)
            return "Vui lòng chọn ít nhất 1 biến thể sản phẩm";
        return "";
    };

    const handleSave = async () => {
        const err = validate();
        if (err) { setFormError(err); return; }

        setSaving(true);
        setFormError("");

        try {
            const body = {
                tenChuongTrinh: form.tenChuongTrinh.trim(),
                loaiGiam: form.loaiGiam,
                giaTriGiam: Number(form.giaTriGiam),
                ngayBatDau: form.ngayBatDau + ":00",
                ngayKetThuc: form.ngayKetThuc + ":00",
                trangThai: form.trangThai,
                phamViApDung: "BIEN_THE",
                bienTheIds: selectedBienTheIds,
                thuongHieuId: null,
                sanPhamIds: null,
            };

            const url = editing ? `${API}/chuong-trinh-giam-gia/${editing.id}` : `${API}/chuong-trinh-giam-gia`;
            const method = editing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                let msg = "Lưu thất bại";
                try { const j = JSON.parse(text); msg = j.message || msg; } catch { msg = text || msg; }
                throw new Error(msg);
            }

            const savedData = await res.json();
            let newList;
            if (editing) {
                newList = danhSach.map((item) => item.id === savedData.id ? savedData : item);
            } else {
                newList = [savedData, ...danhSach];
            }

            setDanhSach(newList);
            writeCache(newList);
            closeModal();
            setTimeout(() => loadDanhSach(true), 500);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (v) => {
        if (!window.confirm(`Xóa chương trình "${v.tenChuongTrinh}"?`)) return;
        const oldList = danhSach;
        const newList = danhSach.filter((item) => item.id !== v.id);
        setDanhSach(newList);
        writeCache(newList);
        try {
            const res = await fetch(`${API}/chuong-trinh-giam-gia/${v.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Xóa thất bại");
            setTimeout(() => loadDanhSach(true), 400);
        } catch (err) {
            setDanhSach(oldList);
            writeCache(oldList);
            alert(err.message);
        }
    };

    const filtered = danhSach.filter((v) => {
        const kw = search.trim().toLowerCase();
        const matchKw = !kw || v.tenChuongTrinh?.toLowerCase().includes(kw);
        const ttThuc = getTrangThaiThuc(v);
        const matchTT = filterTrangThai === "TAT_CA" || ttThuc === filterTrangThai;
        let matchTime = true;
        if (v.ngayBatDau) {
            const vDate = new Date(v.ngayBatDau).setHours(0, 0, 0, 0);
            if (filterStartDate) {
                const fStart = new Date(filterStartDate).setHours(0, 0, 0, 0);
                if (vDate < fStart) matchTime = false;
            }
            if (filterEndDate) {
                const fEnd = new Date(filterEndDate).setHours(23, 59, 59, 999);
                if (vDate > fEnd) matchTime = false;
            }
        } else if (filterStartDate || filterEndDate) {
            matchTime = false;
        }
        return matchKw && matchTT && matchTime;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

    useEffect(() => { setCurrentPage(1); }, [search, filterTrangThai, filterStartDate, filterEndDate]);
    useEffect(() => { setCurrentPage((page) => Math.min(page, totalPages)); }, [totalPages]);

    const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const showSkeleton = loading && danhSach.length === 0;

    return (
        <div className="km-container">
            {/* HEADER */}
            <div className="km-header">
                <div>
                    <div className="km-eyebrow">Quản lý / Khuyến mãi</div>
                    <h1 className="km-title">Quản lý Khuyến mãi</h1>
                    <p className="km-subtitle">Quản lý các chương trình giảm giá của cửa hàng.</p>
                </div>
                <button className="km-btn-add" onClick={openCreate}>
                    + Thêm chương trình
                </button>
            </div>

            {/* BỘ LỌC */}
            <div className="km-filters">
                <input
                    className="km-input-base km-filter-search"
                    placeholder="Tìm theo tên chương trình..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="km-input-base km-filter-select"
                    value={filterTrangThai}
                    onChange={(e) => setFilterTrangThai(e.target.value)}
                >
                    <option value="TAT_CA">Tất cả trạng thái</option>
                    <option value="HOAT_DONG">Hoạt động</option>
                    <option value="HET_HAN">Hết hạn</option>
                </select>
                <div className="km-date-group">
                    <span>Từ:</span>
                    <input type="date" className="km-date-input" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                    <span>|</span>
                    <span>Đến:</span>
                    <input type="date" className="km-date-input" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            {showSkeleton && (
                <div className="km-table-wrapper" style={{ padding: 20 }}>
                    <p style={{ color: "var(--text-muted)" }}>Đang tải dữ liệu...</p>
                </div>
            )}

            {!showSkeleton && error && danhSach.length === 0 && (
                <div className="km-table-wrapper" style={{ color: "var(--badge-danger-text)", padding: 20 }}>
                    <h3>Lỗi</h3><p>{error}</p>
                </div>
            )}

            {!showSkeleton && danhSach.length > 0 && (
                <div className="km-table-wrapper">
                    <div className="km-table-head">
                        <h2>Danh sách chương trình</h2>
                        <span>{filtered.length} chương trình</span>
                    </div>
                    <table className="km-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên chương trình</th>
                            <th>Loại giảm</th>
                            <th>Giá trị</th>
                            <th>Bắt đầu</th>
                            <th>Kết thúc</th>
                            <th>Áp dụng cho</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {currentItems.map((v) => (
                            <tr key={v.id}>
                                <td><strong>#{v.id}</strong></td>
                                <td><strong>{v.tenChuongTrinh}</strong></td>
                                <td>{v.loaiGiam === "PHAN_TRAM" ? "Phần trăm" : "Số tiền"}</td>
                                <td>{v.loaiGiam === "PHAN_TRAM" ? `${v.giaTriGiam}%` : formatGia(v.giaTriGiam)}</td>
                                <td>{formatDate(v.ngayBatDau)}</td>
                                <td>{formatDate(v.ngayKetThuc)}</td>
                                <td>
                                    <span className="km-badge km-badge-success">
                                        {(v.bienThes || []).length} biến thể
                                    </span>
                                </td>
                                <td>
                                    {(() => {
                                        const ttThuc = getTrangThaiThuc(v);
                                        const isActive = ttThuc === "HOAT_DONG";
                                        return <span className={`km-badge ${isActive ? 'km-badge-success' : 'km-badge-danger'}`}>{getTrangThaiLabel(ttThuc)}</span>;
                                    })()}
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                    <button className="km-btn-action km-btn-edit" onClick={() => openEdit(v)}>Sửa</button>
                                    <button className="km-btn-action km-btn-delete" onClick={() => handleDelete(v)}>Xóa</button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>Không có chương trình nào</td></tr>}

                        {/* Phân trang */}
                        <tr>
                            <td colSpan={9}>
                                {filtered.length > 0 && (
                                    <div className="km-pagination">
                                        <button className="km-page-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>←</button>
                                        <span style={{ padding: "0 10px", color: "var(--text-muted)" }}>Trang {currentPage} / {totalPages}</span>
                                        <button className="km-page-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>→</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL THÊM/SỬA */}
            {showModal && (
                <div className="km-modal-overlay" onClick={closeModal}>
                    <div className="km-modal-content" onClick={(e) => e.stopPropagation()}>

                        <h2 className="km-modal-title">{editing ? "Sửa chương trình" : "Thêm chương trình"}</h2>

                        {formError && <div className="km-error-box">{formError}</div>}

                        <div className="km-form-grid">

                            <div className="km-form-group km-form-full">
                                <label className="km-label">Tên chương trình *</label>
                                <input className="km-input-base" value={form.tenChuongTrinh} onChange={(e) => handleChange("tenChuongTrinh", e.target.value)} placeholder="VD: Giảm 50% giày Nike" />
                            </div>

                            <div className="km-form-group">
                                <label className="km-label">Loại giảm</label>
                                <select className="km-input-base" value={form.loaiGiam} onChange={(e) => handleChange("loaiGiam", e.target.value)}>
                                    <option value="PHAN_TRAM">Phần trăm (%)</option>
                                    <option value="SO_TIEN">Số tiền (đ)</option>
                                </select>
                            </div>

                            <div className="km-form-group">
                                <label className="km-label">Giá trị giảm *</label>
                                <input className="km-input-base" type="number" value={form.giaTriGiam} onChange={(e) => handleChange("giaTriGiam", e.target.value)} placeholder={form.loaiGiam === "PHAN_TRAM" ? "VD: 50 (Tối đa 60)" : "VD: 100000"} max={form.loaiGiam === "PHAN_TRAM" ? 60 : undefined} />
                            </div>

                            <div className="km-form-group">
                                <label className="km-label">Ngày bắt đầu *</label>
                                <input className="km-input-base" type="datetime-local" value={form.ngayBatDau} onChange={(e) => handleChange("ngayBatDau", e.target.value)} style={{ colorScheme: "light dark" }} />
                            </div>

                            <div className="km-form-group">
                                <label className="km-label">Ngày kết thúc *</label>
                                <input className="km-input-base" type="datetime-local" value={form.ngayKetThuc} onChange={(e) => handleChange("ngayKetThuc", e.target.value)} style={{ colorScheme: "light dark" }} />
                            </div>

                            {/* CHỌN SẢN PHẨM & BIẾN THỂ */}
                            <div className="km-form-group km-form-full" style={{ marginTop: "10px" }}>
                                <label className="km-label">
                                    Chọn sản phẩm & biến thể * <br/>
                                    <span>(Bấm vào ảnh sản phẩm để chọn size/màu)</span>
                                </label>

                                {/* Lưới sản phẩm */}
                                <div className="km-product-grid">
                                    {sanPhamList.map((sp) => {
                                        const isActive = String(activeSanPhamId) === String(sp.id);
                                        const hasSelectedVariant = (editing?.bienThes || []).some(bt => String(bt.sanPhamId) === String(sp.id)) || selectedBienTheIds.some(id => {
                                            const bt = bienTheList.find(b => b.id === id);
                                            return bt && String(bt.sanPhamId) === String(sp.id);
                                        });

                                        return (
                                            <div key={sp.id} className={`km-product-card ${isActive ? 'active' : ''}`} onClick={() => setActiveSanPhamId(sp.id)}>
                                                <div className="km-product-img-wrapper">
                                                    <img src={sp.hinhAnh || sp.anhDaiDien || "https://via.placeholder.com/150"} alt={sp.tenSanPham} className="km-product-img" />
                                                    {hasSelectedVariant && <div className="km-product-check">✓</div>}
                                                </div>
                                                <div className="km-product-info">
                                                    <div className="km-product-name">{sp.tenSanPham}</div>
                                                    <div className="km-product-brand">{sp.thuongHieu?.tenThuongHieu || "N/A"}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Khung chọn biến thể */}
                                {activeSanPhamId && (
                                    <div className="km-variant-section">
                                        <label className="km-label">
                                            Chọn size & màu cho sản phẩm này: ({selectedBienTheIds.length} đã chọn)
                                        </label>
                                        <div className="km-variant-container">
                                            {bienTheList.length === 0 && <span style={{color: "var(--text-muted)"}}>Sản phẩm này chưa có biến thể.</span>}
                                            {bienTheList.map((bt) => {
                                                const checked = selectedBienTheIds.includes(bt.id);
                                                return (
                                                    <div
                                                        key={bt.id}
                                                        className={`km-variant-pill ${checked ? 'active' : ''}`}
                                                        onClick={() => {
                                                            if (checked) setSelectedBienTheIds((p) => p.filter((x) => x !== bt.id));
                                                            else setSelectedBienTheIds((p) => [...p, bt.id]);
                                                        }}
                                                    >
                                                        <span className="km-variant-color">{bt.mauSac?.tenMau || "?"}</span>
                                                        <span className="km-variant-size">Size {bt.kichCo?.tenKichCo || "?"}</span>
                                                        {bt.maSku && <span className="km-variant-sku">({bt.maSku})</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="km-form-group">
                                <label className="km-label">Trạng thái</label>
                                <select className="km-input-base" value={form.trangThai} onChange={(e) => handleChange("trangThai", e.target.value)}>
                                    <option value="HOAT_DONG">Hoạt động</option>
                                    <option value="HET_HAN">Hết hạn</option>
                                </select>
                            </div>
                        </div>

                        <div className="km-modal-actions">
                            <button className="km-btn-cancel" onClick={closeModal} disabled={saving}>Hủy</button>
                            <button className="km-btn-save" onClick={handleSave} disabled={saving}>
                                {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}