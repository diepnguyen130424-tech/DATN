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

    const [vouchers, setVouchers] = useState([]);
    const [loadingVoucher, setLoadingVoucher] = useState(true);

    const [chuongTrinhs, setChuongTrinhs] = useState([]);
    const [loadingCT, setLoadingCT] = useState(true);

    // Mã đã sao chép của tài khoản hiện tại
    const [copiedList, setCopiedList] = useState([]);
    const [thongBao, setThongBao] = useState("");

    // Lấy tên tài khoản đang đăng nhập
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

    const getCacheKey = () => `voucher_copied_${getTenDangNhap()}`;

    // Load danh sách mã đã sao chép
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const raw = localStorage.getItem(getCacheKey());
                if (raw) {
                    const parsed = JSON.parse(raw);
                    setCopiedList(Array.isArray(parsed) ? parsed : []);
                }
            } catch {
                setCopiedList([]);
            }
        }, 0);

        return () => clearTimeout(timer);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        const timer = setTimeout(load, 0);
        return () => clearTimeout(timer);
    }, []);

    // Load chương trình
    useEffect(() => {
        const load = async () => {
            try {
                setLoadingCT(true);
                const res = await fetch(
                    `${API}/chuong-trinh-giam-gia/trang-thai/HOAT_DONG`
                );
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
        const timer = setTimeout(load, 0);
        return () => clearTimeout(timer);
    }, []);

    const copyMa = async (ma) => {
        if (copiedList.includes(ma)) {
            return;
        }

        try {
            let copied = false;

            // Copy bằng Clipboard API
            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {
                try {
                    await navigator.clipboard.writeText(ma);
                    copied = true;
                } catch (error) {
                    console.warn(
                        "Clipboard API lỗi:",
                        error
                    );
                }
            }

            // Fallback
            if (!copied) {
                const textArea =
                    document.createElement("textarea");

                textArea.value = ma;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "-9999px";

                document.body.appendChild(textArea);

                textArea.focus();
                textArea.select();
                textArea.setSelectionRange(
                    0,
                    textArea.value.length
                );

                try {
                    copied = document.execCommand("copy");
                } catch (error) {
                    console.warn(
                        "Fallback copy lỗi:",
                        error
                    );
                }

                document.body.removeChild(textArea);
            }

            if (!copied) {
                setThongBao("Không thể sao chép mã!");
                setTimeout(() => {
                    setThongBao("");
                }, 1800);

                return;
            }

            // ==========================================
            // LƯU MÃ ĐÃ SAO CHÉP
            // ==========================================

            const newList = [
                ...copiedList,
                ma,
            ];

            setCopiedList(newList);

            try {
                localStorage.setItem(
                    getCacheKey(),
                    JSON.stringify(newList)
                );
            } catch (error) {
                console.warn(
                    "Không lưu được localStorage:",
                    error
                );
            }

            // ==========================================
            // THÔNG BÁO
            // ==========================================

            setThongBao(`✓ Đã sao chép mã ${ma}`);

            // Tự biến mất sau 1.8 giây
            setTimeout(() => {
                setThongBao("");
            }, 1800);

            // ==========================================
            // CẬP NHẬT SỐ LƯỢT
            // ==========================================

            setVouchers((old) =>
                old.map((v) =>
                    v.maVoucher === ma
                        ? {
                            ...v,
                            soLuongDaDung:
                                (v.soLuongDaDung || 0) + 1,
                        }
                        : v
                )
            );

        } catch (error) {
            console.error(
                "Lỗi sao chép mã:",
                error
            );

            setThongBao("Không thể sao chép mã!");

            setTimeout(() => {
                setThongBao("");
            }, 1800);
        }
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

                {thongBao && (
                    <div
                        style={{
                            margin: "16px 0",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            background: "#e8f5e9",
                            color: "#2e7d32",
                            fontWeight: 600,
                            textAlign: "center"
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
                                    const daSaoChep = copiedList.includes(
                                        v.maVoucher
                                    );

                                    return (
                                        <div
                                            className="khuyen-mai-card"
                                            key={v.id}
                                        >
                                            <div className="khuyen-mai-badge">
                                                {v.loaiGiam === "PHAN_TRAM"
                                                    ? `-${v.giaTriGiam}%`
                                                    : `-${formatGia(
                                                        v.giaTriGiam
                                                    )}`}
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
                                                                {formatGia(
                                                                    v.donToiThieu
                                                                )}
                                                            </strong>
                                                        </li>
                                                    )}
                                                    {v.loaiGiam ===
                                                        "PHAN_TRAM" &&
                                                        v.giamToiDa && (
                                                            <li>
                                                                Giảm tối đa:{" "}
                                                                <strong>
                                                                    {formatGia(
                                                                        v.giamToiDa
                                                                    )}
                                                                </strong>
                                                            </li>
                                                        )}
                                                    <li>
                                                        Hạn dùng:{" "}
                                                        <strong>
                                                            {formatDate(
                                                                v.ngayKetThuc
                                                            )}
                                                        </strong>
                                                    </li>
                                                    <li>
                                                        Còn lại:{" "}
                                                        <strong>
                                                            {Math.max(
                                                                0,
                                                                (v.soLuong ??
                                                                    0) -
                                                                (v.soLuongDaDung ??
                                                                    0)
                                                            )}{" "}
                                                            lượt
                                                        </strong>
                                                    </li>
                                                </ul>

                                                <button
                                                    type="button"
                                                    className="khuyen-mai-copy"
                                                    onClick={() =>
                                                        copyMa(v.maVoucher)
                                                    }
                                                    disabled={daSaoChep}
                                                >
                                                    {daSaoChep
                                                        ? "✓ Đã sao chép"
                                                        : "📋 Sao chép mã"}
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
                                    <div
                                        className="khuyen-mai-card ct-card"
                                        key={ct.id}
                                    >
                                        <div className="khuyen-mai-badge ct-badge">
                                            {ct.loaiGiam === "PHAN_TRAM"
                                                ? `-${ct.giaTriGiam}%`
                                                : `-${formatGia(
                                                    ct.giaTriGiam
                                                )}`}
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
                                                        {ct.loaiGiam ===
                                                        "PHAN_TRAM"
                                                            ? "Phần trăm"
                                                            : "Số tiền"}
                                                    </strong>
                                                </li>
                                                <li>
                                                    Giá trị:{" "}
                                                    <strong>
                                                        {ct.loaiGiam ===
                                                        "PHAN_TRAM"
                                                            ? `${ct.giaTriGiam}%`
                                                            : formatGia(
                                                                ct.giaTriGiam
                                                            )}
                                                    </strong>
                                                </li>
                                                <li>
                                                    Bắt đầu:{" "}
                                                    <strong>
                                                        {formatDate(
                                                            ct.ngayBatDau
                                                        )}
                                                    </strong>
                                                </li>
                                                <li>
                                                    Kết thúc:{" "}
                                                    <strong>
                                                        {formatDate(
                                                            ct.ngayKetThuc
                                                        )}
                                                    </strong>
                                                </li>
                                            </ul>

                                            <button
                                                type="button"
                                                className="khuyen-mai-copy ct-view-btn"
                                                onClick={() =>
                                                    setPage("products")
                                                }
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
                    💡 Sau khi sao chép mã, vào <strong>Giỏ hàng</strong> →{" "}
                    <strong>Đặt hàng</strong> → dán mã vào ô "Mã giảm giá".
                </div>
            </div>
        </main>
    );
}