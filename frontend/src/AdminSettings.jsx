import { useEffect, useMemo, useState } from "react";
import "./AdminSettings.css";

const STORAGE_KEY = "fshop_admin_settings";

const DEFAULT_SETTINGS = {
    hoTen: "Quản trị viên",
    email: "admin@fshop.vn",
    soDienThoai: "",
    tenCuaHang: "FSHOP",
    diaChi: "",
    emailCuaHang: "",
    hotline: "",
    phiVanChuyen: 30000,
    mienPhiTu: 500000,
    cod: true,
    chuyenKhoan: true,
    vnpay: false,
    momo: false,
    thongBaoDonHang: true,
    thongBaoThanhToan: true,
    thongBaoSapHetHang: true,
    thongBaoKhachHang: true,
    amThanh: true,
};

function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved
            ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
            : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

function formatMoney(value) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";
}

export default function AdminSettings() {
    const [activeTab, setActiveTab] = useState("tai-khoan");
    const [settings, setSettings] = useState(loadSettings);
    const [saved, setSaved] = useState(false);

    const taiKhoan = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("taiKhoan") || "null");
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setSaved(false), 2500);
        return () => clearTimeout(timer);
    }, [saved]);

    const update = (key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const saveSettings = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        setSaved(true);
    };

    const resetSettings = () => {
        if (!window.confirm("Bạn có chắc muốn khôi phục cài đặt mặc định?")) {
            return;
        }
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        setSaved(true);
    };

    const tabs = [
        { id: "tai-khoan", icon: "👤", label: "Tài khoản" },
        { id: "cua-hang", icon: "🏪", label: "Cửa hàng" },
        { id: "thanh-toan", icon: "💳", label: "Thanh toán" },
        { id: "van-chuyen", icon: "🚚", label: "Vận chuyển" },
        { id: "thong-bao", icon: "🔔", label: "Thông báo" },
        { id: "bao-mat", icon: "🔐", label: "Bảo mật" },
    ];

    return (
        <div className="settings-page">
            <div className="settings-page-header">
                <div>
                    <span className="settings-eyebrow">FSHOP ADMIN</span>
                    <h1>Cài đặt</h1>
                    <p>Quản lý các cấu hình chung của hệ thống FShop.</p>
                </div>

                <div className="settings-header-actions">
                    {saved && <span className="settings-saved">✓ Đã lưu</span>}
                    <button className="settings-reset-btn" type="button" onClick={resetSettings}>
                        Khôi phục
                    </button>
                    <button className="settings-save-btn" type="button" onClick={saveSettings}>
                        Lưu thay đổi
                    </button>
                </div>
            </div>

            <div className="settings-layout">
                <aside className="settings-tabs">
                    {tabs.map((tab) => (
                        <button
                            type="button"
                            key={tab.id}
                            className={activeTab === tab.id ? "active" : ""}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </aside>

                <section className="settings-content">
                    {activeTab === "tai-khoan" && (
                        <div className="settings-section">
                            <SectionTitle
                                title="Tài khoản quản trị"
                                desc="Thông tin tài khoản đang sử dụng trong trang quản trị."
                            />

                            <div className="settings-profile">
                                <div className="settings-avatar">A</div>
                                <div>
                                    <strong>{taiKhoan?.tenDangNhap || "admin"}</strong>
                                    <span>Quản trị viên • ADMIN</span>
                                </div>
                            </div>

                            <div className="settings-grid">
                                <Field
                                    label="Họ tên"
                                    value={settings.hoTen}
                                    onChange={(e) => update("hoTen", e.target.value)}
                                />
                                <Field
                                    label="Tên đăng nhập"
                                    value={taiKhoan?.tenDangNhap || "admin"}
                                    disabled
                                />
                                <Field
                                    label="Email"
                                    type="email"
                                    value={settings.email}
                                    onChange={(e) => update("email", e.target.value)}
                                />
                                <Field
                                    label="Số điện thoại"
                                    value={settings.soDienThoai}
                                    onChange={(e) => update("soDienThoai", e.target.value)}
                                    placeholder="09xxxxxxxx"
                                />
                            </div>

                            <InfoBox>
                                Thông tin tài khoản ở màn này hiện được lưu trên trình duyệt.
                                Khi backend có API cập nhật tài khoản Admin, có thể nối trực tiếp vào đây.
                            </InfoBox>
                        </div>
                    )}

                    {activeTab === "cua-hang" && (
                        <div className="settings-section">
                            <SectionTitle
                                title="Thông tin cửa hàng"
                                desc="Thông tin dùng chung cho FShop."
                            />

                            <div className="settings-store-card">
                                <div className="settings-store-logo">F</div>
                                <div>
                                    <strong>{settings.tenCuaHang || "FSHOP"}</strong>
                                    <span>Cửa hàng giày thể thao</span>
                                </div>
                            </div>

                            <div className="settings-grid">
                                <Field
                                    label="Tên cửa hàng"
                                    value={settings.tenCuaHang}
                                    onChange={(e) => update("tenCuaHang", e.target.value)}
                                />
                                <Field
                                    label="Hotline"
                                    value={settings.hotline}
                                    onChange={(e) => update("hotline", e.target.value)}
                                    placeholder="09xxxxxxxx"
                                />
                                <Field
                                    label="Email cửa hàng"
                                    type="email"
                                    value={settings.emailCuaHang}
                                    onChange={(e) => update("emailCuaHang", e.target.value)}
                                    placeholder="contact@fshop.vn"
                                />
                                <Field
                                    label="Địa chỉ"
                                    value={settings.diaChi}
                                    onChange={(e) => update("diaChi", e.target.value)}
                                    placeholder="Địa chỉ cửa hàng"
                                    wide
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "thanh-toan" && (
                        <div className="settings-section">
                            <SectionTitle
                                title="Phương thức thanh toán"
                                desc="Bật hoặc tắt các phương thức mà FShop cho phép sử dụng."
                            />

                            <Toggle
                                label="Thanh toán khi nhận hàng (COD)"
                                desc="Khách thanh toán khi nhận được sản phẩm."
                                checked={settings.cod}
                                onChange={(value) => update("cod", value)}
                            />
                            <Toggle
                                label="Chuyển khoản ngân hàng"
                                desc="Cho phép khách hàng thanh toán bằng chuyển khoản."
                                checked={settings.chuyenKhoan}
                                onChange={(value) => update("chuyenKhoan", value)}
                            />
                            <Toggle
                                label="VNPay"
                                desc="Chuẩn bị cho tích hợp cổng thanh toán VNPay."
                                checked={settings.vnpay}
                                onChange={(value) => update("vnpay", value)}
                            />
                            <Toggle
                                label="MoMo"
                                desc="Chuẩn bị cho tích hợp cổng thanh toán MoMo."
                                checked={settings.momo}
                                onChange={(value) => update("momo", value)}
                            />

                            <InfoBox>
                                VNPay và MoMo hiện chỉ là cấu hình bật/tắt giao diện, chưa tự động
                                tích hợp giao dịch nếu backend chưa có API tương ứng.
                            </InfoBox>
                        </div>
                    )}

                    {activeTab === "van-chuyen" && (
                        <div className="settings-section">
                            <SectionTitle
                                title="Vận chuyển"
                                desc="Thiết lập phí vận chuyển mặc định cho cửa hàng."
                            />

                            <div className="settings-grid settings-grid-small">
                                <Field
                                    label="Phí vận chuyển mặc định"
                                    type="number"
                                    value={settings.phiVanChuyen}
                                    onChange={(e) => update("phiVanChuyen", Number(e.target.value))}
                                />
                                <Field
                                    label="Miễn phí vận chuyển từ"
                                    type="number"
                                    value={settings.mienPhiTu}
                                    onChange={(e) => update("mienPhiTu", Number(e.target.value))}
                                />
                            </div>

                            <div className="settings-summary">
                                <div>
                                    <span>Phí hiện tại</span>
                                    <strong>{formatMoney(settings.phiVanChuyen)}</strong>
                                </div>
                                <div>
                                    <span>Đơn từ</span>
                                    <strong>{formatMoney(settings.mienPhiTu)}</strong>
                                </div>
                            </div>

                            <InfoBox>
                                Đây là cấu hình giao diện hiện tại. Muốn áp dụng trực tiếp vào
                                quá trình đặt hàng, cần nối các giá trị này với backend tính phí.
                            </InfoBox>
                        </div>
                    )}

                    {activeTab === "thong-bao" && (
                        <div className="settings-section">
                            <SectionTitle
                                title="Thông báo"
                                desc="Chọn những sự kiện mà quản trị viên muốn nhận thông báo."
                            />

                            <Toggle
                                label="Đơn hàng mới"
                                desc="Thông báo khi hệ thống có đơn hàng mới."
                                checked={settings.thongBaoDonHang}
                                onChange={(value) => update("thongBaoDonHang", value)}
                            />
                            <Toggle
                                label="Thanh toán mới"
                                desc="Thông báo khi có giao dịch thanh toán mới."
                                checked={settings.thongBaoThanhToan}
                                onChange={(value) => update("thongBaoThanhToan", value)}
                            />
                            <Toggle
                                label="Sản phẩm sắp hết hàng"
                                desc="Cảnh báo khi tồn kho xuống thấp."
                                checked={settings.thongBaoSapHetHang}
                                onChange={(value) => update("thongBaoSapHetHang", value)}
                            />
                            <Toggle
                                label="Khách hàng mới"
                                desc="Thông báo khi có khách hàng mới đăng ký."
                                checked={settings.thongBaoKhachHang}
                                onChange={(value) => update("thongBaoKhachHang", value)}
                            />
                            <Toggle
                                label="Âm thanh thông báo"
                                desc="Bật âm thanh khi có thông báo mới."
                                checked={settings.amThanh}
                                onChange={(value) => update("amThanh", value)}
                            />
                        </div>
                    )}

                    {activeTab === "bao-mat" && (
                        <div className="settings-section">
                            <SectionTitle
                                title="Bảo mật"
                                desc="Các thao tác bảo vệ phiên đăng nhập quản trị."
                            />

                            <div className="security-card">
                                <div>
                                    <strong>Phiên đăng nhập hiện tại</strong>
                                    <span className="security-online">● Đang hoạt động</span>
                                </div>
                                <span className="security-time">Trình duyệt hiện tại</span>
                            </div>

                            <div className="security-action">
                                <div>
                                    <strong>Đăng xuất tài khoản</strong>
                                    <p>Xóa phiên đăng nhập hiện tại và quay về trang đăng nhập.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        localStorage.removeItem("taiKhoan");
                                        window.location.reload();
                                    }}
                                >
                                    Đăng xuất
                                </button>
                            </div>

                            <InfoBox>
                                Chức năng đổi mật khẩu nên được nối với API backend để bảo đảm
                                mật khẩu được cập nhật an toàn trong cơ sở dữ liệu.
                            </InfoBox>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function SectionTitle({ title, desc }) {
    return (
        <div className="settings-section-title">
            <h2>{title}</h2>
            <p>{desc}</p>
        </div>
    );
}

function Field({
                   label,
                   value,
                   onChange,
                   type = "text",
                   placeholder = "",
                   disabled = false,
                   wide = false,
               }) {
    return (
        <label className={`settings-field ${wide ? "wide" : ""}`}>
            <span>{label}</span>
            <input
                type={type}
                value={value ?? ""}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
            />
        </label>
    );
}

function Toggle({ label, desc, checked, onChange }) {
    return (
        <div className="settings-toggle-row">
            <div>
                <strong>{label}</strong>
                <p>{desc}</p>
            </div>
            <button
                type="button"
                className={`settings-switch ${checked ? "on" : ""}`}
                onClick={() => onChange(!checked)}
                aria-pressed={checked}
            >
                <span />
            </button>
        </div>
    );
}

function InfoBox({ children }) {
    return <div className="settings-info">ℹ️ {children}</div>;
}
