import { useState } from "react";
import "./HoaDonShared.css";

/* =========================================================
   Dùng chung cho trang Hóa đơn của Admin và Nhân viên
   ========================================================= */

/* Trạng thái mà đơn online còn được sửa thông tin giao hàng (trước khi giao) */
export const TRANG_THAI_CHO_SUA_THONG_TIN = [
    "CHO_XAC_NHAN",
    "DA_XAC_NHAN",
    "DANG_CHUAN_BI",
];

export function choPhepSuaThongTin(hoaDon) {
    return (
        String(hoaDon?.loaiHoaDon || "").toUpperCase() === "ONLINE" &&
        TRANG_THAI_CHO_SUA_THONG_TIN.includes(
            String(hoaDon?.trangThai || "").toUpperCase()
        )
    );
}

/* Tên / SĐT / ID khách hiển thị trong danh sách (đơn online ưu tiên người nhận) */
export function layThongTinKhach(hoaDon) {
    const online = String(hoaDon?.loaiHoaDon || "").toUpperCase() === "ONLINE";
    const id = hoaDon?.khachHang?.id || hoaDon?.khachHangQuay?.id || null;
    const ten = online
        ? hoaDon?.diaChi?.tenNguoiNhan || hoaDon?.khachHang?.hoTen
        : hoaDon?.tenKhach || hoaDon?.khachHang?.hoTen || hoaDon?.diaChi?.tenNguoiNhan;
    const sdt = online
        ? hoaDon?.diaChi?.soDienThoai || hoaDon?.khachHang?.soDienThoai
        : hoaDon?.soDienThoaiKhach || hoaDon?.khachHang?.soDienThoai || hoaDon?.diaChi?.soDienThoai;
    return { id, ten: ten || "Khách lẻ", sdt: sdt || "" };
}

/* ---------- Lọc theo khoảng thời gian ---------- */

export function dateToInput(date) {
    const d = new Date(date);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
}

/* value: chuỗi ngày của hóa đơn; from/to: "YYYY-MM-DD" (có thể rỗng) */
export function trongKhoangNgay(value, from, to) {
    if (!from && !to) return true;
    if (!value) return false;
    const t = new Date(value).getTime();
    if (Number.isNaN(t)) return false;
    if (from && t < new Date(`${from}T00:00:00`).getTime()) return false;
    if (to && t > new Date(`${to}T23:59:59.999`).getTime()) return false;
    return true;
}

export function DateRangeFilter({ from, to, onChange }) {
    const today = new Date();
    const dayAgo = (n) => {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return dateToInput(d);
    };
    const presets = [
        ["Hôm nay", dateToInput(today), dateToInput(today)],
        ["7 ngày", dayAgo(6), dateToInput(today)],
        ["30 ngày", dayAgo(29), dateToInput(today)],
        [
            "Tháng này",
            dateToInput(new Date(today.getFullYear(), today.getMonth(), 1)),
            dateToInput(today),
        ],
    ];
    const dangChon = (f, t) => from === f && to === t;
    return (
        <div className="hd-range">
            <span className="hd-range-label">Thời gian</span>
            <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => onChange({ from: e.target.value, to })}
                aria-label="Từ ngày"
            />
            <span className="hd-range-sep">–</span>
            <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => onChange({ from, to: e.target.value })}
                aria-label="Đến ngày"
            />
            {presets.map(([label, f, t]) => (
                <button
                    key={label}
                    type="button"
                    className={`hd-chip ${dangChon(f, t) ? "active" : ""}`}
                    onClick={() => onChange({ from: f, to: t })}
                >
                    {label}
                </button>
            ))}
            {(from || to) && (
                <button
                    type="button"
                    className="hd-chip clear"
                    onClick={() => onChange({ from: "", to: "" })}
                >
                    ✕ Xóa lọc
                </button>
            )}
        </div>
    );
}

/* ---------- Phân trang gọn ---------- */

export function CompactPager({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;
    // Chỉ hiện trang đầu, cuối và các trang quanh trang hiện tại
    const pages = [];
    for (let i = 1; i <= totalPages; i += 1) {
        if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== "…") {
            pages.push("…");
        }
    }
    return (
        <div className="hd-pager">
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                ←
            </button>
            {pages.map((p, index) =>
                p === "…" ? (
                    <span key={`gap-${index}`} className="hd-pager-gap">…</span>
                ) : (
                    <button
                        key={p}
                        type="button"
                        className={p === page ? "active" : ""}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                )
            )}
            <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                →
            </button>
        </div>
    );
}

/* ---------- Lịch sử hóa đơn: ai tác động, lúc nào ---------- */

const VAI_TRO_LABEL = {
    ADMIN: "Admin",
    NHAN_VIEN: "Nhân viên",
    KHACH_HANG: "Khách hàng",
    HE_THONG: "Hệ thống",
};

export function tenNguoiThaoTac(item) {
    const vaiTro = String(item?.vaiTro || "").toUpperCase();
    const nhan = VAI_TRO_LABEL[vaiTro] || "";
    const ten = item?.nguoiThucHien || item?.nhanVien?.hoTen || "";
    const tenDangNhap = item?.tenDangNhap || "";
    // Hiện thêm tên đăng nhập để biết chính xác tài khoản nào đã thao tác
    const taiKhoan = tenDangNhap && tenDangNhap !== ten ? ` · @${tenDangNhap}` : "";
    if (ten && nhan && vaiTro !== "HE_THONG") return `${ten} (${nhan})${taiKhoan}`;
    return ten || nhan || "Chưa ghi nhận người thao tác";
}

