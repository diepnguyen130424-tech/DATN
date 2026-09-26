import { useEffect, useRef, useState } from "react";

const API = "http://localhost:8080/api";
const CACHE_KEY = "admin_voucher_cache";
const CACHE_TTL = 60 * 1000;

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

function clearCache() {
    try {
        sessionStorage.removeItem(CACHE_KEY);
    } catch {}
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

            const res = await fetch(`${API}/ma-giam-gia`, {
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!isMountedRef.current) return;

            if (!res.ok) {
                throw new Error(`Lỗi ${res.status}: Không tải được danh sách`);
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
            maVoucher: v.maVoucher || "",
            tenVoucher: v.tenVoucher || "",
            loaiGiam: v.loaiGiam || "PHAN_TRAM",
            giaTriGiam: v.giaTriGiam ?? "",
            giamToiDa: v.giamToiDa ?? "",
            donToiThieu: v.donToiThieu ?? "",
            soLuong: v.soLuong ?? "",
            soLuongDaDung: v.soLuongDaDung ?? 0,
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
        if (!form.maVoucher.trim()) return "Vui lòng nhập mã voucher";
        if (!/^[A-Z0-9_]+$/.test(form.maVoucher.trim().toUpperCase()))
            return "Mã chỉ dùng chữ HOA, số và dấu gạch dưới";
        if (!form.tenVoucher.trim()) return "Vui lòng nhập tên voucher";
        if (!form.giaTriGiam || Number(form.giaTriGiam) <= 0)
            return "Giá trị giảm phải lớn hơn 0";
        if (form.loaiGiam === "PHAN_TRAM" && Number(form.giaTriGiam) > 100)
            return "Giảm % không được vượt quá 100";
        if (!form.soLuong || Number(form.soLuong) <= 0)
            return "Số lượng phải lớn hơn 0";
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
                maVoucher: form.maVoucher.trim().toUpperCase(),
                tenVoucher: form.tenVoucher.trim(),
                loaiGiam: form.loaiGiam,
                giaTriGiam: Number(form.giaTriGiam),
                giamToiDa: form.giamToiDa ? Number(form.giamToiDa) : null,
                donToiThieu: form.donToiThieu ? Number(form.donToiThieu) : null,
                soLuong: Number(form.soLuong),
                soLuongDaDung: Number(form.soLuongDaDung) || 0,
                ngayBatDau: form.ngayBatDau ? form.ngayBatDau + ":00" : null,
                ngayKetThuc: form.ngayKetThuc ? form.ngayKetThuc + ":00" : null,
                trangThai: form.trangThai,
            };

            const url = editing
                ? `${API}/ma-giam-gia/${editing.id}`
                : `${API}/ma-giam-gia`;

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
        if (!window.confirm(`Xóa voucher "${v.maVoucher}"?`)) return;

        const oldList = danhSach;
        const newList = danhSach.filter((item) => item.id !== v.id);
        setDanhSach(newList);
        writeCache(newList);

        try {
            const res = await fetch(`${API}/ma-giam-gia/${v.id}`, {
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
        const matchKw =
            !kw ||
            v.maVoucher?.toLowerCase().includes(kw) ||
            v.tenVoucher?.toLowerCase().includes(kw);

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
                    <h1>Quản lý Voucher</h1>
                    <p>Thêm, sửa, xóa mã giảm giá của cửa hàng.</p>
                </div>
                <button
                    className="admin-date-button"
                    onClick={openCreate}
                    style={{ background: "#111", color: "#fff" }}
                >
                    + Thêm voucher
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
                    placeholder="Tìm theo mã hoặc tên..."
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
                                <th>Mã</th>
                                <th>Tên</th>
                                <th>Loại</th>
                                <th>Giá trị</th>
                                <th>Đơn tối thiểu</th>
                                <th>SL</th>
                                <th>Đã dùng</th>
                                <th>Hạn</th>
                                <th>Trạng thái</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i}>
                                    {Array.from({ length: 10 }).map((_, j) => (
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
                    <p style={{ color: "#666", margin: "0 0 20px", fontSize: 14 }}>
                        {error}
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            clearCache();
                            loadDanhSach();
                        }}
                        style={{
                            padding: "10px 24px",
                            border: "none",
                            borderRadius: 8,
                            background: "#e53935",
                            color: "#fff",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {!showSkeleton && danhSach.length > 0 && (
                <div className="admin-table-scroll">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Tên</th>
                                <th>Loại</th>
                                <th>Giá trị</th>
                                <th>Đơn tối thiểu</th>
                                <th>SL</th>
                                <th>Đã dùng</th>
                                <th>Hạn</th>
                                <th>Trạng thái</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((v) => (
                                <tr key={v.id}>
                                    <td>
                                        <strong>{v.maVoucher}</strong>
                                    </td>
                                    <td>{v.tenVoucher}</td>
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
                                    <td>{formatGia(v.donToiThieu)}</td>
                                    <td>{v.soLuong}</td>
                                    <td>{v.soLuongDaDung ?? 0}</td>
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
                                        colSpan={10}
                                        style={{
                                            textAlign: "center",
                                            padding: 30,
                                            color: "#888",
                                        }}
                                    >
                                        Không có voucher nào
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
                            {editing ? "Sửa voucher" : "Thêm voucher"}
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
                            <Field label="Mã voucher *">
                                <input
                                    className="price-input"
                                    value={form.maVoucher}
                                    onChange={(e) =>
                                        handleChange(
                                            "maVoucher",
                                            e.target.value.toUpperCase()
                                        )
                                    }
                                    placeholder="VD: SALE10"
                                />
                            </Field>

                            <Field label="Tên voucher *">
                                <input
                                    className="price-input"
                                    value={form.tenVoucher}
                                    onChange={(e) =>
                                        handleChange("tenVoucher", e.target.value)
                                    }
                                    placeholder="VD: Giảm 10% đơn hàng"
                                />
                            </Field>

                            <Field label="Loại giảm">
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
                            </Field>

                            <Field label="Giá trị giảm *">
                                <input
                                    className="price-input"
                                    type="number"
                                    value={form.giaTriGiam}
                                    onChange={(e) =>
                                        handleChange("giaTriGiam", e.target.value)
                                    }
                                    placeholder={
                                        form.loaiGiam === "PHAN_TRAM"
                                            ? "VD: 10"
                                            : "VD: 50000"
                                    }
                                />
                            </Field>

                            <Field label="Giảm tối đa (đ)">
                                <input
                                    className="price-input"
                                    type="number"
                                    value={form.giamToiDa}
                                    onChange={(e) =>
                                        handleChange("giamToiDa", e.target.value)
                                    }
                                    placeholder="Chỉ áp dụng nếu giảm %"
                                />
                            </Field>

                            <Field label="Đơn tối thiểu (đ)">
                                <input
                                    className="price-input"
                                    type="number"
                                    value={form.donToiThieu}
                                    onChange={(e) =>
                                        handleChange("donToiThieu", e.target.value)
                                    }
                                    placeholder="VD: 500000"
                                />
                            </Field>

                            <Field label="Số lượng *">
                                <input
                                    className="price-input"
                                    type="number"
                                    value={form.soLuong}
                                    onChange={(e) =>
                                        handleChange("soLuong", e.target.value)
                                    }
                                    placeholder="VD: 100"
                                />
                            </Field>

                            <Field label="Đã dùng">
                                <input
                                    className="price-input"
                                    type="number"
                                    value={form.soLuongDaDung}
                                    onChange={(e) =>
                                        handleChange(
                                            "soLuongDaDung",
                                            e.target.value
                                        )
                                    }
                                />
                            </Field>

                            <Field label="Ngày bắt đầu">
                                <input
                                    className="price-input"
                                    type="datetime-local"
                                    value={form.ngayBatDau}
                                    onChange={(e) =>
                                        handleChange("ngayBatDau", e.target.value)
                                    }
                                />
                            </Field>

                            <Field label="Ngày kết thúc">
                                <input
                                    className="price-input"
                                    type="datetime-local"
                                    value={form.ngayKetThuc}
                                    onChange={(e) =>
                                        handleChange("ngayKetThuc", e.target.value)
                                    }
                                />
                            </Field>

                            <Field label="Trạng thái">
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
                            </Field>
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

function Field({ label, children }) {
    return (
        <div>
            <label
                style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 6,
                }}
            >
                {label}
            </label>
            {children}
        </div>
    );
}