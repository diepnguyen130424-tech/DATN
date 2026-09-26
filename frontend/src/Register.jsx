import { useState } from "react";
import "./Auth.css";

const API = "http://localhost:8080/api";

function Register({ setPage }) {
    const [tenDangNhap, setTenDangNhap] = useState("");
    const [matKhau, setMatKhau] = useState("");
    const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");
    const [hienMatKhau, setHienMatKhau] = useState(false);
    const [hienXacNhan, setHienXacNhan] = useState(false);
    const [dangKy, setDangKy] = useState(false);
    const [loi, setLoi] = useState("");

    const xuLyDangKy = async (e) => {
        e.preventDefault();
        setLoi("");

        if (tenDangNhap.trim().length < 3) {
            setLoi("Tên đăng nhập phải có ít nhất 3 ký tự");
            return;
        }

        if (matKhau.length < 6) {
            setLoi("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }

        if (matKhau !== xacNhanMatKhau) {
            setLoi("Mật khẩu xác nhận không khớp");
            return;
        }

        try {
            setDangKy(true);

            const response = await fetch(`${API}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tenDangNhap: tenDangNhap.trim(),
                    matKhau,
                }),
            });

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
                    "Đăng ký thất bại"
                );
            }

            alert("Đăng ký tài khoản thành công!");
            setPage("login");
        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            setLoi(error.message || "Không thể đăng ký. Vui lòng thử lại.");
        } finally {
            setDangKy(false);
        }
    };

    return (
        <main className="auth-screen auth-register-screen">
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

                <div className="auth-card auth-card-register">
                    <div className="auth-card-heading">
                        <h1>Đăng ký</h1>
                        <p className="auth-welcome">
                            Tạo tài khoản để nhận nhiều ưu đãi hấp dẫn
                        </p>
                        <p>
                            và trải nghiệm mua sắm tốt hơn tại FShop!
                        </p>
                    </div>

                    <form onSubmit={xuLyDangKy} className="auth-form">
                        <div className="auth-field">
                            <label>Tên tài khoản</label>
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
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="auth-eye"
                                    onClick={() => setHienMatKhau(!hienMatKhau)}
                                >
                                    {hienMatKhau ? "◉" : "◌"}
                                </button>
                            </div>
                        </div>

                        <div className="auth-field">
                            <label>Nhập lại mật khẩu</label>
                            <div className="auth-input-box">
                                <span className="auth-input-icon">♙</span>
                                <input
                                    type={hienXacNhan ? "text" : "password"}
                                    value={xacNhanMatKhau}
                                    onChange={(e) => setXacNhanMatKhau(e.target.value)}
                                    placeholder="Nhập lại mật khẩu"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="auth-eye"
                                    onClick={() => setHienXacNhan(!hienXacNhan)}
                                >
                                    {hienXacNhan ? "◉" : "◌"}
                                </button>
                            </div>
                        </div>

                        {loi && <div className="auth-error">{loi}</div>}

                        <label className="auth-terms">
                            <input type="checkbox" required />
                            <span>
                                Tôi đồng ý với <u>Điều khoản sử dụng</u> và
                                <u> Chính sách bảo mật</u> của FShop
                            </span>
                        </label>

                        <button
                            type="submit"
                            className="auth-primary"
                            disabled={dangKy}
                        >
                            {dangKy ? "Đang đăng ký..." : "Đăng ký"}
                            {!dangKy && <span>→</span>}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span></span>
                        <small>Hoặc đăng ký bằng</small>
                        <span></span>
                    </div>

                    <button
                        type="button"
                        className="auth-phone-button"
                        onClick={() => alert("Đăng ký bằng số điện thoại sẽ được bổ sung sau.")}
                    >
                        <span>▯</span>
                        Số điện thoại
                    </button>

                    <div className="auth-switch">
                        Đã có tài khoản?
                        <button type="button" onClick={() => setPage("login")}>
                            Đăng nhập ngay
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

export default Register;
