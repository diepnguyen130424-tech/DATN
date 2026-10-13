/* eslint-disable react-hooks/set-state-in-effect, no-empty */
import { useEffect, useRef, useState } from "react";

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
    if (item?.trangThai === "NGUNG_HOAT_DONG") {
        return "NGUNG_HOAT_DONG";
    }

    const now = new Date();

    if (item?.ngayBatDau) {
        const bd = new Date(item.ngayBatDau);
        if (!Number.isNaN(bd.getTime()) && now < bd) {
            return "NGUNG_HOAT_DONG";
        }
    }

    if (item?.ngayKetThuc) {
        const kt = new Date(item.ngayKetThuc);
        if (!Number.isNaN(kt.getTime())) {
            const hetHan = new Date(kt);
            hetHan.setHours(23, 59, 59, 999);
            if (now > hetHan) return "NGUNG_HOAT_DONG";
        }
    }

    return "HOAT_DONG";
}

function getTrangThaiClass(trangThai) {
    if (trangThai === "HOAT_DONG") return "active";
    return "inactive";
}

function getTrangThaiLabel(trangThai) {
    if (trangThai === "HOAT_DONG") return "Hoạt động";
    return "Ngừng hoạt động";
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
        sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data, time: Date.now() })
        );
    } catch {}
}

const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
};

