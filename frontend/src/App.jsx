import { useEffect, useState } from "react";
import "./App.css";
import "./Auth.css";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";
import Login from "./Login";
import Register from "./Register";

const API = "http://localhost:8080/api";

const danhMuc = [
    {
        ten: "Giày thể thao",
        moTa: "Năng động, thoải mái",
        anh: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
    },
    {
        ten: "Sneaker",
        moTa: "Thời trang, dễ phối đồ",
        anh: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85",
    },
    {
        ten: "Giày chạy bộ",
        moTa: "Êm nhẹ, bền bỉ",
        anh: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=85",
    },
    {
        ten: "Giày đi chơi",
        moTa: "Thoải mái, cá tính",
        anh: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=85",
    },
];

const thuongHieu = [
    "Nike",
    "adidas",
    "Puma Sport",
    "Converse",
];

const dichVu = [
    {
        icon: "🚚",
        title: "Miễn phí vận chuyển",
        desc: "Cho đơn hàng từ 500.000đ",
    },
    {
        icon: "✓",
        title: "Hàng chính hãng",
        desc: "Cam kết chất lượng sản phẩm",
    },
    {
        icon: "↻",
        title: "Đổi trả 7 ngày",
        desc: "Nếu sản phẩm có lỗi",
    },
    {
        icon: "🔒",
        title: "Thanh toán an toàn",
        desc: "Bảo mật thông tin khách hàng",
    },
];

