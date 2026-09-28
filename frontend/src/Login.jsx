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

            params.append(
                "tenDangNhap",
                tenDangNhap.trim()
            );

            params.append(
                "matKhau",
                matKhau
            );

            const response = await fetch(
                `${API}/auth/login?${params.toString()}`,
                {
                    method: "POST",
                }
            );

            const text = await response.text();

            let data = null;

            try {
                data = text
                    ? JSON.parse(text)
                    : null;
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
                khachHangId:
                    data?.khachHangId ?? null,
            };

            console.log(
                "LOGIN RESPONSE:",
                data
            );

            console.log(
                "TAI KHOAN LUU:",
                taiKhoan
            );

            localStorage.setItem(
                "taiKhoan",
                JSON.stringify(taiKhoan)
            );

            if (onLoginSuccess) {
                onLoginSuccess(taiKhoan);
            } else {
                setPage("home");
            }

        } catch (error) {

            console.error(
                "Lỗi đăng nhập:",
                error
            );

            setLoi(
                error.message ||
                "Không thể đăng nhập. Vui lòng thử lại."
            );

        } finally {

            setDangNhap(false);

        }
    };

    const xuLyFacebook = () => {
        alert(
            "Đăng nhập bằng Facebook sẽ được kết nối sau."
        );
    };


    const xuLyGoogle = () => {
        alert(
            "Đăng nhập bằng Gmail sẽ được kết nối sau."
        );
    };


    const xuLyApple = () => {
        alert(
            "Đăng nhập bằng Apple sẽ được kết nối sau."
        );
    };


    return (
        <main className="auth-screen auth-login-screen">

            <div className="auth-bg"></div>


            <section className="auth-shell">

                <div className="auth-brand-block">

                    <div className="auth-logo-mark">

                        <span>
                            F
                        </span>

                        <b>
                            FShop
                        </b>

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

                        <h1>
                            Đăng nhập
                        </h1>


                        <p className="auth-welcome">
                            Chào mừng bạn quay trở lại FShop!
                        </p>


                        <p>
                            Đăng nhập để tiếp tục mua sắm
                            và khám phá những mẫu giày
                            thể thao nam mới nhất.
                        </p>

                    </div>


                    <form
                        onSubmit={xuLyDangNhap}
                        className="auth-form"
                    >

                        <div className="auth-field">

                            <label>
                                Tài khoản
                            </label>


                            <div className="auth-input-box">

                                <span className="auth-input-icon">
                                    ♙
                                </span>


                                <input
                                    type="text"
                                    value={tenDangNhap}
                                    onChange={(e) =>
                                        setTenDangNhap(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Số điện thoại hoặc tên đăng nhập"
                                    autoComplete="username"
                                />

                            </div>

                        </div>

                        <div className="auth-field">

                            <label>
                                Mật khẩu
                            </label>


                            <div className="auth-input-box">

                                <span className="auth-input-icon">
                                    ♙
                                </span>


                                <input
                                    type={
                                        hienMatKhau
                                            ? "text"
                                            : "password"
                                    }
                                    value={matKhau}
                                    onChange={(e) =>
                                        setMatKhau(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Mật khẩu"
                                    autoComplete="current-password"
                                />


                                <button
                                    type="button"
                                    className="auth-eye"
                                    onClick={() =>
                                        setHienMatKhau(
                                            !hienMatKhau
                                        )
                                    }
                                    aria-label="Hiện hoặc ẩn mật khẩu"
                                >
                                    {hienMatKhau
                                        ? "◉"
                                        : "◌"}
                                </button>

                            </div>

                        </div>


                        {loi && (
                            <div className="auth-error">
                                {loi}
                            </div>
                        )}

                        <div className="auth-options">

                            <label className="auth-check">

                                <input
                                    type="checkbox"
                                />

                                <span>
                                    Ghi nhớ tài khoản
                                </span>

                            </label>


                            <button
                                type="button"
                                className="auth-forgot"
                                onClick={() =>
                                    alert(
                                        "Chức năng quên mật khẩu sẽ được bổ sung sau."
                                    )
                                }
                            >
                                Quên mật khẩu?
                            </button>

                        </div>

                        <button
                            type="submit"
                            className="auth-primary"
                            disabled={dangNhap}
                        >

                            {dangNhap
                                ? "Đang đăng nhập..."
                                : "Đăng nhập"}


                            {!dangNhap && (
                                <span>
                                    →
                                </span>
                            )}

                        </button>

                    </form>

                    <div className="auth-divider">

                        <span></span>

                        <small>
                            Hoặc đăng nhập bằng
                        </small>

                        <span></span>

                    </div>

                    <div className="auth-social-grid">

                        {/* FACEBOOK */}

                        <button
                            type="button"
                            className="auth-social-button auth-facebook"
                            onClick={xuLyFacebook}
                            aria-label="Đăng nhập bằng Facebook"
                            title="Facebook"
                        >

                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >

                                <path
                                    d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H7.4v3h2.7v8h3.4Z"
                                />

                            </svg>

                        </button>


                        <button
                            type="button"
                            className="auth-social-button auth-google"
                            onClick={xuLyGoogle}
                            aria-label="Đăng nhập bằng Gmail"
                            title="Gmail"
                        >

                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >

                                <path
                                    fill="#4285F4"
                                    d="M21.6 12.23c0-.7-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
                                />

                                <path
                                    fill="#34A853"
                                    d="M12 22c2.7 0 4.97-.9 6.63-2.41l-3.24-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.83-1.76-5.62-4.13H3.03v2.59A10 10 0 0 0 12 22Z"
                                />

                                <path
                                    fill="#FBBC05"
                                    d="M6.38 13.91A6 6 0 0 1 6.06 12c0-.66.11-1.3.32-1.91V7.5H3.03A10 10 0 0 0 2 12c0 1.61.39 3.14 1.03 4.5l3.35-2.59Z"
                                />

                                <path
                                    fill="#EA4335"
                                    d="M12 5.96c1.47 0 2.8.5 3.84 1.49l2.88-2.88C16.96 2.97 14.7 2 12 2a10 10 0 0 0-8.97 5.5l3.35 2.59C7.17 7.72 9.39 5.96 12 5.96Z"
                                />

                            </svg>

                        </button>

                        <button
                            type="button"
                            className="auth-social-button auth-apple"
                            onClick={xuLyApple}
                            aria-label="Đăng nhập bằng Apple"
                            title="Apple"
                        >

                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >

                                <path
                                    fill="currentColor"
                                    d="M17.05 12.54c0-2.03 1.66-3.01 1.74-3.06a3.76 3.76 0 0 0-2.95-1.6c-1.25-.13-2.46.75-3.1.75-.64 0-1.63-.73-2.68-.71-1.38.02-2.66.8-3.37 2.04-1.44 2.5-.37 6.2 1.02 8.23.68.99 1.48 2.1 2.54 2.06 1.02-.04 1.4-.66 2.64-.66 1.23 0 1.58.66 2.65.64 1.1-.02 1.79-1 2.46-2 .78-1.14 1.1-2.24 1.12-2.3-.03-.01-2.07-.8-2.07-3.39ZM15.01 6.55c.56-.68.94-1.63.84-2.57-.81.03-1.78.54-2.36 1.21-.52.6-.97 1.57-.85 2.49.9.07 1.82-.46 2.37-1.13Z"
                                />

                            </svg>

                        </button>

                    </div>

                    <div className="auth-switch">

                        Chưa có tài khoản?

                        <button
                            type="button"
                            onClick={() =>
                                setPage("register")
                            }
                        >
                            Đăng ký ngay
                        </button>

                    </div>


                    <button
                        type="button"
                        className="auth-back"
                        onClick={() =>
                            setPage("home")
                        }
                    >
                        ← Quay về trang chủ
                    </button>

                </div>


                <div className="auth-benefits">

                    <div>

                        <strong>
                            ♧
                        </strong>

                        <b>
                            Giao hàng toàn quốc
                        </b>

                        <span>
                            Nhanh chóng - An toàn
                        </span>

                    </div>


                    <i></i>


                    <div>

                        <strong>
                            ♢
                        </strong>

                        <b>
                            Sản phẩm chính hãng
                        </b>

                        <span>
                            100% chất lượng
                        </span>

                    </div>


                    <i></i>


                    <div>

                        <strong>
                            ♧
                        </strong>

                        <b>
                            Hỗ trợ 24/7
                        </b>

                        <span>
                            Tư vấn nhanh chóng
                        </span>

                    </div>

                </div>

            </section>

        </main>
    );
}

export default Login;