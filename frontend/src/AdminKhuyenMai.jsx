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

export default function AdminKhuyenMai() {
    const [danhSach, setDanhSach] = useState(() => readCache() || []);
    const [loading, setLoading] = useState(() => !readCache());
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [search, setSearch] = useState("");
    const [filterTrangThai, setFilterTrangThai] = useState("TAT_CA");

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
                if (!cached || cached.length === 0) {
                    setLoading(true);
                }
                setError("");
            }

            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const res = await fetch(`${API}/chuong-trinh-giam-gia`, {
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!isMountedRef.current) return;

            if (!res.ok) {
                throw new Error(`Lỗi ${res.status}: Không tải được chương trình`);
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

    useEffect(() => {
        loadDanhSach();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
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
            trangThai: v.trangThai || "HOAT_DONG",
        });
        setFormError("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError("");
    };

    const handleChange = (field, value) => {
        setForm((old) => ({ ...old, [field]: value }));
    };

    const validate = () => {
        if (!form.tenChuongTrinh.trim()) return "Vui lòng nhập tên chương trình";
        if (!form.giaTriGiam || Number(form.giaTriGiam) <= 0)
            return "Giá trị giảm phải lớn hơn 0";
        if (form.loaiGiam === "PHAN_TRAM" && Number(form.giaTriGiam) > 100)
            return "Giảm % không được vượt quá 100";
        if (!form.ngayBatDau) return "Vui lòng chọn ngày bắt đầu";
        if (!form.ngayKetThuc) return "Vui lòng chọn ngày kết thúc";
        if (new Date(form.ngayBatDau) >= new Date(form.ngayKetThuc))
            return "Ngày kết thúc phải sau ngày bắt đầu";
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
        const matchTT =
            filterTrangThai === "TAT_CA" || v.trangThai === filterTrangThai;
        return matchKw && matchTT;
    });

    const showSkeleton = loading && danhSach.length === 0;

    return (
        <div className="admin-voucher">
            <div className="admin-page-heading">
                <div>
                    <div className="admin-eyebrow">FSHOP ADMIN</div>
                    <h1>Quản lý Khuyến mãi</h1>
                    <p>Thêm, sửa, xóa chương trình giảm giá.</p>
                </div>
                <button
                    className="admin-date-button"
                    onClick={openCreate}
                    style={{ background: "#111", color: "#fff" }}
                >
                    + Thêm chương trình
                </button>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 18,
                    flexWrap: "wrap",
                }}
            >
                <input
                    className="price-input"
                    placeholder="Tìm theo tên chương trình..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1, minWidth: 220 }}
                />
                <select
                    className="price-input"
                    value={filterTrangThai}
                    onChange={(e) => setFilterTrangThai(e.target.value)}
                    style={{ width: 200 }}
                >
                    <option value="TAT_CA">Tất cả trạng thái</option>
                    <option value="HOAT_DONG">Hoạt động</option>
                    <option value="TAM_DUNG">Tạm dừng</option>
                    <option value="KET_THUC">Kết thúc</option>
                </select>
            </div>

            {showSkeleton && (
                <div className="admin-table-scroll">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Tên chương trình</th>
                                <th>Loại giảm</th>
                                <th>Giá trị</th>
                                <th>Bắt đầu</th>
                                <th>Kết thúc</th>
                                <th>Trạng thái</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i}>
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <td key={j}>
                                            <div
                                                style={{
                                                    height: 14,
                                                    background:
                                                        "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
                                                    backgroundSize: "200% 100%",
                                                    animation:
                                                        "shimmer 1.4s infinite",
                                                    borderRadius: 4,
                                                }}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <style>{`
                        @keyframes shimmer {
                            0% { background-position: 200% 0; }
                            100% { background-position: -200% 0; }
                        }
                    `}</style>
                </div>
            )}

            {!showSkeleton && error && danhSach.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        background: "#fdecea",
                        borderRadius: 12,
                        maxWidth: 500,
                        margin: "20px auto",
                    }}
                >
                    <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
                    <h3 style={{ margin: "0 0 8px", color: "#c0392b" }}>
                        Không tải được dữ liệu
                    </h3>
                    <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
                        {error}
                    </p>
                </div>
            )}

            {!showSkeleton && danhSach.length > 0 && (
                <div className="admin-table-scroll">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Tên chương trình</th>
                                <th>Loại giảm</th>
                                <th>Giá trị</th>
                                <th>Bắt đầu</th>
                                <th>Kết thúc</th>
                                <th>Trạng thái</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((v) => (
                                <tr key={v.id}>
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
                                        <span
                                            className={`order-status ${
                                                v.trangThai === "HOAT_DONG"
                                                    ? "Đã-giao"
                                                    : ""
                                            }`}
                                        >
                                            {v.trangThai}
                                        </span>
                                    </td>
                                    <td style={{ whiteSpace: "nowrap" }}>
                                        <button
                                            type="button"
                                            onClick={() => openEdit(v)}
                                            style={{
                                                marginRight: 6,
                                                padding: "6px 10px",
                                                border: "1px solid #ddd",
                                                borderRadius: 6,
                                                cursor: "pointer",
                                                background: "#fff",
                                            }}
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(v)}
                                            style={{
                                                padding: "6px 10px",
                                                border: "1px solid #fdd",
                                                borderRadius: 6,
                                                cursor: "pointer",
                                                background: "#fdecea",
                                                color: "#c0392b",
                                            }}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        style={{
                                            textAlign: "center",
                                            padding: 30,
                                            color: "#888",
                                        }}
                                    >
                                        Không có chương trình nào
                                    </td>
                                </tr>
                            )}
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
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        marginBottom: 6,
                                    }}
                                >
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
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        marginBottom: 6,
                                    }}
                                >
                                    Loại giảm
                                </label>
                                <select
                                    className="price-input"
                                    value={form.loaiGiam}
                                    onChange={(e) =>
                                        handleChange("loaiGiam", e.target.value)
                                    }
                                >
                                    <option value="PHAN_TRAM">Phần trăm (%)</option>
                                    <option value="SO_TIEN">Số tiền (đ)</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        marginBottom: 6,
                                    }}
                                >
                                    Giá trị giảm *
                                </label>
                                <input
                                    className="price-input"
                                    type="number"
                                    value={form.giaTriGiam}
                                    onChange={(e) =>
                                        handleChange("giaTriGiam", e.target.value)
                                    }
                                    placeholder={
                                        form.loaiGiam === "PHAN_TRAM"
                                            ? "VD: 50"
                                            : "VD: 100000"
                                    }
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        marginBottom: 6,
                                    }}
                                >
                                    Ngày bắt đầu *
                                </label>
                                <input
                                    className="price-input"
                                    type="datetime-local"
                                    value={form.ngayBatDau}
                                    onChange={(e) =>
                                        handleChange("ngayBatDau", e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        marginBottom: 6,
                                    }}
                                >
                                    Ngày kết thúc *
                                </label>
                                <input
                                    className="price-input"
                                    type="datetime-local"
                                    value={form.ngayKetThuc}
                                    onChange={(e) =>
                                        handleChange("ngayKetThuc", e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        marginBottom: 6,
                                    }}
                                >
                                    Trạng thái
                                </label>
                                <select
                                    className="price-input"
                                    value={form.trangThai}
                                    onChange={(e) =>
                                        handleChange("trangThai", e.target.value)
                                    }
                                >
                                    <option value="HOAT_DONG">Hoạt động</option>
                                    <option value="TAM_DUNG">Tạm dừng</option>
                                    <option value="KET_THUC">Kết thúc</option>
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