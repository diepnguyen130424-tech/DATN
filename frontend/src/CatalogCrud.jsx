import { useEffect, useMemo, useRef, useState } from "react";

const API = "http://localhost:8080/api";
const CACHE_TTL = 60 * 1000;
const PAGE_SIZE = 10;

export function isActive(trangThai) {
    const v = String(trangThai || "").toUpperCase();
    return v === "HOAT_DONG" || v === "ACTIVE";
}

function formatNgay(str) {
    if (!str) return "—";
    try {
        return new Date(str).toLocaleDateString("vi-VN");
    } catch {
        return str;
    }
}

function makeCache(key) {
    return {
        read() {
            try {
                const raw = sessionStorage.getItem(key);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (Date.now() - parsed.time > CACHE_TTL) return null;
                return parsed.data;
            } catch {
                return null;
            }
        },
        write(data) {
            try {
                sessionStorage.setItem(key, JSON.stringify({ data, time: Date.now() }));
            } catch {}
        },
        clear() {
            try {
                sessionStorage.removeItem(key);
            } catch {}
        },
    };
}

async function docLoi(res, macDinh) {
    try {
        const text = await res.text();
        try {
            return JSON.parse(text).message || macDinh;
        } catch {
            return text || macDinh;
        }
    } catch {
        return macDinh;
    }
}


