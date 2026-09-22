import { useEffect, useState } from "react";
import "./App.css";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";

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
        ten: "Giày bóng đá",
        moTa: "Thi đấu và luyện tập",
        anh: "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=900&q=85",
    },
    {
        ten: "Giày casual",
        moTa: "Lịch lãm, đơn giản",
        anh: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=900&q=85",
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
    "PUMA",
    "Biti's",
    "Converse",
    "New Balance",
    "Skechers",
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

function formatGia(gia) {
    if (gia === null || gia === undefined) {
        return "Liên hệ";
    }

    return Number(gia).toLocaleString("vi-VN") + "đ";
}

function App() {
    const [page, setPage] = useState("home");

    const [sanPhams, setSanPhams] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [selectedProduct, setSelectedProduct] = useState(null);

    const [gioHang, setGioHang] = useState([]);

    const [toast, setToast] = useState("");

    useEffect(() => {
        taiSanPham();
    }, []);

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
        const variantId = chiTiet?.id || `product-${sanPham.id}`;

        setGioHang((oldCart) => {
            const existing = oldCart.find(
                (item) => item.variantId === variantId
            );

            if (existing) {
                return oldCart.map((item) =>
                    item.variantId === variantId
                        ? {
                            ...item,
                            soLuong: item.soLuong + soLuong,
                        }
                        : item
                );
            }

            return [
                ...oldCart,
                {
                    variantId,
                    sanPham,
                    chiTiet,
                    soLuong,
                },
            ];
        });

        showToast("Đã thêm sản phẩm vào giỏ hàng");
    };

    const tangSoLuong = (variantId) => {
        setGioHang((oldCart) =>
            oldCart.map((item) =>
                item.variantId === variantId
                    ? {
                        ...item,
                        soLuong: item.soLuong + 1,
                    }
                    : item
            )
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
        return <AdminDashboard />;
    }

    if (page === "nhan-vien") {
        return (
            <EmployeeDashboard
                onBackToShop={() => setPage("home")}
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

/* =========================================================
   HEADER
========================================================= */

function Header({
                    page,
                    setPage,
                    search,
                    setSearch,
                    tongSoLuong,
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

                    <button
                        className="admin-entry-button"
                        onClick={() => setPage("admin")}
                    >
                        Admin
                    </button>

                    <button
                        className="employee-entry-button"
                        onClick={() => setPage("nhan-vien")}
                    >
                        ♙ Nhân viên
                    </button>

                    <div className="header-right">

                        <div className="header-item">
              <span className="header-icon">
                ♙
              </span>

                            <div>
                                <small>Tài khoản</small>
                                <strong>Đăng nhập</strong>
                            </div>
                        </div>

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
    return (
        <>
            <section className="hero">

                <img
                    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=2000&q=90"
                    alt="Giày nam"
                    className="hero-image"
                />

                <div className="hero-overlay"></div>

                <div className="container hero-container">

                    <div className="hero-content">

                        <div className="hero-label">
                            BỘ SƯU TẬP GIÀY NAM 2026
                        </div>

                        <h1>
                            Phong cách
                            <br />
                            cho mọi bước đi
                        </h1>

                        <p>
                            Những mẫu giày nam hiện đại,
                            năng động dành cho mọi hành trình
                            của bạn.
                        </p>

                        <button
                            className="primary-button"
                            onClick={() => setPage("products")}
                        >
                            Mua ngay →
                        </button>

                    </div>

                    <div className="hero-services">

                        {dichVu.slice(0, 3).map((item) => (
                            <div
                                className="hero-service"
                                key={item.title}
                            >
                                <div className="service-icon">
                                    {item.icon}
                                </div>

                                <div>
                                    <strong>{item.title}</strong>
                                    <span>{item.desc}</span>
                                </div>
                            </div>
                        ))}

                    </div>

                </div>

                <div className="hero-dots">
                    <span className="active"></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
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
                                .slice(0, 8)
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
                        {formatGia(sanPham.giaBan)}
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
    const phiVanChuyen =
        tongTien >= 500000 || tongTien === 0
            ? 0
            : 30000;

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

                            <button className="checkout-button">
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