const heroSlides = [
    { image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=2000&q=90", label: "BỘ SƯU TẬP GIÀY NAM 2026", title1: "Phong cách", title2: "cho mọi bước đi", description: "Những mẫu giày nam hiện đại, năng động dành cho mọi hành trình của bạn." },
    { image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=2000&q=90", label: "SNEAKER MỚI VỀ", title1: "Cá tính", title2: "trong từng bước chân", description: "Khám phá những mẫu sneaker trẻ trung, dễ phối đồ và phù hợp mỗi ngày." },
    { image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=2000&q=90", label: "RUNNING COLLECTION", title1: "Êm nhẹ", title2: "chạy xa hơn", description: "Thiết kế năng động, thoải mái cho luyện tập, chạy bộ và hoạt động hàng ngày." },
    { image: "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=2000&q=90", label: "SPORT COLLECTION", title1: "Sẵn sàng", title2: "cho mọi cuộc chơi", description: "Những mẫu giày thể thao nổi bật dành cho phong cách năng động của bạn." },
    { image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=2000&q=90", label: "NEW ARRIVAL", title1: "Mẫu mới", title2: "đã có tại FShop", description: "Cập nhật những mẫu giày mới nhất và chọn phong cách phù hợp với bạn." },
];

function formatGia(gia) {
    if (gia === null || gia === undefined || gia === "") {
        return "0đ";
    }

    return Number(gia).toLocaleString("vi-VN") + "đ";
}

function layTrangTheoVaiTro(taiKhoan) {
    const vaiTro = String(taiKhoan?.vaiTro || "").toUpperCase();

    if (vaiTro === "QUAN_TRI") return "admin";
    if (vaiTro === "NHAN_VIEN" || vaiTro === "NHÂN_VIÊN") return "employee";
    return "home";
}

function App() {

    const taiKhoanDaLuu = (() => {
        try {
            const data = localStorage.getItem("taiKhoan");
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    })();

    const [taiKhoan, setTaiKhoan] = useState(taiKhoanDaLuu);
    const [page, setPage] = useState(
        taiKhoanDaLuu ? layTrangTheoVaiTro(taiKhoanDaLuu) : "login"
    );

    const [sanPhams, setSanPhams] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [selectedProduct, setSelectedProduct] = useState(null);

    const [gioHang, setGioHang] = useState([]);

    const [toast, setToast] = useState("");

    useEffect(() => {
        taiSanPham();
    }, []);

    const xuLyDangNhapThanhCong = (data) => {
        setTaiKhoan(data);
        localStorage.setItem("taiKhoan", JSON.stringify(data));
        setPage(layTrangTheoVaiTro(data));
    };

    const dangXuat = () => {
        localStorage.removeItem("taiKhoan");
        setTaiKhoan(null);
        setGioHang([]);
        setPage("login");
    };

    const taiSanPham = async () => {
        try {
            setLoading(true);

            const response = await fetch(`${API}/san-pham`);

if (!response.ok) {
    throw new Error("Không thể lấy danh sách sản phẩm");
}

const data = await response.json();

const danhSach = Array.isArray(data) ? data : [];

const sanPhamCoGia = await Promise.all(
    danhSach.map(async (sanPham) => {
        try {
            const detailResponse = await fetch(
                `${API}/san-pham/${sanPham.id}/chi-tiet`
            );

            if (!detailResponse.ok) {
                return {
                    ...sanPham,
                    chiTiets: [],
                    giaBan: null,
                };
            }

            const details = await detailResponse.json();

            return {
                ...sanPham,
                chiTiets: Array.isArray(details) ? details : [],
                giaBan:
                    Array.isArray(details) && details.length > 0
                        ? details[0].giaBan
                        : null,
            };
        } catch {
            return {
                ...sanPham,
                chiTiets: [],
                giaBan: null,
            };
        }
    })
);

setSanPhams(sanPhamCoGia);
} catch (error) {
    console.error(error);
    setSanPhams([]);
} finally {
    setLoading(false);
}
};

const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
        setToast("");
    }, 2000);
};

const xemSanPham = async (sanPham) => {
    try {
        const response = await fetch(
            `${API}/san-pham/${sanPham.id}/chi-tiet`
        );

        let chiTiets = [];

        if (response.ok) {
            const data = await response.json();
            chiTiets = Array.isArray(data) ? data : [];
        }

        setSelectedProduct({
            ...sanPham,
            chiTiets,
        });

        setPage("detail");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    } catch (error) {
        console.error(error);

        setSelectedProduct({
            ...sanPham,
            chiTiets: sanPham.chiTiets || [],
        });

        setPage("detail");
    }
};

const themVaoGio = (sanPham, chiTiet = null, soLuong = 1) => {
    if (!chiTiet?.id) {
        alert("Sản phẩm chưa có biến thể để mua");
        return;
    }

    const tonKho = Number(chiTiet.soLuongTon ?? 0);

    if (tonKho <= 0) {
        alert("Sản phẩm đã hết hàng");
        return;
    }

    const variantId = chiTiet.id;
    const soLuongThem = Math.max(1, Number(soLuong) || 1);

    setGioHang((oldCart) => {
        const existing = oldCart.find(
            (item) => item.variantId === variantId
        );

        if (existing) {
            const soLuongMoi = existing.soLuong + soLuongThem;

            if (soLuongMoi > tonKho) {
                alert(`Sản phẩm chỉ còn ${tonKho} sản phẩm trong kho`);
                return oldCart;
            }

            return oldCart.map((item) =>
                item.variantId === variantId
                    ? { ...item, soLuong: soLuongMoi }
                    : item
            );
        }

        const soLuongMoi = Math.min(soLuongThem, tonKho);

        return [
            ...oldCart,
            {
                variantId,
                sanPham,
                chiTiet,
                soLuong: soLuongMoi,
            },
        ];
    });

    showToast("Đã thêm sản phẩm vào giỏ hàng");
};

const tangSoLuong = (variantId) => {
    setGioHang((oldCart) =>
        oldCart.map((item) => {
            if (item.variantId !== variantId) return item;

            const tonKho = Number(item.chiTiet?.soLuongTon ?? 0);

            if (tonKho > 0 && item.soLuong >= tonKho) {
                alert(`Sản phẩm chỉ còn ${tonKho} sản phẩm trong kho`);
                return item;
            }

            return {
                ...item,
                soLuong: item.soLuong + 1,
            };
        })
    );
};

const giamSoLuong = (variantId) => {
    setGioHang((oldCart) =>
        oldCart
            .map((item) =>
                item.variantId === variantId
                    ? {
                        ...item,
                        soLuong: item.soLuong - 1,
                    }
                    : item
            )
            .filter((item) => item.soLuong > 0)
    );
};

const xoaKhoiGio = (variantId) => {
    setGioHang((oldCart) =>
        oldCart.filter(
            (item) => item.variantId !== variantId
        )
    );

    showToast("Đã xóa sản phẩm khỏi giỏ");
};

const tongSoLuong = gioHang.reduce(
    (total, item) => total + item.soLuong,
    0
);

const tongTien = gioHang.reduce((total, item) => {
    const gia =
        item.chiTiet?.giaBan ||
        item.sanPham?.giaBan ||
        0;

    return total + Number(gia) * item.soLuong;
}, 0);

if (page === "admin") {
    if (String(taiKhoan?.vaiTro || "").toUpperCase() !== "QUAN_TRI") {
        return (
            <Login
                setPage={setPage}
                onLoginSuccess={xuLyDangNhapThanhCong}
            />
        );
    }

    return <AdminDashboard />;
}

if (page === "employee") {
    const vaiTro = String(taiKhoan?.vaiTro || "").toUpperCase();

    if (vaiTro !== "NHAN_VIEN" && vaiTro !== "NHÂN_VIÊN") {
        return (
            <Login
                setPage={setPage}
                onLoginSuccess={xuLyDangNhapThanhCong}
            />
        );
    }

    return (
        <EmployeeDashboard
            taiKhoan={taiKhoan}
            dangXuat={dangXuat}
            onBackToShop={() => setPage("home")}
        />
    );
}

if (page === "login") {
    return (
        <Login
            setPage={setPage}
            onLoginSuccess={xuLyDangNhapThanhCong}
        />
    );
}

if (page === "register") {
    return <Register setPage={setPage} />;
}

if (!taiKhoan) {
    return (
        <Login
            setPage={setPage}
            onLoginSuccess={xuLyDangNhapThanhCong}
        />
    );
}

return (
    <div className="fshop">

        <Header
            page={page}
            setPage={setPage}
            search={search}
            setSearch={setSearch}
            tongSoLuong={tongSoLuong}
            taiKhoan={taiKhoan}
            dangXuat={dangXuat}
        />

        {page === "home" && (
            <Home
                sanPhams={sanPhams}
                loading={loading}
                xemSanPham={xemSanPham}
                themVaoGio={themVaoGio}
                setPage={setPage}
            />
        )}

        {page === "products" && (
            <ProductList
                sanPhams={sanPhams}
                loading={loading}
                search={search}
                setSearch={setSearch}
                xemSanPham={xemSanPham}
                themVaoGio={themVaoGio}
            />
        )}

        {page === "detail" && selectedProduct && (
            <ProductDetail
                sanPham={selectedProduct}
                themVaoGio={themVaoGio}
                setPage={setPage}
            />
        )}

        {page === "cart" && (
            <Cart
                gioHang={gioHang}
                tongTien={tongTien}
                tangSoLuong={tangSoLuong}
                giamSoLuong={giamSoLuong}
                xoaKhoiGio={xoaKhoiGio}
                setPage={setPage}
            />
        )}

        {page === "checkout" && (
            <Checkout
                gioHang={gioHang}
                tongTien={tongTien}
                setPage={setPage}
                setGioHang={setGioHang}
            />
        )}

        <Footer />

        {toast && (
            <div className="toast">
                <span>✓</span>
                {toast}
            </div>
        )}
    </div>
);
}

function Header({
                    page,
                    setPage,
                    search,
                    setSearch,
                    tongSoLuong,
                    taiKhoan,
                    dangXuat,
                }) {
    const submitSearch = () => {
        setPage("products");
    };

    return (
        <>
            <header className="top-header">
                <div className="container header-container">

                    <div
                        className="logo"
                        onClick={() => setPage("home")}
                    >
                        <div className="logo-box">F</div>

                        <div>
                            <div className="logo-name">FShop</div>
                            <div className="logo-sub">
                                Giày nam chính hãng
                            </div>
                        </div>
                    </div>

                    <div className="search-wrapper">

                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm, thương hiệu, danh mục..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    submitSearch();
                                }
                            }}
                        />

                        <button onClick={submitSearch}>
                            🔍
                        </button>
                    </div>

                    {String(taiKhoan?.vaiTro || "").toUpperCase() === "QUAN_TRI" && (
                        <button
                            className="admin-entry-button"
                            onClick={() => setPage("admin")}
                        >
                            Admin
                        </button>
                    )}

                    {(String(taiKhoan?.vaiTro || "").toUpperCase() === "NHAN_VIEN"
                        || String(taiKhoan?.vaiTro || "").toUpperCase() === "NHÂN_VIÊN") && (
                        <button
                            className="admin-entry-button"
                            onClick={() => setPage("employee")}
                        >
                            Nhân viên
                        </button>
                    )}

                    <div className="header-right">

                        <div
                            className="header-item account-header"
                            onClick={() => {
                                if (!taiKhoan) {
                                    setPage("login");
                                }
                            }}
                        >
              <span className="header-icon">
                ♙
              </span>

                            <div>
                                <small>Tài khoản</small>
                                <strong>
                                    {taiKhoan
                                        ? taiKhoan.tenDangNhap
                                        : "Đăng nhập"}
                                </strong>
                            </div>
                        </div>

                        {taiKhoan && (
                            <button
                                type="button"
                                className="logout-button"
                                onClick={dangXuat}
                            >
                                Đăng xuất
                            </button>
                        )}

                        <div className="header-item">
              <span className="header-icon">
                ♡
              </span>

                            <div>
                                <small>Yêu thích</small>
                                <strong>0 sản phẩm</strong>
                            </div>
                        </div>

                        <div
                            className="header-item cart-item"
                            onClick={() => setPage("cart")}
                        >
                            <div className="cart-icon">
                                🛒

                                {tongSoLuong > 0 && (
                                    <span className="cart-count">
                    {tongSoLuong}
                  </span>
                                )}
                            </div>

                            <div>
                                <small>Giỏ hàng</small>
                                <strong>
                                    {tongSoLuong} sản phẩm
                                </strong>
                            </div>
                        </div>

                    </div>
                </div>
            </header>

            <nav className="navigation">
                <div className="container navigation-container">

                    <a
                        className={page === "home" ? "nav-active" : ""}
                        onClick={() => setPage("home")}
                    >
                        🏠 Trang chủ
                    </a>

                    <a
                        className={page === "products" ? "nav-active" : ""}
                        onClick={() => setPage("products")}
                    >
                        Sản phẩm
                    </a>

                    <a>
                        Danh mục ⌄
                    </a>

                    <a>
                        Thương hiệu
                    </a>

                    <a>
                        Khuyến mãi
                    </a>

                    <a>
                        Liên hệ
                    </a>

                </div>
            </nav>
        </>
    );
}