export default function AdminKhuyenMai() {
    const [danhSach, setDanhSach] = useState(() => readCache() || []);
    const [loading, setLoading] = useState(() => !readCache());
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // ⭐ Thương hiệu
    const [thuongHieuList, setThuongHieuList] = useState([]);
    const [thuongHieuId, setThuongHieuId] = useState("");

    // ⭐ Phạm vi áp dụng
    const [phamViApDung, setPhamViApDung] = useState("TAT_CA");

    // ⭐ Sản phẩm
    const [sanPhamList, setSanPhamList] = useState([]);
    const [filterThuongHieuId, setFilterThuongHieuId] = useState("");
    const [selectedSanPhamIds, setSelectedSanPhamIds] = useState([]);

    // ⭐ Biến thể
    const [bienTheList, setBienTheList] = useState([]);
    const [selectedBienTheIds, setSelectedBienTheIds] = useState([]);
    const [chonSanPhamChoBienThe, setChonSanPhamChoBienThe] = useState("");

    const [search, setSearch] = useState("");
    const [filterTrangThai, setFilterTrangThai] = useState("TAT_CA");
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
            const res = await fetch(`${API}/chuong-trinh-giam-gia`, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!isMountedRef.current) return;
            if (!res.ok) {
                throw new Error(
                    `Lỗi ${res.status}: Không tải được chương trình`
                );
            }

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
                    if (err.message === "Failed to fetch") {
                        msg = "Không kết nối được tới máy chủ.";
                    }
                    setError(msg);
                }
            }
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    };

    // ⭐ Load danh sách thương hiệu
    useEffect(() => {
        fetch(`${API}/thuong-hieu`)
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => setThuongHieuList(Array.isArray(d) ? d : []))
            .catch(() => setThuongHieuList([]));
    }, []);

    // ⭐ Load danh sách sản phẩm
    useEffect(() => {
        fetch(`${API}/san-pham`)
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => setSanPhamList(Array.isArray(d) ? d : []))
            .catch(() => setSanPhamList([]));
    }, []);

    // ⭐ Load biến thể khi chọn 1 sản phẩm
    useEffect(() => {
        if (!chonSanPhamChoBienThe) {
            setBienTheList([]);
            return;
        }
        fetch(`${API}/san-pham-chi-tiet/san-pham/${chonSanPhamChoBienThe}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => setBienTheList(Array.isArray(d) ? d : []))
            .catch(() => setBienTheList([]));
    }, [chonSanPhamChoBienThe]);

    useEffect(() => {
        loadDanhSach();
    }, []);

    const resetFormExtra = () => {
        setPhamViApDung("TAT_CA");
        setThuongHieuId("");
        setFilterThuongHieuId("");
        setSelectedSanPhamIds([]);
        setSelectedBienTheIds([]);
        setChonSanPhamChoBienThe("");
        setBienTheList([]);
    };

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        resetFormExtra();
        setFormError("");
        setShowModal(true);
    };

    // ⭐ Tìm thương hiệu của 1 SP từ sanPhamList
    const timThuongHieuCuaSanPham = (spId) => {
        const sp = sanPhamList.find((s) => s.id === spId);
        if (!sp) return "";
        const hangId = sp.thuongHieu?.id ?? sp.thuongHieuId;
        return hangId ? String(hangId) : "";
    };

    const openEdit = (v) => {
        setEditing(v);
        setForm({
            tenChuongTrinh: v.tenChuongTrinh || "",
            loaiGiam: v.loaiGiam || "PHAN_TRAM",
            giaTriGiam: v.giaTriGiam ?? "",
            ngayBatDau: v.ngayBatDau ? v.ngayBatDau.slice(0, 16) : "",
            ngayKetThuc: v.ngayKetThuc ? v.ngayKetThuc.slice(0, 16) : "",
            trangThai: v.trangThai || "HOAT_DONG",
        });

        const pv = v.phamViApDung || "TAT_CA";
        setPhamViApDung(pv);
        setThuongHieuId(v.thuongHieuId || "");

        // ⭐ Set danh sách đã chọn
        const spIds = (v.sanPhams || []).map((x) => x.sanPhamId);
        const btIds = (v.bienThes || []).map((x) => x.sanPhamChiTietId);
        setSelectedSanPhamIds(spIds);
        setSelectedBienTheIds(btIds);

        // ⭐ Nếu là BIEN_THE → set SP đang chọn → useEffect sẽ load lại biến thể
        if (pv === "BIEN_THE" && v.bienThes && v.bienThes.length > 0) {
            const spId = v.bienThes[0].sanPhamId;
            setChonSanPhamChoBienThe(spId);
            setFilterThuongHieuId(timThuongHieuCuaSanPham(spId));
        }
        // ⭐ Nếu là SAN_PHAM → lọc theo hãng của SP đầu tiên
        else if (pv === "SAN_PHAM" && v.sanPhams && v.sanPhams.length > 0) {
            const spId = v.sanPhams[0].sanPhamId;
            setFilterThuongHieuId(timThuongHieuCuaSanPham(spId));
            setChonSanPhamChoBienThe("");
        } else {
            setFilterThuongHieuId("");
            setChonSanPhamChoBienThe("");
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
        resetFormExtra();
        setFormError("");
    };

    const handleChange = (field, value) => {
        setForm((old) => ({ ...old, [field]: value }));
    };

    const validate = () => {
        if (!form.tenChuongTrinh.trim())
            return "Vui lòng nhập tên chương trình";
        if (!form.giaTriGiam || Number(form.giaTriGiam) <= 0)
            return "Giá trị giảm phải lớn hơn 0";
        if (form.loaiGiam === "PHAN_TRAM" && Number(form.giaTriGiam) > 100)
            return "Giảm % không được vượt quá 100";
        if (!form.ngayBatDau) return "Vui lòng chọn ngày bắt đầu";
        if (!form.ngayKetThuc) return "Vui lòng chọn ngày kết thúc";
        if (new Date(form.ngayBatDau) >= new Date(form.ngayKetThuc))
            return "Ngày kết thúc phải sau ngày bắt đầu";

        if (phamViApDung === "THUONG_HIEU" && !thuongHieuId)
            return "Vui lòng chọn thương hiệu áp dụng";
        if (phamViApDung === "SAN_PHAM" && selectedSanPhamIds.length === 0)
            return "Vui lòng chọn ít nhất 1 sản phẩm";
        if (phamViApDung === "BIEN_THE" && selectedBienTheIds.length === 0)
            return "Vui lòng chọn ít nhất 1 biến thể";
        return "";
    };

    const handleSave = async () => {
        const err = validate();
        if (err) {
            setFormError(err);
            return;
        }

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
                phamViApDung,
                thuongHieuId:
                    phamViApDung === "THUONG_HIEU" ? Number(thuongHieuId) : null,
                sanPhamIds:
                    phamViApDung === "SAN_PHAM" ? selectedSanPhamIds : null,
                bienTheIds:
                    phamViApDung === "BIEN_THE" ? selectedBienTheIds : null,
            };

            const url = editing
                ? `${API}/chuong-trinh-giam-gia/${editing.id}`
                : `${API}/chuong-trinh-giam-gia`;
            const method = editing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                let msg = "Lưu thất bại";
                try {
                    const j = JSON.parse(text);
                    msg = j.message || msg;
                } catch {
                    msg = text || msg;
                }
                throw new Error(msg);
            }

            const savedData = await res.json();

            let newList;
            if (editing) {
                newList = danhSach.map((item) =>
                    item.id === savedData.id ? savedData : item
                );
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
            const res = await fetch(`${API}/chuong-trinh-giam-gia/${v.id}`, {
                method: "DELETE",
            });
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
        const matchTT =
            filterTrangThai === "TAT_CA" || ttThuc === filterTrangThai;

        return matchKw && matchTT;
    });

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / itemsPerPage)
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterTrangThai]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const currentItems = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // ⭐ Danh sách SP đã lọc theo hãng
    const sanPhamFiltered = filterThuongHieuId
        ? sanPhamList.filter((sp) => {
            const spHangId = sp.thuongHieu?.id ?? sp.thuongHieuId;
            return String(spHangId) === String(filterThuongHieuId);
        })
        : sanPhamList;

    const showSkeleton = loading && danhSach.length === 0;

    return (
        <div className="admin-voucher">
            <div className="admin-page-heading">
                <div>
                    <div className="admin-eyebrow">Quản lý / Khuyến mãi</div>
                    <h1>Quản lý Khuyến mãi</h1>
                    <p>Quản lý các chương trình giảm giá của cửa hàng.</p>
                </div>
                <button className="admin-date-button" onClick={openCreate}>
                    + Thêm chương trình
                </button>
            </div>

            <div className="admin-filters">
                <input
                    placeholder="Tìm theo tên chương trình..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    value={filterTrangThai}
                    onChange={(e) => setFilterTrangThai(e.target.value)}
                >
                    <option value="TAT_CA">Tất cả trạng thái</option>
                    <option value="HOAT_DONG">Hoạt động</option>
                    <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                </select>
            </div>

            {showSkeleton && (
                <div className="admin-table-scroll">
                    <table className="admin-table">
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
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i} className="skeleton-row">
                                {Array.from({ length: 9 }).map((_, j) => (
                                    <td key={j}>
                                        <div className="skeleton-bar" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!showSkeleton && error && danhSach.length === 0 && (
                <div className="admin-error-box">
                    <div className="icon">⚠️</div>
                    <h3>Không tải được dữ liệu</h3>
                    <p>{error}</p>
                </div>
            )}

            {!showSkeleton && danhSach.length > 0 && (
                <div className="admin-table-scroll">
                    <div className="admin-table-head">
                        <h2>Danh sách chương trình</h2>
                        <span>{filtered.length} chương trình</span>
                    </div>
                    <table className="admin-table">
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
                                <td>
                                    <strong>#{v.id}</strong>
                                </td>
                                <td>
                                    <strong>{v.tenChuongTrinh}</strong>
                                </td>
                                <td>
                                    {v.loaiGiam === "PHAN_TRAM"
                                        ? "Phần trăm"
                                        : "Số tiền"}
                                </td>
                                <td>
                                    {v.loaiGiam === "PHAN_TRAM"
                                        ? `${v.giaTriGiam}%`
                                        : formatGia(v.giaTriGiam)}
                                </td>
                                <td>{formatDate(v.ngayBatDau)}</td>
                                <td>{formatDate(v.ngayKetThuc)}</td>

                                <td>
                                    {(() => {
                                        const pv = v.phamViApDung || "TAT_CA";

                                        if (pv === "THUONG_HIEU" && v.tenThuongHieu) {
                                            return (
                                                <span style={{
                                                    background: "#fff3f0",
                                                    color: "#e53935",
                                                    padding: "4px 10px",
                                                    borderRadius: 12,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    whiteSpace: "nowrap",
                                                }}>
                                                    {v.tenThuongHieu}
                                                </span>
                                            );
                                        }

                                        if (pv === "SAN_PHAM") {
                                            const list = v.sanPhams || [];
                                            return (
                                                <span style={{ fontSize: 12 }}>
                                                    {list.length} SP:{" "}
                                                    {list.slice(0, 2).map((x) => x.tenSanPham).join(", ")}
                                                    {list.length > 2 && ` +${list.length - 2}`}
                                                </span>
                                            );
                                        }

                                        if (pv === "BIEN_THE") {
                                            return (
                                                <span style={{
                                                    background: "#e8f5e9",
                                                    color: "#2e7d32",
                                                    padding: "4px 10px",
                                                    borderRadius: 12,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                }}>
                                                    {(v.bienThes || []).length} biến thể
                                                </span>
                                            );
                                        }

                                        return (
                                            <span style={{ color: "#888", fontSize: 12 }}>
                                                Tất cả SP
                                            </span>
                                        );
                                    })()}
                                </td>

                                <td>
                                    {(() => {
                                        const ttThuc = getTrangThaiThuc(v);
                                        return (
                                            <span className={`order-status ${getTrangThaiClass(ttThuc)}`}>
                                                {getTrangThaiLabel(ttThuc)}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                    <button
                                        type="button"
                                        className="btn-edit"
                                        onClick={() => openEdit(v)}
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-delete"
                                        onClick={() => handleDelete(v)}
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={9} className="admin-empty">
                                    Không có chương trình nào
                                </td>
                            </tr>
                        )}

                        <tr>
                            <td
                                colSpan={9}
                                style={{
                                    textAlign: "center",
                                    padding: "12px"
                                }}
                            >
                                {filtered.length > 0 && (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: "8px"
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.max(1, page - 1)
                                                )
                                            }
                                            disabled={currentPage === 1}
                                            style={{
                                                width: 56,
                                                height: 56,
                                                border: "1px solid #ddd",
                                                borderRadius: 10,
                                                background: "#fff",
                                                fontSize: 22,
                                                color: currentPage === 1 ? "#ccc" : "#222",
                                                cursor: currentPage === 1 ? "default" : "pointer"
                                            }}
                                        >
                                            ←
                                        </button>

                                        {Array.from(
                                            { length: totalPages },
                                            (_, index) => index + 1
                                        ).map((page) => (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() => setCurrentPage(page)}
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    border: currentPage === page
                                                        ? "1px solid #d94b3f"
                                                        : "1px solid #ddd",
                                                    borderRadius: 10,
                                                    background: currentPage === page
                                                        ? "#d94b3f"
                                                        : "#fff",
                                                    color: currentPage === page ? "#fff" : "#222",
                                                    fontWeight: currentPage === page ? 700 : 500,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.min(totalPages, page + 1)
                                                )
                                            }
                                            disabled={currentPage === totalPages}
                                            style={{
                                                width: 56,
                                                height: 56,
                                                border: "1px solid #ddd",
                                                borderRadius: 10,
                                                background: "#fff",
                                                fontSize: 22,
                                                color: currentPage === totalPages ? "#ccc" : "#222",
                                                cursor: currentPage === totalPages ? "default" : "pointer"
                                            }}
                                        >
                                            →
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div
                    onClick={closeModal}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                        padding: 20,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: 28,
                            width: "100%",
                            maxWidth: 620,
                            maxHeight: "90vh",
                            overflowY: "auto",
                        }}
                    >
                        <h2 style={{ marginTop: 0 }}>
                            {editing ? "Sửa chương trình" : "Thêm chương trình"}
                        </h2>

                        {formError && (
                            <div
                                style={{
                                    background: "#fdecea",
                                    color: "#c0392b",
                                    padding: "10px 14px",
                                    borderRadius: 8,
                                    marginBottom: 16,
                                    fontSize: 13,
                                }}
                            >
                                {formError}
                            </div>
                        )}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 14,
                            }}
                        >
                            {editing && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={labelStyle}>ID</label>
                                    <input
                                        className="price-input"
                                        type="text"
                                        value={editing.id || ""}
                                        disabled
                                        style={{
                                            background: "#f5f5f5",
                                            color: "#666",
                                            cursor: "not-allowed",
                                        }}
                                    />
                                </div>
                            )}

                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>
                                    Tên chương trình *
                                </label>
                                <input
                                    className="price-input"
                                    value={form.tenChuongTrinh}
                                    onChange={(e) =>
                                        handleChange(
                                            "tenChuongTrinh",
                                            e.target.value
                                        )
                                    }
                                    placeholder="VD: Giảm 50% giày Nike"
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Loại giảm</label>
                                <select
                                    className="price-input"
                                    value={form.loaiGiam}
                                    onChange={(e) =>
                                        handleChange("loaiGiam", e.target.value)
                                    }
                                >
                                    <option value="PHAN_TRAM">
                                        Phần trăm (%)
                                    </option>
                                    <option value="SO_TIEN">Số tiền (đ)</option>
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>
                                    Giá trị giảm *
                                </label>
                                <input
                                    className="price-input"
                                    type="number"
                                    value={form.giaTriGiam}
                                    onChange={(e) =>
                                        handleChange(
                                            "giaTriGiam",
                                            e.target.value
                                        )
                                    }
                                    placeholder={
                                        form.loaiGiam === "PHAN_TRAM"
                                            ? "VD: 50"
                                            : "VD: 100000"
                                    }
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>
                                    Ngày bắt đầu *
                                </label>
                                <input
                                    className="price-input"
                                    type="datetime-local"
                                    value={form.ngayBatDau}
                                    onChange={(e) =>
                                        handleChange(
                                            "ngayBatDau",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>
                                    Ngày kết thúc *
                                </label>
                                <input
                                    className="price-input"
                                    type="datetime-local"
                                    value={form.ngayKetThuc}
                                    onChange={(e) =>
                                        handleChange(
                                            "ngayKetThuc",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            {/* ⭐ ÁP DỤNG CHO */}
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>Áp dụng cho</label>
                                <select
                                    className="price-input"
                                    value={phamViApDung}
                                    onChange={(e) => {
                                        setPhamViApDung(e.target.value);
                                        setThuongHieuId("");
                                        setFilterThuongHieuId("");
                                        setSelectedSanPhamIds([]);
                                        setSelectedBienTheIds([]);
                                        setChonSanPhamChoBienThe("");
                                        setBienTheList([]);
                                    }}
                                >
                                    <option value="TAT_CA">Tất cả sản phẩm</option>
                                    <option value="THUONG_HIEU">Theo thương hiệu</option>
                                    <option value="SAN_PHAM">Theo sản phẩm cụ thể</option>
                                    <option value="BIEN_THE">Theo size & màu (biến thể)</option>
                                </select>
                            </div>

                            {/* ⭐ CHỌN THƯƠNG HIỆU */}
                            {phamViApDung === "THUONG_HIEU" && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={labelStyle}>
                                        Chọn thương hiệu *
                                    </label>
                                    <select
                                        className="price-input"
                                        value={thuongHieuId}
                                        onChange={(e) => setThuongHieuId(e.target.value)}
                                    >
                                        <option value="">-- Chọn thương hiệu --</option>
                                        {thuongHieuList.map((th) => (
                                            <option key={th.id} value={th.id}>
                                                {th.tenThuongHieu}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* ⭐ SAN_PHAM */}
                            {phamViApDung === "SAN_PHAM" && (
                                <>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={labelStyle}>
                                            Lọc theo thương hiệu (tuỳ chọn)
                                        </label>
                                        <select
                                            className="price-input"
                                            value={filterThuongHieuId}
                                            onChange={(e) => {
                                                setFilterThuongHieuId(e.target.value);
                                                setSelectedSanPhamIds([]);
                                            }}
                                        >
                                            <option value="">-- Tất cả thương hiệu --</option>
                                            {thuongHieuList.map((th) => (
                                                <option key={th.id} value={th.id}>
                                                    {th.tenThuongHieu}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={labelStyle}>
                                            Chọn sản phẩm * ({selectedSanPhamIds.length} đã chọn)
                                        </label>
                                        <div style={{
                                            maxHeight: 220,
                                            overflowY: "auto",
                                            border: "1px solid #ddd",
                                            borderRadius: 8,
                                            padding: 10,
                                        }}>
                                            {sanPhamFiltered.length === 0 && (
                                                <div style={{ color: "#999", fontSize: 13 }}>
                                                    Không có sản phẩm nào.
                                                </div>
                                            )}
                                            {sanPhamFiltered.map((sp) => {
                                                const checked = selectedSanPhamIds.includes(sp.id);
                                                return (
                                                    <label
                                                        key={sp.id}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 8,
                                                            padding: "6px 4px",
                                                            fontSize: 13,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={(e) => {
                                                                if (e.target.checked)
                                                                    setSelectedSanPhamIds((p) => [...p, sp.id]);
                                                                else
                                                                    setSelectedSanPhamIds((p) =>
                                                                        p.filter((x) => x !== sp.id)
                                                                    );
                                                            }}
                                                        />
                                                        <span>
                                                            {sp.tenSanPham}
                                                            {sp.thuongHieu?.tenThuongHieu && (
                                                                <span style={{ color: "#999", fontSize: 11 }}>
                                                                    {" "}({sp.thuongHieu.tenThuongHieu})
                                                                </span>
                                                            )}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ⭐ BIEN_THE */}
                            {phamViApDung === "BIEN_THE" && (
                                <>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={labelStyle}>
                                            Bước 1: Lọc theo thương hiệu (tuỳ chọn)
                                        </label>
                                        <select
                                            className="price-input"
                                            value={filterThuongHieuId}
                                            onChange={(e) => {
                                                setFilterThuongHieuId(e.target.value);
                                                setChonSanPhamChoBienThe("");
                                                setBienTheList([]);
                                                setSelectedBienTheIds([]);
                                            }}
                                        >
                                            <option value="">-- Tất cả thương hiệu --</option>
                                            {thuongHieuList.map((th) => (
                                                <option key={th.id} value={th.id}>
                                                    {th.tenThuongHieu}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={labelStyle}>
                                            Bước 2: Chọn sản phẩm *
                                        </label>
                                        <select
                                            className="price-input"
                                            value={chonSanPhamChoBienThe}
                                            onChange={(e) => {
                                                setChonSanPhamChoBienThe(e.target.value);
                                                setSelectedBienTheIds([]);
                                            }}
                                        >
                                            <option value="">-- Chọn sản phẩm --</option>
                                            {sanPhamFiltered.map((sp) => (
                                                <option key={sp.id} value={sp.id}>
                                                    {sp.tenSanPham}
                                                </option>
                                            ))}
                                        </select>
                                        {sanPhamFiltered.length === 0 && (
                                            <div style={{ color: "#999", fontSize: 12, marginTop: 6 }}>
                                                Không có sản phẩm nào thuộc hãng đã lọc.
                                            </div>
                                        )}
                                    </div>

                                    {chonSanPhamChoBienThe && (
                                        <div style={{ gridColumn: "1 / -1" }}>
                                            <label style={labelStyle}>
                                                Bước 3: Chọn size & màu * ({selectedBienTheIds.length} đã chọn)
                                            </label>
                                            <div style={{
                                                maxHeight: 240,
                                                overflowY: "auto",
                                                border: "1px solid #ddd",
                                                borderRadius: 8,
                                                padding: 10,
                                            }}>
                                                {bienTheList.length === 0 && (
                                                    <div style={{ color: "#999", fontSize: 13 }}>
                                                        Sản phẩm này chưa có biến thể.
                                                    </div>
                                                )}
                                                {bienTheList.map((bt) => {
                                                    const checked = selectedBienTheIds.includes(bt.id);
                                                    return (
                                                        <label
                                                            key={bt.id}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 8,
                                                                padding: "6px 4px",
                                                                fontSize: 13,
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={(e) => {
                                                                    if (e.target.checked)
                                                                        setSelectedBienTheIds((p) => [...p, bt.id]);
                                                                    else
                                                                        setSelectedBienTheIds((p) =>
                                                                            p.filter((x) => x !== bt.id)
                                                                        );
                                                                }}
                                                            />
                                                            <span>
                                                                {bt.mauSac?.tenMau || "?"}
                                                                {" — Size "}
                                                                {bt.kichCo?.tenKichCo || "?"}
                                                                {bt.maSku && (
                                                                    <span style={{ color: "#999" }}>
                                                                        {" "}({bt.maSku})
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div>
                                <label style={labelStyle}>Trạng thái</label>
                                <select
                                    className="price-input"
                                    value={form.trangThai}
                                    onChange={(e) =>
                                        handleChange(
                                            "trangThai",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="HOAT_DONG">
                                        Hoạt động
                                    </option>
                                    <option value="NGUNG_HOAT_DONG">
                                        Ngừng hoạt động
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 10,
                                marginTop: 24,
                            }}
                        >
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                style={{
                                    padding: "10px 20px",
                                    border: "1px solid #ddd",
                                    borderRadius: 8,
                                    background: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    padding: "10px 20px",
                                    border: "none",
                                    borderRadius: 8,
                                    background: "#111",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontWeight: 700,
                                }}
                            >
                                {saving
                                    ? "Đang lưu..."
                                    : editing
                                        ? "Cập nhật"
                                        : "Tạo mới"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}