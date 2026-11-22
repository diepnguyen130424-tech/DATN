/* eslint-disable react-hooks/set-state-in-effect, no-empty */
import { useEffect, useMemo, useRef, useState } from "react";
import "./AdminKhuyenMai.css";

const API = "http://localhost:8080/api";
const CACHE_KEY = "admin_khuyen_mai_cache";
const CACHE_TTL = 60 * 1000;

const EMPTY_FORM = {
    tenChuongTrinh: "",
    loaiGiam: "PHAN_TRAM",
    giaTriGiam: "",
    giamToiDa: "",
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
    try { return new Date(str).toLocaleDateString("vi-VN"); } catch { return str; }
}

function getTrangThaiThuc(item) {
    if (item?.trangThai === "HET_HAN" || item?.trangThai === "NGUNG_HOAT_DONG") return "HET_HAN";
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

// Bỏ dấu tiếng Việt để tìm kiếm "giay" vẫn ra "Giày"
function boDau(str) {
    return String(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");
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
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, time: Date.now() })); } catch {}
}

function SortIcon({ active, direction }) {
    if (!active) {
        return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    }
    return <span style={{ marginLeft: 4 }}>{direction === "asc" ? "↑" : "↓"}</span>;
}

export default function AdminKhuyenMai() {
    const [danhSach, setDanhSach] = useState(() => readCache() || []);
    const [loading, setLoading] = useState(() => !readCache());
    const [error, setError] = useState("");

    const [view, setView] = useState("list"); // "list" | "form"
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [sanPhamList, setSanPhamList] = useState([]);
    const [activeSanPhamIds, setActiveSanPhamIds] = useState([]);
    const [bienTheTheoSanPham, setBienTheTheoSanPham] = useState({});
    const [selectedBienTheIds, setSelectedBienTheIds] = useState([]);

    // Tìm kiếm / lọc sản phẩm trong trang thêm - sửa
    const [spSearch, setSpSearch] = useState("");
    const [spBrand, setSpBrand] = useState("TAT_CA");
    const [onlySelected, setOnlySelected] = useState(false);

    const [search, setSearch] = useState("");
    const [filterTrangThai, setFilterTrangThai] = useState("TAT_CA");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    // ⭐ STATE CHO SẮP XẾP
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const abortRef = useRef(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; if (abortRef.current) abortRef.current.abort(); };
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
        fetch(`${API}/san-pham`).then((r) => (r.ok ? r.json() : [])).then((d) => setSanPhamList(Array.isArray(d) ? d : [])).catch(() => setSanPhamList([]));
    }, []);

    useEffect(() => {
        if (activeSanPhamIds.length === 0) {
            if (Object.keys(bienTheTheoSanPham).length > 0) {
                setBienTheTheoSanPham({});
            }
            return;
        }

        let cancelled = false;

        const fetchVariants = async () => {
            const missingIds = activeSanPhamIds.filter(
                (id) => !bienTheTheoSanPham[id]
            );

            if (missingIds.length === 0) return;

            const results = {};

            await Promise.all(
                missingIds.map(async (id) => {
                    try {
                        const res = await fetch(`${API}/san-pham-chi-tiet/san-pham/${id}`);
                        results[id] = res.ok ? await res.json() : [];
                    } catch {
                        results[id] = [];
                    }
                })
            );

            if (!cancelled) {
                setBienTheTheoSanPham((prev) => ({ ...prev, ...results }));
            }
        };

        void fetchVariants();

        return () => {
            cancelled = true;
        };
    }, [activeSanPhamIds, bienTheTheoSanPham]);

    useEffect(() => { void loadDanhSach(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setActiveSanPhamIds([]);
        setSelectedBienTheIds([]);
        setBienTheTheoSanPham({});
        setFormError("");
        resetProductFilters();
        setView("form");
        window.scrollTo({ top: 0 });
    };

    const openEdit = (v) => {
        setEditing(v);
        setForm({
            tenChuongTrinh: v.tenChuongTrinh || "",
            loaiGiam: v.loaiGiam || "PHAN_TRAM",
            giaTriGiam: v.giaTriGiam ?? "",
            giamToiDa: v.giamToiDa ?? "",
            ngayBatDau: v.ngayBatDau ? v.ngayBatDau.slice(0, 16) : "",
            ngayKetThuc: v.ngayKetThuc ? v.ngayKetThuc.slice(0, 16) : "",
            trangThai: (v.trangThai === "HET_HAN" || v.trangThai === "NGUNG_HOAT_DONG") ? "HET_HAN" : (v.trangThai || "HOAT_DONG"),
        });

        const btIds = (v.bienThes || []).map((x) => x.sanPhamChiTietId);
        setSelectedBienTheIds(btIds);

        const uniqueSpIds = [...new Set((v.bienThes || []).map(x => String(x.sanPhamId)))];
        setActiveSanPhamIds(uniqueSpIds);
        setBienTheTheoSanPham({});

        setFormError("");
        resetProductFilters();
        setView("form");
        window.scrollTo({ top: 0 });
    };

    const resetProductFilters = () => {
        setSpSearch("");
        setSpBrand("TAT_CA");
        setOnlySelected(false);
    };

    const closeModal = () => {
        if (saving) return;
        setView("list");
        setEditing(null);
        setForm(EMPTY_FORM);
        setActiveSanPhamIds([]);
        setSelectedBienTheIds([]);
        setBienTheTheoSanPham({});
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
                giamToiDa: form.loaiGiam === "PHAN_TRAM" ? (form.giamToiDa ? Number(form.giamToiDa) : null) : null,
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

    // ===== Chọn sản phẩm / biến thể =====
    const toggleSanPham = (id) => {
        const key = String(id);
        const dangChon = activeSanPhamIds.includes(key);
        if (dangChon) {
            // Bỏ chọn sản phẩm => bỏ luôn các biến thể của nó để không bị "chọn ngầm"
            const ids = (bienTheTheoSanPham[key] || []).map((b) => b.id);
            if (ids.length) setSelectedBienTheIds((p) => p.filter((x) => !ids.includes(x)));
            setActiveSanPhamIds((p) => p.filter((x) => x !== key));
        } else {
            setActiveSanPhamIds((p) => [...p, key]);
        }
    };

    const selectAllVisible = () => {
        const ids = filteredSanPham.map((s) => String(s.id));
        setActiveSanPhamIds((p) => [...new Set([...p, ...ids])]);
    };

    const clearAllSelected = () => {
        setActiveSanPhamIds([]);
        setSelectedBienTheIds([]);
    };

    const toggleBienThe = (id) => {
        setSelectedBienTheIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    };

    const setAllVariantsOf = (variants, checked) => {
        const ids = variants.map((v) => v.id);
        setSelectedBienTheIds((p) =>
            checked ? [...new Set([...p, ...ids])] : p.filter((x) => !ids.includes(x))
        );
    };

    // ⭐ HÀM XỬ LÝ CLICK SẮP XẾP
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // ⭐ LOGIC FILTER VÀ SẮP XẾP
    const filtered = danhSach
        .filter((v) => {
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
        })
        // ⭐ SẮP XẾP THEO CẤU HÌNH (MẶC ĐỊNH ID GIẢM DẦN)
        .sort((a, b) => {
            if (sortConfig.key === 'id') {
                return sortConfig.direction === 'asc' ? a.id - b.id : b.id - a.id;
            }
            if (sortConfig.key === 'tenChuongTrinh') {
                const valA = a.tenChuongTrinh || "";
                const valB = b.tenChuongTrinh || "";
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            }
            return 0;
        });

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

    useEffect(() => { setCurrentPage(1); }, [search, filterTrangThai, filterStartDate, filterEndDate, sortConfig]);
    useEffect(() => { setCurrentPage((page) => Math.min(page, totalPages)); }, [totalPages]);

    const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const showSkeleton = loading && danhSach.length === 0;

    // ===== Danh sách sản phẩm sau khi tìm kiếm / lọc =====
    const brandOptions = useMemo(
        () => [...new Set(sanPhamList.map((sp) => sp.thuongHieu?.tenThuongHieu).filter(Boolean))].sort(),
        [sanPhamList]
    );

    const filteredSanPham = useMemo(() => {
        const kw = boDau(spSearch.trim());
        return sanPhamList.filter((sp) => {
            const brand = sp.thuongHieu?.tenThuongHieu || "";
            if (spBrand !== "TAT_CA" && brand !== spBrand) return false;
            if (onlySelected && !activeSanPhamIds.includes(String(sp.id))) return false;
            if (!kw) return true;
            return boDau(`${sp.tenSanPham || ""} ${brand} ${sp.maSanPham || ""}`).includes(kw);
        });
    }, [sanPhamList, spSearch, spBrand, onlySelected, activeSanPhamIds]);

    // ===== TRANG THÊM / SỬA (thay cho modal) =====
    if (view === "form") {
        return (
            <div className="km-container km-form-page">
                <div className="km-page-top">
                    <button className="km-btn-back" onClick={closeModal} disabled={saving}>
                        ← Quay lại danh sách
                    </button>
                    <div className="km-eyebrow">
                        Quản lý / Khuyến mãi / {editing ? "Sửa" : "Thêm mới"}
                    </div>
                    <h1 className="km-title">
                        {editing ? `Sửa chương trình #${editing.id}` : "Thêm chương trình khuyến mãi"}
                    </h1>
                </div>

                <div className="km-form-layout">
                    {/* ----- CỘT TRÁI: THÔNG TIN CHƯƠNG TRÌNH ----- */}
                    <section className="km-panel km-panel-info">
                        <h2 className="km-panel-title">Thông tin chương trình</h2>

                        <div className="km-form-stack">
                            <div className="km-form-group">
                                <label className="km-label">Tên chương trình *</label>
                                <input className="km-input-base" value={form.tenChuongTrinh} onChange={(e) => handleChange("tenChuongTrinh", e.target.value)} placeholder="VD: Giảm 50% giày Nike" />
                            </div>

                            <div className="km-form-row">
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
                            </div>

                            {form.loaiGiam === "PHAN_TRAM" && (
                                <div className="km-form-group">
                                    <label className="km-label">Số tiền giảm tối đa (đ) <span>(để trống nếu không giới hạn)</span></label>
                                    <input className="km-input-base" type="number" value={form.giamToiDa} onChange={(e) => handleChange("giamToiDa", e.target.value)} placeholder="VD: 200000" />
                                </div>
                            )}

                            <div className="km-form-group">
                                <label className="km-label">Ngày bắt đầu *</label>
                                <input className="km-input-base" type="datetime-local" value={form.ngayBatDau} onChange={(e) => handleChange("ngayBatDau", e.target.value)} style={{ colorScheme: "light dark" }} />
                            </div>

                            <div className="km-form-group">
                                <label className="km-label">Ngày kết thúc *</label>
                                <input className="km-input-base" type="datetime-local" value={form.ngayKetThuc} onChange={(e) => handleChange("ngayKetThuc", e.target.value)} style={{ colorScheme: "light dark" }} />
                            </div>

                            <div className="km-form-group">
                                <label className="km-label">Trạng thái</label>
                                <select className="km-input-base" value={form.trangThai} onChange={(e) => handleChange("trangThai", e.target.value)}>
                                    <option value="HOAT_DONG">Hoạt động</option>
                                    <option value="HET_HAN">Hết hạn</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* ----- CỘT PHẢI: SẢN PHẨM & BIẾN THỂ ----- */}
                    <section className="km-panel km-panel-products">
                        <div className="km-panel-head">
                            <div>
                                <h2 className="km-panel-title">Sản phẩm & biến thể *</h2>
                                <p className="km-hint">Bấm vào sản phẩm để mở danh sách biến thể, sau đó chọn biến thể được giảm giá.</p>
                            </div>
                            <div className="km-selected-summary">
                                <strong>{activeSanPhamIds.length}</strong> sản phẩm ·{" "}
                                <strong>{selectedBienTheIds.length}</strong> biến thể
                            </div>
                        </div>

                        {/* THANH TÌM KIẾM */}
                        <div className="km-product-toolbar">
                            <div className="km-search-wrap">
                                <input
                                    className="km-input-base km-search-input"
                                    type="search"
                                    placeholder="Tìm sản phẩm theo tên, thương hiệu, mã..."
                                    value={spSearch}
                                    onChange={(e) => setSpSearch(e.target.value)}
                                />
                                {spSearch && (
                                    <button className="km-search-clear" onClick={() => setSpSearch("")} aria-label="Xóa tìm kiếm">✕</button>
                                )}
                            </div>
                            <select className="km-input-base km-toolbar-select" value={spBrand} onChange={(e) => setSpBrand(e.target.value)}>
                                <option value="TAT_CA">Tất cả thương hiệu</option>
                                {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <label className="km-check-inline">
                                <input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} />
                                Chỉ hiện đã chọn
                            </label>
                        </div>

                        <div className="km-product-actions">
                            <span className="km-hint">Hiển thị {filteredSanPham.length} / {sanPhamList.length} sản phẩm</span>
                            <div>
                                <button type="button" className="km-link-btn" onClick={selectAllVisible} disabled={filteredSanPham.length === 0}>
                                    Chọn tất cả đang hiển thị
                                </button>
                                <button type="button" className="km-link-btn km-link-danger" onClick={clearAllSelected} disabled={activeSanPhamIds.length === 0}>
                                    Bỏ chọn tất cả
                                </button>
                            </div>
                        </div>

                        {/* LƯỚI SẢN PHẨM */}
                        <div className="km-product-grid">
                            {filteredSanPham.map((sp) => {
                                const key = String(sp.id);
                                const isActive = activeSanPhamIds.includes(key);
                                const variants = bienTheTheoSanPham[key] || [];
                                const soChon = variants.filter((b) => selectedBienTheIds.includes(b.id)).length;
                                const img = sp.hinhAnh || sp.anhDaiDien;

                                return (
                                    <div
                                        key={sp.id}
                                        className={`km-product-card ${isActive ? "active" : ""}`}
                                        onClick={() => toggleSanPham(sp.id)}
                                    >
                                        <div className="km-product-img-wrapper">
                                            {img ? (
                                                <img
                                                    src={img}
                                                    alt={sp.tenSanPham}
                                                    className="km-product-img"
                                                    loading="lazy"
                                                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                />
                                            ) : (
                                                <div className="km-product-noimg">Chưa có ảnh</div>
                                            )}
                                            {soChon > 0 && <div className="km-product-check">{soChon}</div>}
                                        </div>
                                        <div className="km-product-info">
                                            <div className="km-product-name" title={sp.tenSanPham}>{sp.tenSanPham}</div>
                                            <div className="km-product-brand">{sp.thuongHieu?.tenThuongHieu || "N/A"}</div>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredSanPham.length === 0 && (
                                <div className="km-empty-products">
                                    {sanPhamList.length === 0
                                        ? "Chưa có sản phẩm nào."
                                        : "Không tìm thấy sản phẩm phù hợp. Thử đổi từ khóa hoặc bỏ lọc thương hiệu."}
                                </div>
                            )}
                        </div>

                        {/* BIẾN THỂ THEO TỪNG SẢN PHẨM */}
                        {activeSanPhamIds.length > 0 && (
                            <div className="km-variant-wrapper">
                                <h3 className="km-subsection-title">Chọn biến thể</h3>
                                {activeSanPhamIds.map((spId) => {
                                    const sp = sanPhamList.find((s) => String(s.id) === spId);
                                    const variants = bienTheTheoSanPham[spId];
                                    if (!sp) return null;

                                    const soLuongDaChon = variants
                                        ? variants.filter((v) => selectedBienTheIds.includes(v.id)).length
                                        : 0;
                                    const tatCaDaChon = !!variants && variants.length > 0 && soLuongDaChon === variants.length;

                                    return (
                                        <div key={spId} className="km-variant-group">
                                            <div className="km-variant-group-header">
                                                <span className="km-variant-group-title">{sp.tenSanPham}</span>
                                                <div className="km-variant-group-tools">
                                                    {variants && variants.length > 0 && (
                                                        <button type="button" className="km-link-btn" onClick={() => setAllVariantsOf(variants, !tatCaDaChon)}>
                                                            {tatCaDaChon ? "Bỏ chọn hết" : "Chọn hết"}
                                                        </button>
                                                    )}
                                                    <span className="km-variant-group-count">{soLuongDaChon} đã chọn</span>
                                                </div>
                                            </div>

                                            <div className="km-variant-container">
                                                {!variants ? (
                                                    <span className="km-hint">Đang tải biến thể...</span>
                                                ) : variants.length === 0 ? (
                                                    <span className="km-hint">Sản phẩm này chưa có biến thể.</span>
                                                ) : (
                                                    variants.map((bt) => {
                                                        const checked = selectedBienTheIds.includes(bt.id);
                                                        return (
                                                            <div
                                                                key={bt.id}
                                                                className={`km-variant-pill ${checked ? "active" : ""}`}
                                                                onClick={() => toggleBienThe(bt.id)}
                                                            >
                                                                <span className="km-variant-color">{bt.mauSac?.tenMau || "?"}</span>
                                                                <span className="km-variant-size">Size {bt.kichCo?.tenKichCo || "?"}</span>
                                                                {bt.maSku && <span className="km-variant-sku">({bt.maSku})</span>}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                {/* THANH THAO TÁC DÍNH Ở CUỐI TRANG */}
                <div className="km-action-bar">
                    <div className="km-action-bar-inner">
                        <div className="km-action-error">{formError}</div>
                        <button className="km-btn-cancel" onClick={closeModal} disabled={saving}>Hủy</button>
                        <button className="km-btn-save" onClick={handleSave} disabled={saving}>
                            {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                <input className="km-input-base km-filter-search" placeholder="Tìm theo tên chương trình..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className="km-input-base km-filter-select" value={filterTrangThai} onChange={(e) => setFilterTrangThai(e.target.value)}>
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
            {showSkeleton && <div className="km-table-wrapper" style={{ padding: 20 }}><p style={{ color: "var(--text-muted)" }}>Đang tải dữ liệu...</p></div>}

            {!showSkeleton && error && danhSach.length === 0 && (
                <div className="km-table-wrapper" style={{ color: "var(--badge-danger-text)", padding: 20 }}><h3>Lỗi</h3><p>{error}</p></div>
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
                            {/* ⭐ CỘT ID CÓ THỂ CLICK ĐỂ SẮP XẾP */}
                            <th
                                onClick={() => requestSort('id')}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click để sắp xếp theo ID"
                            >
                                ID <SortIcon active={sortConfig.key === "id"} direction={sortConfig.direction} />
                            </th>

                            {/* ⭐ CỘT TÊN CÓ THỂ CLICK ĐỂ SẮP XẾP */}
                            <th
                                onClick={() => requestSort('tenChuongTrinh')}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click để sắp xếp theo Tên"
                            >
                                Tên chương trình <SortIcon active={sortConfig.key === "tenChuongTrinh"} direction={sortConfig.direction} />
                            </th>

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
                                <td><span className="km-badge km-badge-success">{(v.bienThes || []).length} biến thể</span></td>
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
        </div>
    );
}