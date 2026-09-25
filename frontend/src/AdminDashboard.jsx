import { useState } from "react";
import "./AdminDashboard.css";
import AdminProducts from "./AdminProducts";
import EmployeeDashboard from "./EmployeeDashboard";
import AdminKho from "./AdminKho";

const menuItems = [
    { id: "dashboard", icon: "▦", label: "Tổng quan" },
    { id: "san-pham", icon: "□", label: "Sản phẩm" },
    { id: "kho", icon: "▥", label: "Kho" },
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

const stats = [
    { label: "Tổng sản phẩm", value: "128", icon: "□", note: "+12%" },
    { label: "Đơn hàng", value: "56", icon: "▧", note: "+12%" },
    { label: "Khách hàng", value: "320", icon: "◎", note: "+12%" },
    { label: "Doanh thu", value: "48.500.000đ", icon: "₫", note: "+12%" },
];

const orders = [
    ["HD001", "Nguyễn Văn A", "4.800.000đ", "Chờ xác nhận"],
    ["HD002", "Trần Văn B", "2.350.000đ", "Đang giao"],
    ["HD003", "Lê Văn C", "1.500.000đ", "Đã giao"],
    ["HD004", "Phạm Văn D", "3.200.000đ", "Đã thanh toán"],
];

function DashboardContent() {
    return (
        <div className="admin-dashboard-content">
            <div className="admin-page-heading">
                <div>
                    <div className="admin-eyebrow">FSHOP ADMIN</div>
                    <h1>Tổng quan</h1>
                    <p>Theo dõi hoạt động kinh doanh của cửa hàng.</p>
                </div>

                <button className="admin-date-button">
                    <span>▣</span>
                    Tháng 09/2026
                </button>
            </div>

            <div className="admin-stats">
                {stats.map((item) => (
                    <div className="admin-stat-card" key={item.label}>
                        <div className="admin-stat-top">
                            <div className="admin-stat-icon">{item.icon}</div>
                            <span className="admin-growth">{item.note}</span>
                        </div>
                        <div className="admin-stat-value">{item.value}</div>
                        <div className="admin-stat-label">{item.label}</div>
                    </div>
                ))}
            </div>

            <div className="admin-dashboard-grid">
                <section className="admin-card revenue-card">
                    <div className="admin-card-heading">
                        <div>
                            <h2>Doanh thu</h2>
                            <p>Doanh thu trong 7 ngày gần nhất</p>
                        </div>
                        <strong>48.500.000đ</strong>
                    </div>

                    <div className="revenue-chart">
                        <div className="chart-labels">
                            <span>10tr</span>
                            <span>8tr</span>
                            <span>6tr</span>
                            <span>4tr</span>
                            <span>2tr</span>
                            <span>0</span>
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
                                {[35, 52, 42, 72, 58, 88, 76].map((height, index) => (
                                    <div className="chart-bar-wrap" key={index}>
                                        <div
                                            className="chart-bar"
                                            style={{ height: `${height}%` }}
                                        />
                                        <span>{["T2", "T3", "T4", "T5", "T6", "T7", "CN"][index]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="admin-card">
                    <div className="admin-card-heading">
                        <div>
                            <h2>Trạng thái đơn hàng</h2>
                            <p>Tổng quan đơn hàng</p>
                        </div>
                    </div>

                    <div className="order-status-list">
                        <div>
                            <span className="status-dot pending" />
                            <span>Chờ xác nhận</span>
                            <strong>12</strong>
                        </div>
                        <div>
                            <span className="status-dot processing" />
                            <span>Đang xử lý</span>
                            <strong>18</strong>
                        </div>
                        <div>
                            <span className="status-dot shipping" />
                            <span>Đang giao</span>
                            <strong>15</strong>
                        </div>
                        <div>
                            <span className="status-dot done" />
                            <span>Đã giao</span>
                            <strong>11</strong>
                        </div>
                    </div>
                </section>
            </div>

            <section className="admin-card">
                <div className="admin-card-heading">
                    <div>
                        <h2>Đơn hàng gần đây</h2>
                        <p>Các đơn hàng mới nhất</p>
                    </div>
                    <button className="admin-link-button">Xem tất cả →</button>
                </div>

                <div className="admin-table-scroll">
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>Mã hóa đơn</th>
                            <th>Khách hàng</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map(([code, customer, total, status]) => (
                            <tr key={code}>
                                <td><strong>{code}</strong></td>
                                <td>{customer}</td>
                                <td>{total}</td>
                                <td>
                    <span className={`order-status ${status.replaceAll(" ", "-")}`}>
                      {status}
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
        <div className="admin-placeholder">
            <div className="admin-placeholder-icon">✦</div>
            <h2>{title}</h2>
            <p>Giao diện chức năng này sẽ được team triển khai ở bước tiếp theo.</p>
        </div>
    );
}

export default function AdminDashboard() {
    const [activeMenu, setActiveMenu] = useState("dashboard");

    const activeLabel =
        menuItems.find((item) => item.id === activeMenu)?.label || "Tổng quan";

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <div className="admin-brand-mark">F</div>
                    <div>
                        <strong>FShop</strong>
                        <span>ADMIN PANEL</span>
                    </div>
                </div>

                <div className="admin-section-title">QUẢN LÝ</div>

                <nav className="admin-nav">
                    {menuItems.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className={activeMenu === item.id ? "active" : ""}
                            onClick={() => setActiveMenu(item.id)}
                        >
                            <span className="admin-nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">

                    <button
                        type="button"
                        className="admin-home-button" onClick={() => {window.location.href = "/";
                        }}>
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

            <main className="admin-main">
                <header className="admin-topbar">
                    <div className="admin-topbar-left">
                        <div className="admin-breadcrumb">
                            FShop <span>/</span> Admin <span>/</span> <strong>{activeLabel}</strong>
                        </div>
                    </div>

                    <div className="admin-account">
                        <button className="admin-notification" type="button">♢</button>
                        <div className="admin-avatar">A</div>
                        <div className="admin-account-info">
                            <strong>Quản trị viên</strong>
                            <span>ADMIN</span>
                        </div>
                    </div>
                </header>

                <div className="admin-main-body">
                    {activeMenu === "dashboard" ? (
                        <DashboardContent />
                    ) : activeMenu === "san-pham" ? (
                        <AdminProducts />
                    ) : activeMenu === "kho" ? (
                        <AdminKho />
                    ) : activeMenu === "nhan-vien" ? (
                        <EmployeeDashboard
                            onBackToShop={() => {
                                window.location.href = "/";
                            }}/>) : (
                        <ComingSoon title={activeLabel} />
                    )}
                </div>
            </main>
        </div>
    );
}
