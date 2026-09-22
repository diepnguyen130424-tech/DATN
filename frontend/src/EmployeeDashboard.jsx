import { useState } from "react";
import "./EmployeeDashboard.css";

const menuItems = [
    {
        id: "dashboard",
        icon: "▦",
        label: "Tổng quan",
    },
    {
        id: "ban-hang",
        icon: "🛒",
        label: "Bán hàng tại quầy",
    },
    {
        id: "hoa-don",
        icon: "▧",
        label: "Hóa đơn",
    },
    {
        id: "khach-hang",
        icon: "◎",
        label: "Khách hàng",
    },
    {
        id: "san-pham",
        icon: "□",
        label: "Sản phẩm",
    },
];

const todayOrders = [
    {
        ma: "HD001",
        khachHang: "Nguyễn Văn A",
        loai: "Tại quầy",
        tongTien: "1.500.000đ",
        trangThai: "Đã thanh toán",
    },
    {
        ma: "HD002",
        khachHang: "Trần Văn B",
        loai: "Tại quầy",
        tongTien: "2.350.000đ",
        trangThai: "Đã thanh toán",
    },
    {
        ma: "HD003",
        khachHang: "Khách lẻ",
        loai: "Tại quầy",
        tongTien: "850.000đ",
        trangThai: "Chờ thanh toán",
    },
];

