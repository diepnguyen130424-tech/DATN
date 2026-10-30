import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import AdminProducts from "./AdminProducts";
import AdminKho from "./AdminKho";
import AdminVoucher from "./AdminVoucher";
import AdminKhuyenMai from "./AdminKhuyenMai";
import AdminDanhMuc from "./AdminDanhMuc";
import AdminThuongHieu from "./AdminThuongHieu";
import AdminKichCo from "./AdminKichCo";
import AdminMauSac from "./AdminMauSac";
import AdminSettings from "./AdminSettings";
import Returns from "./Returns";
const API = "http://localhost:8080/api";
const adminDataCache = {
    hoaDons: null,
    hoaDonsPromise: null,
    khachHangs: null,
    khachHangsPromise: null,
    thanhToans: {},
    thanhToanPromises: {}
};
async function getHoaDons(force = false) {
    if (!force && adminDataCache.hoaDons) {
        return adminDataCache.hoaDons;
    }
    if (!force && adminDataCache.hoaDonsPromise) {
        return adminDataCache.hoaDonsPromise;
    }
    const promise = fetch(`${API}/hoa-don`)
        .then(async (response) => {
            const text = await response.text();
            let data;
            try {
                data = text ? JSON.parse(text) : null;
            }
            catch {
                data = null;
            }
            if (!response.ok) {
                throw new Error(data?.message ||
                    data?.error ||
                    text ||
                    "Không thể tải danh sách hóa đơn");
            }
            const danhSach = Array.isArray(data) ? data : [];
            danhSach.sort((a, b) => {
                const ngayA = new Date(a?.ngayLap || a?.ngayTao || 0).getTime();
                const ngayB = new Date(b?.ngayLap || b?.ngayTao || 0).getTime();
                return ngayB - ngayA;
            });
            adminDataCache.hoaDons = danhSach;
            return danhSach;
        })
        .finally(() => {
            adminDataCache.hoaDonsPromise = null;
        });
    adminDataCache.hoaDonsPromise = promise;
    return promise;
}
async function getKhachHangs(force = false) {
    if (!force && adminDataCache.khachHangs) {
        return adminDataCache.khachHangs;
    }
    if (!force && adminDataCache.khachHangsPromise) {
        return adminDataCache.khachHangsPromise;
    }
    const promise = fetch(`${API}/khach-hang`)
        .then(async (response) => {
            const data = await response.json().catch(() => []);
            if (!response.ok) {
                throw new Error(data?.message ||
                    data?.error ||
                    "Không thể tải danh sách khách hàng");
            }
            const danhSach = Array.isArray(data) ? data : [];
            adminDataCache.khachHangs = danhSach;
            return danhSach;
        })
        .finally(() => {
            adminDataCache.khachHangsPromise = null;
        });
    adminDataCache.khachHangsPromise = promise;
    return promise;
}
async function getThanhToanByHoaDonId(id, force = false) {
    if (!force && adminDataCache.thanhToans[id]) {
        return adminDataCache.thanhToans[id];
    }
    if (!force && adminDataCache.thanhToanPromises[id]) {
        return adminDataCache.thanhToanPromises[id];
    }
    const promise = fetch(`${API}/hoa-don/${id}/thanh-toan`)
        .then(async (response) => {
            if (!response.ok) {
                return null;
            }
            const data = await response.json().catch(() => null);
            if (data) {
                adminDataCache.thanhToans[id] = data;
            }
            return data;
        })
        .finally(() => {
            delete adminDataCache.thanhToanPromises[id];
        });
    adminDataCache.thanhToanPromises[id] = promise;
    return promise;
}
async function prefetchAdminData() {
    const [hoaDonResult] = await Promise.allSettled([
        getHoaDons(),
        getKhachHangs()
    ]);
    if (hoaDonResult.status === "fulfilled") {
        const danhSachHoaDon = hoaDonResult.value;
        danhSachHoaDon.forEach((hoaDon) => {
            getThanhToanByHoaDonId(hoaDon.id).catch((err) => {
                console.error(`Lỗi tải thanh toán hóa đơn ${hoaDon.id}:`, err);
            });
        });
    }
    else {
        console.error("Lỗi preload hóa đơn:", hoaDonResult.reason);
    }
}
const menuItems = [
    { id: "dashboard", icon: "▦", label: "Tổng quan" },
    { id: "ban-hang", icon: "🛒", label: "Bán hàng tại quầy" },
    { id: "san-pham", icon: "□", label: "Sản phẩm" },
    { id: "kho", icon: "▣", label: "Kho hàng" },
    { id: "danh-muc", icon: "▤", label: "Danh mục" },
    { id: "thuong-hieu", icon: "◇", label: "Thương hiệu" },
    { id: "kich-co", icon: "↔", label: "Kích cỡ" },
    { id: "mau-sac", icon: "●", label: "Màu sắc" },
    { id: "voucher", icon: "◇", label: "Voucher" },
    { id: "khuyen-mai", icon: "✦", label: "Khuyến mãi" },
    { id: "hoa-don", icon: "▧", label: "Hóa đơn" },
    { id: "doi-tra", icon: "↩", label: "Đổi trả hàng" },
    { id: "thanh-toan", icon: "▤", label: "Thanh toán" },
    { id: "khach-hang", icon: "◎", label: "Khách hàng" },
    { id: "nhan-vien", icon: "♙", label: "Nhân viên" },
];
/* ⭐ DANH SÁCH TẤT CẢ TRẠNG THÁI HÓA ĐƠN (dùng cho dropdown filter) */
const TRANG_THAI_HOA_DON = [
    "CHO_XAC_NHAN",
    "DA_XAC_NHAN",
    "DANG_CHUAN_BI",
    "DANG_GIAO",
    "DA_GIAO",
    "DA_THANH_TOAN",
    "DA_HUY",
];

/* ⭐ BẢNG CHUYỂN TRẠNG THÁI — BẮT BUỘC tuần tự, không nhảy cóc */
const TRANSITION_HOA_DON = {
    CHO_XAC_NHAN:  ["DA_XAC_NHAN", "DA_HUY"],
    DA_XAC_NHAN:   ["DANG_CHUAN_BI", "DA_HUY"],
    DANG_CHUAN_BI: ["DANG_GIAO", "DA_HUY"],
    DANG_GIAO:     ["DA_GIAO", "DA_HUY"],
    DA_GIAO:       ["DA_THANH_TOAN"],
    DA_THANH_TOAN: [],
    DA_HUY:        [],
};

/* ⭐ Lấy danh sách trạng thái được phép chuyển từ trạng thái hiện tại */
function layTrangThaiChoPhep(trangThaiHienTai) {
    const key = String(trangThaiHienTai || "").trim().toUpperCase();
    return TRANSITION_HOA_DON[key] || [];
}

/* ⭐ Đang ở trạng thái kết thúc (không đổi được nữa)? */
function laTrangThaiKetThuc(trangThai) {
    const key = String(trangThai || "").trim().toUpperCase();
    return key === "DA_THANH_TOAN" || key === "DA_HUY";
}
const TRANG_THAI_THANH_TOAN = [
    "CHO_THANH_TOAN",
    "DA_THANH_TOAN",
    "THAT_BAI",
];
function formatTien(value) {
    const number = Number(value || 0);
    return (number.toLocaleString("vi-VN") +
        "đ");
}
function formatNgay(value) {
    if (!value) {
        return "-";
    }
    try {
        return new Date(value).toLocaleString("vi-VN");
    }
    catch {
        return String(value);
    }
}
function tenTrangThaiHoaDon(trangThai) {
    const map = {
        CHO_XAC_NHAN: "Chờ xác nhận",
        DA_XAC_NHAN: "Đã xác nhận",
        DANG_CHUAN_BI: "Đang chuẩn bị",
        DANG_GIAO: "Đang giao",
        DA_GIAO: "Đã giao",
        DA_THANH_TOAN: "Đã thanh toán",
        DA_HUY: "Đã hủy",
    };
    return (map[trangThai] ||
        trangThai ||
        "-");
}
function getTrangThaiDonHangStyle(trangThai) {
    const styles = {
        CHO_XAC_NHAN: {
            background: "#fff3e0",
            color: "#ef6c00",
        },
        DA_XAC_NHAN: {
            background: "#e8f5e9",
            color: "#2e7d32",
        },
        DANG_CHUAN_BI: {
            background: "#ffebee",
            color: "#e53935",
        },
        DANG_GIAO: {
            background: "#f3e5f5",
            color: "#7e57c2",
        },
        DA_GIAO: {
            background: "#e8f5e9",
            color: "#2e9d5b",
        },
        DA_THANH_TOAN: {
            background: "#e8f5e9",
            color: "#2e7d32",
        },
        DA_HUY: {
            background: "#ffebee",
            color: "#c62828",
        },
    };

    return styles[trangThai] || {
        background: "#f5f5f5",
        color: "#666",
    };
}

function tenTrangThaiThanhToan(trangThai) {
    const map = {
        CHO_THANH_TOAN: "Chờ thanh toán",
        DA_THANH_TOAN: "Đã thanh toán",
        THAT_BAI: "Thanh toán thất bại",
    };
    return (map[trangThai] ||
        trangThai ||
        "-");
}
function tenLoaiHoaDon(loaiHoaDon) {
    const map = {
        ONLINE: "Online",
        TAI_QUAY: "Tại quầy",
    };
    return (map[loaiHoaDon] ||
        loaiHoaDon ||
        "-");
}
function tenPhuongThuc(phuongThuc) {
    const map = {
        COD: "Thanh toán khi nhận hàng",
        TIEN_MAT: "Tiền mặt",
        CHUYEN_KHOAN: "Chuyển khoản",
        VNPAY: "VNPay",
        MOMO: "MoMo",
    };
    return (map[phuongThuc] ||
        phuongThuc ||
        "-");
}
function hienThiChucVu(chucVu) {
    if (chucVu === "NHAN_VIEN_BAN_HANG") {
        return "Nhân viên bán hàng";
    }
    return chucVu || "-";
}
function hienThiTrangThaiNhanVien(trangThai) {
    if (trangThai === "HOAT_DONG" ||
        trangThai === "ACTIVE") {
        return "Hoạt động";
    }
    if (trangThai === "NGUNG_HOAT_DONG") {
        return "Ngừng hoạt động";
    }
    return trangThai || "-";
}
function layTenSanPham(chiTiet) {
    return (chiTiet?.sanPhamChiTiet?.sanPham
            ?.tenSanPham ||
        chiTiet?.sanPhamChiTiet?.sanPham
            ?.ten ||
        chiTiet?.sanPham?.tenSanPham ||
        "Sản phẩm");
}
function formatChartMoney(value) {
    const number = Number(value || 0);

    if (number >= 1000000) {
        const million = number / 1000000;
        return `${Number.isInteger(million) ? million : million.toFixed(1)}tr`;
    }

    if (number >= 1000) {
        const thousand = number / 1000;
        return `${Number.isInteger(thousand) ? thousand : thousand.toFixed(1)}k`;
    }

    return `${number.toLocaleString("vi-VN")}`;
}

function isRevenueOrder(hoaDon) {
    const status = String(hoaDon?.trangThai || "").toUpperCase();

    return (
        status === "DA_GIAO" ||
        status === "DA_THANH_TOAN"
    );
}

function getHoaDonDate(hoaDon) {
    const value =
        hoaDon?.ngayLap ||
        hoaDon?.ngayTao ||
        hoaDon?.ngayCapNhat;

    if (!value) return null;

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}

function isSameDay(dateA, dateB) {
    if (!dateA || !dateB) return false;

    return (
        dateA.getFullYear() === dateB.getFullYear() &&
        dateA.getMonth() === dateB.getMonth() &&
        dateA.getDate() === dateB.getDate()
    );
}

