import { useEffect, useState } from "react";

const API = "http://localhost:8080/api";

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

/* ⭐ Mô tả phạm vi áp dụng */
function moTaPhamVi(ct) {
    const pv = ct?.phamViApDung || "TAT_CA";
    if (pv === "THUONG_HIEU") return ct.tenThuongHieu ? `Hãng ${ct.tenThuongHieu}` : "Theo hãng";
    if (pv === "SAN_PHAM") return `${(ct.sanPhams || []).length} sản phẩm`;
    if (pv === "BIEN_THE") return `${(ct.bienThes || []).length} size/màu`;
    return "Toàn bộ sản phẩm";
}

/* ⭐ Kiểm tra còn hiệu lực */
function isConHieuLuc(item) {
    const trangThai = String(item?.trangThai || "HOAT_DONG").toUpperCase();
    if (trangThai === "NGUNG_HOAT_DONG") return false;

    const now = new Date();

    if (item?.ngayBatDau) {
        const batDau = new Date(item.ngayBatDau);
        if (!Number.isNaN(batDau.getTime()) && now < batDau) return false;
    }

    if (item?.ngayKetThuc) {
        const ketThuc = new Date(item.ngayKetThuc);
        if (!Number.isNaN(ketThuc.getTime())) {
            const hetHan = new Date(ketThuc);
            hetHan.setHours(23, 59, 59, 999);
            if (now > hetHan) return false;
        }
    }
    return true;
}

