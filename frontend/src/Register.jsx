import { useState } from "react";
import "./Auth.css";

const API = "http://localhost:8080/api";

function Register({ setPage }) {

    const [tenDangNhap, setTenDangNhap] = useState("");
    const [matKhau, setMatKhau] = useState("");
    const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");
    const [hoTen, setHoTen] = useState("");
    const [soDienThoai, setSoDienThoai] = useState("");
    const [gioiTinh, setGioiTinh] = useState("");
    const [hienMatKhau, setHienMatKhau] = useState(false);
    const [hienXacNhan, setHienXacNhan] = useState(false);

    const [dangKy, setDangKy] = useState(false);
    const [loi, setLoi] = useState("");
    const xuLyDangKy = async (e) => {
        e.preventDefault();
        setLoi("");
        if (!hoTen.trim()) {
            setLoi("Vui lòng nhập họ tên");
            return;
        }

        if (hoTen.trim().length < 2) {
            setLoi("Họ tên phải có ít nhất 2 ký tự");
            return;
        }
        if (!soDienThoai.trim()) {
            setLoi("Vui lòng nhập số điện thoại");
            return;
        }

        const sdt = soDienThoai.trim();

        if (!/^(0|\+84)[0-9]{9,10}$/.test(sdt)) {
            setLoi("Số điện thoại không hợp lệ");
            return;
        }
        if (!gioiTinh) {
            setLoi("Vui lòng chọn giới tính");
            return;
        }

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
                    // Tài khoản
                    tenDangNhap: tenDangNhap.trim(),
                    matKhau,

                    // Khách hàng
                    hoTen: hoTen.trim(),
                    soDienThoai: sdt,
                    gioiTinh: gioiTinh,
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
            // Báo ngay cho AdminDashboard rằng khách hàng mới đã được tạo.
            // CustomEvent: dùng khi Admin và Register cùng một tab/app.
            try {
                window.dispatchEvent(
                    new CustomEvent("fshop-khach-hang-moi", {
                        detail: {
                            type: "KHACH_HANG_MOI",
                            timestamp: Date.now(),
                            khachHang: data?.khachHang || null,
                        },
                    })
                );
            } catch (eventError) {
                console.error(
                    "Không thể phát tín hiệu khách hàng mới:",
                    eventError
                );
            }

            // BroadcastChannel: dùng khi Admin đang mở ở tab khác.
            try {
                if ("BroadcastChannel" in window) {
                    const channel = new BroadcastChannel(
                        "fshop-khach-hang"
                    );

                    channel.postMessage({
                        type: "KHACH_HANG_MOI",
                        timestamp: Date.now(),
                    });

                    channel.close();
                }
            } catch (broadcastError) {
                console.error(
                    "Không thể gửi BroadcastChannel:",
                    broadcastError
                );
            }

            // Fallback cho trình duyệt không hỗ trợ BroadcastChannel.
            try {
                localStorage.setItem(
                    "fshop-khach-hang-moi",
                    String(Date.now())
                );
            } catch (storageError) {
                console.error(
                    "Không thể gửi tín hiệu localStorage:",
                    storageError
                );
            }

            alert(
                "Đăng ký tài khoản thành công!\n\n" +
                "Thông tin khách hàng đã được lưu."
            );


            setHoTen("");
            setSoDienThoai("");
            setGioiTinh("");
            setTenDangNhap("");
            setMatKhau("");
            setXacNhanMatKhau("");


            setPage("login");

        } catch (error) {
            console.error("Lỗi đăng ký:", error);

            setLoi(
                error.message ||
                "Không thể đăng ký. Vui lòng thử lại."
            );
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

                    <form
                        onSubmit={xuLyDangKy}
                        className="auth-form"
                    >

                        <div className="auth-field">
                            <label>Họ tên</label>

                            <div className="auth-input-box">
                                <span className="auth-input-icon">
                                    ♙
                                </span>

                                <input
                                    type="text"
                                    value={hoTen}
                                    onChange={(e) =>
                                        setHoTen(e.target.value)
                                    }
                                    placeholder="Nhập họ và tên"
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label>Số điện thoại</label>

                            <div className="auth-input-box">
                                <span className="auth-input-icon">
                                    ☎
                                </span>

                                <input
                                    type="tel"
                                    value={soDienThoai}
                                    onChange={(e) =>
                                        setSoDienThoai(e.target.value)
                                    }
                                    placeholder="Nhập số điện thoại"
                                    autoComplete="tel"
                                />
                            </div>
                        </div>
                        <div className="auth-field">
                            <label>Giới tính</label>

                            <div className="auth-input-box">
                                <span className="auth-input-icon">
                                    ♙
                                </span>

                                <select
                                    value={gioiTinh}
                                    onChange={(e) =>
                                        setGioiTinh(e.target.value)
                                    }
                                    style={{
                                        flex: 1,
                                        border: "none",
                                        outline: "none",
                                        background: "transparent",
                                        fontSize: "14px",
                                        color: gioiTinh
                                            ? "#222"
                                            : "#999",
                                        cursor: "pointer",
                                    }}
                                >
                                    <option value="">
                                        Chọn giới tính
                                    </option>

                                    <option value="NAM">
                                        Nam
                                    </option>

                                    <option value="NU">
                                        Nữ
                                    </option>

                                    <option value="KHAC">
                                        Khác
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="auth-field">
                            <label>Tên tài khoản</label>

                            <div className="auth-input-box">
                                <span className="auth-input-icon">
                                    ♙
                                </span>

                                <input
                                    type="text"
                                    value={tenDangNhap}
                                    onChange={(e) =>
                                        setTenDangNhap(e.target.value)
                                    }
                                    placeholder="Tên đăng nhập"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label>Mật khẩu</label>

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
                                        setMatKhau(e.target.value)
                                    }
                                    placeholder="Mật khẩu"
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    className="auth-eye"
                                    onClick={() =>
                                        setHienMatKhau(!hienMatKhau)
                                    }
                                >
                                    {hienMatKhau ? "◉" : "◌"}
                                </button>
                            </div>
                        </div>

                        <div className="auth-field">
                            <label>Nhập lại mật khẩu</label>

                            <div className="auth-input-box">
                                <span className="auth-input-icon">
                                    ♙
                                </span>

                                <input
                                    type={
                                        hienXacNhan
                                            ? "text"
                                            : "password"
                                    }
                                    value={xacNhanMatKhau}
                                    onChange={(e) =>
                                        setXacNhanMatKhau(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nhập lại mật khẩu"
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    className="auth-eye"
                                    onClick={() =>
                                        setHienXacNhan(!hienXacNhan)
                                    }
                                >
                                    {hienXacNhan ? "◉" : "◌"}
                                </button>
                            </div>
                        </div>

                        {loi && (
                            <div className="auth-error">
                                {loi}
                            </div>
                        )}

                        <label className="auth-terms">
                            <input
                                type="checkbox"
                                required
                            />

                            <span>
                                Tôi đồng ý với{" "}
                                <u>Điều khoản sử dụng</u>{" "}
                                và{" "}
                                <u>Chính sách bảo mật</u>{" "}
                                của FShop
                            </span>
                        </label>
                        <button
                            type="submit"
                            className="auth-primary"
                            disabled={dangKy}
                        >
                            {dangKy
                                ? "Đang đăng ký..."
                                : "Đăng ký"}

                            {!dangKy && (
                                <span>→</span>
                            )}
                        </button>
                    </form>

                    <div className="auth-divider auth-social-divider">
                        <span></span>

                        <small>
                            Hoặc đăng nhập bằng
                        </small>

                        <span></span>
                    </div>

                    <div className="auth-social-grid">

                        <button
                            type="button"
                            className="auth-social-button auth-facebook"
                            onClick={() =>
                                alert(
                                    "Đăng ký bằng Facebook sẽ được kết nối sau."
                                )
                            }
                            aria-label="Đăng ký bằng Facebook"
                            title="Facebook"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H7.4v3h2.7v8h3.4Z" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            className="auth-social-button auth-google"
                            onClick={() =>
                                alert(
                                    "Đăng ký bằng Gmail sẽ được kết nối sau."
                                )
                            }
                            aria-label="Đăng ký bằng Gmail"
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
                            onClick={() =>
                                alert(
                                    "Đăng ký bằng Apple sẽ được kết nối sau."
                                )
                            }
                            aria-label="Đăng ký bằng Apple"
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
                        Đã có tài khoản?

                        <button
                            type="button"
                            onClick={() => setPage("login")}
                        >
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

                        <b>
                            Giao hàng toàn quốc
                        </b>

                        <span>
                            Nhanh chóng - An toàn
                        </span>
                    </div>

                    <i></i>

                    <div>
                        <strong>♢</strong>

                        <b>
                            Sản phẩm chính hãng
                        </b>

                        <span>
                            100% chất lượng
                        </span>
                    </div>

                    <i></i>

                    <div>
                        <strong>♧</strong>

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

export default Register;