function Home({
                  sanPhams,
                  loading,
                  xemSanPham,
                  themVaoGio,
                  setPage,
              }) {
    const [heroIndex, setHeroIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setHeroIndex((current) => (current + 1) % heroSlides.length);
        }, 4500);
        return () => clearInterval(timer);
    }, []);

    const hero = heroSlides[heroIndex];

    const nextHero = () => setHeroIndex((current) => (current + 1) % heroSlides.length);
    const prevHero = () => setHeroIndex((current) => (current - 1 + heroSlides.length) % heroSlides.length);

    return (
        <>
            <section className="hero">
                <img key={heroIndex} src={hero.image} alt={hero.label} className="hero-image" style={{ animation: "heroFade 0.7s ease" }} />
                <div className="hero-overlay"></div>

                <div className="container hero-container">
                    <div className="hero-content" key={`hero-content-${heroIndex}`} style={{ animation: "heroContentFade 0.7s ease" }}>
                        <div className="hero-label">{hero.label}</div>
                        <h1>{hero.title1}<br />{hero.title2}</h1>
                        <p>{hero.description}</p>
                        <button className="primary-button" onClick={() => setPage("products")}>Mua ngay →</button>
                    </div>

                    <div className="hero-services">
                        {dichVu.slice(0, 3).map((item) => (
                            <div className="hero-service" key={item.title}>
                                <div className="service-icon">{item.icon}</div>
                                <div><strong>{item.title}</strong><span>{item.desc}</span></div>
                            </div>
                        ))}
                    </div>
                </div>

                <button type="button" aria-label="Ảnh trước" onClick={prevHero} style={{position:"absolute",left:"28px",top:"50%",transform:"translateY(-50%)",width:"46px",height:"46px",borderRadius:"50%",border:"1px solid rgba(255,255,255,.5)",background:"rgba(0,0,0,.28)",color:"#fff",fontSize:"28px",cursor:"pointer",zIndex:5}}>‹</button>
                <button type="button" aria-label="Ảnh tiếp theo" onClick={nextHero} style={{position:"absolute",right:"28px",top:"50%",transform:"translateY(-50%)",width:"46px",height:"46px",borderRadius:"50%",border:"1px solid rgba(255,255,255,.5)",background:"rgba(0,0,0,.28)",color:"#fff",fontSize:"28px",cursor:"pointer",zIndex:5}}>›</button>

                <div className="hero-dots">
                    {heroSlides.map((_, index) => (
                        <button key={index} type="button" aria-label={`Banner ${index + 1}`} onClick={() => setHeroIndex(index)} style={{width:index===heroIndex?"30px":"9px",height:"9px",borderRadius:"999px",border:"none",padding:0,margin:"0 4px",cursor:"pointer",background:index===heroIndex?"#fff":"rgba(255,255,255,.55)",transition:"all .25s ease"}} />
                    ))}
                </div>

                <style>{`
                    @keyframes heroFade { from { opacity:.55; transform:scale(1.015); } to { opacity:1; transform:scale(1); } }
                    @keyframes heroContentFade { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
                `}</style>
            </section>

            <section className="service-section">
                <div className="container service-grid">

                    {dichVu.map((item) => (
                        <div
                            className="service-card"
                            key={item.title}
                        >
                            <div className="service-card-icon">
                                {item.icon}
                            </div>

                            <div>
                                <strong>{item.title}</strong>
                                <p>{item.desc}</p>
                            </div>
                        </div>
                    ))}

                </div>
            </section>

            <section className="section">

                <div className="container">

                    <div className="section-header">

                        <div>
              <span className="section-label">
                DANH MỤC NỔI BẬT
              </span>

                            <h2>
                                Giày nam theo phong cách
                            </h2>
                        </div>

                        <button
                            className="view-all"
                            onClick={() => setPage("products")}
                        >
                            Xem tất cả →
                        </button>

                    </div>

                    <div className="category-grid">

                        {danhMuc.map((item) => (
                            <div
                                className="category-card"
                                key={item.ten}
                            >
                                <img
                                    src={item.anh}
                                    alt={item.ten}
                                />

                                <div className="category-overlay"></div>

                                <div className="category-info">
                                    <h3>{item.ten}</h3>
                                    <p>{item.moTa}</p>

                                    <button
                                        onClick={() =>
                                            setPage("products")
                                        }
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                        ))}

                    </div>

                </div>

            </section>

            <section className="section products-section">

                <div className="container">

                    <div className="section-header">

                        <div>
              <span className="section-label">
                SẢN PHẨM NỔI BẬT
              </span>

                            <h2>
                                Top sản phẩm bán chạy
                            </h2>
                        </div>

                        <button
                            className="view-all"
                            onClick={() => setPage("products")}
                        >
                            Xem tất cả →
                        </button>

                    </div>

                    {loading ? (
                        <Loading />
                    ) : (
                        <div className="product-grid">

                            {sanPhams
                                .slice(0, 12)
                                .map((sp, index) => (

                                    <ProductCard
                                        key={sp.id}
                                        sanPham={sp}
                                        index={index}
                                        xemSanPham={xemSanPham}
                                        themVaoGio={themVaoGio}
                                    />

                                ))}

                        </div>
                    )}

                </div>
            </section>

            <section className="container promotion-section">

                <div className="promotion-main">

                    <img
                        src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1400&q=85"
                        alt="Khuyến mãi"
                    />

                    <div className="promotion-overlay"></div>

                    <div className="promotion-content">

            <span>
              KHUYẾN MÃI ĐẶC BIỆT
            </span>

                        <h2>
                            Giảm đến <b>50%</b>
                        </h2>

                        <p>
                            Săn ngay những mẫu giày hot nhất
                            tại FShop.
                        </p>

                        <button
                            onClick={() => setPage("products")}
                        >
                            Xem ngay →
                        </button>

                    </div>
                </div>

                <div className="promotion-small">

                    <img
                        src="https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=85"
                        alt="Bộ sưu tập"
                    />

                    <div>
                        <span>BỘ SƯU TẬP MỚI</span>

                        <h3>
                            Thiết kế hiện đại
                        </h3>

                        <p>
                            Phong cách trẻ trung
                        </p>

                        <button
                            onClick={() => setPage("products")}
                        >
                            Khám phá →
                        </button>
                    </div>

                </div>

                <div className="promotion-small">

                    <img
                        src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=85"
                        alt="Freeship"
                    />

                    <div>
                        <span>FREESHIP TOÀN QUỐC</span>

                        <h3>
                            Đơn từ 500.000đ
                        </h3>

                        <button
                            onClick={() => setPage("products")}
                        >
                            Mua ngay →
                        </button>
                    </div>

                </div>

            </section>

            <section className="brand-section">

                <div className="container">

                    <div className="brand-header">
            <span className="section-label">
              THƯƠNG HIỆU NỔI BẬT
            </span>
                    </div>

                    <div className="brand-grid">

                        {thuongHieu.map((brand) => (
                            <div
                                className="brand-card"
                                key={brand}
                            >
                                {brand}
                            </div>
                        ))}

                    </div>

                </div>

            </section>
        </>
    );
}

