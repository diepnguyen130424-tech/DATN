import { useState } from "react";

const API = "http://localhost:8080/api";

function Login({
                   setPage,
                   onLoginSuccess
               }) {
    const [tenDangNhap, setTenDangNhap] = useState("");
    const [matKhau, setMatKhau] = useState("");
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

            /*
             * Không lưu nguyên object trả về từ backend
             * vì backend hiện đang trả cả matKhau.
             */
            const taiKhoan = {
                id: data?.id,
                tenDangNhap: data?.tenDangNhap,
                vaiTro: data?.vaiTro,
                trangThai: data?.trangThai,
                ngayTao: data?.ngayTao,
            };

            localStorage.setItem(
                "taiKhoan",
                JSON.stringify(taiKhoan)
            );

            if (onLoginSuccess) {
                onLoginSuccess(taiKhoan);
            }

            setPage("home");

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

    return (
        <main className="auth-page">

            <div className="auth-container">

                <div className="auth-card">

                    {/* LOGO */}
                    <div className="auth-header">

                        <div className="auth-logo">
                            FSHOP
                        </div>

                        <h1>
                            Đăng nhập
                        </h1>

                        <p>
                            Đăng nhập để tiếp tục mua sắm tại FShop
                        </p>

                    </div>

                    {/* FORM */}
                    <form
                        className="auth-form"
                        onSubmit={xuLyDangNhap}
                    >

                        {loi && (
                            <div className="auth-error">
                                {loi}
                            </div>
                        )}

                        {/* TÊN ĐĂNG NHẬP */}
                        <div className="auth-field">

                            <label>
                                Tên đăng nhập
                            </label>

                            <input
                                type="text"
                                value={tenDangNhap}
                                onChange={(e) =>
                                    setTenDangNhap(
                                        e.target.value
                                    )
                                }
                                placeholder="Nhập tên đăng nhập"
                                autoComplete="username"
                            />

                        </div>

                        {/* MẬT KHẨU */}
                        <div className="auth-field">

                            <label>
                                Mật khẩu
                            </label>

                            <input
                                type="password"
                                value={matKhau}
                                onChange={(e) =>
                                    setMatKhau(
                                        e.target.value
                                    )
                                }
                                placeholder="Nhập mật khẩu"
                                autoComplete="current-password"
                            />

                        </div>

                        {/* BUTTON */}
                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={dangNhap}
                        >
                            {dangNhap
                                ? "Đang đăng nhập..."
                                : "Đăng nhập"
                            }
                        </button>

                    </form>

                    {/* REGISTER */}
                    <div className="auth-register">

                        <span>
                            Chưa có tài khoản?
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setPage("register")
                            }
                        >
                            Đăng ký ngay
                        </button>

                    </div>

                    {/* BACK */}
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

            </div>

        </main>
    );
}

export default Login;