function DashboardContent({ onViewAll }) {
    // Mỗi loại dữ liệu có state riêng.
    // API nào trả về trước thì giao diện cập nhật trước,
    // không chờ tất cả API xong mới hiển thị.
    const [productCount, setProductCount] = useState(null);
    const [customerCount, setCustomerCount] = useState(
        adminDataCache.khachHangs?.length ?? null
    );
    const [hoaDons, setHoaDons] = useState(
        adminDataCache.hoaDons || []
    );

    const [loadingOrders, setLoadingOrders] = useState(
        !adminDataCache.hoaDons
    );

    const [loadingProducts, setLoadingProducts] = useState(
        true
    );

    const [loadingCustomers, setLoadingCustomers] = useState(
        !adminDataCache.khachHangs
    );

    const [dashboardError, setDashboardError] =
        useState("");

    // Tải sản phẩm độc lập.
    useEffect(() => {
        let mounted = true;

        fetch(`${API}/san-pham`)
            .then(async (response) => {
                const text = await response.text();

                let data = [];

                try {
                    data = text ? JSON.parse(text) : [];
                } catch {
                    data = [];
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        data?.error ||
                        text ||
                        "Không thể tải sản phẩm"
                    );
                }

                return Array.isArray(data)
                    ? data
                    : [];
            })
            .then((data) => {
                if (!mounted) return;

                setProductCount(data.length);
            })
            .catch((err) => {
                console.error(
                    "Lỗi tải sản phẩm Dashboard:",
                    err
                );

                if (mounted) {
                    setDashboardError(
                        (old) =>
                            old ||
                            "Không thể tải dữ liệu sản phẩm."
                    );
                }
            })
            .finally(() => {
                if (mounted) {
                    setLoadingProducts(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    // Tải khách hàng độc lập.
    useEffect(() => {
        let mounted = true;

        if (adminDataCache.khachHangs) {
            setCustomerCount(
                adminDataCache.khachHangs.length
            );
            setLoadingCustomers(false);
            return () => {
                mounted = false;
            };
        }

        getKhachHangs()
            .then((data) => {
                if (!mounted) return;

                setCustomerCount(data.length);
            })
            .catch((err) => {
                console.error(
                    "Lỗi tải khách hàng Dashboard:",
                    err
                );

                if (mounted) {
                    setDashboardError(
                        (old) =>
                            old ||
                            "Không thể tải dữ liệu khách hàng."
                    );
                }
            })
            .finally(() => {
                if (mounted) {
                    setLoadingCustomers(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    // Tải hóa đơn độc lập.
    useEffect(() => {
        let mounted = true;

        getHoaDons()
            .then((data) => {
                if (!mounted) return;

                setHoaDons(data);
            })
            .catch((err) => {
                console.error(
                    "Lỗi tải đơn hàng Dashboard:",
                    err
                );

                if (mounted) {
                    setDashboardError(
                        (old) =>
                            old ||
                            "Không thể tải dữ liệu đơn hàng."
                    );
                }
            })
            .finally(() => {
                if (mounted) {
                    setLoadingOrders(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    const totalRevenue = hoaDons
        .filter(isRevenueOrder)
        .reduce(
            (sum, hoaDon) =>
                sum +
                Number(
                    hoaDon?.tongThanhToan || 0
                ),
            0
        );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const revenueByDay = Array.from(
        { length: 7 },
        (_, index) => {
            const date = new Date(today);

            date.setDate(
                today.getDate() -
                (6 - index)
            );

            const revenue = hoaDons
                .filter(
                    (hoaDon) =>
                        isRevenueOrder(hoaDon) &&
                        isSameDay(
                            getHoaDonDate(hoaDon),
                            date
                        )
                )
                .reduce(
                    (sum, hoaDon) =>
                        sum +
                        Number(
                            hoaDon?.tongThanhToan ||
                            0
                        ),
                    0
                );

            return {
                date,
                revenue,
                label: date.toLocaleDateString(
                    "vi-VN",
                    {
                        weekday: "short",
                    }
                ),
            };
        }
    );

    const maxRevenue = Math.max(
        ...revenueByDay.map(
            (item) => item.revenue
        ),
        1
    );

    const statusCounts = {
        pending: hoaDons.filter(
            (hoaDon) =>
                hoaDon?.trangThai ===
                "CHO_XAC_NHAN"
        ).length,

        processing: hoaDons.filter(
            (hoaDon) =>
                hoaDon?.trangThai ===
                "DA_XAC_NHAN" ||
                hoaDon?.trangThai ===
                "DANG_CHUAN_BI"
        ).length,

        shipping: hoaDons.filter(
            (hoaDon) =>
                hoaDon?.trangThai ===
                "DANG_GIAO"
        ).length,

        done: hoaDons.filter(
            (hoaDon) =>
                hoaDon?.trangThai ===
                "DA_GIAO"
        ).length,
    };

    const recentOrders = hoaDons.slice(0, 4);

    return (
        <div className="admin-dashboard-content">
            <div className="admin-page-heading">
                <div>
                    <div className="admin-eyebrow">
                        FSHOP ADMIN
                    </div>

                    <h1>Tổng quan</h1>

                    <p>
                        Theo dõi hoạt động kinh doanh
                        thực tế của cửa hàng.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-date-button"
                >
                    <span>▣</span>
                    Tháng{" "}
                    {String(
                        today.getMonth() + 1
                    ).padStart(2, "0")}
                    /{today.getFullYear()}
                </button>
            </div>

            {dashboardError ? (
                <div
                    className="admin-card"
                    style={{
                        marginBottom: "20px",
                        color: "#c62828",
                    }}
                >
                    {dashboardError}
                </div>
            ) : null}

            <div className="admin-stats">
                <div className="admin-stat-card">
                    <div className="admin-stat-top">
                        <div className="admin-stat-icon">
                            □
                        </div>

                        <span className="admin-growth">
                            Database
                        </span>
                    </div>

                    <div className="admin-stat-value">
                        {loadingProducts
                            ? "..."
                            : productCount.toLocaleString(
                                "vi-VN"
                            )}
                    </div>

                    <div className="admin-stat-label">
                        Tổng sản phẩm
                    </div>
                </div>

                <div className="admin-stat-card">
                    <div className="admin-stat-top">
                        <div className="admin-stat-icon">
                            ▧
                        </div>

                        <span className="admin-growth">
                            Database
                        </span>
                    </div>

                    <div className="admin-stat-value">
                        {loadingOrders
                            ? "..."
                            : hoaDons.length.toLocaleString(
                                "vi-VN"
                            )}
                    </div>

                    <div className="admin-stat-label">
                        Đơn hàng
                    </div>
                </div>

                <div className="admin-stat-card">
                    <div className="admin-stat-top">
                        <div className="admin-stat-icon">
                            ◎
                        </div>

                        <span className="admin-growth">
                            Database
                        </span>
                    </div>

                    <div className="admin-stat-value">
                        {loadingCustomers
                            ? "..."
                            : customerCount.toLocaleString(
                                "vi-VN"
                            )}
                    </div>

                    <div className="admin-stat-label">
                        Khách hàng
                    </div>
                </div>

                <div className="admin-stat-card">
                    <div className="admin-stat-top">
                        <div className="admin-stat-icon">
                            ₫
                        </div>

                        <span className="admin-growth">
                            Đã giao / đã thanh toán
                        </span>
                    </div>

                    <div className="admin-stat-value">
                        {loadingOrders
                            ? "..."
                            : formatTien(totalRevenue)}
                    </div>

                    <div className="admin-stat-label">
                        Doanh thu
                    </div>
                </div>
            </div>

            <div className="admin-dashboard-grid">
                <section className="admin-card revenue-card">
                    <div className="admin-card-heading">
                        <div>
                            <h2>Doanh thu</h2>

                            <p>
                                Doanh thu thực tế trong
                                7 ngày gần nhất
                            </p>
                        </div>

                        <strong>
                            {loadingOrders
                                ? "Đang tải..."
                                : formatTien(
                                    totalRevenue
                                )}
                        </strong>
                    </div>

                    <div className="revenue-chart">
                        <div className="chart-labels">
                            {[
                                5,
                                4,
                                3,
                                2,
                                1,
                                0,
                            ].map((level) => (
                                <span key={level}>
                                    {formatChartMoney(
                                        (maxRevenue /
                                            5) *
                                        level
                                    )}
                                </span>
                            ))}
                        </div>

                        <div className="chart-main">
                            <div className="chart-grid-lines">
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                            </div>

                            <div className="chart-bars">
                                {revenueByDay.map(
                                    (item) => (
                                        <div
                                            className="chart-bar-wrap"
                                            key={item.date.toISOString()}
                                            title={`${item.date.toLocaleDateString(
                                                "vi-VN"
                                            )}: ${formatTien(
                                                item.revenue
                                            )}`}
                                        >
                                            <div
                                                className="chart-bar"
                                                style={{
                                                    height:
                                                        item.revenue >
                                                        0
                                                            ? `${Math.max(
                                                                4,
                                                                (item.revenue /
                                                                    maxRevenue) *
                                                                100
                                                            )}%`
                                                            : "0%",
                                                }}
                                            />

                                            <span>
                                                {item.label}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="admin-card">
                    <div className="admin-card-heading">
                        <div>
                            <h2>
                                Trạng thái đơn hàng
                            </h2>

                            <p>
                                Số lượng thực tế từ
                                database
                            </p>
                        </div>
                    </div>

                    <div className="order-status-list">
                        <div>
                            <span className="status-dot pending" />
                            <span>
                                Chờ xác nhận
                            </span>
                            <strong>
                                {loadingOrders
                                    ? "..."
                                    : statusCounts.pending}
                            </strong>
                        </div>

                        <div>
                            <span className="status-dot processing" />
                            <span>
                                Đang xử lý
                            </span>
                            <strong>
                                {loadingOrders
                                    ? "..."
                                    : statusCounts.processing}
                            </strong>
                        </div>

                        <div>
                            <span className="status-dot shipping" />
                            <span>
                                Đang giao
                            </span>
                            <strong>
                                {loadingOrders
                                    ? "..."
                                    : statusCounts.shipping}
                            </strong>
                        </div>

                        <div>
                            <span className="status-dot done" />
                            <span>
                                Đã giao
                            </span>
                            <strong>
                                {loadingOrders
                                    ? "..."
                                    : statusCounts.done}
                            </strong>
                        </div>
                    </div>
                </section>
            </div>

            <section className="admin-card">
                <div className="admin-card-heading">
                    <div>
                        <h2>Đơn hàng gần đây</h2>

                        <p>
                            4 đơn hàng mới nhất
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-link-button"
                        onClick={onViewAll}
                    >
                        Xem tất cả →
                    </button>
                </div>

                <div className="admin-table-scroll">
                    {loadingOrders ? (
                        <div
                            style={{
                                padding: "40px",
                                textAlign: "center",
                                color: "#777",
                            }}
                        >
                            Đang tải đơn hàng...
                        </div>
                    ) : recentOrders.length === 0 ? (
                        <div
                            style={{
                                padding: "40px",
                                textAlign: "center",
                                color: "#777",
                            }}
                        >
                            Chưa có đơn hàng.
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>
                                    Mã hóa đơn
                                </th>

                                <th>
                                    Khách hàng
                                </th>

                                <th>
                                    Tổng tiền
                                </th>

                                <th>
                                    Trạng thái
                                </th>
                            </tr>
                            </thead>

                            <tbody>
                            {recentOrders.map(
                                (hoaDon) => (
                                    <tr
                                        key={
                                            hoaDon.id
                                        }
                                    >
                                        <td>
                                            <strong>
                                                {hoaDon.maHoaDon ||
                                                    `HD${hoaDon.id}`}
                                            </strong>
                                        </td>

                                        <td>
                                            {hoaDon
                                                    ?.khachHang
                                                    ?.hoTen ||
                                                hoaDon
                                                    ?.diaChi
                                                    ?.tenNguoiNhan ||
                                                "Khách lẻ"}
                                        </td>

                                        <td>
                                            <strong>
                                                {formatTien(
                                                    hoaDon.tongThanhToan
                                                )}
                                            </strong>
                                        </td>

                                        <td>
                                            <span
                                                className="order-status"
                                                style={{
                                                    display:
                                                        "inline-flex",
                                                    alignItems:
                                                        "center",
                                                    justifyContent:
                                                        "center",
                                                    padding:
                                                        "6px 12px",
                                                    borderRadius:
                                                        "999px",
                                                    fontSize:
                                                        "12px",
                                                    fontWeight:
                                                        700,
                                                    whiteSpace:
                                                        "nowrap",
                                                    ...getTrangThaiDonHangStyle(
                                                        hoaDon.trangThai
                                                    ),
                                                }}
                                            >
                                                {hoaDon.trangThai ===
                                                    "DA_THANH_TOAN" &&
                                                    "✓ "}
                                                {tenTrangThaiHoaDon(
                                                    hoaDon.trangThai
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
    );
}

function HoaDonContent() {
    const [hoaDons, setHoaDons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filterTrangThai, setFilterTrangThai] = useState("");
    const [filterLoai, setFilterLoai] = useState("");
    const [selectedHoaDon, setSelectedHoaDon] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [chiTiet, setChiTiet] = useState([]);
    const [thanhToan, setThanhToan] = useState(null);
    const [lichSu, setLichSu] = useState([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState("");
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const taiHoaDon = async (force = false) => {
        try {
            // Nếu đã có cache thì hiện ngay, không hiện màn hình loading.
            if (!force && adminDataCache.hoaDons) {
                setHoaDons(adminDataCache.hoaDons);
                setLoading(false);
                setError("");
                return;
            }
            setLoading(true);
            setError("");
            const danhSach = await getHoaDons(force);
            setHoaDons(danhSach);
        }
        catch (err) {
            console.error("Lỗi tải hóa đơn:", err);
            setError(err.message ||
                "Không thể kết nối tới máy chủ");
            setHoaDons([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        // Luôn tải danh sách mới nhất khi mở mục Hóa đơn, bỏ qua cache cũ.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        taiHoaDon(true);
    }, []);
    const xemChiTiet = async (hoaDon) => {
        try {
            setSelectedHoaDon(hoaDon);
            setLoadingDetail(true);
            setDetailError("");
            setChiTiet([]);
            setThanhToan(null);
            setLichSu([]);
            const [chiTietResponse, thanhToanResponse, lichSuResponse,] = await Promise.all([
                fetch(`${API}/hoa-don/${hoaDon.id}/chi-tiet`),
                fetch(`${API}/hoa-don/${hoaDon.id}/thanh-toan`),
                fetch(`${API}/hoa-don/${hoaDon.id}/lich-su`),
            ]);
            if (chiTietResponse.ok) {
                const data = await chiTietResponse.json();
                setChiTiet(Array.isArray(data)
                    ? data
                    : []);
            }
            if (thanhToanResponse.ok) {
                const data = await thanhToanResponse.json();
                setThanhToan(data);
            }
            if (lichSuResponse.ok) {
                const data = await lichSuResponse.json();
                setLichSu(Array.isArray(data)
                    ? data
                    : []);
            }
        }
        catch (err) {
            console.error("Lỗi tải chi tiết:", err);
            setDetailError(err.message ||
                "Không thể tải chi tiết hóa đơn");
        }
        finally {
            setLoadingDetail(false);
        }
    };
    const capNhatTrangThai = async (trangThai) => {
        if (!selectedHoaDon) {
            return;
        }
        try {
            setUpdatingStatus(true);
            const params = new URLSearchParams();
            params.append("trangThai", trangThai);
            const response = await fetch(`${API}/hoa-don/${selectedHoaDon.id}/trang-thai?${params.toString()}`, {
                method: "PUT",
            });
            const text = await response.text();
            let data = null;
            try {
                data = text
                    ? JSON.parse(text)
                    : null;
            }
            catch {
                data = null;
            }
            if (!response.ok) {
                throw new Error(data?.message ||
                    data?.error ||
                    text ||
                    "Không thể cập nhật trạng thái");
            }
            setSelectedHoaDon(data);
            setHoaDons((old) => old.map((item) => item.id ===
            data.id
                ? data
                : item));
            const historyResponse = await fetch(`${API}/hoa-don/${data.id}/lich-su`);
            if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                setLichSu(Array.isArray(historyData)
                    ? historyData
                    : []);
            }
            alert("Đã cập nhật trạng thái hóa đơn");
        }
        catch (err) {
            console.error(err);
            alert(err.message ||
                "Không thể cập nhật trạng thái");
        }
        finally {
            setUpdatingStatus(false);
        }
    };
    const danhSachLoc = hoaDons.filter((hoaDon) => {
        const keyword = search
            .trim()
            .toLowerCase();
        const maHoaDon = String(hoaDon.maHoaDon ||
            "").toLowerCase();
        const tenKhachHang = String(hoaDon
                .khachHang
                ?.hoTen ||
            hoaDon
                .diaChi
                ?.tenNguoiNhan ||
            "").toLowerCase();
        const matchSearch = !keyword ||
            maHoaDon.includes(keyword) ||
            tenKhachHang.includes(keyword);
        const matchTrangThai = !filterTrangThai ||
            hoaDon.trangThai ===
            filterTrangThai;
        const matchLoai = !filterLoai ||
            hoaDon.loaiHoaDon ===
            filterLoai;
        return (matchSearch &&
            matchTrangThai &&
            matchLoai);
    });

    const totalPages = Math.max(
        1,
        Math.ceil(danhSachLoc.length / itemsPerPage)
    );

    const currentItems = danhSachLoc.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage(1);
    }, [search, filterTrangThai, filterLoai]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage((page) =>
            Math.min(page, totalPages)
        );
    }, [totalPages]);

    return (<div style={{
        padding: "4px",
    }}>

        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            marginBottom: "24px",
            flexWrap: "wrap",
        }}>

            <div>

                <div className="admin-eyebrow">
                    FSHOP ADMIN
                </div>

                <h1 style={{
                    margin: "5px 0 8px",
                }}>
                    Hóa đơn
                </h1>

                <p style={{
                    margin: 0,
                    color: "#777",
                }}>
                    Quản lý đơn hàng và
                    trạng thái xử lý.
                </p>

            </div>

            <button type="button" onClick={() => taiHoaDon(true)} disabled={loading} style={{
                border: "1px solid #ddd",
                background: "#fff",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: loading ? "wait" : "pointer",
                fontWeight: 600,
                opacity: loading ? 0.7 : 1,
            }}>
                {loading ? "Đang tải..." : "↻ Làm mới"}
            </button>

        </div>

        <section className="admin-card" style={{
            marginBottom: "20px",
        }}>

            <div style={{
                display: "grid",
                gridTemplateColumns: "minmax(250px,1fr) 220px 180px",
                gap: "12px",
            }}>

                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã hóa đơn hoặc tên khách hàng..." style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 14px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                }}/>

                <select value={filterTrangThai} onChange={(e) => setFilterTrangThai(e.target.value)} style={{
                    padding: "12px 14px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    background: "#fff",
                }}>

                    <option value="">
                        Tất cả trạng thái
                    </option>

                    {TRANG_THAI_HOA_DON.map((item) => (<option key={item} value={item}>
                        {tenTrangThaiHoaDon(item)}
                    </option>))}

                </select>

                <select value={filterLoai} onChange={(e) => setFilterLoai(e.target.value)} style={{
                    padding: "12px 14px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    background: "#fff",
                }}>

                    <option value="">
                        Tất cả loại
                    </option>

                    <option value="ONLINE">
                        Online
                    </option>

                    <option value="TAI_QUAY">
                        Tại quầy
                    </option>

                </select>

            </div>

        </section>

        <section className="admin-card">

            <div className="admin-card-heading">

                <div>
                    <h2>
                        Danh sách hóa đơn
                    </h2>

                    <p>
                        {danhSachLoc.length} hóa đơn
                    </p>
                </div>

            </div>

            {loading ? (<div style={{
                padding: "50px",
                textAlign: "center",
                color: "#777",
            }}>
                Đang tải hóa đơn...
            </div>) : error ? (<div style={{
                padding: "30px",
                textAlign: "center",
                color: "#c62828",
            }}>

                <div style={{
                    marginBottom: "12px",
                }}>
                    {error}
                </div>

                <button type="button" onClick={taiHoaDon}>
                    Thử lại
                </button>

            </div>) : danhSachLoc.length ===
            0 ? (<div style={{
                padding: "50px",
                textAlign: "center",
                color: "#777",
            }}>
                Không có hóa đơn.
            </div>) : (<div style={{
                overflowX: "auto",
            }}>

                <table className="admin-table" style={{
                    width: "100%",
                    minWidth: "1080px",
                    tableLayout: "fixed",
                }}>

                    <thead>

                    <tr>

                        <th style={{ width: "8%" }}>
                            ID khách hàng
                        </th>

                        <th style={{ width: "16%" }}>
                            Mã hóa đơn
                        </th>

                        <th style={{ width: "12%" }}>
                            Khách hàng
                        </th>

                        <th style={{ width: "11%" }}>
                            Số điện thoại
                        </th>

                        <th style={{ width: "12%" }}>
                            Ngày lập
                        </th>

                        <th style={{ width: "7%" }}>
                            Loại
                        </th>

                        <th style={{ width: "11%" }}>
                            Tổng tiền
                        </th>

                        <th style={{ width: "12%" }}>
                            Trạng thái
                        </th>

                        <th style={{ width: "11%" }}>
                            Thao tác
                        </th>

                    </tr>

                    </thead>

                    <tbody>

                    {currentItems.map((hoaDon) => (<tr key={hoaDon.id}>

                        <td>
                            #{hoaDon.khachHang?.id || "-"}
                        </td>

                        <td>
                            <strong>
                                {hoaDon.maHoaDon}
                            </strong>
                        </td>

                        <td>
                            {hoaDon
                                    .khachHang
                                    ?.hoTen ||
                                hoaDon
                                    .diaChi
                                    ?.tenNguoiNhan ||
                                "Khách lẻ"}
                        </td>

                        <td>
                            {hoaDon
                                    .khachHang
                                    ?.soDienThoai ||
                                hoaDon
                                    .diaChi
                                    ?.soDienThoai ||
                                "-"}
                        </td>

                        <td>
                            {formatNgay(hoaDon.ngayLap)}
                        </td>

                        <td>
                            {tenLoaiHoaDon(hoaDon.loaiHoaDon)}
                        </td>

                        <td>
                            <strong>
                                {formatTien(hoaDon.tongThanhToan)}
                            </strong>
                        </td>

                        <td>
                                            <span style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                padding: "6px 10px",
                                                borderRadius: "999px",
                                                background: hoaDon.trangThai === "DA_THANH_TOAN"
                                                    ? "#e8f5e9"
                                                    : hoaDon.trangThai === "CHO_XAC_NHAN"
                                                        ? "#fff3e0"
                                                        : "#f5f5f5",
                                                color: hoaDon.trangThai === "DA_THANH_TOAN"
                                                    ? "#2e7d32"
                                                    : hoaDon.trangThai === "CHO_XAC_NHAN"
                                                        ? "#ef6c00"
                                                        : "#666",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                whiteSpace: "nowrap",
                                            }}>
                                                {hoaDon.trangThai === "DA_THANH_TOAN" && "✓ "}
                                                {tenTrangThaiHoaDon(hoaDon.trangThai)}
                                            </span>
                        </td>

                        <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>

                            <button type="button" onClick={() => xemChiTiet(hoaDon)} style={{
                                border: "1px solid #ddd",
                                background: "#fff",
                                color: "#222",
                                padding: "7px 14px",
                                minWidth: "72px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                            }}>
                                Xem
                            </button>

                        </td>

                    </tr>))}

                    <tr>
                        <td colSpan={9}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "12px"
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
                                        width: "56px",
                                        height: "56px",
                                        border: "1px solid #ddd",
                                        borderRadius: "10px",
                                        background: "#fff",
                                        fontSize: "22px",
                                        color:
                                            currentPage === 1
                                                ? "#ccc"
                                                : "#222",
                                        cursor:
                                            currentPage === 1
                                                ? "default"
                                                : "pointer"
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
                                        onClick={() =>
                                            setCurrentPage(page)
                                        }
                                        style={{
                                            width: "46px",
                                            height: "46px",
                                            border: "none",
                                            borderRadius: "10px",
                                            background:
                                                currentPage === page
                                                    ? "#c94f3f"
                                                    : "transparent",
                                            color:
                                                currentPage === page
                                                    ? "#fff"
                                                    : "#999",
                                            fontWeight: 600,
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
                                            Math.min(
                                                totalPages,
                                                page + 1
                                            )
                                        )
                                    }
                                    disabled={
                                        currentPage === totalPages
                                    }
                                    style={{
                                        width: "56px",
                                        height: "56px",
                                        border: "1px solid #ddd",
                                        borderRadius: "10px",
                                        background: "#fff",
                                        fontSize: "22px",
                                        color:
                                            currentPage === totalPages
                                                ? "#ccc"
                                                : "#222",
                                        cursor:
                                            currentPage === totalPages
                                                ? "default"
                                                : "pointer"
                                    }}
                                >
                                    →
                                </button>
                            </div>
                        </td>
                    </tr>

                    </tbody>

                </table>

            </div>)}

        </section>

        {selectedHoaDon && (<div onClick={() => setSelectedHoaDon(null)} style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 18, 25, .58)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
        }}>

            <div onClick={(e) => e.stopPropagation()} style={{
                width: "min(1150px, 100%)",
                maxHeight: "92vh",
                overflowY: "auto",
                background: "linear-gradient(180deg, #ffffff 0%, #fffefe 100%)",
                border: "1px solid rgba(255,255,255,.8)",
                borderRadius: "22px",
                padding: "28px 30px",
                boxShadow: "0 28px 90px rgba(15, 23, 42, .28)",
                position: "relative",
            }}>

                <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "18px",
                    marginBottom: "24px",
                }}>

                    <div>

                        <div style={{
                            color: "#8791a2",
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: ".08em",
                        }}>
                            CHI TIẾT HÓA ĐƠN
                        </div>

                        <h2 style={{
                            margin: "8px 0 0",
                            color: "#111827",
                            fontSize: "27px",
                            fontWeight: 800,
                            letterSpacing: "-.025em",
                        }}>
                            {selectedHoaDon.maHoaDon}
                        </h2>

                    </div>

                    <button
                        type="button"
                        aria-label="Đóng chi tiết hóa đơn"
                        title="Đóng"
                        onClick={() => setSelectedHoaDon(null)}
                        style={{
                            flex: "0 0 46px",
                            width: "46px",
                            height: "46px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid #ffe0e3",
                            borderRadius: "50%",
                            background: "linear-gradient(145deg, #fff5f6, #ffe8eb)",
                            color: "#e11d48",
                            fontSize: "28px",
                            fontWeight: 400,
                            lineHeight: 1,
                            cursor: "pointer",
                            boxShadow: "0 5px 15px rgba(225,29,72,.13)",
                            transition: "transform .18s ease, box-shadow .18s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "rotate(90deg) scale(1.05)";
                            e.currentTarget.style.boxShadow = "0 8px 20px rgba(225,29,72,.2)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "none";
                            e.currentTarget.style.boxShadow = "0 5px 15px rgba(225,29,72,.13)";
                        }}
                    >
                        ×
                    </button>

                </div>

                {detailError && (<div style={{
                    color: "#c62828",
                    marginBottom: "15px",
                }}>
                    {detailError}
                </div>)}

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "12px",
                    marginBottom: "22px",
                }}>

                    <div>
                        <small>
                            Khách hàng
                        </small>

                        <strong style={{
                            display: "block",
                        }}>
                            {selectedHoaDon
                                    .khachHang
                                    ?.hoTen ||
                                selectedHoaDon
                                    .diaChi
                                    ?.tenNguoiNhan ||
                                "Khách lẻ"}
                        </strong>
                    </div>

                    <div>
                        <small>
                            Ngày lập
                        </small>

                        <strong style={{
                            display: "block",
                        }}>
                            {formatNgay(selectedHoaDon.ngayLap)}
                        </strong>
                    </div>

                    <div>
                        <small>
                            Loại
                        </small>

                        <strong style={{
                            display: "block",
                        }}>
                            {tenLoaiHoaDon(selectedHoaDon.loaiHoaDon)}
                        </strong>
                    </div>

                    <div>
                        <small>
                            Tổng tiền
                        </small>

                        <strong style={{
                            display: "block",
                            color: "#e53935",
                        }}>
                            {formatTien(selectedHoaDon.tongThanhToan)}
                        </strong>
                    </div>

                </div>

                {/* VOUCHER ĐÃ ÁP DỤNG */}
                <section style={{
                    marginBottom: "25px",
                    padding: "18px",
                    border: "1px solid #ffdadd",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #fff7f8 0%, #fffafa 100%)",
                    boxShadow: "0 5px 18px rgba(225, 29, 72, .035)",
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", color: "#1f2937", fontSize: "19px", fontWeight: 800 }}>
                        <span style={{ display: "inline-flex", width: "30px", height: "30px", alignItems: "center", justifyContent: "center", borderRadius: "9px", background: "#ffe4e8", color: "#e11d48", fontSize: "16px" }}>◆</span>
                        Voucher áp dụng cho đơn hàng
                    </h3>

                    {(() => {
                        const voucher = selectedHoaDon.voucher;
                        const voucherShip = selectedHoaDon.voucherFreeship;
                        const coVoucherGiam = Boolean(voucher);
                        const coFreeship = Boolean(voucherShip);
                        const loaiGiam = String(voucher?.loaiGiam || "").toUpperCase();
                        const giaTriGiam = Number(voucher?.giaTriGiam || 0);
                        const giamToiDa = voucher?.giamToiDa;
                        const tienGiamThucTe = Number(selectedHoaDon.tienGiam || 0);
                        const labelLoaiGiam = loaiGiam === "PHAN_TRAM"
                            ? `${giaTriGiam}%`
                            : loaiGiam === "SO_TIEN"
                                ? formatTien(giaTriGiam)
                                : (loaiGiam || "Không rõ");

                        if (!coVoucherGiam && !coFreeship) {
                            return <div style={{ color: "#777" }}>Đơn hàng này không có thông tin voucher được lưu.</div>;
                        }

                        return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                            {coVoucherGiam && <div style={{ padding: "17px", borderRadius: "14px", background: "#fff", border: "1px solid #f0e5e7", boxShadow: "0 4px 14px rgba(31,41,55,.035)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "13px" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", borderRadius: "12px", background: "#ffe7eb", color: "#e11d48", fontSize: "22px" }}>◆</span>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#667085", fontWeight: 700, marginBottom: "5px" }}>VOUCHER GIẢM GIÁ</div>
                                        <strong style={{ display: "inline-block", fontSize: "18px", color: "#c81e1e", marginRight: "8px" }}>
                                            {voucher.maVoucher || voucher.maGiamGia || "Voucher giảm giá"}
                                        </strong>
                                        {loaiGiam === "PHAN_TRAM" && <span style={{ display: "inline-block", padding: "5px 9px", borderRadius: "7px", background: "#fff0f2", color: "#c81e1e", fontSize: "12px", fontWeight: 800 }}>↓ Giảm {giaTriGiam}%</span>}
                                    </div>
                                </div>
                                {voucher.tenVoucher && <div style={{ marginBottom: "11px", color: "#667085", fontSize: "13px" }}>{voucher.tenVoucher}</div>}
                                <div style={{ display: "grid", gap: "0", fontSize: "14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "9px 0", borderBottom: "1px solid #f0f1f3" }}><span>Loại giảm</span><strong>{labelLoaiGiam}</strong></div>
                                    {loaiGiam === "PHAN_TRAM" && <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "9px 0", borderBottom: "1px solid #f0f1f3" }}><span>Giảm tối đa</span><strong>{giamToiDa != null ? formatTien(giamToiDa) : "Không giới hạn"}</strong></div>}
                                    {loaiGiam === "SO_TIEN" && <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "9px 0", borderBottom: "1px solid #f0f1f3" }}><span>Mức giảm</span><strong>{formatTien(giaTriGiam)}</strong></div>}
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "9px 0 2px" }}><span>Số tiền đã giảm</span><strong style={{ color: "#159447" }}>{formatTien(tienGiamThucTe)}</strong></div>
                                </div>
                            </div>}

                            {coFreeship && <div style={{ padding: "17px", borderRadius: "14px", background: "#fff", border: "1px solid #e1edf9", boxShadow: "0 4px 14px rgba(31,41,55,.035)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "13px" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", borderRadius: "12px", background: "#e6f2ff", color: "#1680d6", fontSize: "22px" }}>➜</span>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#667085", fontWeight: 700, marginBottom: "5px" }}>VOUCHER FREESHIP</div>
                                        <strong style={{ display: "inline-block", fontSize: "18px", color: "#c81e1e", marginRight: "8px" }}>
                                            {voucherShip.maVoucher || voucherShip.maGiamGia || "FREESHIP"}
                                        </strong>
                                        <span style={{ display: "inline-block", padding: "5px 9px", borderRadius: "7px", background: "#eaf4ff", color: "#1670b9", fontSize: "12px", fontWeight: 800 }}>Miễn phí vận chuyển</span>
                                    </div>
                                </div>
                                {voucherShip.tenVoucher && <div style={{ marginBottom: "11px", color: "#667085", fontSize: "13px" }}>{voucherShip.tenVoucher}</div>}
                                <div style={{ display: "grid", gap: "0", fontSize: "14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "9px 0", borderBottom: "1px solid #f0f1f3" }}><span>Loại giảm</span><strong>Miễn phí vận chuyển</strong></div>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "9px 0 2px" }}><span>Phí vận chuyển sau giảm</span><strong style={{ color: "#159447" }}>{formatTien(selectedHoaDon.phiVanChuyen || 0)}</strong></div>
                                </div>
                            </div>}
                        </div>;
                    })()}
                </section>

                <section style={{ marginBottom: "25px" }}>
                    <h3>Xử lý hóa đơn</h3>

                    {(() => {
                        const ttHienTai = String(selectedHoaDon.trangThai || "").toUpperCase();
                        const dsChoPhep = layTrangThaiChoPhep(ttHienTai);
                        const ketThuc = laTrangThaiKetThuc(ttHienTai);

                        // 🔒 Trạng thái kết thúc → không cho đổi
                        if (ketThuc) {
                            const laHuy = ttHienTai === "DA_HUY";
                            return (
                                <div style={{
                                    padding: "14px 18px",
                                    background: laHuy ? "#fdecea" : "#eaf7ed",
                                    color: laHuy ? "#c0392b" : "#24833b",
                                    borderRadius: 8,
                                    fontWeight: 700,
                                    fontSize: 14,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    minWidth: 250,
                                }}>
                                    {laHuy
                                        ? "❌ Hóa đơn đã bị hủy — không thể thay đổi"
                                        : "✅ Hóa đơn đã hoàn tất — không thể thay đổi"}
                                </div>
                            );
                        }

                        return (
                            <>
                                <select
                                    value={selectedHoaDon?.trangThai || ""}
                                    disabled={updatingStatus}
                                    onChange={(e) => capNhatTrangThai(e.target.value)}
                                    style={{
                                        padding: "10px",
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        minWidth: "250px",
                                    }}
                                >
                                    {TRANG_THAI_HOA_DON.map((item) => (
                                        <option key={item} value={item}>
                                            {tenTrangThaiHoaDon(item)}
                                        </option>
                                    ))}
                                </select>

                                <div
                                    style={{
                                        marginTop: 8,
                                        fontSize: 12,
                                        color: "#777",
                                    }}
                                >
                                    Trạng thái hiện tại:{" "}
                                    <strong style={{ color: "#111" }}>
                                        {tenTrangThaiHoaDon(ttHienTai)}
                                    </strong>

                                    {dsChoPhep.length > 0 && (
                                        <>
                                            {" "}· Chỉ có thể chuyển sang {dsChoPhep.length} bước tiếp theo
                                        </>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </section>

                <section style={{
                    marginBottom: "25px",
                }}>

                    <h3 style={{ margin: "0 0 14px", color: "#1f2937", fontSize: "19px", fontWeight: 800 }}>
                        <span style={{ color: "#e11d48", marginRight: "9px" }}>🛒</span> Chi tiết sản phẩm
                    </h3>

                    {loadingDetail ? (<div>
                        Đang tải...
                    </div>) : chiTiet.length ===
                    0 ? (<div>
                        Không có sản phẩm.
                    </div>) : (<div style={{
                        overflowX: "auto",
                    }}>

                        <table className="admin-table" style={{
                            width: "100%",
                        }}>

                            <thead>

                            <tr>

                                <th>
                                    Sản phẩm
                                </th>

                                <th>
                                    SKU
                                </th>

                                <th>
                                    Số lượng
                                </th>

                                <th>
                                    Đơn giá
                                </th>

                                <th>
                                    Thành tiền
                                </th>

                            </tr>

                            </thead>

                            <tbody>

                            {chiTiet.map((item) => {
                                const spct = item.sanPhamChiTiet;
                                return (<tr key={item.id}>

                                    <td>
                                        {layTenSanPham(item)}
                                    </td>

                                    <td>
                                        {spct?.maSku ||
                                            "-"}
                                    </td>

                                    <td>
                                        {item.soLuong}
                                    </td>

                                    <td>
                                        {formatTien(item.donGia)}
                                    </td>

                                    <td>
                                        <strong>
                                            {formatTien(item.thanhTien)}
                                        </strong>
                                    </td>

                                </tr>);
                            })}

                            </tbody>

                        </table>

                    </div>)}

                </section>

                <section style={{
                    marginBottom: "25px",
                }}>

                    <h3 style={{ margin: "0 0 14px", color: "#168a52", fontSize: "19px", fontWeight: 800 }}>
                        <span style={{ marginRight: "9px" }}>▣</span> Thanh toán
                    </h3>

                    {thanhToan ? (<div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4,1fr)",
                        gap: "12px",
                    }}>

                        <div>
                            <small>
                                Phương thức
                            </small>

                            <strong style={{
                                display: "block",
                            }}>
                                {tenPhuongThuc(thanhToan.phuongThuc)}
                            </strong>
                        </div>

                        <div>
                            <small>
                                Số tiền
                            </small>

                            <strong style={{
                                display: "block",
                            }}>
                                {formatTien(thanhToan.soTien)}
                            </strong>
                        </div>

                        <div>
                            <small>
                                Trạng thái
                            </small>

                            <strong style={{
                                display: "block",
                            }}>
                                {tenTrangThaiThanhToan(thanhToan.trangThai)}
                            </strong>
                        </div>

                        <div>
                            <small>
                                Ngày thanh toán
                            </small>

                            <strong style={{
                                display: "block",
                            }}>
                                {formatNgay(thanhToan.ngayThanhToan)}
                            </strong>
                        </div>

                    </div>) : (<div>
                        Chưa có thông tin
                        thanh toán.
                    </div>)}

                </section>

                <section>

                    <h3 style={{ margin: "0 0 14px", color: "#1675c5", fontSize: "19px", fontWeight: 800 }}>
                        <span style={{ marginRight: "9px" }}>◷</span> Lịch sử hóa đơn
                    </h3>

                    {lichSu.length ===
                    0 ? (<div>
                        Chưa có lịch sử.
                    </div>) : (lichSu.map((item) => (<div key={item.id} style={{
                        padding: "10px",
                        borderBottom: "1px solid #eee",
                    }}>

                        <strong>
                            {tenTrangThaiHoaDon(item.trangThai)}
                        </strong>

                        <div>
                            {formatNgay(item.thoiGian)}
                        </div>

                        {item.ghiChu && (<div>
                            {item.ghiChu}
                        </div>)}

                    </div>)))}

                </section>

            </div>

        </div>)}

    </div>);
}
function ThanhToanContent() {
    const [hoaDons, setHoaDons] = useState([]);
    const [thanhToans, setThanhToans] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filterTrangThai, setFilterTrangThai] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const taiThanhToanNen = async (danhSach, force = false) => {
        // Tải từng payment ở nền. Bảng hóa đơn không phải chờ tất cả payment.
        danhSach.forEach((hoaDon) => {
            getThanhToanByHoaDonId(hoaDon.id, force)
                .then((payment) => {
                    if (!payment)
                        return;
                    setThanhToans((old) => ({
                        ...old,
                        [hoaDon.id]: payment
                    }));
                })
                .catch((err) => {
                    console.error(`Lỗi tải thanh toán hóa đơn ${hoaDon.id}:`, err);
                });
        });
    };
    const taiThanhToan = async (force = false) => {
        try {
            if (!force && adminDataCache.hoaDons) {
                const danhSach = adminDataCache.hoaDons;
                setHoaDons(danhSach);
                setLoading(false);
                setError("");
                // Không await.
                taiThanhToanNen(danhSach);
                return;
            }
            setLoading(true);
            setError("");
            const danhSach = await getHoaDons(force);
            setHoaDons(danhSach);
            setLoading(false);
            // Hiện bảng ngay sau khi có hóa đơn.
            // Payment tiếp tục cập nhật nền.
            taiThanhToanNen(danhSach, force);
        }
        catch (err) {
            console.error("Lỗi tải thanh toán:", err);
            setError(err.message ||
                "Không thể kết nối tới máy chủ");
            setHoaDons([]);
            setLoading(false);
        }
    };
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        taiThanhToan();
    }, []);
    const xacNhanThanhToan = async (hoaDon, thanhToan) => {
        if (!thanhToan) {
            alert("Hóa đơn chưa có bản ghi thanh toán.");
            return;
        }
        if (thanhToan.trangThai ===
            "DA_THANH_TOAN") {
            alert("Khoản thanh toán này đã được xác nhận.");
            return;
        }
        try {
            const paymentResponse = await fetch(`${API}/hoa-don/thanh-toan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: thanhToan.id,
                    hoaDon: {
                        id: hoaDon.id,
                    },
                    phuongThuc: thanhToan.phuongThuc,
                    trangThai: "DA_THANH_TOAN",
                    maGiaoDich: thanhToan.maGiaoDich,
                }),
            });
            const paymentText = await paymentResponse.text();
            let paymentData = null;
            try {
                paymentData =
                    paymentText
                        ? JSON.parse(paymentText)
                        : null;
            }
            catch {
                paymentData =
                    null;
            }
            if (!paymentResponse.ok) {
                throw new Error(paymentData?.message ||
                    paymentData?.error ||
                    paymentText ||
                    "Không thể cập nhật thanh toán");
            }
            const params = new URLSearchParams();
            params.append("trangThai", "DA_THANH_TOAN");
            params.append("ghiChu", "Admin xác nhận đã thanh toán");
            const invoiceResponse = await fetch(`${API}/hoa-don/${hoaDon.id}/trang-thai?${params.toString()}`, {
                method: "PUT",
            });
            if (!invoiceResponse.ok) {
                const invoiceText = await invoiceResponse.text();
                throw new Error(invoiceText ||
                    "Không thể cập nhật trạng thái hóa đơn");
            }
            // Cập nhật ngay trên giao diện, không tải lại toàn bộ danh sách.
            setThanhToans((prev) => ({
                ...prev,
                [hoaDon.id]: {
                    ...prev[hoaDon.id],
                    ...thanhToan,
                    trangThai: "DA_THANH_TOAN",
                },
            }));
            setHoaDons((prev) => prev.map((item) => item.id === hoaDon.id
                ? { ...item, trangThai: "DA_THANH_TOAN" }
                : item));
            alert("Đã xác nhận thanh toán thành công.");
        }
        catch (err) {
            console.error("Lỗi xác nhận thanh toán:", err);
            alert(err.message ||
                "Không thể xác nhận thanh toán");
        }
    };
    const danhSachLoc = hoaDons.filter((hoaDon) => {
        const payment = thanhToans[hoaDon.id];
        const keyword = search
            .trim()
            .toLowerCase();
        const maHoaDon = String(hoaDon.maHoaDon ||
            "").toLowerCase();
        const tenKhachHang = String(hoaDon
                .khachHang
                ?.hoTen ||
            hoaDon
                .diaChi
                ?.tenNguoiNhan ||
            "").toLowerCase();
        const matchSearch = !keyword ||
            maHoaDon.includes(keyword) ||
            tenKhachHang.includes(keyword);
        const matchTrangThai = !filterTrangThai ||
            payment?.trangThai ===
            filterTrangThai;
        return (matchSearch &&
            matchTrangThai);
    });

    const totalPages = Math.max(
        1,
        Math.ceil(danhSachLoc.length / itemsPerPage)
    );

    const currentItems = danhSachLoc.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage(1);
    }, [search, filterTrangThai]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage((page) =>
            Math.min(page, totalPages)
        );
    }, [totalPages]);

    return (<div style={{
        padding: "4px",
    }}>

        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            marginBottom: "24px",
            flexWrap: "wrap",
        }}>

            <div>

                <div className="admin-eyebrow">
                    FSHOP ADMIN
                </div>

                <h1 style={{
                    margin: "5px 0 8px",
                }}>
                    Thanh toán
                </h1>

                <p style={{
                    margin: 0,
                    color: "#777",
                }}>
                    Quản lý trạng thái
                    thanh toán của
                    các hóa đơn.
                </p>

            </div>

            <button type="button" onClick={taiThanhToan} style={{
                border: "1px solid #ddd",
                background: "#fff",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
            }}>
                ↻ Làm mới
            </button>

        </div>

        <section className="admin-card" style={{
            marginBottom: "20px",
        }}>

            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 220px",
                gap: "12px",
            }}>

                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã hóa đơn hoặc tên khách hàng..." style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 14px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                }}/>

                <select value={filterTrangThai} onChange={(e) => setFilterTrangThai(e.target
                    .value)} style={{
                    padding: "12px 14px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    background: "#fff",
                }}>

                    <option value="">
                        Tất cả thanh toán
                    </option>

                    {TRANG_THAI_THANH_TOAN.map((item) => (<option key={item} value={item}>
                        {tenTrangThaiThanhToan(item)}
                    </option>))}

                </select>

            </div>

        </section>

        <section className="admin-card">

            <div className="admin-card-heading">

                <div>

                    <h2>
                        Danh sách thanh toán
                    </h2>

                    <p>
                        {danhSachLoc.length} hóa đơn
                    </p>

                </div>

            </div>

            {loading ? (<div style={{
                padding: "50px",
                textAlign: "center",
                color: "#777",
            }}>
                Đang tải thanh toán...
            </div>) : error ? (<div style={{
                padding: "30px",
                textAlign: "center",
                color: "#c62828",
            }}>
                {error}
            </div>) : danhSachLoc.length ===
            0 ? (<div style={{
                padding: "50px",
                textAlign: "center",
                color: "#777",
            }}>
                Không có thanh toán.
            </div>) : (<div style={{
                overflowX: "auto",
            }}>

                <table className="admin-table" style={{
                    width: "100%",
                    minWidth: "1100px",
                    tableLayout: "fixed",
                }}>

                    <thead>

                    <tr>

                        <th style={{ width: "8%" }}>
                            ID thanh toán
                        </th>

                        <th style={{ width: "16%" }}>
                            Mã hóa đơn
                        </th>

                        <th style={{ width: "12%" }}>
                            Khách hàng
                        </th>

                        <th style={{ width: "9%" }}>
                            Phương thức
                        </th>

                        <th style={{ width: "10%" }}>
                            Số tiền
                        </th>

                        <th style={{ width: "10%" }}>
                            Mã giao dịch
                        </th>

                        <th style={{ width: "12%" }}>
                            Trạng thái
                        </th>

                        <th style={{ width: "12%" }}>
                            Ngày thanh toán
                        </th>

                        <th style={{ width: "11%" }}>
                            Thao tác
                        </th>

                    </tr>

                    </thead>

                    <tbody>

                    {currentItems.map((hoaDon) => {
                        const payment = thanhToans[hoaDon.id];
                        return (<tr key={hoaDon.id}>

                            <td>
                                #{payment?.id || "-"}
                            </td>

                            <td>
                                <strong>
                                    {hoaDon.maHoaDon}
                                </strong>
                            </td>

                            <td>
                                {hoaDon
                                        .khachHang
                                        ?.hoTen ||
                                    hoaDon
                                        .diaChi
                                        ?.tenNguoiNhan ||
                                    "Khách lẻ"}
                            </td>

                            <td>
                                {tenPhuongThuc(payment
                                    ?.phuongThuc)}
                            </td>

                            <td>
                                <strong>
                                    {formatTien(payment
                                            ?.soTien ??
                                        hoaDon.tongThanhToan)}
                                </strong>
                            </td>

                            <td>
                                {payment
                                        ?.maGiaoDich ||
                                    "-"}
                            </td>

                            <td>

                                                <span style={{
                                                    display: "inline-block",
                                                    padding: "5px 10px",
                                                    borderRadius: "20px",
                                                    background: payment
                                                        ?.trangThai ===
                                                    "DA_THANH_TOAN"
                                                        ? "#e8f5e9"
                                                        : payment
                                                            ?.trangThai ===
                                                        "THAT_BAI"
                                                            ? "#ffebee"
                                                            : "#fff3e0",
                                                    color: payment
                                                        ?.trangThai ===
                                                    "DA_THANH_TOAN"
                                                        ? "#2e7d32"
                                                        : payment
                                                            ?.trangThai ===
                                                        "THAT_BAI"
                                                            ? "#c62828"
                                                            : "#ef6c00",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                }}>
                                                    {tenTrangThaiThanhToan(payment
                                                        ?.trangThai)}
                                                </span>

                            </td>

                            <td>
                                {formatNgay(payment
                                    ?.ngayThanhToan)}
                            </td>

                            <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>

                                {payment &&
                                payment.trangThai !==
                                "DA_THANH_TOAN" ? (<button type="button" onClick={() => xacNhanThanhToan(hoaDon, payment)} style={{
                                    border: "none",
                                    background: "#2e7d32",
                                    color: "#fff",
                                    padding: "8px 12px",
                                    minWidth: "92px",
                                    borderRadius: "7px",
                                    cursor: "pointer",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                }}>
                                    ✓ Xác nhận
                                </button>) : (<span style={{
                                    color: "#2e7d32",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                }}>
                                                        ✓ Hoàn tất
                                                    </span>)}

                            </td>

                        </tr>);
                    })}

                    <tr>
                        <td colSpan={9}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "12px"
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
                                        border: "none",
                                        background: "none",
                                        fontSize: "24px",
                                        color:
                                            currentPage === 1
                                                ? "#ccc"
                                                : "#999"
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
                                        onClick={() =>
                                            setCurrentPage(page)
                                        }
                                        style={{
                                            width: "46px",
                                            height: "46px",
                                            border: "none",
                                            borderRadius: "10px",
                                            background:
                                                currentPage === page
                                                    ? "#c94f3f"
                                                    : "transparent",
                                            color:
                                                currentPage === page
                                                    ? "#fff"
                                                    : "#999",
                                            fontWeight: 600,
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
                                            Math.min(
                                                totalPages,
                                                page + 1
                                            )
                                        )
                                    }
                                    disabled={
                                        currentPage === totalPages
                                    }
                                    style={{
                                        border: "none",
                                        background: "none",
                                        fontSize: "24px",
                                        color:
                                            currentPage === totalPages
                                                ? "#ccc"
                                                : "#999"
                                    }}
                                >
                                    →
                                </button>
                            </div>
                        </td>
                    </tr>

                    </tbody>

                </table>

            </div>)}

        </section>

    </div>);
}
const searchInputStyle = {
    width: "400px",
    maxWidth: "100%",
    height: "58px",
    boxSizing: "border-box",
    padding: "0 18px",
    border: "1px solid #d9d9d9",
    borderRadius: "10px",
    fontSize: "18px",
    color: "#222",
    outline: "none",
    background: "#fff"
};
function CustomerContent() {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selected, setSelected] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 5;

    const taiKhachHang = async (force = false) => {
        try {
            if (force) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const danhSach = await getKhachHangs(force);

            // Khách đăng ký mới có ID lớn hơn.
            // Ưu tiên ID giảm dần để khách mới luôn nằm đầu danh sách.
            const danhSachDaSapXep = [...danhSach].sort((a, b) => {
                return Number(b?.id || 0) - Number(a?.id || 0);
            });

            setCustomers(danhSachDaSapXep);
        }
        catch (err) {
            console.error("Lỗi tải khách hàng:", err);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        // Lần đầu vào trang Khách hàng luôn lấy dữ liệu mới nhất từ backend.
        // Không phụ thuộc cache cũ.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        taiKhachHang(true);
    }, []);

    useEffect(() => {
        const taiLaiNgay = () => {
            // Xóa cache cũ để chắc chắn lấy khách vừa đăng ký.
            adminDataCache.khachHangs = null;
            adminDataCache.khachHangsPromise = null;
            taiKhachHang(true);
        };

        // Register và Admin cùng chạy trong một tab/app.
        const xuLyKhachHangMoi = (event) => {
            if (event?.detail?.type === "KHACH_HANG_MOI") {
                taiLaiNgay();
            }
        };

        window.addEventListener(
            "fshop-khach-hang-moi",
            xuLyKhachHangMoi
        );

        // Register và Admin mở ở hai tab khác nhau.
        let channel = null;

        try {
            if ("BroadcastChannel" in window) {
                channel = new BroadcastChannel("fshop-khach-hang");

                channel.onmessage = (event) => {
                    if (event?.data?.type === "KHACH_HANG_MOI") {
                        taiLaiNgay();
                    }
                };
            }
        } catch (error) {
            console.error(
                "Không thể tạo BroadcastChannel:",
                error
            );
        }

        // Fallback cho trình duyệt không hỗ trợ BroadcastChannel.
        const xuLyStorage = (event) => {
            if (
                event.key === "fshop-khach-hang-moi" &&
                event.newValue
            ) {
                taiLaiNgay();
            }
        };

        window.addEventListener("storage", xuLyStorage);

        return () => {
            window.removeEventListener(
                "fshop-khach-hang-moi",
                xuLyKhachHangMoi
            );
            window.removeEventListener(
                "storage",
                xuLyStorage
            );

            if (channel) {
                channel.close();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = customers.filter((item) => {
        const keyword = search.trim().toLowerCase();

        const hoTen = String(
            item?.hoTen ||
            item?.tenNguoiNhan ||
            ""
        ).toLowerCase();

        const tenDangNhap = String(
            item?.taiKhoan?.tenDangNhap ||
            item?.tenDangNhap ||
            ""
        ).toLowerCase();

        const soDienThoai = String(
            item?.soDienThoai ||
            item?.taiKhoan?.soDienThoai ||
            ""
        ).toLowerCase();

        const id = String(item?.id || "").toLowerCase();

        return (
            !keyword ||
            hoTen.includes(keyword) ||
            tenDangNhap.includes(keyword) ||
            soDienThoai.includes(keyword) ||
            id.includes(keyword)
        );
    });

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / itemsPerPage)
    );

    const currentItems = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage(1);
    }, [search]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const formatGioiTinh = (value) => {
        const v = String(value || "").trim().toUpperCase();

        if (v === "NAM") return "Nam";
        if (v === "NU" || v === "NỮ") return "Nữ";
        if (v === "KHAC" || v === "KHÁC") return "Khác";

        return value || "-";
    };

    const formatNgaySinh = (value) => {
        if (!value) return "-";

        const parts = String(value).split("-");

        if (parts.length !== 3) {
            return String(value);
        }

        const [year, month, day] = parts;

        return `${day}/${month}/${year}`;
    };

    const xemChiTiet = async (customer) => {
        setSelected(customer);
        setAddresses([]);

        try {
            const response = await fetch(
                `${API}/dia-chi/khach-hang/${customer.id}`
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            setAddresses(Array.isArray(data) ? data : []);
        }
        catch (err) {
            console.error("Lỗi tải địa chỉ khách hàng:", err);
        }
    };

    const dongChiTiet = () => {
        setSelected(null);
        setAddresses([]);
    };

    const diaChiMacDinh = addresses.find(
        (item) =>
            item?.macDinh === true ||
            item?.macDinh === 1 ||
            item?.macDinh === "true"
    );

    return (
        <div className="admin-dashboard-content">
            <div className="admin-page-heading">
                <div>
                    <div className="admin-eyebrow">
                        FSHOP ADMIN
                    </div>

                    <h1>Khách hàng</h1>

                    <p>
                        Quản lý thông tin khách hàng.
                    </p>
                </div>
            </div>

            <section className="admin-card">
                <div
                    className="customer-toolbar"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap"
                    }}
                >
                    <input
                        className="customer-search-input"
                        style={{
                            width: "400px",
                            maxWidth: "100%",
                            height: "58px",
                            boxSizing: "border-box",
                            padding: "0 18px",
                            border: "1px solid #ddd",
                            borderRadius: "10px",
                            fontSize: "16px",
                            color: "#222",
                            outline: "none",
                            background: "#fff"
                        }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm ID, tên, tên đăng nhập hoặc số điện thoại..."
                    />

                    <button
                        type="button"
                        onClick={() => taiKhachHang(true)}
                        disabled={refreshing}
                        style={{
                            height: "58px",
                            padding: "0 18px",
                            border: "1px solid #ddd",
                            borderRadius: "10px",
                            background: "#fff",
                            cursor: refreshing
                                ? "not-allowed"
                                : "pointer",
                            fontWeight: 600,
                            opacity: refreshing ? 0.6 : 1,
                            whiteSpace: "nowrap"
                        }}
                    >
                        {refreshing
                            ? "Đang cập nhật..."
                            : "↻ Làm mới"}
                    </button>
                </div>
            </section>

            <section className="admin-card">
                <div className="admin-card-heading">
                    <div>
                        <h2>Danh sách khách hàng</h2>
                        <p>
                            Tổng: {filtered.length} khách hàng
                        </p>
                    </div>
                </div>

                <div className="admin-table-scroll">
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Họ tên</th>
                            <th>Tên đăng nhập</th>
                            <th>Số điện thoại</th>
                            <th>Giới tính</th>
                            <th>Thao tác</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="customer-empty"
                                >
                                    Đang tải khách hàng...
                                </td>
                            </tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        #{item.id}
                                    </td>

                                    <td>
                                        <strong>
                                            {item?.hoTen ||
                                                item?.tenNguoiNhan ||
                                                item?.taiKhoan?.hoTen ||
                                                "Khách hàng mới"}
                                        </strong>
                                    </td>

                                    <td>
                                        {item?.taiKhoan?.tenDangNhap ||
                                            item?.tenDangNhap ||
                                            "-"}
                                    </td>

                                    <td>
                                        {item?.soDienThoai ||
                                            item?.taiKhoan?.soDienThoai ||
                                            "-"}
                                    </td>

                                    <td>
                                        {formatGioiTinh(
                                            item?.gioiTinh
                                        )}
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                xemChiTiet(item)
                                            }
                                            style={{
                                                border: "1px solid #ddd",
                                                background: "#fff",
                                                color: "#222",
                                                padding: "8px 16px",
                                                borderRadius: "9px",
                                                cursor: "pointer",
                                                fontSize: "14px",
                                                fontWeight: 600
                                            }}
                                        >
                                            Xem
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="customer-empty"
                                >
                                    Không tìm thấy khách hàng.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {filtered.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "8px",
                            padding: "20px 0 5px",
                            flexWrap: "wrap"
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
                                width: "56px",
                                height: "46px",
                                border: "1px solid #ddd",
                                borderRadius: "10px",
                                background: "#fff",
                                fontSize: "20px",
                                color:
                                    currentPage === 1
                                        ? "#ccc"
                                        : "#222",
                                cursor:
                                    currentPage === 1
                                        ? "default"
                                        : "pointer"
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
                                onClick={() =>
                                    setCurrentPage(page)
                                }
                                style={{
                                    width: "46px",
                                    height: "46px",
                                    border: "none",
                                    borderRadius: "10px",
                                    background:
                                        currentPage === page
                                            ? "#c94f3f"
                                            : "transparent",
                                    color:
                                        currentPage === page
                                            ? "#fff"
                                            : "#777",
                                    fontWeight: 600,
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
                                    Math.min(
                                        totalPages,
                                        page + 1
                                    )
                                )
                            }
                            disabled={
                                currentPage === totalPages
                            }
                            style={{
                                width: "56px",
                                height: "46px",
                                border: "1px solid #ddd",
                                borderRadius: "10px",
                                background: "#fff",
                                fontSize: "20px",
                                color:
                                    currentPage === totalPages
                                        ? "#ccc"
                                        : "#222",
                                cursor:
                                    currentPage === totalPages
                                        ? "default"
                                        : "pointer"
                            }}
                        >
                            →
                        </button>
                    </div>
                )}
            </section>

            {selected && (
                <div
                    onClick={dongChiTiet}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "min(650px,100%)",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            background: "#fff",
                            borderRadius: "14px",
                            padding: "25px",
                            boxShadow:
                                "0 20px 60px rgba(0,0,0,.18)"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px"
                            }}
                        >
                            <h2 style={{ margin: 0 }}>
                                Chi tiết khách hàng
                            </h2>

                            <button
                                type="button"
                                onClick={dongChiTiet}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    fontSize: "30px",
                                    cursor: "pointer",
                                    lineHeight: 1
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "1fr 1fr",
                                gap: "14px",
                                marginBottom: "25px"
                            }}
                        >
                            <div>
                                <strong>ID</strong>
                                <p>#{selected.id}</p>
                            </div>

                            <div>
                                <strong>Họ tên</strong>
                                <p>
                                    {selected?.hoTen ||
                                        selected?.tenNguoiNhan ||
                                        "Khách hàng mới"}
                                </p>
                            </div>

                            <div>
                                <strong>Tên đăng nhập</strong>
                                <p>
                                    {selected?.taiKhoan
                                            ?.tenDangNhap ||
                                        selected?.tenDangNhap ||
                                        "-"}
                                </p>
                            </div>

                            <div>
                                <strong>Số điện thoại</strong>
                                <p>
                                    {selected?.soDienThoai ||
                                        selected?.taiKhoan
                                            ?.soDienThoai ||
                                        "-"}
                                </p>
                            </div>

                            <div>
                                <strong>Ngày sinh</strong>
                                <p>
                                    {formatNgaySinh(
                                        selected?.ngaySinh
                                    )}
                                </p>
                            </div>

                            <div>
                                <strong>Giới tính</strong>
                                <p>
                                    {formatGioiTinh(
                                        selected?.gioiTinh
                                    )}
                                </p>
                            </div>
                        </div>

                        <h3>Địa chỉ mặc định</h3>

                        {diaChiMacDinh ? (
                            <div
                                style={{
                                    padding: "14px",
                                    border: "1px solid #eee",
                                    borderRadius: "10px",
                                    background: "#fafafa"
                                }}
                            >
                                <strong>
                                    {diaChiMacDinh?.tenNguoiNhan ||
                                        "Chưa cập nhật"}
                                </strong>

                                <div
                                    style={{
                                        marginTop: "7px"
                                    }}
                                >
                                    SĐT:{" "}
                                    {diaChiMacDinh?.soDienThoai ||
                                        "-"}
                                </div>

                                <div
                                    style={{
                                        marginTop: "7px"
                                    }}
                                >
                                    Địa chỉ:{" "}
                                    {diaChiMacDinh?.diaChi ||
                                        diaChiMacDinh?.diaChiChiTiet ||
                                        diaChiMacDinh?.chiTiet ||
                                        "-"}
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: "#777" }}>
                                Khách hàng chưa có địa chỉ mặc định.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
function EmployeeContent() {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [selectedEdit, setSelectedEdit] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [form, setForm] = useState({
        tenDangNhap: "",
        matKhau: "",
        hoTen: "",
        soDienThoai: "",
        chucVu: "",
        trangThai: "HOAT_DONG",
        ngayVaoLam: ""
    });
    const taiNhanVien = async () => {
        try {
            const res = await fetch(`${API}/nhan-vien`);
            if (res.ok) {
                setEmployees(await res.json());
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        taiNhanVien();
    }, []);
    const filtered = employees.filter((item) => `${item.hoTen} ${item.taiKhoan?.tenDangNhap || ""} ${item.soDienThoai || ""} ${item.chucVu || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()));

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / itemsPerPage)
    );

    const currentItems = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage(1);
    }, [search]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage((page) =>
            Math.min(page, totalPages)
        );
    }, [totalPages]);

    const formatNgay = (value) => {
        if (!value)
            return "-";
        const [year, month, day] = value.split("-");
        return `${day}/${month}/${year}`;
    };
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };
    const xemChiTiet = (item) => {
        setSelected(item);
    };
    const moSua = (item) => {
        setSelected(null);
        setSelectedEdit(item);
        setForm({
            tenDangNhap: item.taiKhoan?.tenDangNhap || "",
            matKhau: "",
            hoTen: item.hoTen || "",
            soDienThoai: item.soDienThoai || "",
            chucVu: item.chucVu || "",
            trangThai: item.trangThai || "HOAT_DONG",
            ngayVaoLam: item.ngayVaoLam || ""
        });
        setShowEdit(true);
    };
    const suaNhanVien = async (e) => {
        e.preventDefault();
        if (!form.hoTen || !form.chucVu) {
            alert("Vui lòng nhập đầy đủ thông tin bắt buộc.");
            return;
        }
        try {
            setSaving(true);
            const response = await fetch(`${API}/nhan-vien/${selectedEdit.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    hoTen: form.hoTen,
                    soDienThoai: form.soDienThoai,
                    chucVu: form.chucVu,
                    trangThai: form.trangThai,
                    ngayVaoLam: form.ngayVaoLam || null
                })
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Không thể sửa nhân viên");
            }
            alert("Sửa nhân viên thành công.");
            setShowEdit(false);
            setSelectedEdit(null);
            await taiNhanVien();
        }
        catch (err) {
            alert(err.message || "Không thể sửa nhân viên");
        }
        finally {
            setSaving(false);
        }
    };
    const xoaNhanVien = async (item) => {
        if (!window.confirm(`Bạn có chắc muốn xóa nhân viên ${item.hoTen}?`)) {
            return;
        }
        try {
            setDeleting(true);
            const response = await fetch(`${API}/nhan-vien/${item.id}`, {
                method: "DELETE"
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Không thể xóa nhân viên");
            }
            alert("Xóa nhân viên thành công.");
            setSelected(null);
            setSelectedEdit(null);
            await taiNhanVien();
        }
        catch (err) {
            alert(err.message || "Không thể xóa nhân viên");
        }
        finally {
            setDeleting(false);
        }
    };
    const themNhanVien = async (e) => {
        e.preventDefault();
        if (!form.tenDangNhap ||
            !form.matKhau ||
            !form.hoTen ||
            !form.chucVu) {
            alert("Vui lòng nhập đầy đủ thông tin bắt buộc.");
            return;
        }
        try {
            setSaving(true);
            const response = await fetch(`${API}/nhan-vien`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    hoTen: form.hoTen,
                    soDienThoai: form.soDienThoai,
                    chucVu: form.chucVu,
                    trangThai: form.trangThai,
                    ngayVaoLam: form.ngayVaoLam || null,
                    taiKhoan: {
                        tenDangNhap: form.tenDangNhap,
                        matKhau: form.matKhau
                    }
                })
            });
            const text = await response.text();
            let data = null;
            try {
                data = text ? JSON.parse(text) : null;
            }
            catch {
                data = null;
            }
            if (!response.ok) {
                throw new Error(data?.message ||
                    data?.error ||
                    text ||
                    "Không thể thêm nhân viên");
            }
            alert("Thêm nhân viên thành công.");
            setForm({
                tenDangNhap: "",
                matKhau: "",
                hoTen: "",
                soDienThoai: "",
                chucVu: "",
                trangThai: "HOAT_DONG",
                ngayVaoLam: ""
            });
            setShowAdd(false);
            await taiNhanVien();
        }
        catch (err) {
            alert(err.message || "Không thể thêm nhân viên");
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="admin-dashboard-content">
        <div className="admin-page-heading">
            <div>
                <div className="admin-eyebrow">FSHOP ADMIN</div>
                <h1>Nhân viên</h1>
                <p>Quản lý thông tin nhân viên.</p>
            </div>

            <button type="button" className="customer-add-button" onClick={() => setShowAdd(true)} style={{
                border: "none",
                background: "#111",
                color: "#fff",
                padding: "16px 24px",
                borderRadius: "14px",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: 500,
                minWidth: "174px"
            }}>
                + Thêm nhân viên
            </button>
        </div>

        <section className="admin-card">
            <div className="customer-toolbar">
                <input className="customer-search-input" style={searchInputStyle} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, tên đăng nhập, số điện thoại hoặc chức vụ..."/>
            </div>
        </section>

        <section className="admin-card">
            <div className="admin-table-scroll">
                <table className="admin-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Họ tên</th>
                        <th>Tên đăng nhập</th>
                        <th>Số điện thoại</th>
                        <th>Chức vụ</th>
                        <th>Ngày vào làm</th>
                        <th>Thao tác</th>
                    </tr>
                    </thead>

                    <tbody>
                    {loading ? (<tr>
                        <td colSpan="7" className="customer-empty">
                            Đang tải nhân viên...
                        </td>
                    </tr>) : filtered.length ? (currentItems.map((item) => (<tr key={item.id}>
                        <td>#{item.id}</td>
                        <td><strong>{item.hoTen}</strong></td>
                        <td>{item.taiKhoan?.tenDangNhap || "-"}</td>
                        <td>{item.soDienThoai || "-"}</td>
                        <td>
                            {hienThiChucVu(item.chucVu)}
                        </td>
                        <td>{formatNgay(item.ngayVaoLam)}</td>
                        <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                                <button type="button" onClick={() => xemChiTiet(item)} style={{
                                    border: "1px solid #ddd",
                                    background: "#fff",
                                    color: "#222",
                                    padding: "8px 16px",
                                    borderRadius: "9px",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    fontWeight: 400
                                }}>
                                    Xem
                                </button>
                                <button type="button" onClick={() => moSua(item)} style={{
                                    border: "1px solid #ddd",
                                    background: "#fff",
                                    color: "#222",
                                    padding: "8px 16px",
                                    borderRadius: "9px",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    fontWeight: 400
                                }}>
                                    Sửa
                                </button>
                                <button type="button" onClick={() => xoaNhanVien(item)} disabled={deleting} style={{
                                    border: "1px solid #f3d6d1",
                                    background: "#fff3f1",
                                    color: "#c84b3c",
                                    padding: "8px 16px",
                                    borderRadius: "9px",
                                    cursor: deleting ? "not-allowed" : "pointer",
                                    fontSize: "16px",
                                    fontWeight: 400
                                }}>
                                    Xóa
                                </button>
                            </div>
                        </td>
                    </tr>))) : (<tr>
                        <td colSpan="7" className="customer-empty">
                            Không có nhân viên.
                        </td>
                    </tr>)}

                    {!loading && filtered.length > 0 && (
                        <tr>
                            <td colSpan={7}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "12px"
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
                                            width: "56px",
                                            height: "56px",
                                            border: "1px solid #ddd",
                                            borderRadius: "10px",
                                            background: "#fff",
                                            fontSize: "22px",
                                            color:
                                                currentPage === 1
                                                    ? "#ccc"
                                                    : "#222",
                                            cursor:
                                                currentPage === 1
                                                    ? "default"
                                                    : "pointer"
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
                                            onClick={() =>
                                                setCurrentPage(page)
                                            }
                                            style={{
                                                width: "46px",
                                                height: "46px",
                                                border: "none",
                                                borderRadius: "10px",
                                                background:
                                                    currentPage === page
                                                        ? "#c94f3f"
                                                        : "transparent",
                                                color:
                                                    currentPage === page
                                                        ? "#fff"
                                                        : "#999",
                                                fontWeight: 600,
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
                                                Math.min(
                                                    totalPages,
                                                    page + 1
                                                )
                                            )
                                        }
                                        disabled={
                                            currentPage === totalPages
                                        }
                                        style={{
                                            width: "56px",
                                            height: "56px",
                                            border: "1px solid #ddd",
                                            borderRadius: "10px",
                                            background: "#fff",
                                            fontSize: "22px",
                                            color:
                                                currentPage === totalPages
                                                    ? "#ccc"
                                                    : "#222",
                                            cursor:
                                                currentPage === totalPages
                                                    ? "default"
                                                    : "pointer"
                                        }}
                                    >
                                        →
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </section>

        {showAdd && (<div onClick={() => setShowAdd(false)} style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
        }}>
            <div onClick={(e) => e.stopPropagation()} style={{
                width: "min(700px,100%)",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "#fff",
                borderRadius: "14px",
                padding: "25px"
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px"
                }}>
                    <h2>Thêm nhân viên</h2>

                    <button type="button" onClick={() => setShowAdd(false)}>
                        ×
                    </button>
                </div>

                <form onSubmit={themNhanVien}>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "14px"
                    }}>
                        <div>
                            <label>Tên đăng nhập *</label>
                            <input name="tenDangNhap" value={form.tenDangNhap} onChange={handleChange} style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "10px",
                                marginTop: "6px"
                            }}/>
                        </div>

                        <div>
                            <label>Mật khẩu *</label>
                            <input type="password" name="matKhau" value={form.matKhau} onChange={handleChange} style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "10px",
                                marginTop: "6px"
                            }}/>
                        </div>

                        <div>
                            <label>Họ tên *</label>
                            <input name="hoTen" value={form.hoTen} onChange={handleChange} style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "10px",
                                marginTop: "6px"
                            }}/>
                        </div>

                        <div>
                            <label>Số điện thoại</label>
                            <input name="soDienThoai" value={form.soDienThoai} onChange={handleChange} style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "10px",
                                marginTop: "6px"
                            }}/>
                        </div>

                        <div>
                            <label>Chức vụ *</label>
                            <input name="chucVu" value={form.chucVu} onChange={handleChange} placeholder="Ví dụ: Nhân viên bán hàng" style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "10px",
                                marginTop: "6px"
                            }}/>
                        </div>

                        <div>
                            <label>Ngày vào làm</label>
                            <input type="date" name="ngayVaoLam" value={form.ngayVaoLam} onChange={handleChange} style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "10px",
                                marginTop: "6px"
                            }}/>
                        </div>

                        <div>
                            <label>Trạng thái</label>
                            <select name="trangThai" value={form.trangThai} onChange={handleChange} style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "10px",
                                marginTop: "6px"
                            }}>
                                <option value="HOAT_DONG">Hoạt động</option>
                                <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                            </select>
                        </div>
                    </div>

                    <div style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "10px",
                        marginTop: "25px"
                    }}>
                        <button type="button" onClick={() => setShowAdd(false)} style={{
                            padding: "10px 18px",
                            border: "1px solid #ddd",
                            background: "#fff",
                            borderRadius: "8px",
                            cursor: "pointer"
                        }}>
                            Hủy
                        </button>

                        <button type="submit" disabled={saving} style={{
                            padding: "10px 18px",
                            border: "none",
                            background: "#222",
                            color: "#fff",
                            borderRadius: "8px",
                            cursor: "pointer"
                        }}>
                            {saving ? "Đang lưu..." : "Thêm nhân viên"}
                        </button>
                    </div>
                </form>
            </div>
        </div>)}

        {showEdit && selectedEdit && (<div onClick={() => setShowEdit(false)} style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
        }}>
            <div onClick={(e) => e.stopPropagation()} style={{
                width: "min(700px,100%)",
                background: "#fff",
                borderRadius: "14px",
                padding: "25px"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>Sửa nhân viên</h2>
                    <button type="button" onClick={() => setShowEdit(false)}>×</button>
                </div>

                <form onSubmit={suaNhanVien}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div>
                            <label>Tên đăng nhập</label>
                            <input value={form.tenDangNhap} disabled style={{ width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }}/>
                        </div>
                        <div>
                            <label>Họ tên *</label>
                            <input name="hoTen" value={form.hoTen} onChange={handleChange} style={{ width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }}/>
                        </div>
                        <div>
                            <label>Số điện thoại</label>
                            <input name="soDienThoai" value={form.soDienThoai} onChange={handleChange} style={{ width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }}/>
                        </div>
                        <div>
                            <label>Chức vụ *</label>
                            <input name="chucVu" value={form.chucVu} onChange={handleChange} style={{ width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }}/>
                        </div>
                        <div>
                            <label>Ngày vào làm</label>
                            <input type="date" name="ngayVaoLam" value={form.ngayVaoLam} onChange={handleChange} style={{ width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }}/>
                        </div>
                        <div>
                            <label>Trạng thái</label>
                            <select name="trangThai" value={form.trangThai} onChange={handleChange} style={{ width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }}>
                                <option value="HOAT_DONG">Hoạt động</option>
                                <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "25px" }}>
                        <button type="button" onClick={() => setShowEdit(false)}>Hủy</button>
                        <button type="submit" disabled={saving}>
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>)}

        {selected && (<div onClick={() => setSelected(null)} style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
        }}>
            <div onClick={(e) => e.stopPropagation()} style={{
                width: "min(650px,100%)",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "#fff",
                borderRadius: "14px",
                padding: "25px"
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between"
                }}>
                    <h2>Chi tiết nhân viên</h2>

                    <button type="button" onClick={() => setSelected(null)}>
                        ×
                    </button>
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px"
                }}>
                    <div>
                        <strong>ID</strong>
                        <p>#{selected.id}</p>
                    </div>

                    <div>
                        <strong>Họ tên</strong>
                        <p>{selected.hoTen}</p>
                    </div>

                    <div>
                        <strong>Tên đăng nhập</strong>
                        <p>{selected.taiKhoan?.tenDangNhap || "-"}</p>
                    </div>

                    <div>
                        <strong>Số điện thoại</strong>
                        <p>{selected.soDienThoai || "-"}</p>
                    </div>

                    <div>
                        <strong>Chức vụ</strong>
                        <p>{hienThiChucVu(selected.chucVu)}</p>
                    </div>

                    <div>
                        <strong>Trạng thái</strong>
                        <p>{hienThiTrangThaiNhanVien(selected.trangThai)}</p>
                    </div>

                    <div>
                        <strong>Ngày vào làm</strong>
                        <p>{formatNgay(selected.ngayVaoLam)}</p>
                    </div>
                </div>
            </div>
        </div>)}
    </div>);
}
function BanHangTaiQuayContent() {
    // Tài khoản nhận tiền cố định của FShop; VietQR tự điền số tiền và nội dung theo đơn.
    const BANK_ID = "MB";
    const BANK_ACCOUNT_NO = "0867596002";
    const BANK_ACCOUNT_NAME = "FBShop";
    const [successBill, setSuccessBill] = useState(null);
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [activeBrand, setActiveBrand] = useState("Tất cả");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState("");
    const [loadingVariants, setLoadingVariants] = useState(false);
    const [cart, setCart] = useState([]);
    const [tenKhach, setTenKhach] = useState("");
    const [soDienThoaiKhach, setSoDienThoaiKhach] = useState("");
    const [phuongThucThanhToan, setPhuongThucThanhToan] = useState("TIEN_MAT");
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [cashGiven, setCashGiven] = useState("");

    const loadProducts = async () => {
        try {
            setLoading(true); setError("");
            const response = await fetch(`${API}/san-pham`);
            const raw = await response.text();
            let data; try { data = raw ? JSON.parse(raw) : []; } catch { data = []; }
            if (!response.ok) throw new Error(data?.message || data?.error || raw || "Không tải được sản phẩm");
            // API /san-pham có thể chỉ trả thông tin cơ bản; lấy thêm biến thể
            // để hiển thị giá bán và tồn kho thực tế ngay trên thẻ sản phẩm.
            const danhSach = Array.isArray(data) ? data : [];
            const productsWithDetails = await Promise.all(danhSach.map(async (product) => {
                try {
                    const detailResponse = await fetch(`${API}/san-pham/${product.id}/chi-tiet`);
                    if (!detailResponse.ok) {
                        return { ...product, chiTiet: [], giaBan: product.giaBan ?? product.gia ?? null, tonKhoPOS: null, loiTaiBienThe: true };
                    }
                    const detailRaw = await detailResponse.text();
                    let detailData;
                    try { detailData = detailRaw ? JSON.parse(detailRaw) : []; } catch { detailData = []; }
                    const chiTiet = Array.isArray(detailData) ? detailData : [];
                    const activeVariants = chiTiet.filter(v => !v.trangThai || String(v.trangThai).toUpperCase() === "HOAT_DONG");
                    const pricedVariants = activeVariants
                        .map(v => Number(v.giaBan ?? v.gia ?? v.donGia ?? 0))
                        .filter(price => Number.isFinite(price) && price > 0);
                    const stock = activeVariants.reduce((sum, v) => sum + Math.max(0, Number(v.soLuongTon ?? 0)), 0);
                    return {
                        ...product,
                        chiTiet,
                        // Dùng giá thấp nhất của biến thể đang hoạt động làm giá tham khảo.
                        giaBan: pricedVariants.length ? Math.min(...pricedVariants) : (product.giaBan ?? product.gia ?? null),
                        tonKhoPOS: stock,
                        loiTaiBienThe: false,
                    };
                } catch (detailError) {
                    console.error(`Không tải được size/màu sản phẩm ${product.id}:`, detailError);
                    return { ...product, chiTiet: [], giaBan: product.giaBan ?? product.gia ?? null, tonKhoPOS: null, loiTaiBienThe: true };
                }
            }));
            setProducts(productsWithDetails);
        } catch (e) { setError(e.message || "Không thể tải sản phẩm từ máy chủ."); }
        finally { setLoading(false); }
    };
    useEffect(() => { loadProducts(); }, []);

    const brandName = (p) => p?.thuongHieu?.tenThuongHieu || p?.thuongHieu?.ten || p?.tenThuongHieu || "Khác";
    const brands = [...new Set(products.map(brandName))].sort((a, b) => a.localeCompare(b, "vi"));
    const brandCounts = (brand) => products.filter(p => brandName(p) === brand).length;
    const filteredProducts = products.filter((p) => {
        const key = search.trim().toLowerCase();
        const matchSearch = !key || [p.tenSanPham, p.maSanPham, brandName(p)].some(v => String(v || "").toLowerCase().includes(key));
        return matchSearch && (activeBrand === "Tất cả" || brandName(p) === activeBrand);
    });
    const openVariants = async (product) => {
        try {
            setSelectedProduct(product); setVariants([]); setSelectedVariantId(""); setLoadingVariants(true); setError("");
            const response = await fetch(`${API}/san-pham/${product.id}/chi-tiet`);
            const raw = await response.text(); let data; try { data = raw ? JSON.parse(raw) : []; } catch { data = []; }
            if (!response.ok) throw new Error(data?.message || data?.error || raw || "Không tải được size/màu sản phẩm");
            const available = (Array.isArray(data) ? data : []).filter(v => Number(v.soLuongTon || 0) > 0 && (!v.trangThai || String(v.trangThai).toUpperCase() === "HOAT_DONG"));
            setVariants(available); if (available.length) setSelectedVariantId(String(available[0].id));
            else setError("Sản phẩm này hiện không có biến thể còn hàng.");
        } catch (e) { setError(e.message || "Không tải được biến thể sản phẩm."); }
        finally { setLoadingVariants(false); }
    };
    const addSelectedVariant = () => {
        const variant = variants.find(v => String(v.id) === String(selectedVariantId));
        if (!variant) return;
        setCart(old => {
            const existing = old.find(item => Number(item.variant.id) === Number(variant.id));
            if (existing) {
                if (existing.quantity >= Number(variant.soLuongTon || 0)) { setError(`Size/màu này chỉ còn ${variant.soLuongTon || 0} sản phẩm.`); return old; }
                return old.map(item => Number(item.variant.id) === Number(variant.id) ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...old, { product: selectedProduct, variant, quantity: 1 }];
        });
        setError(""); setSelectedProduct(null);
    };
    const changeQuantity = (variantId, delta) => setCart(old => old.map(item => {
        if (Number(item.variant.id) !== Number(variantId)) return item;
        const next = item.quantity + delta;
        if (next > Number(item.variant.soLuongTon || 0)) { setError(`Chỉ còn ${item.variant.soLuongTon || 0} sản phẩm trong kho.`); return item; }
        return { ...item, quantity: next };
    }).filter(item => item.quantity > 0));
    const priceOf = (product, variant) => Number(variant?.giaBan ?? variant?.gia ?? variant?.donGia ?? product?.giaBan ?? product?.gia ?? 0);
    const total = cart.reduce((sum, item) => sum + priceOf(item.product, item.variant) * item.quantity, 0);
    const money = value => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
    const checkout = () => {
        if (!cart.length) { setError("Vui lòng thêm ít nhất một sản phẩm vào giỏ."); return; }
        if (soDienThoaiKhach.trim() && !/^[0-9+\s().-]{9,15}$/.test(soDienThoaiKhach.trim())) { setError("Số điện thoại khách hàng chưa hợp lệ."); return; }
        setError("");
        setCashGiven(phuongThucThanhToan === "TIEN_MAT" ? String(total) : "");
        setPaymentModalOpen(true);
    };
    const confirmCheckout = async () => {
        if (!cart.length) { setError("Giỏ hàng đang trống."); return; }
        const cashAmount = Number(cashGiven || 0);
        if (phuongThucThanhToan === "TIEN_MAT" && cashAmount < total) {
            setError("Số tiền khách đưa chưa đủ thanh toán.");
            return;
        }
        const requestBody = { phuongThucThanhToan, tenKhach: tenKhach.trim() || null, soDienThoaiKhach: soDienThoaiKhach.trim() || null, chiTiet: cart.map(item => ({ sanPhamChiTietId: Number(item.variant.id), soLuong: item.quantity })) };
        try {
            setBusy(true); setError("");
            const response = await fetch(`${API}/hoa-don/tao-tai-quay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
            const raw = await response.text(); let data; try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
            if (!response.ok) throw new Error(data?.message || data?.error || raw || "Không thể tạo hóa đơn tại quầy.");
            const ma = data?.maHoaDon || (data?.id ? `HD${data.id}` : "");
            setPaymentModalOpen(false);
            setSuccessBill({
                maHoaDon: ma || "Đã tạo hóa đơn",
                tongTien: Number(data?.tongThanhToan ?? total),
                tenKhach: tenKhach.trim() || "Khách lẻ",
                soDienThoai: soDienThoaiKhach.trim() || "—",
                phuongThuc: phuongThucThanhToan === "TIEN_MAT" ? "Tiền mặt" : "Chuyển khoản",
                tienThua: phuongThucThanhToan === "TIEN_MAT" ? Math.max(0, cashAmount - total) : 0,
                items: cart.map(item => ({
                    ten: item.product?.tenSanPham || "Sản phẩm",
                    ma: item.product?.maSanPham || `SP${item.product?.id ?? ""}`,
                    size: item.variant?.kichCo?.tenKichCo || item.variant?.kichCo?.kichCo || "—",
                    mau: item.variant?.mauSac?.tenMau || "—",
                    soLuong: item.quantity,
                    donGia: priceOf(item.product, item.variant),
                })),
                ngay: new Date().toLocaleString("vi-VN"),
            });
            setCart([]); setTenKhach(""); setSoDienThoaiKhach(""); setCashGiven(""); await loadProducts();
            adminDataCache.hoaDons = null; adminDataCache.khachHangs = null;
        } catch (e) { setError(e.message || "Thanh toán thất bại. Vui lòng thử lại."); }
        finally { setBusy(false); }
    };
    const changeDue = Math.max(0, Number(cashGiven || 0) - total);
    const cashPresets = [...new Set([total, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000, Math.ceil(total / 500000) * 500000].filter(n => n >= total))];
    const [transferContent] = useState(() => `FSHOP${Date.now().toString().slice(-8)}`);
    const bankConfigured = Boolean(BANK_ID.trim() && BANK_ACCOUNT_NO.trim() && BANK_ACCOUNT_NAME.trim());
    const vietQrUrl = bankConfigured
        ? `https://img.vietqr.io/image/${encodeURIComponent(BANK_ID)}-${encodeURIComponent(BANK_ACCOUNT_NO)}-compact2.png?amount=${Math.round(total)}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_ACCOUNT_NAME)}`
        : "";
    const panel = { background: "#fff", border: "1px solid #ececec", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(16,24,40,.035)", minWidth: 0 };
    const field = { width: "100%", boxSizing: "border-box", border: "1px solid #ddd", borderRadius: 9, padding: "12px", background: "#fff", outlineColor: "#f04b2f" };
    const buttonBase = { border: 0, borderRadius: 8, background: "#ed4b2e", color: "#fff", padding: "9px 11px", fontWeight: 700, cursor: "pointer" };
    return <div style={{ padding: 4, color: "#252525" }}>
        <div className="admin-page-heading" style={{ marginBottom: 20 }}><div><div className="admin-eyebrow">FSHOP ADMIN</div><h1>Bán hàng tại quầy</h1><p>Phân loại theo thương hiệu, chọn đúng size/màu và tạo hóa đơn tại quầy.</p></div><button type="button" onClick={loadProducts} disabled={loading} style={{ padding: "10px 14px", border: "1px solid #ddd", borderRadius: 9, background: "#fff", cursor: "pointer" }}>↻ Làm mới</button></div>
        {error && <div role="alert" style={{ padding: 12, marginBottom: 16, color: "#b42318", background: "#fff1f0", borderRadius: 9 }}>{error}<button type="button" onClick={() => setError("")} style={{ float: "right", border: 0, background: "transparent", cursor: "pointer" }}>×</button></div>}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, .72fr) minmax(390px, 1.65fr) minmax(300px, 1.05fr)", gap: 16, alignItems: "stretch" }}>
            <aside style={{ ...panel, padding: 14 }}><div style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 8px 16px", borderBottom: "1px solid #eee" }}><span style={{ width: 38, height: 38, display: "grid", placeItems: "center", background: "#fff1ed", color: "#ed4b2e", borderRadius: 10 }}>☷</span><div><strong>Thương hiệu</strong><div style={{ color: "#8a8a8a", fontSize: 12 }}>{brands.length} thương hiệu</div></div></div>
                <div style={{ display: "grid", gap: 5, marginTop: 12 }}><button type="button" onClick={() => setActiveBrand("Tất cả")} style={{ ...buttonBase, display: "flex", justifyContent: "space-between", padding: "13px 12px", background: activeBrand === "Tất cả" ? "#ed4b2e" : "#fff", color: activeBrand === "Tất cả" ? "#fff" : "#444", border: activeBrand === "Tất cả" ? "1px solid #ed4b2e" : "1px solid transparent", textAlign: "left" }}><span>▦ &nbsp;Tất cả</span><span>{products.length}</span></button>
                    {brands.map(brand => <button type="button" key={brand} onClick={() => setActiveBrand(brand)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "12px", border: "1px solid transparent", borderRadius: 9, background: activeBrand === brand ? "#fff3ef" : "transparent", color: activeBrand === brand ? "#ed4b2e" : "#444", cursor: "pointer", textAlign: "left" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>▫ &nbsp;{brand}</span><span style={{ fontSize: 12, color: activeBrand === brand ? "#ed4b2e" : "#888" }}>{brandCounts(brand)}</span></button>)}</div>
            </aside>
            <section style={{ ...panel, padding: 16 }}><div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 10, marginBottom: 14 }}><div><h2 style={{ margin: "2px 0 3px", fontSize: 24 }}>Sản phẩm</h2><p style={{ margin: 0, color: "#858585", fontSize: 13 }}>Chọn sản phẩm rồi chọn size/màu để thêm vào hóa đơn.</p></div><span style={{ whiteSpace: "nowrap", borderRadius: 20, padding: "8px 12px", background: "#f5f5f5", fontSize: 12, fontWeight: 700 }}>{filteredProducts.length} sản phẩm</span></div>
                <div style={{ position: "relative", marginBottom: 14 }}><span style={{ position: "absolute", left: 13, top: 12, color: "#888" }}>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, mã sản phẩm hoặc thương hiệu..." style={{ ...field, paddingLeft: 36 }}/></div>
                {loading ? <p style={{ padding: 30, textAlign: "center" }}>Đang tải sản phẩm...</p> : filteredProducts.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>{filteredProducts.map(product => {
                    const stock = product.tonKhoPOS ?? product.chiTiet?.reduce?.((sum, v) => sum + Math.max(0, Number(v.soLuongTon ?? 0)), 0) ?? product.soLuongTon;
                    const image = product.hinhAnh || product.anhDaiDien || product.urlAnh || "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80";
                    return <article key={product.id} style={{ minWidth: 0, border: "1px solid #ececec", borderRadius: 12, padding: 9, display: "flex", flexDirection: "column", background: "#fff" }}>
                        <button type="button" onClick={() => openVariants(product)} aria-label={`Chọn size màu ${product.tenSanPham}`} style={{ position: "relative", border: 0, padding: 0, background: "#f7f7f7", borderRadius: 9, cursor: "pointer", overflow: "hidden" }}><img src={image} alt={product.tenSanPham || "Sản phẩm"} style={{ width: "100%", height: 145, objectFit: "contain", display: "block" }}/><span style={{ position: "absolute", right: 8, bottom: 8, width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", background: "#ed4b2e", boxShadow: "0 2px 7px #0002", fontSize: 22 }}>+</span></button>
                        <small style={{ color: "#ed4b2e", fontSize: 10, fontWeight: 700, marginTop: 10, textTransform: "uppercase" }}>{brandName(product)}</small><strong style={{ display: "block", fontSize: 13, lineHeight: 1.4, minHeight: 38, marginTop: 6, overflowWrap: "anywhere" }}>{product.tenSanPham || "Sản phẩm"}</strong><small style={{ color: "#999", marginTop: 6 }}>{product.maSanPham || `SP${product.id}`}</small><strong style={{ color: "#ed4b2e", fontSize: 15, marginTop: 8, whiteSpace: "normal", overflowWrap: "anywhere" }}>{(product.giaBan ?? product.gia) != null && Number(product.giaBan ?? product.gia) > 0 ? money(product.giaBan ?? product.gia) : "Chưa có giá"}</strong><small style={{ color: "#777", fontSize: 11, margin: "7px 0 10px" }}><span style={{ color: stock > 0 ? "#20b66a" : "#d92d20" }}>●</span> {stock == null ? (product.loiTaiBienThe ? "Chưa tải được tồn kho" : "Chưa có dữ liệu tồn kho") : stock > 0 ? `Còn hàng (${stock})` : "Hết hàng"}</small><button type="button" disabled={stock === 0} onClick={() => openVariants(product)} style={{ ...buttonBase, marginTop: "auto", fontSize: 12, opacity: stock === 0 ? .55 : 1, cursor: stock === 0 ? "not-allowed" : "pointer" }}>{stock === 0 ? "Hết hàng" : "Thêm vào giỏ　＋"}</button>
                    </article>;
                })}</div> : <p style={{ padding: 28, textAlign: "center", color: "#667085" }}>Không tìm thấy sản phẩm phù hợp.</p>}
            </section>
            <aside style={{ ...panel, display: "flex", flexDirection: "column" }}><h2 style={{ margin: "2px 0 2px", fontSize: 24 }}>Giỏ hàng ({cart.length})</h2><p style={{ color: "#999", fontSize: 13, margin: "0 0 12px" }}>Hóa đơn tại quầy</p><div style={{ flex: 1, minHeight: 100, maxHeight: 320, overflowY: "auto" }}>{cart.length ? cart.map(item => <div key={item.variant.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "12px 0", borderBottom: "1px solid #eee" }}><div><strong>{item.product.tenSanPham}</strong><div style={{ color: "#667085", fontSize: 12, marginTop: 4 }}>Size {item.variant.kichCo?.tenKichCo || item.variant.kichCo?.kichCo || "-"} · {item.variant.mauSac?.tenMau || "-"}</div><b style={{ display: "block", color: "#ed4b2e", marginTop: 5 }}>{money(priceOf(item.product, item.variant))}</b><div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 7 }}><button type="button" onClick={() => changeQuantity(item.variant.id, -1)}>−</button><span>{item.quantity}</span><button type="button" onClick={() => changeQuantity(item.variant.id, 1)}>+</button><small style={{ color: "#667085" }}>Còn {item.variant.soLuongTon}</small></div></div><button type="button" aria-label="Xóa sản phẩm" onClick={() => setCart(old => old.filter(row => row.variant.id !== item.variant.id))} style={{ border: 0, background: "transparent", color: "#b42318", fontSize: 22, cursor: "pointer" }}>×</button></div>) : <div style={{ minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#999", textAlign: "center" }}><span style={{ fontSize: 36 }}>🛒</span><strong style={{ color: "#666", marginTop: 8 }}>Chưa có sản phẩm</strong><small style={{ marginTop: 6 }}>Chọn sản phẩm bên trái để bắt đầu.</small></div>}</div>
                <div style={{ borderTop: "1px dashed #ddd", marginTop: 12, paddingTop: 14, display: "grid", gap: 10 }}><div style={{ display: "flex", justifyContent: "space-between", color: "#777", fontSize: 13 }}><span>Tạm tính</span><strong>{money(total)}</strong></div><div style={{ display: "flex", justifyContent: "space-between", color: "#777", fontSize: 13 }}><span>Giảm giá</span><strong>0đ</strong></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 19 }}><strong>Tổng tiền</strong><strong style={{ color: "#ed4b2e" }}>{money(total)}</strong></div></div>
                <div style={{ borderTop: "1px solid #eee", marginTop: 16, paddingTop: 14, display: "grid", gap: 11 }}><strong style={{ fontSize: 15 }}>PHƯƠNG THỨC THANH TOÁN</strong><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{[["TIEN_MAT", "💵", "Tiền mặt"], ["CHUYEN_KHOAN", "🏦", "Chuyển khoản"]].map(([value, icon, label]) => <button type="button" key={value} onClick={() => setPhuongThucThanhToan(value)} style={{ padding: "12px 6px", borderRadius: 9, border: `1px solid ${phuongThucThanhToan === value ? "#ed4b2e" : "#ddd"}`, background: phuongThucThanhToan === value ? "#fff3ef" : "#fff", color: phuongThucThanhToan === value ? "#ed4b2e" : "#555", cursor: "pointer" }}><span style={{ display: "block", fontSize: 20 }}>{icon}</span><small>{label}</small></button>)}</div><label style={{ fontSize: 13 }}>Tên khách hàng<input value={tenKhach} onChange={e => setTenKhach(e.target.value)} placeholder="Khách lẻ (không bắt buộc)" style={{ ...field, marginTop: 5 }}/></label><label style={{ fontSize: 13 }}>Số điện thoại<input value={soDienThoaiKhach} onChange={e => setSoDienThoaiKhach(e.target.value)} placeholder="Không bắt buộc" style={{ ...field, marginTop: 5 }}/></label><button type="button" disabled={busy || !cart.length} onClick={checkout} style={{ ...buttonBase, padding: 14, opacity: busy || !cart.length ? .55 : 1, cursor: busy || !cart.length ? "not-allowed" : "pointer" }}>{busy ? "Đang tạo hóa đơn..." : `▣　Thanh toán　${money(total)}`}</button><button type="button" disabled={!cart.length} onClick={() => setCart([])} style={{ border: "1px solid #ddd", borderRadius: 9, padding: 11, background: "#fff", color: "#777", cursor: cart.length ? "pointer" : "not-allowed" }}>Xóa giỏ hàng</button><small style={{ color: "#999", fontStyle: "italic" }}>* Hóa đơn tại quầy được ghi trực tiếp vào database.</small></div>
            </aside>
        </div>
        {successBill && <div onClick={() => setSuccessBill(null)} style={{ position: "fixed", inset: 0, zIndex: 12000, background: "rgba(16,24,40,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <section role="dialog" aria-modal="true" aria-labelledby="pos-bill-title" onClick={e => e.stopPropagation()} style={{ width: "min(560px,100%)", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,.25)", padding: 24, color: "#202124" }}>
                <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: "1px dashed #d0d5dd" }}><div style={{ width: 52, height: 52, borderRadius: "50%", background: "#ecfdf3", color: "#039855", display: "grid", placeItems: "center", fontSize: 28, margin: "0 auto 10px" }}>✓</div><h2 id="pos-bill-title" style={{ margin: 0 }}>Thanh toán thành công</h2><p style={{ margin: "6px 0 0", color: "#667085" }}>Hóa đơn bán hàng tại quầy · FShop</p></div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "16px 0", borderBottom: "1px solid #eee" }}><div><small style={{ color: "#667085" }}>Mã hóa đơn</small><div style={{ fontWeight: 800 }}>{successBill.maHoaDon}</div><small style={{ color: "#667085" }}>{successBill.ngay}</small></div><div style={{ textAlign: "right" }}><small style={{ color: "#667085" }}>Tổng thanh toán</small><div style={{ fontSize: 22, fontWeight: 800, color: "#ed4b2e" }}>{money(successBill.tongTien)}</div><small>{successBill.phuongThuc}</small></div></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "14px 0", fontSize: 13 }}><div><span style={{ color: "#667085" }}>Khách hàng</span><div style={{ fontWeight: 700 }}>{successBill.tenKhach}</div></div><div><span style={{ color: "#667085" }}>Số điện thoại</span><div style={{ fontWeight: 700 }}>{successBill.soDienThoai}</div></div></div>
                <div style={{ border: "1px solid #eaecf0", borderRadius: 10, overflow: "hidden" }}><div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 48px 100px", gap: 8, padding: 10, background: "#f9fafb", fontSize: 12, fontWeight: 800 }}><span>Sản phẩm / size / màu</span><span style={{ textAlign: "center" }}>SL</span><span style={{ textAlign: "right" }}>Thành tiền</span></div>{successBill.items.map((item, index) => <div key={`${item.ma}-${index}`} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 48px 100px", gap: 8, padding: 10, borderTop: "1px solid #eaecf0", alignItems: "center", fontSize: 12 }}><div><strong>{item.ten}</strong><div style={{ color: "#667085" }}>{item.ma} · Size {item.size} · {item.mau}</div><div style={{ color: "#667085" }}>{money(item.donGia)}/đôi</div></div><span style={{ textAlign: "center" }}>{item.soLuong}</span><strong style={{ textAlign: "right" }}>{money(item.donGia * item.soLuong)}</strong></div>)}</div>
                {successBill.phuongThuc === "Tiền mặt" && <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", color: "#667085", fontSize: 13 }}><span>Tiền thừa trả khách</span><strong style={{ color: "#039855" }}>{money(successBill.tienThua)}</strong></div>}
                <button type="button" onClick={() => { setSuccessBill(null); }} style={{ ...buttonBase, width: "100%", padding: 13, marginTop: 18 }}>Hoàn tất · Đóng hóa đơn</button>
                <button type="button" onClick={() => window.print()} style={{ width: "100%", padding: 12, marginTop: 8, border: "1px solid #e4e7ec", background: "#fff", borderRadius: 9, fontWeight: 700, cursor: "pointer" }}>In hóa đơn</button>
            </section>
        </div>}
        {paymentModalOpen && <div onClick={() => !busy && setPaymentModalOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 11000, background: "rgba(16,24,40,.48)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <section role="dialog" aria-modal="true" aria-labelledby="pos-payment-title" onClick={e => e.stopPropagation()} style={{ width: "min(560px, 100%)", maxHeight: "min(90vh, 820px)", overflowY: "auto", background: "#fff", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,.25)", color: "#202124" }}>
                <header style={{ padding: "22px 24px 18px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid #eee", gap: 12 }}>
                    <div><small style={{ color: "#ed4b2e", fontWeight: 800, letterSpacing: 1.4 }}>XÁC NHẬN THANH TOÁN</small><h2 id="pos-payment-title" style={{ margin: "6px 0 0", fontSize: 23 }}>{phuongThucThanhToan === "TIEN_MAT" ? "💵 Tiền mặt" : "🏦 Chuyển khoản"}</h2></div>
                    <button type="button" aria-label="Đóng cửa sổ thanh toán" onClick={() => setPaymentModalOpen(false)} disabled={busy} style={{ border: 0, background: "transparent", fontSize: 24, color: "#98a2b3", cursor: "pointer" }}>×</button>
                </header>
                <div style={{ padding: "18px 24px", background: "linear-gradient(110deg,#fff7f4,#fff)", borderBottom: "1px solid #f1e9e6", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><span style={{ color: "#667085", fontSize: 14 }}>Số tiền cần thanh toán</span><strong style={{ color: "#ed4b2e", fontSize: "clamp(22px,4vw,29px)", whiteSpace: "nowrap" }}>{money(total)}</strong></div>
                <div style={{ padding: 24, display: "grid", gap: 14 }}>
                    <label style={{ fontSize: 13, fontWeight: 700 }}>♟ Tên khách hàng <span style={{ color: "#98a2b3", fontWeight: 400 }}>(Không bắt buộc)</span><input value={tenKhach} onChange={e => setTenKhach(e.target.value)} placeholder="Nhập tên khách (để trống = Khách lẻ)" style={{ ...field, marginTop: 7, padding: 13, fontWeight: 400 }}/></label>
                    <label style={{ fontSize: 13, fontWeight: 700 }}>📱 Số điện thoại người mua <span style={{ color: "#98a2b3", fontWeight: 400 }}>(Không bắt buộc)</span><input value={soDienThoaiKhach} onChange={e => setSoDienThoaiKhach(e.target.value)} placeholder="Nhập số điện thoại để gắn vào hóa đơn" style={{ ...field, marginTop: 7, padding: 13, fontWeight: 400 }}/></label>
                    {phuongThucThanhToan === "TIEN_MAT" ? <>
                        <label style={{ fontSize: 13, fontWeight: 700 }}>Tiền khách đưa<div style={{ position: "relative", marginTop: 7 }}><input inputMode="numeric" type="number" min={0} value={cashGiven} onChange={e => setCashGiven(e.target.value)} placeholder="Nhập số tiền khách đưa" style={{ ...field, padding: "15px 42px 15px 14px", border: "1.5px solid #ed4b2e", boxShadow: "0 0 0 3px rgba(237,75,46,.08)", fontSize: 17 }}/><strong style={{ position: "absolute", right: 14, top: 14, color: "#888" }}>đ</strong></div></label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(105px,1fr))", gap: 8 }}>{cashPresets.map(amount => <button type="button" key={amount} onClick={() => setCashGiven(String(amount))} style={{ border: `1px solid ${Number(cashGiven) === amount ? "#ed4b2e" : "#e4e7ec"}`, borderRadius: 9, background: Number(cashGiven) === amount ? "#fff3ef" : "#f9fafb", padding: "10px 6px", color: Number(cashGiven) === amount ? "#ed4b2e" : "#344054", fontWeight: 700, cursor: "pointer" }}>{money(amount)}</button>)}</div>
                        <div style={{ border: "1px solid #ffd0c7", background: "#fff5f3", borderRadius: 11, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><span style={{ color: "#667085", fontSize: 14 }}>Tiền thừa trả khách</span><strong style={{ color: Number(cashGiven) >= total ? "#16834a" : "#b42318", fontSize: 22 }}>{cashGiven === "" || Number(cashGiven) < total ? "—" : money(changeDue)}</strong></div>
                        {cashGiven !== "" && Number(cashGiven) < total && <small style={{ color: "#b42318" }}>Còn thiếu {money(total - Number(cashGiven || 0))}.</small>}
                    </> : <div style={{ border: "1px solid #d1e9ff", background: "#f0f8ff", borderRadius: 12, padding: 14, color: "#175cd3", fontSize: 13, display: "grid", justifyItems: "center", gap: 10, textAlign: "center" }}>
                        <strong style={{ fontSize: 15 }}>Quét mã QR để chuyển {money(total)}</strong>
                        <img src={vietQrUrl} alt="Mã QR chuyển khoản FShop" style={{ width: 250, maxWidth: "100%", height: "auto", borderRadius: 10, border: "1px solid #e4e7ec", background: "white" }} />
                        <div style={{ color: "#344054", textAlign: "left", width: "100%", background: "#fff", borderRadius: 9, padding: 12, boxSizing: "border-box" }}><div><strong>Ngân hàng:</strong> MB Bank</div><div><strong>Số tài khoản:</strong> {BANK_ACCOUNT_NO}</div><div><strong>Chủ tài khoản:</strong> {BANK_ACCOUNT_NAME}</div><div><strong>Số tiền:</strong> {money(total)}</div><div><strong>Nội dung:</strong> {transferContent}</div></div>
                        <p style={{ margin: 0 }}>Quét mã để ứng dụng ngân hàng tự điền số tiền {money(total)} và nội dung chuyển khoản. Sau khi kiểm tra tài khoản đã nhận đúng tiền, nhấn xác nhận bên dưới; hệ thống chưa tự đối soát giao dịch ngân hàng.</p>
                    </div>}
                    {error && <div role="alert" style={{ padding: 11, borderRadius: 9, color: "#b42318", background: "#fff1f0", fontSize: 13 }}>{error}</div>}
                </div>
                <footer style={{ padding: "14px 24px 22px", borderTop: "1px solid #eee", display: "grid", gridTemplateColumns: "minmax(100px,.7fr) minmax(180px,1.5fr)", gap: 10 }}><button type="button" disabled={busy} onClick={() => setPaymentModalOpen(false)} style={{ border: "1px solid #e4e7ec", background: "#f9fafb", color: "#475467", borderRadius: 10, padding: 13, fontWeight: 700, cursor: "pointer" }}>Hủy</button><button type="button" disabled={busy || (phuongThucThanhToan === "TIEN_MAT" && Number(cashGiven || 0) < total)} onClick={confirmCheckout} style={{ ...buttonBase, borderRadius: 10, padding: 13, fontSize: 14, opacity: busy || (phuongThucThanhToan === "TIEN_MAT" && Number(cashGiven || 0) < total) ? .55 : 1, cursor: busy || (phuongThucThanhToan === "TIEN_MAT" && Number(cashGiven || 0) < total) ? "not-allowed" : "pointer" }}>{busy ? "Đang xử lý..." : `✓ Xác nhận thanh toán · ${money(total)}`}</button></footer>
            </section>
        </div>}
        {selectedProduct && <div
            onClick={() => setSelectedProduct(null)}
            style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(20, 24, 32, .58)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 24, width: "min(560px, 100%)", maxHeight: "min(88vh, 760px)", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,.24)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, paddingBottom: 16, borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                        <img src={selectedProduct.hinhAnh || selectedProduct.anhDaiDien || selectedProduct.urlAnh || "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=200&q=80"} alt={selectedProduct.tenSanPham || "Sản phẩm"} style={{ width: 76, height: 76, objectFit: "contain", borderRadius: 12, background: "#f7f7f7", flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                            <small style={{ color: "#ed4b2e", fontWeight: 800, textTransform: "uppercase" }}>{brandName(selectedProduct)}</small>
                            <h2 style={{ margin: "4px 0", fontSize: 21, lineHeight: 1.3, overflowWrap: "anywhere" }}>{selectedProduct.tenSanPham}</h2>
                            <small style={{ color: "#888" }}>{selectedProduct.maSanPham || `SP${selectedProduct.id}`} · Chỉ hiển thị biến thể còn hàng</small>
                        </div>
                    </div>
                    <button type="button" aria-label="Đóng chọn size màu" onClick={() => setSelectedProduct(null)} style={{ width: 36, height: 36, border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff", color: "#555", fontSize: 22, cursor: "pointer", flexShrink: 0 }}>×</button>
                </div>
                {loadingVariants ? <div style={{ padding: 32, textAlign: "center", color: "#667085" }}>Đang tải size và màu...</div> : variants.length ? <>
                    <div style={{ marginTop: 18, marginBottom: 10 }}>
                        <strong style={{ display: "block", fontSize: 15 }}>1. Chọn size và màu</strong>
                        <small style={{ color: "#777", display: "block", marginTop: 4 }}>Nhấn vào một ô để chọn đúng biến thể muốn mua.</small>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: 9 }}>
                        {[...variants].sort((a, b) => Number(a.kichCo?.tenKichCo || a.kichCo?.kichCo || 0) - Number(b.kichCo?.tenKichCo || b.kichCo?.kichCo || 0) || String(a.mauSac?.tenMau || "").localeCompare(String(b.mauSac?.tenMau || ""), "vi")).map(v => {
                            const selected = String(v.id) === String(selectedVariantId);
                            return <button type="button" key={v.id} onClick={() => setSelectedVariantId(String(v.id))} aria-pressed={selected} style={{ textAlign: "left", border: `1.5px solid ${selected ? "#ed4b2e" : "#e5e7eb"}`, borderRadius: 12, padding: 12, background: selected ? "#fff3ef" : "#fff", cursor: "pointer", boxShadow: selected ? "0 0 0 2px rgba(237,75,46,.08)" : "none", minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><strong style={{ fontSize: 15 }}>Size {v.kichCo?.tenKichCo || v.kichCo?.kichCo || "-"}</strong><span style={{ width: 20, height: 20, borderRadius: "50%", border: `1px solid ${selected ? "#ed4b2e" : "#d0d5dd"}`, background: selected ? "#ed4b2e" : "#fff", color: "#fff", display: "grid", placeItems: "center", fontSize: 12, flexShrink: 0 }}>{selected ? "✓" : ""}</span></div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, color: "#555", fontSize: 12 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: v.mauSac?.maMau && /^#[0-9a-f]{3,8}$/i.test(v.mauSac.maMau) ? v.mauSac.maMau : "#d0d5dd", border: "1px solid #ddd", flexShrink: 0 }} /><span>{v.mauSac?.tenMau || "Chưa rõ màu"}</span></div>
                                <strong style={{ display: "block", color: "#ed4b2e", fontSize: 14, marginTop: 9 }}>{money(priceOf(selectedProduct, v))}</strong>
                                <small style={{ display: "block", color: Number(v.soLuongTon) > 0 ? "#16834a" : "#b42318", marginTop: 5 }}>● Còn {Number(v.soLuongTon || 0)} đôi</small>
                            </button>;
                        })}
                    </div>
                    {(() => { const chosen = variants.find(v => String(v.id) === String(selectedVariantId)); return chosen ? <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e9edf2", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><small style={{ color: "#667085" }}>Bạn đang chọn</small><strong style={{ display: "block", marginTop: 4 }}>Size {chosen.kichCo?.tenKichCo || chosen.kichCo?.kichCo || "-"} · {chosen.mauSac?.tenMau || "-"}</strong></div><div style={{ textAlign: "right" }}><small style={{ color: "#667085" }}>Đơn giá</small><strong style={{ display: "block", color: "#ed4b2e", fontSize: 19, marginTop: 2 }}>{money(priceOf(selectedProduct, chosen))}</strong></div></div> : null; })()}
                    <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                        <button type="button" onClick={() => setSelectedProduct(null)} style={{ flex: 1, border: "1px solid #d0d5dd", borderRadius: 10, padding: 13, background: "#fff", color: "#344054", fontWeight: 700, cursor: "pointer" }}>Quay lại</button>
                        <button type="button" onClick={addSelectedVariant} disabled={!selectedVariantId} style={{ ...buttonBase, flex: 1.5, borderRadius: 10, padding: 13, opacity: selectedVariantId ? 1 : .55 }}>＋ Thêm vào giỏ hàng</button>
                    </div>
                </> : <div style={{ padding: 24, textAlign: "center" }}><div style={{ fontSize: 32 }}>📦</div><strong style={{ display: "block", marginTop: 8 }}>Hiện không có size/màu còn hàng</strong><small style={{ display: "block", color: "#667085", marginTop: 5 }}>Vui lòng chọn sản phẩm khác hoặc kiểm tra tồn kho.</small><button type="button" onClick={() => setSelectedProduct(null)} style={{ ...buttonBase, marginTop: 16 }}>Đóng</button></div>}
            </div>
        </div>}
        <style>{`@media (max-width: 1450px) { .admin-main-body article img { height: 130px !important; } } @media (max-width: 1250px) { .admin-main-body > div > div[style*="minmax(180px"] { grid-template-columns: minmax(150px,.6fr) minmax(350px,1.4fr) !important; } .admin-main-body > div > div[style*="minmax(180px"] > aside:last-child { grid-column: 1 / -1; } } @media (max-width: 850px) { .admin-main-body > div > div[style*="minmax(180px"] { grid-template-columns: 1fr !important; } .admin-main-body > div > div[style*="minmax(180px"] > aside:last-child { grid-column: auto; } } @media (max-width: 1050px) { .admin-main-body article { min-width: 0; } }`}</style>
    </div>;
}

function ComingSoon({ title, }) {
    return (<div className="admin-placeholder">

        <div className="admin-placeholder-icon">
            ✦
        </div>

        <h2>
            {title}
        </h2>

        <p>
            Giao diện chức năng này sẽ được team
            triển khai ở bước tiếp theo.
        </p>

    </div>);
}
export default function AdminDashboard({ dangXuat, }) {
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const activeLabel =
        activeMenu === "cai-dat"
            ? "Cài đặt"
            : menuItems.find((item) => item.id === activeMenu)?.label ||
            "Tổng quan";
    useEffect(() => {
        // Preload ngay khi mở Admin để click vào 3 màn này hiện dữ liệu gần như tức thì.
        prefetchAdminData();
    }, []);
    return (<div className="admin-layout">

        {/* SIDEBAR */}

        <aside className="admin-sidebar">

            <div className="admin-brand">

                <div className="admin-brand-mark">
                    F
                </div>

                <div>

                    <strong>
                        FShop
                    </strong>

                    <span>
                            ADMIN PANEL
                        </span>

                </div>

            </div>

            <div className="admin-section-title">
                QUẢN LÝ
            </div>

            <nav className="admin-nav">

                {menuItems.map((item) => (<button type="button" key={item.id} className={activeMenu ===
                item.id
                    ? "active"
                    : ""} onClick={() => setActiveMenu(item.id)}>

                                <span className="admin-nav-icon">
                                    {item.icon}
                                </span>

                    <span>
                                    {item.label}
                                </span>

                </button>))}

            </nav>

            <div className="admin-sidebar-footer">

                <button
                    type="button"
                    className={activeMenu === "cai-dat" ? "active" : ""}
                    onClick={() => setActiveMenu("cai-dat")}
                >
                        <span>
                            ⚙
                        </span>

                    Cài đặt
                </button>

                <button type="button" onClick={dangXuat}>
                        <span>
                            ↪
                        </span>

                    Đăng xuất
                </button>

            </div>

        </aside>

        {/* MAIN */}

        <main className="admin-main">

            <header className="admin-topbar">

                <div className="admin-topbar-left">

                    <div className="admin-breadcrumb">

                        FShop

                        <span>
                                /
                            </span>

                        Admin

                        <span>
                                /
                            </span>

                        <strong>
                            {activeLabel}
                        </strong>

                    </div>

                </div>

                <div className="admin-account">

                    <button type="button" className="admin-notification">
                        ♢
                    </button>

                    <div className="admin-avatar">
                        A
                    </div>

                    <div className="admin-account-info">

                        <strong>
                            Quản trị viên
                        </strong>

                        <span>
                                ADMIN
                            </span>

                    </div>

                </div>

            </header>

            <div className="admin-main-body">

                {activeMenu ===
                "dashboard" ? (<DashboardContent onViewAll={() => setActiveMenu("hoa-don")}/>) : activeMenu === "ban-hang" ? (<BanHangTaiQuayContent />) : activeMenu ===
                "hoa-don" ? (<HoaDonContent />) : activeMenu === "doi-tra" ? (<Returns mode="admin" />) : activeMenu ===
                "thanh-toan" ? (<ThanhToanContent />) : activeMenu === "san-pham" ? (<AdminProducts />) : activeMenu === "danh-muc" ? (<AdminDanhMuc />) : activeMenu === "thuong-hieu" ? (<AdminThuongHieu />) : activeMenu === "kich-co" ? (<AdminKichCo />) : activeMenu === "mau-sac" ? (<AdminMauSac />) : activeMenu === "kho" ? (<AdminKho />) : activeMenu === "voucher" ? (<AdminVoucher />) : activeMenu === "khuyen-mai" ? (<AdminKhuyenMai />) : activeMenu ===
                "khach-hang" ? (<CustomerContent />) : activeMenu ===
                "nhan-vien" ? (<EmployeeContent />) : activeMenu ===
                "cai-dat" ? (<AdminSettings />) : (<ComingSoon title={activeLabel}/>)}

            </div>

        </main>

    </div>);
}