export function LichSuHoaDonList({ items, tenTrangThai, formatNgay }) {
    if (!items || items.length === 0) {
        return <div className="hd-muted">Chưa có lịch sử.</div>;
    }
    return (
        <ol className="hd-timeline">
            {items.map((item) => {
                const vaiTro = String(item.vaiTro || "").toLowerCase();
                return (
                    <li key={item.id}>
                        <span className={`hd-dot ${vaiTro}`} />
                        <div className="hd-tl-head">
                            <strong>{tenTrangThai(item.trangThai)}</strong>
                            <span className="hd-tl-time">{formatNgay(item.thoiGian)}</span>
                        </div>
                        <div className="hd-tl-actor">
                            <span className={`hd-role ${vaiTro}`}>{tenNguoiThaoTac(item)}</span>
                        </div>
                        {item.ghiChu && <div className="hd-tl-note">{item.ghiChu}</div>}
                    </li>
                );
            })}
        </ol>
    );
}

/* ---------- Thông tin giao hàng + sửa trước khi giao ---------- */

async function docLoi(response) {
    const text = await response.text();
    try {
        const data = text ? JSON.parse(text) : null;
        return data?.message || data?.error || text || "Không thể cập nhật";
    } catch {
        return text || "Không thể cập nhật";
    }
}

/*
 * order     : hóa đơn đang xem
 * actor     : { nhanVienId, nguoiThucHien, vaiTro } — người đang thao tác
 * onSaved   : (hoaDonMoi) => void
 */
export function ThongTinGiaoHang({ order, api, actor, onSaved }) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ ten: "", sdt: "", diaChi: "" });
    const [loi, setLoi] = useState("");

    const online = String(order?.loaiHoaDon || "").toUpperCase() === "ONLINE";
    if (!online || !order?.diaChi) return null;

    const duocSua = choPhepSuaThongTin(order);
    const dc = order.diaChi;

    const mo = () => {
        setForm({
            ten: dc.tenNguoiNhan || "",
            sdt: dc.soDienThoai || "",
            diaChi: dc.diaChi || "",
        });
        setLoi("");
        setEditing(true);
    };

    const luu = async () => {
        const ten = form.ten.trim();
        const sdt = form.sdt.trim();
        const diaChi = form.diaChi.trim();
        if (!ten || !sdt || !diaChi) {
            setLoi("Vui lòng nhập đủ tên, số điện thoại và địa chỉ.");
            return;
        }
        try {
            setSaving(true);
            setLoi("");
            const response = await fetch(`${api}/hoa-don/${order.id}/thong-tin-giao-hang`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenNguoiNhan: ten,
                    soDienThoai: sdt,
                    diaChi,
                    nhanVienId: actor?.nhanVienId ? String(actor.nhanVienId) : "",
                    taiKhoanId: actor?.taiKhoanId ? String(actor.taiKhoanId) : "",
                    nguoiThucHien: actor?.nguoiThucHien || "",
                    vaiTro: actor?.vaiTro || "",
                }),
            });
            if (!response.ok) {
                throw new Error(await docLoi(response));
            }
            const data = await response.json();
            setEditing(false);
            onSaved?.(data);
        } catch (err) {
            setLoi(err.message || "Không thể lưu thông tin");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="hd-section">
            <div className="hd-section-head">
                <h3>Thông tin giao hàng</h3>
                {duocSua && !editing && (
                    <button type="button" className="hd-btn ghost" onClick={mo}>
                        ✎ Sửa
                    </button>
                )}
            </div>

            {editing ? (
                <div className="hd-form">
                    <label>
                        <span>Người nhận</span>
                        <input
                            value={form.ten}
                            onChange={(e) => setForm({ ...form, ten: e.target.value })}
                            maxLength={100}
                        />
                    </label>
                    <label>
                        <span>Số điện thoại</span>
                        <input
                            value={form.sdt}
                            onChange={(e) => setForm({ ...form, sdt: e.target.value })}
                            maxLength={15}
                        />
                    </label>
                    <label className="full">
                        <span>Địa chỉ</span>
                        <textarea
                            rows={2}
                            value={form.diaChi}
                            onChange={(e) => setForm({ ...form, diaChi: e.target.value })}
                        />
                    </label>
                    {loi && <div className="hd-error full">{loi}</div>}
                    <div className="hd-form-actions full">
                        <button type="button" className="hd-btn primary" onClick={luu} disabled={saving}>
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                        <button
                            type="button"
                            className="hd-btn ghost"
                            onClick={() => setEditing(false)}
                            disabled={saving}
                        >
                            Hủy
                        </button>
                    </div>
                    <div className="hd-hint full">
                        Phí vận chuyển giữ nguyên như lúc đặt hàng. Thay đổi sẽ được ghi vào lịch sử đơn.
                    </div>
                </div>
            ) : (
                <div className="hd-info">
                    <div><span>Người nhận</span><strong>{dc.tenNguoiNhan || "-"}</strong></div>
                    <div><span>Số điện thoại</span><strong>{dc.soDienThoai || "-"}</strong></div>
                    <div className="full"><span>Địa chỉ</span><strong>{dc.diaChi || "-"}</strong></div>
                    {!duocSua && (
                        <div className="hd-hint full">
                            Đơn đã giao hoặc đã kết thúc — không thể sửa thông tin giao hàng.
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