function EmployeeOverview() {
    return (
        <div className="employee-content">

            <div className="employee-heading">
                <div>
                    <span className="employee-eyebrow">
                        FSHOP NHÂN VIÊN
                    </span>

                    <h1>Tổng quan</h1>

                    <p>
                        Quản lý bán hàng và đơn hàng tại cửa hàng.
                    </p>
                </div>

                <button
                    className="employee-date"
                    type="button"
                >
                    ▣ Hôm nay
                </button>
            </div>

            {/* STATISTICS */}

            <div className="employee-stats">

                <div className="employee-stat-card">
                    <div className="employee-stat-icon">
                        🛒
                    </div>

                    <div>
                        <span>Đơn hàng hôm nay</span>
                        <strong>24</strong>
                    </div>
                </div>

                <div className="employee-stat-card">
                    <div className="employee-stat-icon">
                        ₫
                    </div>

                    <div>
                        <span>Doanh thu hôm nay</span>
                        <strong>18.500.000đ</strong>
                    </div>
                </div>

                <div className="employee-stat-card">
                    <div className="employee-stat-icon">
                        ◎
                    </div>

                    <div>
                        <span>Khách hàng hôm nay</span>
                        <strong>19</strong>
                    </div>
                </div>

                <div className="employee-stat-card">
                    <div className="employee-stat-icon">
                        □
                    </div>

                    <div>
                        <span>Sản phẩm đã bán</span>
                        <strong>42</strong>
                    </div>
                </div>

            </div>

            {/* QUICK ACTION */}

            <div className="employee-section-grid">

                <section className="employee-card quick-card">

                    <div className="employee-card-heading">
                        <div>
                            <h2>Thao tác nhanh</h2>

                            <p>
                                Các chức năng thường sử dụng
                            </p>
                        </div>
                    </div>

                    <div className="quick-actions">

                        <button type="button">
                            <span>🛒</span>

                            <div>
                                <strong>Bán hàng tại quầy</strong>
                                <small>
                                    Tạo hóa đơn mới
                                </small>
                            </div>
                        </button>

                        <button type="button">
                            <span>▧</span>

                            <div>
                                <strong>Hóa đơn</strong>
                                <small>
                                    Xem và xử lý hóa đơn
                                </small>
                            </div>
                        </button>

                        <button type="button">
                            <span>◎</span>

                            <div>
                                <strong>Khách hàng</strong>
                                <small>
                                    Tra cứu khách hàng
                                </small>
                            </div>
                        </button>

                    </div>

                </section>

                {/* TODAY SUMMARY */}

                <section className="employee-card">

                    <div className="employee-card-heading">
                        <div>
                            <h2>Tình hình hôm nay</h2>

                            <p>
                                Tổng quan hoạt động
                            </p>
                        </div>
                    </div>

                    <div className="employee-summary">

                        <div>
                            <span>Đã thanh toán</span>
                            <strong>21</strong>
                        </div>

                        <div>
                            <span>Chờ thanh toán</span>
                            <strong>3</strong>
                        </div>

                        <div>
                            <span>Đã hủy</span>
                            <strong>0</strong>
                        </div>

                    </div>

                </section>

            </div>

            {/* RECENT ORDERS */}

            <section className="employee-card employee-orders">

                <div className="employee-card-heading">

                    <div>
                        <h2>Hóa đơn gần đây</h2>

                        <p>
                            Các hóa đơn được tạo gần nhất
                        </p>
                    </div>

                    <button
                        className="employee-link"
                        type="button"
                    >
                        Xem tất cả →
                    </button>

                </div>

                <div className="employee-table-wrapper">

                    <table className="employee-table">

                        <thead>
                        <tr>
                            <th>Mã hóa đơn</th>
                            <th>Khách hàng</th>
                            <th>Loại</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                        </tr>
                        </thead>

                        <tbody>

                        {todayOrders.map((order) => (

                            <tr key={order.ma}>

                                <td>
                                    <strong>
                                        {order.ma}
                                    </strong>
                                </td>

                                <td>
                                    {order.khachHang}
                                </td>

                                <td>
                                        <span className="employee-type">
                                            {order.loai}
                                        </span>
                                </td>

                                <td>
                                    {order.tongTien}
                                </td>

                                <td>
                                        <span
                                            className={
                                                order.trangThai ===
                                                "Đã thanh toán"
                                                    ? "employee-status paid"
                                                    : "employee-status waiting"
                                            }
                                        >
                                            {order.trangThai}
                                        </span>
                                </td>

                            </tr>

                        ))}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}

function ComingSoon({ title }) {
    return (
        <div className="employee-placeholder">

            <div className="employee-placeholder-icon">
                ✦
            </div>

            <h2>{title}</h2>

            <p>
                Chức năng này sẽ được team triển khai
                ở bước tiếp theo.
            </p>

        </div>
    );
}

export default function EmployeeDashboard({
                                              onBackToShop,
                                          }) {

    const [activeMenu, setActiveMenu] =
        useState("dashboard");

    const activeLabel =
        menuItems.find(
            (item) => item.id === activeMenu
        )?.label || "Tổng quan";

    return (
        <div className="employee-layout">

            {/* SIDEBAR */}

            <aside className="employee-sidebar">

                <div className="employee-brand">

                    <div className="employee-brand-mark">
                        F
                    </div>

                    <div>
                        <strong>FShop</strong>

                        <span>
                            NHÂN VIÊN
                        </span>
                    </div>

                </div>

                <div className="employee-menu-title">
                    LÀM VIỆC
                </div>

                <nav className="employee-nav">

                    {menuItems.map((item) => (

                        <button
                            type="button"
                            key={item.id}
                            className={
                                activeMenu === item.id
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveMenu(item.id)
                            }
                        >

                            <span className="employee-nav-icon">
                                {item.icon}
                            </span>

                            <span>
                                {item.label}
                            </span>

                        </button>

                    ))}

                </nav>

                <div className="employee-sidebar-footer">

                    <button
                        type="button"
                        className="employee-home-button"
                        onClick={onBackToShop}
                    >
                        <span>←</span>
                        Về trang chủ
                    </button>

                    <button type="button">
                        <span>⚙</span>
                        Cài đặt
                    </button>

                    <button type="button">
                        <span>↪</span>
                        Đăng xuất
                    </button>

                </div>

            </aside>

            {/* MAIN */}

            <main className="employee-main">

                <header className="employee-topbar">

                    <div className="employee-breadcrumb">
                        FShop
                        <span>/</span>
                        Nhân viên
                        <span>/</span>

                        <strong>
                            {activeLabel}
                        </strong>
                    </div>

                    <div className="employee-account">

                        <button
                            className="employee-notification"
                            type="button"
                        >
                            ♢
                        </button>

                        <div className="employee-avatar">
                            NV
                        </div>

                        <div className="employee-account-info">

                            <strong>
                                Nhân viên bán hàng
                            </strong>

                            <span>
                                NHÂN VIÊN
                            </span>

                        </div>

                    </div>

                </header>

                <div className="employee-main-body">

                    {activeMenu === "dashboard" ? (

                        <EmployeeOverview />

                    ) : (

                        <ComingSoon
                            title={activeLabel}
                        />

                    )}

                </div>

            </main>

        </div>
    );
}