function ProductCard({
                         sanPham,
                         index,
                         xemSanPham,
                         themVaoGio,
                     }) {
    return (
        <div className="product-card">

            <div
                className="product-image"
                onClick={() => xemSanPham(sanPham)}
            >

                <img
                    src={
                        sanPham.hinhAnh ||
                        "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85"
                    }
                    alt={sanPham.tenSanPham}
                />

                <span className="discount">
          -{10 + (index % 5) * 2}%
        </span>

                <button
                    className="favorite"
                    onClick={(e) => e.stopPropagation()}
                >
                    ♡
                </button>

            </div>

            <div className="product-content">

                <div className="product-brand">
                    {sanPham.thuongHieu?.tenThuongHieu ||
                        "FShop"}
                </div>

                <h3>
                    {sanPham.tenSanPham}
                </h3>

                <div className="rating">
                    <span>★</span>
                    4.{6 + (index % 4)}
                    <small>
                        ({20 + index * 13})
                    </small>
                </div>

                <div className="price-row">

                    <strong>
                        {formatGia(sanPham.chiTiets?.[0]?.giaBan)}
                    </strong>

                </div>

                <div className="product-buttons">

                    <button
                        className="add-cart"
                        onClick={() =>
                            themVaoGio(
                                sanPham,
                                sanPham.chiTiets?.[0]
                            )
                        }
                    >
                        🛒 Thêm vào giỏ
                    </button>

                    <button
                        className="detail-button"
                        onClick={() =>
                            xemSanPham(sanPham)
                        }
                    >
                        Xem
                    </button>

                </div>

            </div>

        </div>
    );
}

function ProductList({
                         sanPhams,
                         loading,
                         search,
                         setSearch,
                         xemSanPham,
                         themVaoGio,
                     }) {
    const [brand, setBrand] = useState("Tất cả");
    const [sort, setSort] = useState("default");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    let products = sanPhams.filter((sp) => {

        const keyword =
            sp.tenSanPham
                ?.toLowerCase()
                .includes(search.toLowerCase());

        const productBrand =
            sp.thuongHieu?.tenThuongHieu ||
            "";

        const brandMatch =
            brand === "Tất cả" ||
            productBrand === brand;

        const price =
            Number(sp.giaBan || 0);

        const minMatch =
            !minPrice ||
            price >= Number(minPrice);

        const maxMatch =
            !maxPrice ||
            price <= Number(maxPrice);

        return (
            keyword &&
            brandMatch &&
            minMatch &&
            maxMatch
        );
    });

    if (sort === "priceAsc") {
        products = [...products].sort(
            (a, b) =>
                Number(a.giaBan || 0) -
                Number(b.giaBan || 0)
        );
    }

    if (sort === "priceDesc") {
        products = [...products].sort(
            (a, b) =>
                Number(b.giaBan || 0) -
                Number(a.giaBan || 0)
        );
    }

    return (
        <main className="product-list-page">

            <div className="container">

                <div className="breadcrumb">
                    Trang chủ / Sản phẩm
                </div>

                <div className="product-list-heading">

                    <div>
            <span className="section-label">
              FSHOP
            </span>

                        <h1>
                            Giày nam
                        </h1>

                        <p>
                            {products.length} sản phẩm
                        </p>
                    </div>

                </div>

                <div className="product-layout">

                    {/* FILTER */}

                    <aside className="filter-sidebar">

                        <h3>
                            Bộ lọc
                        </h3>

                        <div className="filter-group">

                            <h4>
                                Thương hiệu
                            </h4>

                            <label>
                                <input
                                    type="radio"
                                    checked={brand === "Tất cả"}
                                    onChange={() =>
                                        setBrand("Tất cả")
                                    }
                                />
                                Tất cả
                            </label>

                            {thuongHieu.map((item) => (

                                <label key={item}>

                                    <input
                                        type="radio"
                                        checked={brand === item}
                                        onChange={() =>
                                            setBrand(item)
                                        }
                                    />

                                    {item}

                                </label>

                            ))}

                        </div>

                        <div className="filter-group">

                            <h4>
                                Khoảng giá
                            </h4>

                            <input
                                className="price-input"
                                type="number"
                                placeholder="Giá từ"
                                value={minPrice}
                                onChange={(e) =>
                                    setMinPrice(e.target.value)
                                }
                            />

                            <input
                                className="price-input"
                                type="number"
                                placeholder="Giá đến"
                                value={maxPrice}
                                onChange={(e) =>
                                    setMaxPrice(e.target.value)
                                }
                            />

                        </div>

                    </aside>

                    {/* PRODUCT */}

                    <section className="product-result">

                        <div className="product-toolbar">

                            <div className="search-result-box">

                                <input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Tìm kiếm sản phẩm..."
                                />

                                <span>
                  🔍
                </span>

                            </div>

                            <select
                                value={sort}
                                onChange={(e) =>
                                    setSort(e.target.value)
                                }
                            >
                                <option value="default">
                                    Sắp xếp
                                </option>

                                <option value="priceAsc">
                                    Giá thấp → cao
                                </option>

                                <option value="priceDesc">
                                    Giá cao → thấp
                                </option>
                            </select>

                        </div>

                        {loading ? (
                            <Loading />
                        ) : products.length === 0 ? (

                            <div className="no-result">
                                <div>🔍</div>
                                <h3>
                                    Không tìm thấy sản phẩm
                                </h3>
                                <p>
                                    Hãy thử từ khóa hoặc bộ lọc khác.
                                </p>
                            </div>

                        ) : (

                            <div className="product-grid list-grid">

                                {products.map((sp, index) => (

                                    <ProductCard
                                        key={sp.id}
                                        sanPham={sp}
                                        index={index}
                                        xemSanPham={xemSanPham}
                                        themVaoGio={themVaoGio}
                                    />

                                ))}

                            </div>

                        )}

                    </section>

                </div>

            </div>

        </main>
    );
}