export default function KhuyenMai({ setPage }) {
    const [activeTab, setActiveTab] = useState("voucher");

    const [vouchers, setVouchers] = useState([]);
    const [loadingVoucher, setLoadingVoucher] = useState(true);

    const [chuongTrinhs, setChuongTrinhs] = useState([]);
    const [loadingCT, setLoadingCT] = useState(true);

    // Danh sách mã đã LƯU
    const [savedList, setSavedList] = useState([]);
    const [thongBao, setThongBao] = useState("");

    const getTenDangNhap = () => {
        try {
            const raw = localStorage.getItem("taiKhoan");
            if (!raw) return "guest";
            const tk = JSON.parse(raw);
            return tk?.tenDangNhap || "guest";
        } catch {
            return "guest";
        }
    };

    // Dùng chung key với trang Thanh toán
    const getCacheKey = () => `saved_vouchers_${getTenDangNhap()}`;

    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const raw = localStorage.getItem(getCacheKey());
                if (raw) {
                    const parsed = JSON.parse(raw);
                    setSavedList(Array.isArray(parsed) ? parsed : []);
                }
            } catch {
                setSavedList([]);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                setLoadingVoucher(true);
                const res = await fetch(`${API}/ma-giam-gia/dang-hoat-dong`);
                if (!res.ok) throw new Error("Không tải được voucher");
                const data = await res.json();
                const raw = Array.isArray(data) ? data : [];
                setVouchers(raw.filter(isConHieuLuc));
            } catch (err) {
                console.error(err);
                setVouchers([]);
            } finally {
                setLoadingVoucher(false);
            }
        };
        const timer = setTimeout(load, 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                setLoadingCT(true);
                const res = await fetch(
                    `${API}/chuong-trinh-giam-gia/dang-hoat-dong`
                );
                if (!res.ok) throw new Error("Không tải được chương trình");
                const data = await res.json();
                const raw = Array.isArray(data) ? data : [];
                setChuongTrinhs(raw.filter(isConHieuLuc));
            } catch (err) {
                console.error(err);
                setChuongTrinhs([]);
            } finally {
                setLoadingCT(false);
            }
        };
        const timer = setTimeout(load, 0);
        return () => clearTimeout(timer);
    }, []);

    // ⭐ Hàm Lưu / Bỏ lưu mã
    const luuMa = (ma) => {
        const daLuu = savedList.includes(ma);
        let newList = [];

        if (daLuu) {
            // Đã lưu -> Bỏ lưu
            newList = savedList.filter((item) => item !== ma);
            setThongBao(`Đã bỏ lưu mã ${ma}`);
        } else {
            // Chưa lưu -> Lưu vào mảng
            newList = [...savedList, ma];
            setThongBao(`✓ Đã lưu mã ${ma}`);
        }

        setSavedList(newList);
        localStorage.setItem(getCacheKey(), JSON.stringify(newList));
        setTimeout(() => setThongBao(""), 1800);
    };

    return (
        <main className="khuyen-mai-page">
            <div className="container">
                <div className="breadcrumb">Trang chủ / Khuyến mãi</div>

                <div className="khuyen-mai-heading">
                    <span className="section-label">FSHOP</span>
                    <h1>🎁 Khuyến mãi đang có</h1>
                    <p>Khám phá ưu đãi và chương trình giảm giá hấp dẫn.</p>
                </div>

                <div className="khuyen-mai-tabs">
                    <button
                        type="button"
                        className={activeTab === "voucher" ? "active" : ""}
                        onClick={() => setActiveTab("voucher")}
                    >
                        🏷️ Mã giảm giá
                    </button>
                    <button
                        type="button"
                        className={activeTab === "chuong-trinh" ? "active" : ""}
                        onClick={() => setActiveTab("chuong-trinh")}
                    >
                        🔥 Chương trình
                    </button>
                </div>

                {thongBao && (
                    <div
                        style={{
                            margin: "16px 0",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            background: "#e8f5e9",
                            color: "#2e7d32",
                            fontWeight: 600,
                            textAlign: "center",
                        }}
                    >
                        {thongBao}
                    </div>
                )}

                {/* ===== TAB 1: VOUCHER ===== */}
                {activeTab === "voucher" && (
                    <>
                        {loadingVoucher && (
                            <p style={{ textAlign: "center", padding: 40 }}>
                                Đang tải...
                            </p>
                        )}

                        {!loadingVoucher && vouchers.length === 0 && (
                            <div className="empty-cart">
                                <div className="empty-cart-icon">🎁</div>
                                <h2>Chưa có mã giảm giá nào</h2>
                                <p>Hãy quay lại sau để xem ưu đãi mới nhất.</p>
                                <button onClick={() => setPage("products")}>
                                    Tiếp tục mua hàng →
                                </button>
                            </div>
                        )}

                        {!loadingVoucher && vouchers.length > 0 && (
                            <div className="khuyen-mai-grid">
                                {vouchers.map((v) => {
                                    const daLuu = savedList.includes(v.maVoucher);
                                    return (
                                        <div className="khuyen-mai-card" key={v.id}>
                                            <div className="khuyen-mai-badge">
                                                {v.loaiGiam === "PHAN_TRAM"
                                                    ? `-${v.giaTriGiam}%`
                                                    : `-${formatGia(v.giaTriGiam)}`}
                                            </div>

                                            <div className="khuyen-mai-body">
                                                <div className="khuyen-mai-code">
                                                    {v.maVoucher}
                                                </div>
                                                <h3>{v.tenVoucher}</h3>

                                                <ul className="khuyen-mai-info">
                                                    {v.donToiThieu && (
                                                        <li>
                                                            Đơn tối thiểu:{" "}
                                                            <strong>{formatGia(v.donToiThieu)}</strong>
                                                        </li>
                                                    )}
                                                    {v.loaiGiam === "PHAN_TRAM" && v.giamToiDa && (
                                                        <li>
                                                            Giảm tối đa:{" "}
                                                            <strong>{formatGia(v.giamToiDa)}</strong>
                                                        </li>
                                                    )}
                                                    <li>
                                                        Hạn dùng:{" "}
                                                        <strong>{formatDate(v.ngayKetThuc)}</strong>
                                                    </li>
                                                    <li>
                                                        Còn lại:{" "}
                                                        <strong>
                                                            {Math.max(
                                                                0,
                                                                (v.soLuong ?? 0) - (v.soLuongDaDung ?? 0)
                                                            )}{" "}
                                                            lượt
                                                        </strong>
                                                    </li>
                                                </ul>

                                                <button
                                                    type="button"
                                                    className="khuyen-mai-copy"
                                                    onClick={() => luuMa(v.maVoucher)}
                                                    style={{
                                                        background: daLuu ? "#f1f8f2" : "#111",
                                                        color: daLuu ? "#2e7d32" : "#fff",
                                                        border: daLuu ? "1px solid #2e7d32" : "none"
                                                    }}
                                                >
                                                    {daLuu ? "✓ Đã lưu (Bấm để bỏ)" : "🔖 Lưu mã"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ===== TAB 2: CHƯƠNG TRÌNH ===== */}
                {activeTab === "chuong-trinh" && (
                    <>
                        {loadingCT && (
                            <p style={{ textAlign: "center", padding: 40 }}>
                                Đang tải...
                            </p>
                        )}

                        {!loadingCT && chuongTrinhs.length === 0 && (
                            <div className="empty-cart">
                                <div className="empty-cart-icon">🔥</div>
                                <h2>Chưa có chương trình nào</h2>
                                <p>Hãy quay lại sau để xem ưu đãi mới nhất.</p>
                                <button onClick={() => setPage("products")}>
                                    Tiếp tục mua hàng →
                                </button>
                            </div>
                        )}

                        {!loadingCT && chuongTrinhs.length > 0 && (
                            <div className="khuyen-mai-grid">
                                {chuongTrinhs.map((ct) => (
                                    <div className="khuyen-mai-card ct-card" key={ct.id}>
                                        <div className="khuyen-mai-badge ct-badge">
                                            {ct.loaiGiam === "PHAN_TRAM"
                                                ? `-${ct.giaTriGiam}%`
                                                : `-${formatGia(ct.giaTriGiam)}`}
                                        </div>

                                        <div className="khuyen-mai-body">
                                            <div className="ct-icon">🔥</div>
                                            <h3 className="ct-title">{ct.tenChuongTrinh}</h3>

                                            <ul className="khuyen-mai-info">
                                                <li>
                                                    Loại giảm:{" "}
                                                    <strong>
                                                        {ct.loaiGiam === "PHAN_TRAM"
                                                            ? "Phần trăm"
                                                            : "Số tiền"}
                                                    </strong>
                                                </li>
                                                <li>
                                                    Giá trị:{" "}
                                                    <strong>
                                                        {ct.loaiGiam === "PHAN_TRAM"
                                                            ? `${ct.giaTriGiam}%`
                                                            : formatGia(ct.giaTriGiam)}
                                                    </strong>
                                                </li>
                                                <li>
                                                    Áp dụng:{" "}
                                                    <strong style={{ color: "#e53935" }}>
                                                        {moTaPhamVi(ct)}
                                                    </strong>
                                                </li>
                                                <li>
                                                    Bắt đầu:{" "}
                                                    <strong>{formatDate(ct.ngayBatDau)}</strong>
                                                </li>
                                                <li>
                                                    Kết thúc:{" "}
                                                    <strong>{formatDate(ct.ngayKetThuc)}</strong>
                                                </li>
                                            </ul>

                                            <button
                                                type="button"
                                                className="khuyen-mai-copy ct-view-btn"
                                                onClick={() => setPage("products")}
                                            >
                                                🛍️ Xem sản phẩm →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                <div className="khuyen-mai-note">
                    💡 Mã đã lưu sẽ tự động hiển thị ở đầu danh sách khi bạn thanh toán đơn hàng.
                </div>
            </div>
        </main>
    );
}