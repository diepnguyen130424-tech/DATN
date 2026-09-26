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

export default function KhuyenMai({ setPage }) {
    const [activeTab, setActiveTab] = useState("voucher");

    // ===== TAB 1: VOUCHER =====
    const [vouchers, setVouchers] = useState([]);
    const [loadingVoucher, setLoadingVoucher] = useState(true);
    const [copied, setCopied] = useState("");

    // ===== TAB 2: CHƯƠNG TRÌNH =====
    const [chuongTrinhs, setChuongTrinhs] = useState([]);
    const [loadingCT, setLoadingCT] = useState(true);

    // Load voucher
    useEffect(() => {
        const load = async () => {
            try {
                setLoadingVoucher(true);
                const res = await fetch(`${API}/ma-giam-gia/dang-hoat-dong`);
                if (!res.ok) throw new Error("Không tải được voucher");
                const data = await res.json();
                setVouchers(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setVouchers([]);
            } finally {
                setLoadingVoucher(false);
            }
        };
        load();
    }, []);

    // Load chương trình
    useEffect(() => {
        const load = async () => {
            try {
                setLoadingCT(true);
                const res = await fetch(`${API}/chuong-trinh-giam-gia/trang-thai/HOAT_DONG`);
                if (!res.ok) throw new Error("Không tải được chương trình");
                const data = await res.json();
                setChuongTrinhs(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setChuongTrinhs([]);
            } finally {
                setLoadingCT(false);
            }
        };
        load();
    }, []);

    const copyMa = (ma) => {
        navigator.clipboard.writeText(ma).then(() => {
            setCopied(ma);
            setTimeout(() => setCopied(""), 2000);
        });
    };

    return (
        <main className="khuyen-mai-page">
            <div className="container">
                <div className="breadcrumb">Trang chủ / Khuyến mãi</div>

                <div className="khuyen-mai-heading">
                    <span className="section-label">FSHOP</span>
                    <h1>🎁 Khuyến mãi đang có</h1>
                    <p>
                        Khám phá ưu đãi và chương trình giảm giá hấp dẫn.
                    </p>
                </div>

                {/* ===== TABS ===== */}
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
                                {vouchers.map((v) => (
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
                                                        <strong>
                                                            {formatGia(v.donToiThieu)}
                                                        </strong>
                                                    </li>
                                                )}
                                                {v.loaiGiam === "PHAN_TRAM" &&
                                                    v.giamToiDa && (
                                                        <li>
                                                            Giảm tối đa:{" "}
                                                            <strong>
                                                                {formatGia(v.giamToiDa)}
                                                            </strong>
                                                        </li>
                                                    )}
                                                <li>
                                                    Hạn dùng:{" "}
                                                    <strong>
                                                        {formatDate(v.ngayKetThuc)}
                                                    </strong>
                                                </li>
                                                <li>
                                                    Còn lại:{" "}
                                                    <strong>
                                                        {Math.max(
                                                            0,
                                                            (v.soLuong ?? 0) -
                                                                (v.soLuongDaDung ?? 0)
                                                        )}{" "}
                                                        lượt
                                                    </strong>
                                                </li>
                                            </ul>

                                            <button
                                                type="button"
                                                className="khuyen-mai-copy"
                                                onClick={() => copyMa(v.maVoucher)}
                                            >
                                                {copied === v.maVoucher
                                                    ? "✓ Đã sao chép"
                                                    : "📋 Sao chép mã"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
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
                                            <h3 className="ct-title">
                                                {ct.tenChuongTrinh}
                                            </h3>

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
                                                    Bắt đầu:{" "}
                                                    <strong>
                                                        {formatDate(ct.ngayBatDau)}
                                                    </strong>
                                                </li>
                                                <li>
                                                    Kết thúc:{" "}
                                                    <strong>
                                                        {formatDate(ct.ngayKetThuc)}
                                                    </strong>
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

{/*                 <div className="khuyen-mai-note"> */}
{/*                     💡 Sau khi sao chép mã, vào <strong>Giỏ hàng</strong> →{" "} */}
{/*                     <strong>Đặt hàng</strong> → dán mã vào ô "Mã giảm giá". */}
{/*                 </div> */}
            </div>
        </main>
    );
}