function ProductDetail({
                           sanPham,
                           themVaoGio,
                           setPage,
                       }) {
    const chiTiets = sanPham.chiTiets || [];

    const [selectedVariant, setSelectedVariant] =
        useState(chiTiets[0] || null);

    const [soLuong, setSoLuong] = useState(1);

    const [anh, setAnh] = useState(
        sanPham.hinhAnh ||
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85"
    );

    const sizes = [
        ...new Set(
            chiTiets
                .map((item) => item.kichCo?.tenKichCo)
                .filter(Boolean)
        ),
    ];

    const colors = [
        ...new Set(
            chiTiets
                .map((item) => item.mauSac?.tenMau)
                .filter(Boolean)
        ),
    ];

    const gia =
        selectedVariant?.giaBan ||
        sanPham.giaBan ||
        0;

    const stock =
        selectedVariant?.soLuongTon ?? 0;

    return (
        <main className="detail-page">

            <div className="container">

                <div className="breadcrumb">
                    Trang chủ / Sản phẩm /{" "}
                    {sanPham.tenSanPham}
                </div>

                <div className="detail-layout">

                    {/* IMAGE */}

                    <div className="detail-gallery">

                        <div className="detail-main-image">

                            <img
                                src={anh}
                                alt={sanPham.tenSanPham}
                            />

                            <span className="detail-sale">
                -20%
              </span>

                        </div>

                        <div className="detail-thumbnails">

                            <button
                                className="thumbnail active"
                                onClick={() =>
                                    setAnh(
                                        sanPham.hinhAnh ||
                                        "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85"
                                    )
                                }
                            >
                                <img
                                    src={
                                        sanPham.hinhAnh ||
                                        "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=300&q=80"
                                    }
                                    alt=""
                                />
                            </button>

                        </div>

                    </div>

                    {/* INFO */}

                    <div className="detail-info">

                        <div className="detail-brand">
                            {sanPham.thuongHieu?.tenThuongHieu ||
                                "FSHOP"}
                        </div>

                        <h1>
                            {sanPham.tenSanPham}
                        </h1>

                        <div className="detail-rating">
                            <span>★</span>
                            4.8
                            <span className="rating-count">
                (126 đánh giá)
              </span>
                        </div>

                        <div className="detail-price">
                            {formatGia(gia)}
                        </div>

                        <div className="detail-old-price">
                            {gia
                                ? formatGia(Number(gia) * 1.2)
                                : ""}
                        </div>

                        <div className="detail-line"></div>

                        {sizes.length > 0 && (
                            <div className="option-group">

                                <div className="option-title">
                                    Kích thước
                                    <span>
                    Chọn size
                  </span>
                                </div>

                                <div className="size-list">

                                    {sizes.map((size) => {

                                        const variant =
                                            chiTiets.find(
                                                (item) =>
                                                    item.kichCo?.tenKichCo ===
                                                    size
                                            );

                                        const active =
                                            selectedVariant?.id ===
                                            variant?.id;

                                        return (
                                            <button
                                                key={size}
                                                className={
                                                    active
                                                        ? "size-button selected"
                                                        : "size-button"
                                                }
                                                onClick={() =>
                                                    setSelectedVariant(
                                                        variant
                                                    )
                                                }
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}

                                </div>

                            </div>
                        )}

                        {colors.length > 0 && (
                            <div className="option-group">

                                <div className="option-title">
                                    Màu sắc
                                    <span>
                    {selectedVariant?.mauSac
                        ?.tenMau || "Chọn màu"}
                  </span>
                                </div>

                                <div className="color-list">

                                    {colors.map((color) => {

                                        const variant =
                                            chiTiets.find(
                                                (item) =>
                                                    item.mauSac?.tenMau ===
                                                    color
                                            );

                                        const active =
                                            selectedVariant?.id ===
                                            variant?.id;

                                        return (
                                            <button
                                                key={color}
                                                className={
                                                    active
                                                        ? "color-button selected"
                                                        : "color-button"
                                                }
                                                onClick={() =>
                                                    setSelectedVariant(
                                                        variant
                                                    )
                                                }
                                            >
                                                {color}
                                            </button>
                                        );
                                    })}

                                </div>

                            </div>
                        )}

                        <div className="stock">
                            {selectedVariant
                                ? `Còn ${stock} sản phẩm`
                                : "Vui lòng chọn sản phẩm"}
                        </div>

                        <div className="quantity-row">

                            <div className="quantity-control">

                                <button
                                    onClick={() =>
                                        setSoLuong(
                                            Math.max(1, soLuong - 1)
                                        )
                                    }
                                >
                                    −
                                </button>

                                <span>
                  {soLuong}
                </span>

                                <button
                                    onClick={() =>
                                        setSoLuong(soLuong + 1)
                                    }
                                >
                                    +
                                </button>

                            </div>

                            <span className="quantity-label">
                Số lượng
              </span>

                        </div>

                        <div className="detail-buttons">

                            <button
                                className="detail-add-cart"
                                onClick={() => {
                                    themVaoGio(
                                        sanPham,
                                        selectedVariant,
                                        soLuong
                                    );
                                }}
                            >
                                🛒 Thêm vào giỏ
                            </button>

                            <button
                                className="detail-buy"
                                onClick={() => {
                                    themVaoGio(
                                        sanPham,
                                        selectedVariant,
                                        soLuong
                                    );

                                    setPage("cart");
                                }}
                            >
                                Mua ngay
                            </button>

                        </div>

                        <div className="detail-guarantees">

                            <div>
                                🚚
                                <span>
                  Giao hàng toàn quốc
                </span>
                            </div>

                            <div>
                                ↻
                                <span>
                  Đổi trả trong 7 ngày
                </span>
                            </div>

                            <div>
                                ✓
                                <span>
                  Kiểm tra hàng trước khi nhận
                </span>
                            </div>

                        </div>

                    </div>

                </div>

                <div className="detail-description">

                    <div className="description-tabs">
                        <button className="active">
                            Mô tả sản phẩm
                        </button>

                        <button>
                            Thông tin sản phẩm
                        </button>

                        <button>
                            Đánh giá
                        </button>
                    </div>

                    <div className="description-content">

                        <h2>
                            {sanPham.tenSanPham}
                        </h2>

                        <p>
                            {sanPham.moTa ||
                                "Sản phẩm giày nam được thiết kế theo phong cách hiện đại, phù hợp sử dụng hàng ngày, đi làm, đi chơi và luyện tập thể thao."}
                        </p>

                        <div className="specifications">

                            <div>
                                <span>Chất liệu</span>
                                <strong>
                                    {sanPham.chatLieu ||
                                        "Đang cập nhật"}
                                </strong>
                            </div>

                            <div>
                                <span>Kiểu dáng</span>
                                <strong>
                                    {sanPham.kieuDang ||
                                        "Đang cập nhật"}
                                </strong>
                            </div>

                            <div>
                                <span>Xuất xứ</span>
                                <strong>
                                    {sanPham.xuatXu ||
                                        "Đang cập nhật"}
                                </strong>
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </main>
    );
}

function Cart({
                  gioHang,
                  tongTien,
                  tangSoLuong,
                  giamSoLuong,
                  xoaKhoiGio,
                  setPage,
              }) {
    const phiVanChuyen = 0;

    const tongThanhToan =
        tongTien + phiVanChuyen;

    return (
        <main className="cart-page">

            <div className="container">

                <div className="breadcrumb">
                    Trang chủ / Giỏ hàng
                </div>

                <div className="cart-title">

          <span className="section-label">
            FSHOP
          </span>

                    <h1>
                        Giỏ hàng
                    </h1>

                    <p>
                        {gioHang.length} sản phẩm
                    </p>

                </div>

                {gioHang.length === 0 ? (

                    <div className="empty-cart">

                        <div className="empty-cart-icon">
                            🛒
                        </div>

                        <h2>
                            Giỏ hàng đang trống
                        </h2>

                        <p>
                            Hãy khám phá những mẫu giày nam
                            mới nhất của FShop.
                        </p>

                        <button
                            onClick={() => setPage("products")}
                        >
                            Tiếp tục mua hàng →
                        </button>

                    </div>

                ) : (

                    <div className="cart-layout">

                        <div className="cart-items">

                            <div className="cart-table-head">
                                <span>Sản phẩm</span>
                                <span>Đơn giá</span>
                                <span>Số lượng</span>
                                <span>Thành tiền</span>
                            </div>

                            {gioHang.map((item) => {

                                const gia =
                                    item.chiTiet?.giaBan ||
                                    item.sanPham?.giaBan ||
                                    0;

                                return (
                                    <div
                                        className="cart-item-row"
                                        key={item.variantId}
                                    >

                                        <div className="cart-product">

                                            <img
                                                src={
                                                    item.sanPham.hinhAnh ||
                                                    "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80"
                                                }
                                                alt={item.sanPham.tenSanPham}
                                            />

                                            <div>

                                                <strong>
                                                    {item.sanPham.tenSanPham}
                                                </strong>

                                                {item.chiTiet?.kichCo && (
                                                    <small>
                                                        Size:{" "}
                                                        {item.chiTiet.kichCo.tenKichCo}
                                                    </small>
                                                )}

                                                {item.chiTiet?.mauSac && (
                                                    <small>
                                                        Màu:{" "}
                                                        {item.chiTiet.mauSac.tenMau}
                                                    </small>
                                                )}

                                                <button
                                                    className="remove-cart"
                                                    onClick={() =>
                                                        xoaKhoiGio(
                                                            item.variantId
                                                        )
                                                    }
                                                >
                                                    Xóa
                                                </button>

                                            </div>

                                        </div>

                                        <div className="cart-price">
                                            {formatGia(gia)}
                                        </div>

                                        <div className="cart-quantity">

                                            <button
                                                onClick={() =>
                                                    giamSoLuong(
                                                        item.variantId
                                                    )
                                                }
                                            >
                                                −
                                            </button>

                                            <span>
                        {item.soLuong}
                      </span>

                                            <button
                                                onClick={() =>
                                                    tangSoLuong(
                                                        item.variantId
                                                    )
                                                }
                                            >
                                                +
                                            </button>

                                        </div>

                                        <strong className="cart-total">
                                            {formatGia(
                                                Number(gia) *
                                                item.soLuong
                                            )}
                                        </strong>

                                    </div>
                                );
                            })}

                            <button
                                className="continue-shopping"
                                onClick={() => setPage("products")}
                            >
                                ← Tiếp tục mua hàng
                            </button>

                        </div>

                        <aside className="cart-summary">

                            <h2>
                                Tóm tắt đơn hàng
                            </h2>

                            <div className="summary-line">
                                <span>Tạm tính</span>

                                <strong>
                                    {formatGia(tongTien)}
                                </strong>
                            </div>

                            <div className="summary-line">
                                <span>Phí vận chuyển</span>

                                <strong>
                                    {phiVanChuyen === 0
                                        ? "Miễn phí"
                                        : formatGia(phiVanChuyen)}
                                </strong>
                            </div>

                            <div className="summary-divider"></div>

                            <div className="summary-total">
                <span>
                  Tổng thanh toán
                </span>

                                <strong>
                                    {formatGia(tongThanhToan)}
                                </strong>
                            </div>

                            <div className="free-ship-message">
                                {tongTien < 500000
                                    ? `Mua thêm ${formatGia(
                                        500000 - tongTien
                                    )} để được miễn phí vận chuyển`
                                    : "🎉 Bạn được miễn phí vận chuyển"}
                            </div>

                            <button
                                className="checkout-button"
                                onClick={() => setPage("checkout")}
                            >
                                Tiến hành đặt hàng →
                            </button>

                            <div className="payment-note">
                                🔒 Thanh toán an toàn và bảo mật
                            </div>

                        </aside>

                    </div>

                )}

            </div>

        </main>
    );
}

function Checkout({
                      gioHang,
                      tongTien,
                      setPage,
                      setGioHang,
                  }) {
    const [hoTen, setHoTen] = useState("");
    const [soDienThoai, setSoDienThoai] = useState("");
    const [diaChi, setDiaChi] = useState("");
    const [ghiChu, setGhiChu] = useState("");
    const [phuongThuc, setPhuongThuc] = useState("TIEN_MAT");
    const [dangDatHang, setDangDatHang] = useState(false);
    const [bill, setBill] = useState(null);

    const datHang = async () => {
        if (!gioHang || gioHang.length === 0) {
            alert("Giỏ hàng đang trống");
            setPage("cart");
            return;
        }

        if (!hoTen.trim()) {
            alert("Vui lòng nhập họ và tên");
            return;
        }

        if (!soDienThoai.trim()) {
            alert("Vui lòng nhập số điện thoại");
            return;
        }

        if (!/^0\d{9}$/.test(soDienThoai.trim())) {
            alert("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0");
            return;
        }

        if (!diaChi.trim()) {
            alert("Vui lòng nhập địa chỉ nhận hàng");
            return;
        }

        if (dangDatHang) return;

        const itemsForBill = gioHang.map((item) => ({
            ...item,
            sanPham: { ...item.sanPham },
            chiTiet: item.chiTiet ? { ...item.chiTiet } : null,
        }));

// ID giỏ hàng backend đang sử dụng
        const gioHangId = 2;

        try {
            setDangDatHang(true);

            const cartDetailResponse = await fetch(
                `${API}/gio-hang/${gioHangId}/chi-tiet`
            );

            if (!cartDetailResponse.ok) {
                const errorText = await cartDetailResponse.text();
                throw new Error(
                    errorText || "Không lấy được giỏ hàng trên hệ thống"
                );
            }

            const cartDetails = await cartDetailResponse.json();

            // Xóa toàn bộ chi tiết cũ để không bị trộn với đơn mới.
            for (const detail of Array.isArray(cartDetails) ? cartDetails : []) {
                const deleteResponse = await fetch(
                    `${API}/gio-hang/chi-tiet/${detail.id}`,
                    { method: "DELETE" }
                );

                if (!deleteResponse.ok) {
                    throw new Error(
                        `Không thể làm sạch sản phẩm cũ trong giỏ hàng (ID ${detail.id})`
                    );
                }
            }

            for (const item of itemsForBill) {
                if (!item.chiTiet?.id) {
                    throw new Error(
                        `Sản phẩm "${item.sanPham?.tenSanPham || "không xác định"}" chưa có biến thể`
                    );
                }

                const addResponse = await fetch(
                    `${API}/gio-hang/chi-tiet`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            gioHang: { id: gioHangId },
                            sanPhamChiTiet: { id: item.chiTiet.id },
                            soLuong: item.soLuong,
                        }),
                    }
                );

                const addText = await addResponse.text();
                let addData = null;

                try {
                    addData = addText ? JSON.parse(addText) : null;
                } catch {
                    addData = null;
                }

                if (!addResponse.ok) {
                    throw new Error(
                        addData?.message ||
                        addData?.error ||
                        addText ||
                        `Không thể thêm ${item.sanPham?.tenSanPham || "sản phẩm"} vào giỏ hàng`
                    );
                }
            }

            const response = await fetch(
                `${API}/hoa-don/dat-hang/${gioHangId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        hoTen: hoTen.trim(),
                        soDienThoai: soDienThoai.trim(),
                        diaChi: diaChi.trim(),
                        ghiChu: ghiChu.trim(),
                        phuongThuc,
                        voucherId: null,
                    }),
                }
            );

            const responseText = await response.text();
            let data = null;

            try {
                data = responseText ? JSON.parse(responseText) : null;
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    responseText ||
                    "Không thể đặt hàng"
                );
            }

            const maHoaDon =
                data?.maHoaDon ||
                data?.id ||
                data?.hoaDon?.maHoaDon ||
                data?.hoaDon?.id ||
                `FS-${Date.now()}`;

            const tongThanhToanBackend =
                data?.tongThanhToan ??
                data?.tongTienThanhToan ??
                data?.tongTien ??
                data?.hoaDon?.tongThanhToan ??
                data?.hoaDon?.tongTienThanhToan ??
                data?.hoaDon?.tongTien;

            setBill({
                maHoaDon,
                ngayDat: new Date().toLocaleString("vi-VN"),
                hoTen: hoTen.trim(),
                soDienThoai: soDienThoai.trim(),
                diaChi: diaChi.trim(),
                ghiChu: ghiChu.trim(),
                phuongThuc,
                items: itemsForBill,
                tamTinh: tongTien,
                tongThanhToan: Number.isFinite(Number(tongThanhToanBackend))
                    ? Number(tongThanhToanBackend)
                    : tongTien,
            });

            setGioHang([]);
        } catch (error) {
            console.error("Lỗi đặt hàng:", error);
            alert(error.message || "Có lỗi xảy ra khi đặt hàng");
        } finally {
            setDangDatHang(false);
        }
    };

    if (bill) {
        return (
            <main className="cart-page">
                <div className="container">
                    <div
                        className="bill-card"
                        style={{
                            maxWidth: "900px",
                            margin: "20px auto",
                            padding: "35px",
                            background: "#fff",
                            border: "1px solid #e5e5e5",
                            borderRadius: "10px",
                            boxShadow: "0 10px 35px rgba(0,0,0,.06)",
                        }}
                    >
                        <div style={{ textAlign: "center", marginBottom: "28px" }}>
                            <div
                                style={{
                                    width: "58px",
                                    height: "58px",
                                    margin: "0 auto 14px",
                                    borderRadius: "50%",
                                    background: "#eaf7ed",
                                    color: "#24833b",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "30px",
                                    fontWeight: 700,
                                }}
                            >
                                ✓
                            </div>
                            <span className="section-label">FSHOP</span>
                            <h1 style={{ margin: "8px 0", fontSize: "30px" }}>
                                Đặt hàng thành công!
                            </h1>
                            <p style={{ color: "#777", margin: 0 }}>
                                Cảm ơn bạn đã mua hàng. Đây là hóa đơn của bạn.
                            </p>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "14px",
                                padding: "18px",
                                background: "#fafafa",
                                borderRadius: "6px",
                                marginBottom: "25px",
                                fontSize: "13px",
                            }}
                        >
                            <div>
                                <span style={{ color: "#888", display: "block", marginBottom: "5px" }}>
                                    Mã hóa đơn
                                </span>
                                <strong>{bill.maHoaDon}</strong>
                            </div>
                            <div>
                                <span style={{ color: "#888", display: "block", marginBottom: "5px" }}>
                                    Ngày đặt
                                </span>
                                <strong>{bill.ngayDat}</strong>
                            </div>
                            <div>
                                <span style={{ color: "#888", display: "block", marginBottom: "5px" }}>
                                    Phương thức thanh toán
                                </span>
                                <strong>
                                    {bill.phuongThuc === "CHUYEN_KHOAN"
                                        ? "Chuyển khoản"
                                        : "Tiền mặt khi nhận hàng"}
                                </strong>
                            </div>
                        </div>

                        <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>
                            Thông tin nhận hàng
                        </h2>
                        <div style={{ lineHeight: 1.8, fontSize: "13px", marginBottom: "25px" }}>
                            <div><strong>Người nhận:</strong> {bill.hoTen}</div>
                            <div><strong>Số điện thoại:</strong> {bill.soDienThoai}</div>
                            <div><strong>Địa chỉ:</strong> {bill.diaChi}</div>
                            {bill.ghiChu && <div><strong>Ghi chú:</strong> {bill.ghiChu}</div>}
                        </div>

                        <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>
                            Chi tiết hóa đơn
                        </h2>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                <tr style={{ background: "#f7f7f7", textAlign: "left" }}>
                                    <th style={{ padding: "13px 10px" }}>Sản phẩm</th>
                                    <th style={{ padding: "13px 10px" }}>Đơn giá</th>
                                    <th style={{ padding: "13px 10px", textAlign: "center" }}>SL</th>
                                    <th style={{ padding: "13px 10px", textAlign: "right" }}>Thành tiền</th>
                                </tr>
                                </thead>
                                <tbody>
                                {bill.items.map((item, index) => {
                                    const donGia = Number(
                                        item.chiTiet?.giaBan ?? item.sanPham?.giaBan ?? 0
                                    );
                                    const thanhTien = donGia * Number(item.soLuong || 0);
                                    return (
                                        <tr key={`${item.variantId}-${index}`}>
                                            <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee" }}>
                                                <strong>{item.sanPham?.tenSanPham || "Sản phẩm"}</strong>
                                                <div style={{ color: "#888", fontSize: "11px", marginTop: "5px" }}>
                                                    {item.chiTiet?.kichCo?.tenKichCo
                                                        ? `Size: ${item.chiTiet.kichCo.tenKichCo}`
                                                        : ""}
                                                    {item.chiTiet?.mauSac?.tenMau
                                                        ? ` · Màu: ${item.chiTiet.mauSac.tenMau}`
                                                        : ""}
                                                </div>
                                            </td>
                                            <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>
                                                {formatGia(donGia)}
                                            </td>
                                            <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                                                {item.soLuong}
                                            </td>
                                            <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee", textAlign: "right", whiteSpace: "nowrap", color: "#e53935", fontWeight: 700 }}>
                                                {formatGia(thanhTien)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ maxWidth: "360px", margin: "22px 0 0 auto" }}>
                            <div className="summary-line">
                                <span>Tạm tính</span>
                                <strong>{formatGia(bill.tamTinh)}</strong>
                            </div>
                            <div className="summary-line">
                                <span>Phí vận chuyển</span>
                                <strong>Miễn phí</strong>
                            </div>
                            <div className="summary-divider" />
                            <div className="summary-total">
                                <span>Tổng thanh toán</span>
                                <strong>{formatGia(bill.tongThanhToan)}</strong>
                            </div>
                        </div>

                        <div
                            className="bill-actions"
                            style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "30px" }}
                        >
                            <button
                                className="checkout-button"
                                style={{ width: "auto", minWidth: "180px", padding: "0 22px" }}
                                onClick={() => window.print()}
                            >
                                In hóa đơn / Lưu PDF
                            </button>
                            <button
                                className="continue-shopping"
                                style={{ marginTop: 0, border: "1px solid #ddd", borderRadius: "4px", padding: "0 22px", minHeight: "48px" }}
                                onClick={() => setPage("home")}
                            >
                                Tiếp tục mua hàng
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (!gioHang || gioHang.length === 0) {
        return (
            <main className="cart-page">
                <div className="container">
                    <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <h2>Giỏ hàng đang trống</h2>
                        <p>Hãy thêm sản phẩm trước khi đặt hàng.</p>
                        <button onClick={() => setPage("products")}>
                            Tiếp tục mua hàng →
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="cart-page">
            <div className="container">
                <div className="breadcrumb">Trang chủ / Giỏ hàng / Đặt hàng</div>

                <div className="cart-title">
                    <span className="section-label">FSHOP</span>
                    <h1>Đặt hàng</h1>
                    <p>Nhập thông tin nhận hàng để hoàn tất đơn.</p>
                </div>

                <div className="cart-layout">
                    <div className="cart-items">
                        <h2 style={{ marginTop: 0 }}>Thông tin nhận hàng</h2>
                        <div style={{ display: "grid", gap: "16px", marginTop: "25px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                                    Họ và tên <span style={{ color: "#e53935" }}>*</span>
                                </label>
                                <input
                                    className="price-input"
                                    type="text"
                                    value={hoTen}
                                    onChange={(e) => setHoTen(e.target.value)}
                                    placeholder="Nhập họ và tên"
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                                    Số điện thoại <span style={{ color: "#e53935" }}>*</span>
                                </label>
                                <input
                                    className="price-input"
                                    type="tel"
                                    value={soDienThoai}
                                    onChange={(e) => setSoDienThoai(e.target.value)}
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                                    Địa chỉ nhận hàng <span style={{ color: "#e53935" }}>*</span>
                                </label>
                                <textarea
                                    className="price-input"
                                    value={diaChi}
                                    onChange={(e) => setDiaChi(e.target.value)}
                                    placeholder="Nhập địa chỉ nhận hàng"
                                    style={{ minHeight: "90px", paddingTop: "10px", resize: "vertical" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                                    Phương thức thanh toán
                                </label>
                                <select
                                    className="price-input"
                                    value={phuongThuc}
                                    onChange={(e) => setPhuongThuc(e.target.value)}
                                >
                                    <option value="TIEN_MAT">Tiền mặt khi nhận hàng</option>
                                    <option value="CHUYEN_KHOAN">Chuyển khoản</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                                    Ghi chú
                                </label>
                                <textarea
                                    className="price-input"
                                    value={ghiChu}
                                    onChange={(e) => setGhiChu(e.target.value)}
                                    placeholder="Ví dụ: Giao giờ hành chính..."
                                    style={{ minHeight: "90px", paddingTop: "10px", resize: "vertical" }}
                                />
                            </div>
                        </div>
                    </div>

                    <aside className="cart-summary">
                        <h2>Tóm tắt đơn hàng</h2>
                        <div className="summary-line">
                            <span>Số sản phẩm</span>
                            <strong>{gioHang.reduce((total, item) => total + item.soLuong, 0)}</strong>
                        </div>
                        <div className="summary-line">
                            <span>Tạm tính</span>
                            <strong>{formatGia(tongTien)}</strong>
                        </div>
                        <div className="summary-line">
                            <span>Phí vận chuyển</span>
                            <strong>Miễn phí</strong>
                        </div>
                        <div className="summary-divider" />
                        <div className="summary-total">
                            <span>Tổng thanh toán</span>
                            <strong>{formatGia(tongTien)}</strong>
                        </div>

                        <button
                            className="checkout-button"
                            onClick={datHang}
                            disabled={dangDatHang}
                            style={{ opacity: dangDatHang ? 0.6 : 1, cursor: dangDatHang ? "not-allowed" : "pointer" }}
                        >
                            {dangDatHang ? "Đang xử lý..." : "Xác nhận đặt hàng →"}
                        </button>

                        <button
                            className="continue-shopping"
                            onClick={() => setPage("cart")}
                            disabled={dangDatHang}
                            style={{ marginTop: "15px" }}
                        >
                            ← Quay lại giỏ hàng
                        </button>

                        <div className="payment-note">🔒 Thanh toán an toàn và bảo mật</div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

function Loading() {
    return (
        <div className="loading">
            <div className="loading-spinner"></div>
            <p>Đang tải sản phẩm...</p>
        </div>
    );
}

function Footer() {
    return (
        <footer className="footer">

            <div className="container footer-grid">

                <div className="footer-company">

                    <div className="footer-logo">

                        <div className="logo-box">
                            F
                        </div>

                        <div>
                            <div className="logo-name">
                                FShop
                            </div>

                            <div className="logo-sub">
                                Giày nam chính hãng
                            </div>
                        </div>

                    </div>

                    <p>
                        FShop - Shop giày nam uy tín,
                        chất lượng, giá tốt. Đồng hành
                        cùng phong cách của bạn.
                    </p>

                    <div className="socials">
                        <span>f</span>
                        <span>◎</span>
                        <span>▶</span>
                        <span>♪</span>
                    </div>

                </div>

                <div className="footer-column">

                    <h4>VỀ FSHOP</h4>

                    <a>Giới thiệu</a>
                    <a>Chính sách mua hàng</a>
                    <a>Chính sách đổi trả</a>
                    <a>Liên hệ</a>

                </div>

                <div className="footer-column">

                    <h4>HỖ TRỢ</h4>

                    <a>Hướng dẫn mua hàng</a>
                    <a>Thanh toán</a>
                    <a>Vận chuyển</a>
                    <a>Bảo hành</a>

                </div>

                <div className="footer-column">

                    <h4>LIÊN HỆ</h4>

                    <p>☎ 0123 456 789</p>
                    <p>✉ support@fshop.vn</p>
                    <p>📍 Việt Nam</p>

                </div>

                <div className="footer-column newsletter">

                    <h4>ĐĂNG KÝ NHẬN TIN</h4>

                    <p>
                        Nhận thông tin khuyến mãi mới nhất
                    </p>

                    <div className="newsletter-box">

                        <input
                            type="email"
                            placeholder="Nhập email của bạn"
                        />

                        <button>
                            →
                        </button>

                    </div>

                </div>

            </div>

            <div className="footer-bottom">

                <div className="container footer-bottom-inner">

          <span>
            © 2026 FShop. All rights reserved.
          </span>

                    <span>
            Thanh toán: VISA · MASTER · NAPAS
          </span>

                </div>

            </div>

        </footer>
    );
}

export default App;
