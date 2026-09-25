import { useState } from "react";

const API = "http://localhost:8080/api";

function Register({
                      setPage
                  }) {
    const [tenDangNhap, setTenDangNhap] = useState("");
    const [matKhau, setMatKhau] = useState("");
    const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");

    const [dangKy, setDangKy] = useState(false);
    const [loi, setLoi] = useState("");
    const [thanhCong, setThanhCong] = useState("");

    const xuLyDangKy = async (e) => {
        e.preventDefault();

        setLoi("");
        setThanhCong("");

        if (!tenDangNhap.trim()) {
            setLoi("Vui lòng nhập tên đăng nhập");
            return;
        }

        if (tenDangNhap.trim().length < 3) {
            setLoi(
                "Tên đăng nhập phải có ít nhất 3 ký tự"
            );
            return;
        }

        if (!matKhau) {
            setLoi("Vui lòng nhập mật khẩu");
            return;
        }

        if (matKhau.length < 6) {
            setLoi(
                "Mật khẩu phải có ít nhất 6 ký tự"
            );
            return;
        }

        if (matKhau !== xacNhanMatKhau) {
            setLoi(
                "Mật khẩu xác nhận không khớp"
            );
            return;
        }

        try {
            setDangKy(true);

            const response = await fetch(
                `${API}/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        tenDangNhap:
                            tenDangNhap.trim(),

                        matKhau: matKhau,
                    }),
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
                    "Đăng ký thất bại"
                );
            }

            setThanhCong(
                "Đăng ký thành công! Đang chuyển đến trang đăng nhập..."
            );

            setTenDangNhap("");
            setMatKhau("");
            setXacNhanMatKhau("");

            setTimeout(() => {
                setPage("login");
            }, 1200);

        } catch (error) {
            console.error(
                "Lỗi đăng ký:",
                error
            );

            setLoi(
                error.message ||
                "Không thể đăng ký. Vui lòng thử lại."
            );

        } finally {
            setDangKy(false);
        }
    };

    return (
        <main className="auth-page">

            <div className="auth-container">

                <div className="auth-card">
                    <div className="auth-header">

                        <div className="auth-logo">
                            FSHOP
                        </div>

                        <h1>
                            Tạo tài khoản
                        </h1>

                        <p>
                            Đăng ký tài khoản khách hàng tại FShop
                        </p>

                    </div>

                    <form
                        className="auth-form"
                        onSubmit={xuLyDangKy}
                    >
                        {loi && (
                            <div className="auth-error">
                                {loi}
                            </div>
                        )}

                        {thanhCong && (
                            <div className="auth-success">
                                {thanhCong}
                            </div>
                        )}

                        {/* USERNAME */}
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

                        {/* PASSWORD */}
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
                                autoComplete="new-password"
                            />

                        </div>

                        {/* CONFIRM PASSWORD */}
                        <div className="auth-field">

                            <label>
                                Xác nhận mật khẩu
                            </label>

                            <input
                                type="password"
                                value={xacNhanMatKhau}
                                onChange={(e) =>
                                    setXacNhanMatKhau(
                                        e.target.value
                                    )
                                }
                                placeholder="Nhập lại mật khẩu"
                                autoComplete="new-password"
                            />

                        </div>

                        {/* REGISTER */}
                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={dangKy}
                        >
                            {dangKy
                                ? "Đang đăng ký..."
                                : "Đăng ký"
                            }
                        </button>

                    </form>

                    {/* LOGIN */}
                    <div className="auth-register">

                        <span>
                            Đã có tài khoản?
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setPage("login")
                            }
                        >
                            Đăng nhập
                        </button>

                    </div>

                    <button
                        type="button"
                        className="auth-back"
                        onClick={() =>
                            setPage("login")
                        }
                    >
                        ← Quay lại đăng nhập
                    </button>

                </div>

            </div>

        </main>
    );
}

export default Register;