import { useState } from "react";
import "./Auth.css";

const API = "http://localhost:8080/api";

function Login({ setPage, onLoginSuccess }) {
    const [tenDangNhap, setTenDangNhap] = useState("");
    const [matKhau, setMatKhau] = useState("");
    const [hienMatKhau, setHienMatKhau] = useState(false);
    const [dangNhap, setDangNhap] = useState(false);
    const [loi, setLoi] = useState("");

    const xuLyDangNhap = async (e) => {
        e.preventDefault();
        setLoi("");

        if (!tenDangNhap.trim()) {
            setLoi("Vui lòng nhập tên đăng nhập");
            return;
        }

        if (!matKhau) {
            setLoi("Vui lòng nhập mật khẩu");
            return;
        }

        try {
            setDangNhap(true);

            const params = new URLSearchParams();
            params.append("tenDangNhap", tenDangNhap.trim());
            params.append("matKhau", matKhau);

            const response = await fetch(
                `${API}/auth/login?${params.toString()}`,
                { method: "POST" }
            );

            const text = await response.text();
            let data = null;

            try {
                data = text ? JSON.parse(text) : null;
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    text ||
                    "Sai tên đăng nhập hoặc mật khẩu"
                );
            }

            const taiKhoan = {
                id: data?.id,
                tenDangNhap: data?.tenDangNhap,
                vaiTro: data?.vaiTro,
                trangThai: data?.trangThai,
                ngayTao: data?.ngayTao,
            };

            localStorage.setItem("taiKhoan", JSON.stringify(taiKhoan));

            if (onLoginSuccess) {
                onLoginSuccess(taiKhoan);
            } else {
                setPage("home");
            }
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            setLoi(error.message || "Không thể đăng nhập. Vui lòng thử lại.");
        } finally {
            setDangNhap(false);
        }
    };

    return (
        <main className="auth-screen auth-login-screen">
            <div className="auth-bg"></div>

            <section className="auth-shell">
                <div className="auth-brand-block">
                    <div className="auth-logo-mark">
                        <span>F</span>
                        <b>FShop</b>
                    </div>

                    <div className="auth-tagline">
                        THỜI TRANG GIÀY THỂ THAO NAM
                    </div>

                    <div className="auth-slogan">
                        Phong cách của bạn
                        <br />
                        — Là động lực của chúng tôi —
                    </div>
                </div>

                <div className="auth-card auth-card-login">
                    <div className="auth-card-heading">
                        <h1>Đăng nhập</h1>
                        <p className="auth-welcome">
                            Chào mừng bạn quay trở lại FShop!
                        </p>
                        <p>
                            Đăng nhập để tiếp tục mua sắm và khám phá những
                            mẫu giày thể thao nam mới nhất.
                        </p>
                    </div>

                    <form onSubmit={xuLyDangNhap} className="auth-form">
                        <div className="auth-field">
                            <label>Tài khoản</label>
                            <div className="auth-input-box">
                                <span className="auth-input-icon">♙</span>
                                <input
                                    type="text"
                                    value={tenDangNhap}
                                    onChange={(e) => setTenDangNhap(e.target.value)}
                                    placeholder="Số điện thoại hoặc tên đăng nhập"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label>Mật khẩu</label>
                            <div className="auth-input-box">
                                <span className="auth-input-icon">♙</span>
                                <input
                                    type={hienMatKhau ? "text" : "password"}
                                    value={matKhau}
                                    onChange={(e) => setMatKhau(e.target.value)}
                                    placeholder="Mật khẩu"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="auth-eye"
                                    onClick={() => setHienMatKhau(!hienMatKhau)}
                                    aria-label="Hiện hoặc ẩn mật khẩu"
                                >
                                    {hienMatKhau ? "◉" : "◌"}
                                </button>
                            </div>
                        </div>

                        {loi && <div className="auth-error">{loi}</div>}

                        <div className="auth-options">
                            <label className="auth-check">
                                <input type="checkbox" />
                                <span>Ghi nhớ tài khoản</span>
                            </label>

                            <button
                                type="button"
                                className="auth-forgot"
                                onClick={() => alert("Chức năng quên mật khẩu sẽ được bổ sung sau.")}
                            >
                                Quên mật khẩu?
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="auth-primary"
                            disabled={dangNhap}
                        >
                            {dangNhap ? "Đang đăng nhập..." : "Đăng nhập"}
                            {!dangNhap && <span>→</span>}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span></span>
                        <small>Hoặc đăng nhập bằng</small>
                        <span></span>
                    </div>

                    <button
                        type="button"
                        className="auth-phone-button"
                        onClick={() => alert("Đăng nhập bằng số điện thoại sẽ được bổ sung sau.")}
                    >
                        <span>▯</span>
                        Số điện thoại
                    </button>

                    <div className="auth-switch">
                        Chưa có tài khoản?
                        <button type="button" onClick={() => setPage("register")}>
                            Đăng ký ngay
                        </button>
                    </div>

                    <button
                        type="button"
                        className="auth-back"
                        onClick={() => setPage("home")}
                    >
                        ← Quay về trang chủ
                    </button>
                </div>

                <div className="auth-benefits">
                    <div>
                        <strong>♧</strong>
                        <b>Giao hàng toàn quốc</b>
                        <span>Nhanh chóng - An toàn</span>
                    </div>
                    <i></i>
                    <div>
                        <strong>♢</strong>
                        <b>Sản phẩm chính hãng</b>
                        <span>100% chất lượng</span>
                    </div>
                    <i></i>
                    <div>
                        <strong>♧</strong>
                        <b>Hỗ trợ 24/7</b>
                        <span>Tư vấn nhanh chóng</span>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Login;
