/* eslint-disable react-hooks/set-state-in-effect, no-empty, react-refresh/only-export-components */
import { useEffect, useMemo, useRef, useState } from "react";
import "./AdminProducts.css";
import "./CatalogCrud.css";

const API = "http://localhost:8080/api";
const CACHE_TTL = 60 * 1000;
const PAGE_SIZE = 5;

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
        codeField,
        title,
        subtitle,
        singular,
        icon,
        namePlaceholder,
        descPlaceholder,
        extraField,
        breadcrumb,
        codeLabel = "Mã",
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
    const [sortDir, setSortDir] = useState("asc"); // sắp xếp theo mã

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
                String(x.id ?? "").includes(kw) ||
                String(x[codeField] || "").toLowerCase().includes(kw) ||
                String(x[nameField] || "").toLowerCase().includes(kw) ||
                String(x.moTa || "").toLowerCase().includes(kw) ||
                (extraField && String(x[extraField.key] || "").toLowerCase().includes(kw));

            const matchTT =
                filterTrangThai === "TAT_CA" ||
                (filterTrangThai === "HOAT_DONG" ? isActive(x.trangThai) : !isActive(x.trangThai));

            return matchKw && matchTT;
        });
    }, [danhSach, search, filterTrangThai, nameField, codeField, extraField]);

    const sorted = useMemo(() => {
        const list = [...filtered].sort((a, b) =>
            String(a[codeField] || "").localeCompare(String(b[codeField] || ""), "vi", {
                numeric: true,
            })
        );
        return sortDir === "asc" ? list : list.reverse();
    }, [filtered, codeField, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const tongSo = danhSach.length;
    const soHoatDong = danhSach.filter((x) => isActive(x.trangThai)).length;
    const soNgung = tongSo - soHoatDong;

    const resetFilter = () => {
        setSearch("");
        setFilterTrangThai("TAT_CA");
        setSortDir("asc");
        setPage(1);
    };

    const showSkeleton = loading && danhSach.length === 0;

    const hasFilter = search.trim() !== "" || filterTrangThai !== "TAT_CA";

    return (
        <div className="admin-products admin-catalog">
            {/* HEADER */}
            <div className="products-header">
                <div>
                    <div className="products-breadcrumb">Quản lý / {breadcrumb || title}</div>
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                </div>

                <button type="button" className="btn-primary" onClick={openCreate}>
                    + Thêm {singular}
                </button>
            </div>

            {/* FILTER */}
            <div className="products-filter catalog-filter">
                <div className="filter-search">
                    <span>🔍</span>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Tìm theo ID, mã, tên${extraField ? ", " + extraField.column.toLowerCase() : ""} hoặc mô tả...`}
                    />
                </div>

                <select value={filterTrangThai} onChange={(e) => setFilterTrangThai(e.target.value)}>
                    <option value="TAT_CA">Tất cả trạng thái</option>
                    <option value="HOAT_DONG">Hoạt động</option>
                    <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                </select>

                <button type="button" className="btn-reset" onClick={resetFilter}>
                    Đặt lại
                </button>
            </div>

            {/* LIST */}
            <div className="products-card">
                <div className="products-card-header">
                    <div>
                        <strong>Danh sách {singular}</strong>
                        <span>
                            {sorted.length} {singular}
                            {hasFilter ? ` (tổng ${tongSo})` : ""} · {soHoatDong} hoạt động · {soNgung} ngừng
                        </span>
                    </div>
                </div>

                {showSkeleton && <div className="products-loading">Đang tải {singular}...</div>}

                {!showSkeleton && error && danhSach.length === 0 && (
                    <div className="products-error">
                        <p style={{ margin: "0 0 14px" }}>{error}</p>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => {
                                cache.clear();
                                load();
                            }}
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {!showSkeleton && !(error && danhSach.length === 0) && (
                    <div className="table-wrapper">
                        <table className="products-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>
                                    <button
                                        type="button"
                                        className="th-sort"
                                        onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                                        title="Bấm để đổi chiều sắp xếp"
                                    >
                                        {codeLabel} {sortDir === "asc" ? "▲" : "▼"}
                                    </button>
                                </th>
                                <th>{cap(singular)}</th>
                                {extraField && <th>{extraField.column}</th>}
                                <th>Mô tả</th>
                                <th>Số sản phẩm</th>
                                <th>Ngày tạo</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                            </thead>

                            <tbody>
                            {pageItems.map((item) => {
                                const active = isActive(item.trangThai);
                                const soSP = thongKe[item.id] || 0;
                                const busy = busyId === item.id;
                                return (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>

                                        <td>
                                            <strong>{item[codeField] || "-"}</strong>
                                        </td>

                                        <td>
                                            <div className="product-name">{item[nameField]}</div>
                                        </td>

                                        {extraField && <td>{item[extraField.key] || "-"}</td>}

                                        <td className="cell-desc" title={item.moTa || ""}>
                                            {item.moTa || "-"}
                                        </td>

                                        <td>{soSP}</td>
                                        <td>{formatNgay(item.ngayTao)}</td>

                                        <td>
                                                <span className={active ? "status active" : "status inactive"}>
                                                    {active ? "Hoạt động" : "Ngừng hoạt động"}
                                                </span>
                                        </td>

                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    type="button"
                                                    className="btn-edit"
                                                    disabled={busy}
                                                    onClick={() => openEdit(item)}
                                                >
                                                    Sửa
                                                </button>

                                                {active ? (
                                                    <button
                                                        type="button"
                                                        className="btn-pause"
                                                        disabled={busy}
                                                        onClick={() => handleNgung(item)}
                                                    >
                                                        Ngừng
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="btn-activate"
                                                        disabled={busy}
                                                        onClick={() => handleKichHoat(item)}
                                                    >
                                                        Kích hoạt
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    className="btn-delete"
                                                    disabled={busy || soSP > 0}
                                                    onClick={() => handleXoaVinhVien(item)}
                                                    title={
                                                        soSP > 0
                                                            ? "Đang có sản phẩm nên không thể xóa vĩnh viễn"
                                                            : "Xóa vĩnh viễn"
                                                    }
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>

                        {sorted.length === 0 && (
                            <div className="empty-products">
                                <div>{icon}</div>
                                <h3>Không tìm thấy {singular}</h3>
                                <p>Hãy thử thay đổi bộ lọc hoặc thêm {singular} mới.</p>
                            </div>
                        )}
                    </div>
                )}

                {sorted.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "8px",
                            padding: "18px 0"
                        }}
                    >
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() =>
                                setPage((page) => page - 1)
                            }
                            style={{
                                minWidth: "38px",
                                height: "38px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                background: "#fff",
                                cursor:
                                    currentPage === 1
                                        ? "not-allowed"
                                        : "pointer"
                            }}
                        >
                            ←
                        </button>

                        {Array.from(
                            { length: totalPages },
                            (_, index) => index + 1
                        ).map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setPage(item)}
                                style={{
                                    minWidth: "38px",
                                    height: "38px",
                                    border: "1px solid #ddd",
                                    borderRadius: "8px",
                                    background:
                                        currentPage === item
                                            ? "#d94b3f"
                                            : "#fff",
                                    color:
                                        currentPage === item
                                            ? "#fff"
                                            : "#222",
                                    cursor: "pointer",
                                    fontWeight:
                                        currentPage === item
                                            ? 600
                                            : 400
                                }}
                            >
                                {item}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() =>
                                setPage((page) => page + 1)
                            }
                            style={{
                                minWidth: "38px",
                                height: "38px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                background: "#fff",
                                cursor:
                                    currentPage === totalPages
                                        ? "not-allowed"
                                        : "pointer"
                            }}
                        >
                            →
                        </button>
                    </div>
                )}
            </div>

            {toast && (
                <div role="status" className={`catalog-toast ${toast.type === "err" ? "err" : "ok"}`}>
                    {toast.message}
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="product-modal catalog-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{editing ? `Sửa ${singular}` : `Thêm ${singular}`}</h2>
                                <p>
                                    {editing
                                        ? `Cập nhật thông tin ${singular}. Mã không thể thay đổi.`
                                        : `Mã ${singular} được tạo tự động khi lưu.`}
                                </p>
                            </div>
                            <button type="button" className="modal-close" onClick={closeModal}>
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSave();
                            }}
                        >
                            {formError && <div className="catalog-form-error">{formError}</div>}

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>ID</label>
                                    <input
                                        readOnly
                                        className="input-readonly"
                                        value={editing ? editing.id : ""}
                                        placeholder="Tự động tạo"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{codeLabel}</label>
                                    <input
                                        readOnly
                                        className="input-readonly"
                                        value={editing ? editing[codeField] || "" : ""}
                                        placeholder="Tự động tạo"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Ngày tạo</label>
                                    <input
                                        readOnly
                                        className="input-readonly"
                                        value={editing ? formatNgay(editing.ngayTao) : ""}
                                        placeholder="Tự động tạo"
                                    />
                                </div>

                                <div className={`form-group ${extraField ? "" : "full"}`}>
                                    <label>{`Tên ${singular} *`}</label>
                                    <input
                                        autoFocus
                                        maxLength={150}
                                        value={form[nameField]}
                                        onChange={(e) => handleChange(nameField, e.target.value)}
                                        placeholder={namePlaceholder}
                                    />
                                </div>

                                {extraField && (
                                    <div className="form-group">
                                        <label>{extraField.column}</label>
                                        <input
                                            maxLength={100}
                                            value={form[extraField.key]}
                                            onChange={(e) => handleChange(extraField.key, e.target.value)}
                                            placeholder={extraField.placeholder}
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Trạng thái</label>
                                    <select
                                        value={form.trangThai}
                                        onChange={(e) => handleChange("trangThai", e.target.value)}
                                    >
                                        <option value="HOAT_DONG">Hoạt động</option>
                                        <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Số sản phẩm</label>
                                    <input
                                        readOnly
                                        className="input-readonly"
                                        value={editing ? thongKe[editing.id] || 0 : 0}
                                    />
                                </div>

                                <div className="form-group full">
                                    <label>Mô tả</label>
                                    <textarea
                                        rows={3}
                                        value={form.moTa}
                                        onChange={(e) => handleChange("moTa", e.target.value)}
                                        placeholder={descPlaceholder}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={closeModal} disabled={saving}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------- small pieces ----------
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