export default function CatalogCrud({ config }) {
    const {
        endpoint,
        nameField,
        title,
        subtitle,
        singular,
        icon,
        namePlaceholder,
        descPlaceholder,
        extraField,
    } = config;

    const cache = useMemo(() => makeCache(`admin_${endpoint}_cache`), [endpoint]);

    const emptyForm = useMemo(
        () => ({
            [nameField]: "",
            ...(extraField ? { [extraField.key]: "" } : {}),
            moTa: "",
            trangThai: "HOAT_DONG",
        }),
        [nameField, extraField]
    );

    const [danhSach, setDanhSach] = useState(() => cache.read() || []);
    const [thongKe, setThongKe] = useState({});
    const [loading, setLoading] = useState(() => !cache.read());
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [search, setSearch] = useState("");
    const [filterTrangThai, setFilterTrangThai] = useState("TAT_CA");
    const [page, setPage] = useState(1);

    const [toast, setToast] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const abortRef = useRef(null);
    const mountedRef = useRef(true);
    const toastTimer = useRef(null);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (abortRef.current) abortRef.current.abort();
            clearTimeout(toastTimer.current);
        };
    }, []);

    const showToast = (message, type = "ok") => {
        setToast({ message, type });
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3200);
    };

    const load = async (background = false) => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            if (!background) {
                const cached = cache.read();
                if (!cached || cached.length === 0) setLoading(true);
                setError("");
            }

            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const [listRes, statRes] = await Promise.all([
                fetch(`${API}/${endpoint}`, { signal: controller.signal }),
                fetch(`${API}/${endpoint}/thong-ke`, { signal: controller.signal }).catch(
                    () => null
                ),
            ]);

            clearTimeout(timeoutId);
            if (!mountedRef.current) return;

            if (!listRes.ok) {
                throw new Error(await docLoi(listRes, `Lỗi ${listRes.status}: Không tải được dữ liệu`));
            }

            const data = await listRes.json();
            if (!mountedRef.current) return;

            const list = Array.isArray(data) ? data : [];
            setDanhSach(list);
            cache.write(list);
            setError("");

            if (statRes && statRes.ok) {
                const stat = await statRes.json();
                if (mountedRef.current) setThongKe(stat || {});
            }
        } catch (err) {
            if (err.name === "AbortError" || !mountedRef.current) return;

            if (!background) {
                const cached = cache.read();
                if (cached && cached.length > 0) {
                    setDanhSach(cached);
                    setError("");
                } else {
                    setError(
                        err.message === "Failed to fetch"
                            ? "Không kết nối được tới máy chủ (kiểm tra backend đang chạy ở cổng 8080)."
                            : err.message
                    );
                }
            }
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setPage(1);
    }, [search, filterTrangThai]);

    // ---------- modal ----------
    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setFormError("");
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            [nameField]: item[nameField] || "",
            ...(extraField ? { [extraField.key]: item[extraField.key] || "" } : {}),
            moTa: item.moTa || "",
            trangThai: isActive(item.trangThai) ? "HOAT_DONG" : "NGUNG_HOAT_DONG",
        });
        setFormError("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setEditing(null);
        setForm(emptyForm);
        setFormError("");
    };

    useEffect(() => {
        if (!showModal) return;
        const onKey = (e) => e.key === "Escape" && closeModal();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showModal, saving]);

    const handleChange = (field, value) => setForm((old) => ({ ...old, [field]: value }));

    const validate = () => {
        const ten = String(form[nameField] || "").trim().replace(/\s+/g, " ");
        if (!ten) return `Vui lòng nhập tên ${singular}`;
        if (ten.length < 2) return `Tên ${singular} quá ngắn`;
        if (ten.length > 150) return `Tên ${singular} tối đa 150 ký tự`;

        const trung = danhSach.some(
            (x) =>
                String(x[nameField] || "").trim().toLowerCase() === ten.toLowerCase() &&
                (!editing || x.id !== editing.id)
        );
        if (trung) return `Tên ${singular} "${ten}" đã tồn tại`;
        return "";
    };

    const handleSave = async () => {
        if (saving) return;
        const err = validate();
        if (err) {
            setFormError(err);
            return;
        }

        setSaving(true);
        setFormError("");

        try {
            const body = {
                [nameField]: form[nameField].trim().replace(/\s+/g, " "),
                ...(extraField ? { [extraField.key]: (form[extraField.key] || "").trim() || null } : {}),
                moTa: form.moTa.trim() || null,
                trangThai: form.trangThai,
            };

            const res = await fetch(
                editing ? `${API}/${endpoint}/${editing.id}` : `${API}/${endpoint}`,
                {
                    method: editing ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                }
            );

            if (!res.ok) throw new Error(await docLoi(res, "Lưu thất bại"));

            const saved = await res.json();
            const newList = editing
                ? danhSach.map((x) => (x.id === saved.id ? saved : x))
                : [saved, ...danhSach];

            setDanhSach(newList);
            cache.write(newList);
            showToast(editing ? `Đã cập nhật ${singular}` : `Đã thêm ${singular} mới`);
            setShowModal(false);
            setEditing(null);
            setForm(emptyForm);
            load(true);
        } catch (e) {
            setFormError(e.message === "Failed to fetch" ? "Không kết nối được tới máy chủ" : e.message);
        } finally {
            setSaving(false);
        }
    };

    // ---------- actions ----------
    const capNhatTrangThai = async (item, trangThaiMoi) => {
        const body = {
            [nameField]: item[nameField],
            ...(extraField ? { [extraField.key]: item[extraField.key] } : {}),
            moTa: item.moTa,
            trangThai: trangThaiMoi,
        };
        const res = await fetch(`${API}/${endpoint}/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await docLoi(res, "Cập nhật thất bại"));
        return res.json();
    };

    const thayDoi = (saved) => {
        const newList = danhSach.map((x) => (x.id === saved.id ? saved : x));
        setDanhSach(newList);
        cache.write(newList);
    };

    const handleNgung = async (item) => {
        const soSP = thongKe[item.id] || 0;
        const msg =
            soSP > 0
                ? `${cap(singular)} "${item[nameField]}" đang có ${soSP} sản phẩm.\nNgừng hoạt động ${singular} này? (Sản phẩm cũ vẫn giữ nguyên, chỉ không nên chọn khi thêm sản phẩm mới.)`
                : `Ngừng hoạt động ${singular} "${item[nameField]}"?`;
        if (!window.confirm(msg)) return;

        setBusyId(item.id);
        try {
            const res = await fetch(`${API}/${endpoint}/${item.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await docLoi(res, "Thao tác thất bại"));
            thayDoi({ ...item, trangThai: "NGUNG_HOAT_DONG" });
            showToast(`Đã ngừng hoạt động ${singular}`);
            load(true);
        } catch (e) {
            showToast(e.message, "err");
        } finally {
            setBusyId(null);
        }
    };

    const handleKichHoat = async (item) => {
        setBusyId(item.id);
        try {
            const saved = await capNhatTrangThai(item, "HOAT_DONG");
            thayDoi(saved);
            showToast(`Đã kích hoạt lại ${singular}`);
        } catch (e) {
            showToast(e.message, "err");
        } finally {
            setBusyId(null);
        }
    };

    const handleXoaVinhVien = async (item) => {
        const soSP = thongKe[item.id] || 0;
        if (soSP > 0) {
            showToast(
                `Không thể xóa vĩnh viễn: đang có ${soSP} sản phẩm thuộc ${singular} này.`,
                "err"
            );
            return;
        }
        if (
            !window.confirm(
                `XÓA VĨNH VIỄN ${singular} "${item[nameField]}"?\nHành động này không thể hoàn tác.`
            )
        )
            return;

        setBusyId(item.id);
        try {
            const res = await fetch(`${API}/${endpoint}/${item.id}/vinh-vien`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(await docLoi(res, "Xóa thất bại"));
            const newList = danhSach.filter((x) => x.id !== item.id);
            setDanhSach(newList);
            cache.write(newList);
            showToast(`Đã xóa vĩnh viễn ${singular}`);
            load(true);
        } catch (e) {
            showToast(e.message, "err");
        } finally {
            setBusyId(null);
        }
    };

    // ---------- derived ----------
    const filtered = useMemo(() => {
        const kw = search.trim().toLowerCase();
        return danhSach.filter((x) => {
            const matchKw =
                !kw ||
                String(x[nameField] || "").toLowerCase().includes(kw) ||
                String(x.moTa || "").toLowerCase().includes(kw) ||
                (extraField && String(x[extraField.key] || "").toLowerCase().includes(kw));

            const matchTT =
                filterTrangThai === "TAT_CA" ||
                (filterTrangThai === "HOAT_DONG" ? isActive(x.trangThai) : !isActive(x.trangThai));

            return matchKw && matchTT;
        });
    }, [danhSach, search, filterTrangThai, nameField, extraField]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const tongSo = danhSach.length;
    const soHoatDong = danhSach.filter((x) => isActive(x.trangThai)).length;
    const soNgung = tongSo - soHoatDong;
    const soExtra = extraField
        ? new Set(danhSach.map((x) => x[extraField.key]).filter(Boolean)).size
        : 0;

    const colCount = extraField ? 7 : 6;
    const showSkeleton = loading && danhSach.length === 0;

    return (
        <div className="admin-catalog">
            <div className="admin-page-heading">
                <div>
                    <div className="admin-eyebrow">FSHOP ADMIN</div>
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                </div>
                <button
                    type="button"
                    className="admin-date-button"
                    onClick={openCreate}
                    style={{ background: "#111", color: "#fff", border: "none" }}
                >
                    <span>+</span>
                    Thêm {singular}
                </button>
            </div>

            <div className="admin-stats" style={{ marginBottom: 18 }}>
                <StatCard icon={icon} value={tongSo} label={`Tổng ${singular}`} />
                <StatCard icon="✓" value={soHoatDong} label="Đang hoạt động" />
                <StatCard icon="⏸" value={soNgung} label="Ngừng hoạt động" />
                {extraField && (
                    <StatCard icon="◎" value={soExtra} label={extraField.statLabel} />
                )}
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
                <input
                    className="price-input"
                    placeholder={`Tìm theo tên${extraField ? ", " + extraField.column.toLowerCase() : ""} hoặc mô tả...`}
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
                    <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                </select>
            </div>

            {showSkeleton && (
                <div className="admin-table-scroll">
                    <table className="admin-table">
                        <thead>
                            <HeaderRow extraField={extraField} nameLabel={cap(singular)} />
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i}>
                                    {Array.from({ length: colCount }).map((_, j) => (
                                        <td key={j}>
                                            <div
                                                style={{
                                                    height: 14,
                                                    background:
                                                        "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
                                                    backgroundSize: "200% 100%",
                                                    animation: "catalogShimmer 1.4s infinite",
                                                    borderRadius: 4,
                                                }}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <style>{`@keyframes catalogShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                </div>
            )}

            {!showSkeleton && error && danhSach.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        background: "#fdecea",
                        borderRadius: 12,
                        maxWidth: 520,
                        margin: "20px auto",
                    }}
                >
                    <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
                    <h3 style={{ margin: "0 0 8px", color: "#c0392b" }}>Không tải được dữ liệu</h3>
                    <p style={{ color: "#666", margin: "0 0 20px", fontSize: 14 }}>{error}</p>
                    <button
                        type="button"
                        onClick={() => {
                            cache.clear();
                            load();
                        }}
                        style={btn("#e53935", "#fff")}
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {!showSkeleton && danhSach.length > 0 && (
                <>
                    <div className="admin-table-scroll">
                        <table className="admin-table">
                            <thead>
                                <HeaderRow extraField={extraField} nameLabel={cap(singular)} />
                            </thead>
                            <tbody>
                                {pageItems.map((item) => {
                                    const active = isActive(item.trangThai);
                                    const soSP = thongKe[item.id] || 0;
                                    const busy = busyId === item.id;
                                    return (
                                        <tr key={item.id} style={{ opacity: active ? 1 : 0.65 }}>
                                            <td>
                                                <strong>{item[nameField]}</strong>
                                            </td>
                                            {extraField && <td>{item[extraField.key] || "—"}</td>}
                                            <td
                                                style={{
                                                    maxWidth: 280,
                                                    color: "#666",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                                title={item.moTa || ""}
                                            >
                                                {item.moTa || "—"}
                                            </td>
                                            <td>{soSP}</td>
                                            <td>{formatNgay(item.ngayTao)}</td>
                                            <td>
                                                <span className={`order-status ${active ? "Đã-giao" : ""}`}>
                                                    {active ? "Hoạt động" : "Ngừng hoạt động"}
                                                </span>
                                            </td>
                                            <td style={{ whiteSpace: "nowrap" }}>
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => openEdit(item)}
                                                    style={smallBtn("#fff", "#111", "#ddd")}
                                                >
                                                    Sửa
                                                </button>
                                                {active ? (
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => handleNgung(item)}
                                                        style={smallBtn("#fff7e6", "#b26a00", "#ffe1a8")}
                                                    >
                                                        Ngừng
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => handleKichHoat(item)}
                                                        style={smallBtn("#eafaf0", "#1e8449", "#bfe8cf")}
                                                    >
                                                        Kích hoạt
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => handleXoaVinhVien(item)}
                                                    title={
                                                        soSP > 0
                                                            ? "Đang có sản phẩm nên không thể xóa vĩnh viễn"
                                                            : "Xóa vĩnh viễn"
                                                    }
                                                    style={{
                                                        ...smallBtn("#fdecea", "#c0392b", "#fdd"),
                                                        opacity: soSP > 0 || busy ? 0.5 : 1,
                                                        marginRight: 0,
                                                    }}
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={colCount}
                                            style={{ textAlign: "center", padding: 30, color: "#888" }}
                                        >
                                            Không tìm thấy {singular} nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filtered.length > PAGE_SIZE && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: 14,
                                fontSize: 13,
                                color: "#666",
                            }}
                        >
                            <span>
                                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–
                                {Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length}
                            </span>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => setPage(currentPage - 1)}
                                    style={{ ...smallBtn("#fff", "#111", "#ddd"), opacity: currentPage <= 1 ? 0.4 : 1, marginRight: 0 }}
                                >
                                    ‹ Trước
                                </button>
                                <span>
                                    Trang {currentPage}/{totalPages}
                                </span>
                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setPage(currentPage + 1)}
                                    style={{ ...smallBtn("#fff", "#111", "#ddd"), opacity: currentPage >= totalPages ? 0.4 : 1, marginRight: 0 }}
                                >
                                    Sau ›
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {!showSkeleton && !error && danhSach.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
                    <p style={{ marginBottom: 20 }}>Chưa có {singular} nào.</p>
                    <button type="button" onClick={openCreate} style={btn("#111", "#fff")}>
                        + Thêm {singular} đầu tiên
                    </button>
                </div>
            )}

            {toast && (
                <div
                    role="status"
                    style={{
                        position: "fixed",
                        right: 24,
                        bottom: 24,
                        zIndex: 200,
                        maxWidth: 380,
                        padding: "12px 18px",
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#fff",
                        background: toast.type === "err" ? "#c0392b" : "#1e8449",
                        boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                    }}
                >
                    {toast.message}
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
                            maxWidth: 480,
                            maxHeight: "90vh",
                            overflowY: "auto",
                        }}
                    >
                        <h2 style={{ marginTop: 0 }}>
                            {editing ? `Sửa ${singular}` : `Thêm ${singular}`}
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

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <Field label={`Tên ${singular} *`}>
                                <input
                                    className="price-input"
                                    autoFocus
                                    maxLength={150}
                                    value={form[nameField]}
                                    onChange={(e) => handleChange(nameField, e.target.value)}
                                    placeholder={namePlaceholder}
                                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                                />
                            </Field>

                            {extraField && (
                                <Field label={extraField.label}>
                                    <input
                                        className="price-input"
                                        maxLength={100}
                                        value={form[extraField.key]}
                                        onChange={(e) => handleChange(extraField.key, e.target.value)}
                                        placeholder={extraField.placeholder}
                                    />
                                </Field>
                            )}

                            <Field label="Mô tả">
                                <textarea
                                    className="price-input"
                                    rows={3}
                                    value={form.moTa}
                                    onChange={(e) => handleChange("moTa", e.target.value)}
                                    placeholder={descPlaceholder}
                                    style={{ resize: "vertical", fontFamily: "inherit" }}
                                />
                            </Field>

                            <Field label="Trạng thái">
                                <select
                                    className="price-input"
                                    value={form.trangThai}
                                    onChange={(e) => handleChange("trangThai", e.target.value)}
                                >
                                    <option value="HOAT_DONG">Hoạt động</option>
                                    <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                                </select>
                            </Field>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                style={btn("#fff", "#111", "1px solid #ddd")}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                style={{ ...btn("#111", "#fff"), opacity: saving ? 0.7 : 1 }}
                            >
                                {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------- small pieces ----------
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const btn = (bg, color, border = "none") => ({
    padding: "10px 20px",
    border,
    borderRadius: 8,
    background: bg,
    color,
    cursor: "pointer",
    fontWeight: 700,
});

const smallBtn = (bg, color, borderColor) => ({
    marginRight: 6,
    padding: "6px 10px",
    border: `1px solid ${borderColor}`,
    borderRadius: 6,
    cursor: "pointer",
    background: bg,
    color,
});

function HeaderRow({ extraField, nameLabel }) {
    return (
        <tr>
            <th>{nameLabel}</th>
            {extraField && <th>{extraField.column}</th>}
            <th>Mô tả</th>
            <th>Số sản phẩm</th>
            <th>Ngày tạo</th>
            <th>Trạng thái</th>
            <th></th>
        </tr>
    );
}

function StatCard({ icon, value, label }) {
    return (
        <div className="admin-stat-card">
            <div className="admin-stat-top">
                <div className="admin-stat-icon">{icon}</div>
            </div>
            <div className="admin-stat-value">{value}</div>
            <div className="admin-stat-label">{label}</div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                {label}
            </label>
            {children}
        </div>
    );
}
