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
 * Bảng tổng kết tiền của hóa đơn: tạm tính − giảm giá + phí ship = tổng thanh toán.
 * Dùng dữ liệu đã lưu trong hóa đơn (tongTienHang / tienGiam / phiVanChuyen / tongThanhToan)
 * để admin & nhân viên đối chiếu được phí ship; nếu lưu lệch sẽ có cảnh báo.
 */
export function TongKetTienHoaDon({ order, formatMoney }) {
    if (!order) return null;
    const fmt = formatMoney || ((v) => `${Number(v || 0).toLocaleString("vi-VN")}đ`);
    const hang = Number(order.tongTienHang || 0);
    const giam = Number(order.tienGiam || 0);
    const ship = Number(order.phiVanChuyen || 0);
    const tong = Number(order.tongThanhToan || 0);
    const tinhLai = Math.max(0, hang - giam + ship);
    const lech = Math.abs(tinhLai - tong) > 0.5;
    const online = String(order.loaiHoaDon || "").toUpperCase() === "ONLINE";
    const dong = { display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: "1px solid #f0f1f3" };

    return (
        <section className="hd-section">
            <div className="hd-section-head"><h3>Tổng kết tiền</h3></div>
            <div style={{ maxWidth: 420, fontSize: 14 }}>
                <div style={dong}><span>Tạm tính (tiền hàng)</span><strong>{fmt(hang)}</strong></div>
                <div style={dong}><span>Giảm giá</span><strong style={{ color: giam > 0 ? "#159447" : undefined }}>{giam > 0 ? `-${fmt(giam)}` : fmt(0)}</strong></div>
                {online && (
                    <div style={dong}>
                        <span>Phí vận chuyển{order.voucherFreeship ? " (voucher FREESHIP)" : ""}</span>
                        <strong>{ship === 0 ? "Miễn phí" : fmt(ship)}</strong>
                    </div>
                )}
                <div style={{ ...dong, borderBottom: "none", paddingTop: 10 }}>
                    <span style={{ fontWeight: 700 }}>Tổng thanh toán</span>
                    <strong style={{ color: "#e53935", fontSize: 16 }}>{fmt(tong)}</strong>
                </div>
            </div>
            {lech && (
                <div className="hd-error" style={{ marginTop: 10 }}>
                    ⚠ Tổng thanh toán đã lưu ({fmt(tong)}) không khớp tạm tính − giảm giá + phí ship ({fmt(tinhLai)}).
                    Đơn này bị lưu sai phí ship/giảm giá — hãy kiểm tra lại với khách trước khi giao.
                </div>
            )}
        </section>
    );
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

/* ---------- Xử lý hóa đơn (đổi trạng thái đơn ONLINE) ---------- */

/* Chuyển trạng thái bắt buộc tuần tự, không nhảy cóc (khớp bên Admin) */
export const TRANSITION_HOA_DON = {
    CHO_XAC_NHAN: ["DA_XAC_NHAN", "DA_HUY"], // chỉ hủy được khi CHƯA xác nhận
    DA_XAC_NHAN: ["DANG_CHUAN_BI"],
    DANG_CHUAN_BI: ["DANG_GIAO"],
    DANG_GIAO: ["DA_GIAO"],
    DA_GIAO: ["DA_THANH_TOAN"],
    DA_THANH_TOAN: [],
    DA_HUY: [],
};

const NUT_TRANG_THAI_LABEL = {
    DA_XAC_NHAN: "Xác nhận đơn hàng",
    DANG_CHUAN_BI: "Chuẩn bị hàng",
    DANG_GIAO: "Bắt đầu giao hàng",
    DA_GIAO: "Đã giao hàng",
    DA_THANH_TOAN: "Xác nhận thanh toán",
    DA_HUY: "Hủy đơn",
};

export function laDonOnline(hoaDon) {
    return String(hoaDon?.loaiHoaDon || "").toUpperCase() === "ONLINE";
}

/*
 * Chỉ dành cho đơn ONLINE. Đơn tại quầy → không có nút, chỉ hiện người tạo hóa đơn
 * (dùng <NguoiTaoHoaDon />).
 * onChange(trangThaiMoi) phải trả về Promise (để khóa nút khi đang xử lý).
 */
export function XuLyHoaDon({ order, onChange }) {
    const [dangXuLy, setDangXuLy] = useState(false);
    if (!order || !laDonOnline(order)) return null;

    const tt = String(order.trangThai || "").trim().toUpperCase();
    const dsChoPhep = TRANSITION_HOA_DON[tt] || [];
    const ketThuc = tt === "DA_THANH_TOAN" || tt === "DA_HUY";

    const bam = async (trangThaiMoi) => {
        if (
            trangThaiMoi === "DA_HUY" &&
            !window.confirm("Hủy đơn này? Sau khi hủy sẽ không thể khôi phục.")
        ) {
            return;
        }
        try {
            setDangXuLy(true);
            await onChange(trangThaiMoi);
        } finally {
            setDangXuLy(false);
        }
    };

    return (
        <section className="hd-section">
            <div className="hd-section-head"><h3>Xử lý hóa đơn</h3></div>
            {ketThuc ? (
                <div
                    style={{
                        padding: "10px 14px",
                        background: tt === "DA_HUY" ? "#fdecea" : "#eaf7ed",
                        color: tt === "DA_HUY" ? "#c0392b" : "#24833b",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 13,
                        display: "inline-block",
                    }}
                >
                    {tt === "DA_HUY"
                        ? "❌ Hóa đơn đã bị hủy — không thể thay đổi"
                        : "✅ Hóa đơn đã hoàn tất — không thể thay đổi"}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {dsChoPhep.map((moi) => (
                            <button
                                key={moi}
                                type="button"
                                className={`hd-btn ${moi === "DA_HUY" ? "danger" : "primary"}`}
                                onClick={() => bam(moi)}
                                disabled={dangXuLy}
                            >
                                {dangXuLy ? "Đang xử lý..." : NUT_TRANG_THAI_LABEL[moi] || moi}
                            </button>
                        ))}
                    </div>
                    {tt !== "CHO_XAC_NHAN" && (
                        <div className="hd-hint">🔒 Đơn đã được xác nhận nên không thể hủy.</div>
                    )}
                </div>
            )}
        </section>
    );
}

/* ---------- Đơn tại quầy: tài khoản nào đã tạo hóa đơn ---------- */

/*
 * Ưu tiên nhân viên lưu trên hóa đơn; nếu hóa đơn cũ chưa có thì lấy người
 * thao tác ở dòng lịch sử đầu tiên (sớm nhất).
 */
export function layNguoiTaoHoaDon(order, history) {
    const nv = order?.nhanVien;
    if (nv?.hoTen || nv?.taiKhoan?.tenDangNhap) {
        return {
            ten: nv.hoTen || nv.taiKhoan?.tenDangNhap,
            tenDangNhap: nv.taiKhoan?.tenDangNhap || "",
            vaiTro: "Nhân viên",
        };
    }
    const dau = [...(history || [])]
        .filter((h) => h?.thoiGian)
        .sort((a, b) => new Date(a.thoiGian) - new Date(b.thoiGian))[0];
    if (dau) {
        const ten = dau.nguoiThucHien || dau.nhanVien?.hoTen || "";
        const vaiTro = String(dau.vaiTro || "").toUpperCase();
        if (ten) {
            return {
                ten,
                tenDangNhap: dau.tenDangNhap || "",
                vaiTro: VAI_TRO_LABEL[vaiTro] || "",
            };
        }
    }
    return null;
}

export function NguoiTaoHoaDon({ order, history, formatNgay }) {
    if (!order || laDonOnline(order)) return null;
    const nguoi = layNguoiTaoHoaDon(order, history);
    return (
        <section className="hd-section">
            <div className="hd-section-head"><h3>Thông tin tạo hóa đơn</h3></div>
            <div className="hd-info">
                <div>
                    <span>Tài khoản tạo hóa đơn</span>
                    <strong>
                        {nguoi
                            ? `${nguoi.ten}${nguoi.vaiTro ? ` (${nguoi.vaiTro})` : ""}${
                                nguoi.tenDangNhap && nguoi.tenDangNhap !== nguoi.ten
                                    ? ` · @${nguoi.tenDangNhap}`
                                    : ""
                            }`
                            : "Chưa ghi nhận"}
                    </strong>
                </div>
                <div>
                    <span>Thời gian tạo</span>
                    <strong>{formatNgay ? formatNgay(order.ngayLap) : order.ngayLap || "-"}</strong>
                </div>
                <div className="full hd-hint">
                    Đơn bán tại quầy được thanh toán ngay nên không có bước xử lý đơn.
                </div>
            </div>
        </section>
    );
}

/* ---------- Voucher áp dụng cho đơn hàng ---------- */

export function VoucherApDungHoaDon({ order, formatMoney }) {
    if (!order) return null;
    const fmt = formatMoney || ((v) => `${Number(v || 0).toLocaleString("vi-VN")}đ`);
    const voucher = order.voucher;
    const voucherShip = order.voucherFreeship;
    const loaiGiam = String(voucher?.loaiGiam || "").toUpperCase();
    const giaTriGiam = Number(voucher?.giaTriGiam || 0);
    const giamToiDa = voucher?.giamToiDa;
    const labelLoai =
        loaiGiam === "PHAN_TRAM" ? `${giaTriGiam}%` : loaiGiam === "SO_TIEN" ? fmt(giaTriGiam) : loaiGiam || "Không rõ";

    const dong = { display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid #f0f1f3" };
    const the = (vien) => ({
        padding: 17,
        borderRadius: 14,
        background: "#fff",
        border: `1px solid ${vien}`,
        boxShadow: "0 4px 14px rgba(31,41,55,.035)",
    });
    const icon = (bg, color) => ({
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 44, height: 44, borderRadius: 12, background: bg, color, fontSize: 22,
    });
    const nhan = { fontSize: 12, color: "#667085", fontWeight: 700, marginBottom: 5 };
    const ma = { display: "inline-block", fontSize: 18, color: "#c81e1e", marginRight: 8 };

    return (
        <details className="hd-section">
            <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 8 }}>
                Voucher áp dụng cho đơn hàng
            </summary>
            {!voucher && !voucherShip ? (
                <div style={{ color: "#777" }}>Đơn hàng này không có thông tin voucher được lưu.</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                    {voucher && (
                        <div style={the("#f0e5e7")}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13 }}>
                                <span style={icon("#ffe7eb", "#e11d48")}>◆</span>
                                <div>
                                    <div style={nhan}>VOUCHER GIẢM GIÁ</div>
                                    <strong style={ma}>{voucher.maVoucher || voucher.maGiamGia || "Voucher giảm giá"}</strong>
                                    {loaiGiam === "PHAN_TRAM" && (
                                        <span style={{ display: "inline-block", padding: "5px 9px", borderRadius: 7, background: "#fff0f2", color: "#c81e1e", fontSize: 12, fontWeight: 800 }}>
                                            ↓ Giảm {giaTriGiam}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            {voucher.tenVoucher && (
                                <div style={{ marginBottom: 11, color: "#667085", fontSize: 13 }}>{voucher.tenVoucher}</div>
                            )}
                            <div style={{ fontSize: 14 }}>
                                <div style={dong}><span>Loại giảm</span><strong>{labelLoai}</strong></div>
                                {loaiGiam === "PHAN_TRAM" && (
                                    <div style={dong}><span>Giảm tối đa</span><strong>{giamToiDa != null ? fmt(giamToiDa) : "Không giới hạn"}</strong></div>
                                )}
                                {loaiGiam === "SO_TIEN" && (
                                    <div style={dong}><span>Mức giảm</span><strong>{fmt(giaTriGiam)}</strong></div>
                                )}
                                <div style={{ ...dong, borderBottom: "none", padding: "9px 0 2px" }}>
                                    <span>Số tiền đã giảm</span>
                                    <strong style={{ color: "#159447" }}>{fmt(order.tienGiam || 0)}</strong>
                                </div>
                            </div>
                        </div>
                    )}
                    {voucherShip && (
                        <div style={the("#e1edf9")}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13 }}>
                                <span style={icon("#e6f2ff", "#1680d6")}>➜</span>
                                <div>
                                    <div style={nhan}>VOUCHER FREESHIP</div>
                                    <strong style={ma}>{voucherShip.maVoucher || voucherShip.maGiamGia || "FREESHIP"}</strong>
                                    <span style={{ display: "inline-block", padding: "5px 9px", borderRadius: 7, background: "#eaf4ff", color: "#1670b9", fontSize: 12, fontWeight: 800 }}>
                                        Miễn phí vận chuyển
                                    </span>
                                </div>
                            </div>
                            {voucherShip.tenVoucher && (
                                <div style={{ marginBottom: 11, color: "#667085", fontSize: 13 }}>{voucherShip.tenVoucher}</div>
                            )}
                            <div style={{ fontSize: 14 }}>
                                <div style={dong}><span>Loại giảm</span><strong>Miễn phí vận chuyển</strong></div>
                                <div style={{ ...dong, borderBottom: "none", padding: "9px 0 2px" }}>
                                    <span>Phí vận chuyển sau giảm</span>
                                    <strong style={{ color: "#159447" }}>{fmt(order.phiVanChuyen || 0)}</strong>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </details>
    );
}
