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
    { id: "san-pham", icon: "□", label: "Sản phẩm" },
    { id: "danh-muc", icon: "▤", label: "Danh mục" },
    { id: "thuong-hieu", icon: "◇", label: "Thương hiệu" },
    { id: "kich-co", icon: "↔", label: "Kích cỡ" },
    { id: "mau-sac", icon: "●", label: "Màu sắc" },
    { id: "voucher", icon: "◇", label: "Voucher" },
    { id: "khuyen-mai", icon: "✦", label: "Khuyến mãi" },
    { id: "hoa-don", icon: "▧", label: "Hóa đơn" },
    { id: "thanh-toan", icon: "▤", label: "Thanh toán" },
    { id: "khach-hang", icon: "◎", label: "Khách hàng" },
    { id: "nhan-vien", icon: "♙", label: "Nhân viên" },
];
const TRANG_THAI_HOA_DON = [
    "CHO_XAC_NHAN",
    "DA_XAC_NHAN",
    "DANG_CHUAN_BI",
    "DANG_GIAO",
    "DA_GIAO",
    "DA_THANH_TOAN",
    "DA_HUY",
];
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        taiHoaDon();
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

            <button type="button" onClick={taiHoaDon} style={{
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
            background: "rgba(0,0,0,.45)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
        }}>

            <div onClick={(e) => e.stopPropagation()} style={{
                width: "min(1100px,100%)",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "#fff",
                borderRadius: "14px",
                padding: "28px",
            }}>

                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "24px",
                }}>

                    <div>

                        <div style={{
                            color: "#888",
                            fontSize: "12px",
                        }}>
                            CHI TIẾT HÓA ĐƠN
                        </div>

                        <h2>
                            {selectedHoaDon.maHoaDon}
                        </h2>

                    </div>

                    <button type="button" onClick={() => setSelectedHoaDon(null)}>
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
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: "12px",
                    marginBottom: "25px",
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

                <section style={{
                    marginBottom: "25px",
                }}>

                    <h3>
                        Xử lý hóa đơn
                    </h3>

                    <select value={selectedHoaDon.trangThai ||
                        ""} disabled={updatingStatus} onChange={(e) => capNhatTrangThai(e.target
                        .value)} style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        minWidth: "250px",
                    }}>

                        {TRANG_THAI_HOA_DON.map((item) => (<option key={item} value={item}>
                            {tenTrangThaiHoaDon(item)}
                        </option>))}

                    </select>

                </section>

                <section style={{
                    marginBottom: "25px",
                }}>

                    <h3>
                        Chi tiết sản phẩm
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

                    <h3>
                        Thanh toán
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

                    <h3>
                        Lịch sử hóa đơn
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
                "dashboard" ? (<DashboardContent onViewAll={() => setActiveMenu("hoa-don")}/>) : activeMenu ===
                "hoa-don" ? (<HoaDonContent />) : activeMenu ===
                "thanh-toan" ? (<ThanhToanContent />) : activeMenu === "san-pham" ? (<AdminProducts />) : activeMenu === "danh-muc" ? (<AdminDanhMuc />) : activeMenu === "thuong-hieu" ? (<AdminThuongHieu />) : activeMenu === "kich-co" ? (<AdminKichCo />) : activeMenu === "mau-sac" ? (<AdminMauSac />) : activeMenu === "kho" ? (<AdminKho />) : activeMenu === "voucher" ? (<AdminVoucher />) : activeMenu === "khuyen-mai" ? (<AdminKhuyenMai />) : activeMenu ===
                "khach-hang" ? (<CustomerContent />) : activeMenu ===
                "nhan-vien" ? (<EmployeeContent />) : activeMenu ===
                "cai-dat" ? (<AdminSettings />) : (<ComingSoon title={activeLabel}/>)}

            </div>

        </main>

    </div>);
}

