import { useEffect, useState } from "react";
import "./App.css";
import "./Auth.css";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";
import Login from "./Login";
import Register from "./Register";
import KhuyenMai from "./KhuyenMai";

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
        anh: "https://gagliottacalzature.com/cdn/shop/files/airforcebianconeroct_4.jpg?v=1721234744&width=1214",
    },
];

const thuongHieu = [
    "Nike",
    "adidas",
    "Puma Sport",
    "Converse",
];

const ANH_THUONG_HIEU = {
    nike: {
        den: "https://static.nike.com/a/images/t_web_pdp_936_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/d3e09821-478f-4eb6-9597-aed72268365f/NIKE+FLEX+TRAIN.png",
        trang: "https://ash.vn/cdn/shop/files/d92eca3620053ee340820f88c1df2355_1800x.jpg?v=1764240841",
    },
    adidas: {
        den: "https://kallos.co/cdn/shop/products/Black_EG4959_01_standard.jpg?v=1674061906&width=840",
        trang: "https://loadbalancer.dktvnblog.com/blog/wp-content/uploads/2025/07/gia-thanh-cua-giay-auth-chenh-lech-nhieu-so-voi-giay-fake.jpg",
    },
    puma: {
        den: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMR9JB1zJoOlUvuSjHetbioHMvcvZpVJWgwrjAq7VnIQ8_CF0sdyYAWlje&s=10",
        trang: "https://myshoes.vn/image/catalog/2025/puma/puma07/giay-puma-caven-mix-nam-trang-xam-01.jpg",
    },
    converse: {
        den: "https://www.converse.vn/media/catalog/product/0/8/0882-CON162050C000005-1.jpg",
        trang: "https://sneakerholicvietnam.vn/wp-content/uploads/2020/08/converse-chuck-taylor-all-star-move-white-568498c-1.jpg",
    },
};

function layTenThuongHieu(sanPham) {
    return String(
        sanPham?.thuongHieu?.tenThuongHieu ||
        sanPham?.tenThuongHieu ||
        ""
    )
        .trim()
        .toLowerCase();
}

function layAnhTheoMau(sanPham, mau) {
    const tenThuongHieu = layTenThuongHieu(sanPham);
    const mauChuanHoa = String(mau || "").trim().toLowerCase();

    let anhThuongHieu = null;

    if (tenThuongHieu.includes("nike")) {
        anhThuongHieu = ANH_THUONG_HIEU.nike;
    } else if (tenThuongHieu.includes("adidas")) {
        anhThuongHieu = ANH_THUONG_HIEU.adidas;
    } else if (tenThuongHieu.includes("puma")) {
        anhThuongHieu = ANH_THUONG_HIEU.puma;
    } else if (tenThuongHieu.includes("converse")) {
        anhThuongHieu = ANH_THUONG_HIEU.converse;
    }

    if (anhThuongHieu) {
        if (mauChuanHoa.includes("đen") || mauChuanHoa.includes("den") || mauChuanHoa.includes("black")) {
            return anhThuongHieu.den;
        }

        if (mauChuanHoa.includes("trắng") || mauChuanHoa.includes("trang") || mauChuanHoa.includes("white")) {
            return anhThuongHieu.trang;
        }
    }

    return sanPham?.hinhAnh ||
        anhThuongHieu?.den ||
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85";
}

function layAnhSanPham(sanPham) {
    return layAnhTheoMau(
        sanPham,
        sanPham?.chiTiets?.[0]?.mauSac?.tenMau || ""
    );
}


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
        taiKhoanDaLuu ? layTrangTheoVaiTro(taiKhoanDaLuu) : "home"
    );

    const [sanPhams, setSanPhams] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [selectedProduct, setSelectedProduct] = useState(null);

    const [gioHang, setGioHang] = useState([]);
    const [gioHangId, setGioHangId] = useState(null);

    const [toast, setToast] = useState("");

    useEffect(() => {
        taiSanPham();
    }, []);

    const taiGioHang = async (taiKhoanHienTai, danhSachSanPham = sanPhams) => {
        try {
            const khachHangId = taiKhoanHienTai?.khachHangId;

            if (!khachHangId) {
                setGioHangId(null);
                setGioHang([]);
                return null;
            }

            const gioHangResponse = await fetch(
                `${API}/gio-hang/khach-hang/${khachHangId}/lay-hoac-tao`
            );

            if (!gioHangResponse.ok) {
                throw new Error("Không lấy được giỏ hàng");
            }

            const gioHangData = await gioHangResponse.json();
            setGioHangId(gioHangData.id);

            const detailResponse = await fetch(
                `${API}/gio-hang/${gioHangData.id}/chi-tiet`
            );

            if (!detailResponse.ok) {
                throw new Error("Không lấy được chi tiết giỏ hàng");
            }

            const details = await detailResponse.json();

            if (!Array.isArray(details)) {
                setGioHang([]);
                return gioHangData.id;
            }

            const cartFrontend = details
                .map((detail) => {
                    const spct = detail?.sanPhamChiTiet;
                    const sanPham =
                        danhSachSanPham.find(
                            (sp) => sp.id === spct?.sanPham?.id
                        ) ||
                        spct?.sanPham ||
                        null;

                    return {
                        id: detail.id,
                        variantId: spct?.id,
                        sanPham,
                        chiTiet: spct,
                        soLuong: detail.soLuong,
                    };
                })
                .filter((item) => item.variantId && item.sanPham);

            setGioHang(cartFrontend);
            return gioHangData.id;
        } catch (error) {
            console.error("Lỗi tải giỏ hàng:", error);
            setGioHang([]);
            setGioHangId(null);
            return null;
        }
    };

    const xuLyDangNhapThanhCong = async (data) => {
        const vaiTro = String(data?.vaiTro || "").toUpperCase();

        setTaiKhoan(data);
        localStorage.setItem("taiKhoan", JSON.stringify(data));

        if (vaiTro === "QUAN_TRI") {
            setPage("admin");
            return;
        }

        if (vaiTro === "NHAN_VIEN" || vaiTro === "NHÂN_VIÊN") {
            setPage("employee");
            return;
        }

        if (vaiTro === "KHACH_HANG") {
            await taiGioHang(data, sanPhams);
        }

        setPage("home");
    };

    useEffect(() => {
        if (
            taiKhoan &&
            String(taiKhoan.vaiTro || "").toUpperCase() === "KHACH_HANG" &&
            sanPhams.length > 0
        ) {
            taiGioHang(taiKhoan, sanPhams);
        }
    }, [taiKhoan, sanPhams]);

    const dangXuat = () => {
        localStorage.removeItem("taiKhoan");
        setTaiKhoan(null);
        setGioHang([]);
        setPage("home");
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

    const themVaoGio = async (sanPham, chiTiet = null, soLuong = 1) => {
        if (!taiKhoan) {
            setPage("login");
            return false;
        }

        if (String(taiKhoan.vaiTro || "").toUpperCase() !== "KHACH_HANG") {
            alert("Chỉ khách hàng mới có thể thêm sản phẩm vào giỏ");
            return false;
        }

        if (!chiTiet?.id) {
            alert("Sản phẩm chưa có biến thể để mua");
            return false;
        }

        const variantId = chiTiet.id;
        const tonKho = Number(chiTiet.soLuongTon ?? 0);

        if (tonKho <= 0) {
            alert("Sản phẩm đã hết hàng");
            return false;
        }

        let currentGioHangId = gioHangId;

        if (!currentGioHangId) {
            currentGioHangId = await taiGioHang(taiKhoan, sanPhams);
        }

        if (!currentGioHangId) {
            alert("Không thể khởi tạo giỏ hàng");
            return false;
        }

        const soLuongThem = Math.max(1, Number(soLuong) || 1);
        const existing = gioHang.find(
            (item) => item.variantId === variantId
        );

        try {
            if (existing) {
                const soLuongMoi = existing.soLuong + soLuongThem;

                if (soLuongMoi > tonKho) {
                    alert(`Sản phẩm chỉ còn ${tonKho} sản phẩm trong kho`);
                    return false;
                }

                const response = await fetch(
                    `${API}/gio-hang/chi-tiet/${existing.id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            gioHang: { id: currentGioHangId },
                            sanPhamChiTiet: { id: variantId },
                            soLuong: soLuongMoi,
                        }),
                    }
                );

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(text || "Không thể cập nhật giỏ hàng");
                }

                setGioHang((oldCart) =>
                    oldCart.map((item) =>
                        item.variantId === variantId
                            ? { ...item, soLuong: soLuongMoi }
                            : item
                    )
                );

                showToast("Đã cập nhật số lượng");
                return true;
            }

            const soLuongMoi = Math.min(soLuongThem, tonKho);

            const response = await fetch(`${API}/gio-hang/chi-tiet`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    gioHang: { id: currentGioHangId },
                    sanPhamChiTiet: { id: variantId },
                    soLuong: soLuongMoi,
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
                    "Không thể thêm sản phẩm vào giỏ"
                );
            }

            setGioHang((oldCart) => [
                ...oldCart,
                {
                    id: data.id,
                    variantId,
                    sanPham,
                    chiTiet: data.sanPhamChiTiet || chiTiet,
                    soLuong: data.soLuong,
                },
            ]);

            showToast("Đã thêm sản phẩm vào giỏ hàng");
            return true;
        } catch (error) {
            console.error("Lỗi thêm sản phẩm vào giỏ:", error);
            alert(error.message || "Không thể thêm sản phẩm vào giỏ");
            return false;
        }
    };

    const tangSoLuong = async (variantId) => {
        const item = gioHang.find(
            (item) => item.variantId === variantId
        );

        if (!item) return;

        const tonKho = Number(item.chiTiet?.soLuongTon ?? 0);
        const soLuongMoi = item.soLuong + 1;

        if (tonKho > 0 && soLuongMoi > tonKho) {
            alert(`Sản phẩm chỉ còn ${tonKho} sản phẩm trong kho`);
            return;
        }

        try {
            const response = await fetch(
                `${API}/gio-hang/chi-tiet/${item.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        gioHang: { id: gioHangId },
                        sanPhamChiTiet: { id: variantId },
                        soLuong: soLuongMoi,
                    }),
                }
            );

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Không thể tăng số lượng");
            }

            setGioHang((oldCart) =>
                oldCart.map((cartItem) =>
                    cartItem.variantId === variantId
                        ? { ...cartItem, soLuong: soLuongMoi }
                        : cartItem
                )
            );
        } catch (error) {
            console.error("Lỗi tăng số lượng:", error);
            alert(error.message || "Không thể tăng số lượng");
        }
    };

    const giamSoLuong = async (variantId) => {
        const item = gioHang.find(
            (item) => item.variantId === variantId
        );

        if (!item) return;

        if (item.soLuong <= 1) {
            await xoaKhoiGio(variantId);
            return;
        }

        const soLuongMoi = item.soLuong - 1;

        try {
            const response = await fetch(
                `${API}/gio-hang/chi-tiet/${item.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        gioHang: { id: gioHangId },
                        sanPhamChiTiet: { id: variantId },
                        soLuong: soLuongMoi,
                    }),
                }
            );

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Không thể giảm số lượng");
            }

            setGioHang((oldCart) =>
                oldCart.map((cartItem) =>
                    cartItem.variantId === variantId
                        ? { ...cartItem, soLuong: soLuongMoi }
                        : cartItem
                )
            );
        } catch (error) {
            console.error("Lỗi giảm số lượng:", error);
            alert(error.message || "Không thể giảm số lượng");
        }
    };

    const xoaKhoiGio = async (variantId) => {
        const item = gioHang.find(
            (item) => item.variantId === variantId
        );

        if (!item) return;

        try {
            const response = await fetch(
                `${API}/gio-hang/chi-tiet/${item.id}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Không thể xóa sản phẩm khỏi giỏ");
            }

            setGioHang((oldCart) =>
                oldCart.filter(
                    (cartItem) => cartItem.variantId !== variantId
                )
            );

            showToast("Đã xóa sản phẩm khỏi giỏ");
        } catch (error) {
            console.error("Lỗi xóa sản phẩm khỏi giỏ:", error);
            alert(error.message || "Không thể xóa sản phẩm khỏi giỏ");
        }
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
        const vaiTro = String(taiKhoan?.vaiTro || "").toUpperCase();

        if (vaiTro === "QUAN_TRI") {
            return <AdminDashboard dangXuat={dangXuat} />;
        }

        if (vaiTro === "NHAN_VIEN" || vaiTro === "NHÂN_VIÊN") {
            return (
                <EmployeeDashboard
                    taiKhoan={taiKhoan}
                    dangXuat={dangXuat}
                    onBackToShop={() => setPage("home")}
                />
            );
        }

        return (
            <Login
                setPage={setPage}
                onLoginSuccess={xuLyDangNhapThanhCong}
            />
        );
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
                    taiKhoan={taiKhoan}
                />
            )}
            {page === "khuyen-mai" && (
                <KhuyenMai setPage={setPage} />
            )}

            {page === "checkout" && (
                <Checkout
                    gioHang={gioHang}
                    gioHangId={gioHangId}
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

                        {!taiKhoan ? (
                            <div className="header-auth-buttons" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <button
                                    type="button"
                                    className="header-login-button"
                                    style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #111", background: "#fff", color: "#111", fontWeight: 700, cursor: "pointer" }}
                                    onClick={() => setPage("login")}
                                >
                                    Đăng nhập
                                </button>

                                <button
                                    type="button"
                                    className="header-register-button"
                                    style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                                    onClick={() => setPage("register")}
                                >
                                    Đăng ký
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="header-item account-header">
                                    <span className="header-icon">♙</span>
                                    <div>
                                        <small>Tài khoản</small>
                                        <strong>{taiKhoan.tenDangNhap}</strong>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="logout-button"
                                    onClick={dangXuat}
                                >
                                    Đăng xuất
                                </button>
                            </>
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

                    <a
                        className={page === "khuyen-mai" ? "nav-active" : ""}
                        onClick={() => setPage("khuyen-mai")}
                    >
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
                        layAnhSanPham(sanPham)
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

    const firstVariant = chiTiets[0] || null;

    const [selectedSize, setSelectedSize] = useState(
        firstVariant?.kichCo?.tenKichCo || ""
    );

    const [selectedColor, setSelectedColor] = useState(
        firstVariant?.mauSac?.tenMau || ""
    );

    const [soLuong, setSoLuong] = useState(1);

    const [anh, setAnh] = useState(
        layAnhTheoMau(sanPham, firstVariant?.mauSac?.tenMau || "")
    );

    const sizes = [
        ...new Set(
            chiTiets
                .map((item) => item.kichCo?.tenKichCo)
                .filter(Boolean)
        ),
    ].sort((a, b) => Number(a) - Number(b));

    const colors = [
        ...new Set(
            chiTiets
                .map((item) => item.mauSac?.tenMau)
                .filter(Boolean)
        ),
    ];
    const selectedVariant = chiTiets.find(
        (item) =>
            item.kichCo?.tenKichCo === selectedSize &&
            item.mauSac?.tenMau === selectedColor
    ) || null;

    const gia =
        selectedVariant?.giaBan ||
        sanPham.giaBan ||
        0;

    const stock = Number(
        selectedVariant?.soLuongTon ?? 0
    );

    const sizeCoTheChon = (size) => {
        return chiTiets.some(
            (item) =>
                item.kichCo?.tenKichCo === size &&
                item.mauSac?.tenMau === selectedColor
        );
    };

    const mauCoTheChon = (color) => {
        return chiTiets.some(
            (item) =>
                item.mauSac?.tenMau === color &&
                item.kichCo?.tenKichCo === selectedSize
        );
    };

    const chonSize = (size) => {
        const variant = chiTiets.find(
            (item) =>
                item.kichCo?.tenKichCo === size &&
                item.mauSac?.tenMau === selectedColor
        );

        if (variant) {
            setSelectedSize(size);
            setAnh(layAnhTheoMau(sanPham, selectedColor));
            return;
        }

        const variantTheoSize = chiTiets.find(
            (item) => item.kichCo?.tenKichCo === size
        );

        if (variantTheoSize) {
            const mauMoi = variantTheoSize.mauSac?.tenMau || "";
            setSelectedSize(size);
            setSelectedColor(mauMoi);
            setAnh(layAnhTheoMau(sanPham, mauMoi));
        }
    };

    const chonMau = (color) => {
        const variant = chiTiets.find(
            (item) =>
                item.mauSac?.tenMau === color &&
                item.kichCo?.tenKichCo === selectedSize
        );

        if (variant) {
            setSelectedColor(color);
            setAnh(layAnhTheoMau(sanPham, color));
            return;
        }
        const variantTheoMau = chiTiets.find(
            (item) => item.mauSac?.tenMau === color
        );

        if (variantTheoMau) {
            const sizeMoi = variantTheoMau.kichCo?.tenKichCo || "";
            setSelectedColor(color);
            setSelectedSize(sizeMoi);
            setAnh(layAnhTheoMau(sanPham, color));
        }
    };

    return (
        <main className="detail-page">
            <div className="container">

                <div className="breadcrumb">
                    Trang chủ / Sản phẩm / {sanPham.tenSanPham}
                </div>

                <div className="detail-layout">

                    {/* ================= IMAGE ================= */}
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

                        <div
                            className="detail-thumbnails"
                            style={{
                                display: "flex",
                                gap: "8px",
                                alignItems: "center",
                                flexWrap: "nowrap",
                            }}
                        >
                            {/* ẢNH MÀU ĐEN */}
                            <button
                                type="button"
                                className={
                                    selectedColor?.toLowerCase().includes("đen") ||
                                    selectedColor?.toLowerCase().includes("den") ||
                                    selectedColor?.toLowerCase().includes("black")
                                        ? "thumbnail active"
                                        : "thumbnail"
                                }
                                title="Xem màu đen"
                                onClick={() => {
                                    const colorDen = chiTiets.find((item) => {
                                        const color = String(item.mauSac?.tenMau || "").toLowerCase();
                                        return color.includes("đen") || color.includes("den") || color.includes("black");
                                    })?.mauSac?.tenMau || "Đen";

                                    setSelectedColor(colorDen);
                                    setAnh(layAnhTheoMau(sanPham, colorDen));
                                }}
                            >
                                <img
                                    src={layAnhTheoMau(sanPham, "Đen")}
                                    alt={`${sanPham.tenSanPham} màu đen`}
                                />
                            </button>

                            {/* ẢNH MÀU TRẮNG */}
                            <button
                                type="button"
                                className={
                                    selectedColor?.toLowerCase().includes("trắng") ||
                                    selectedColor?.toLowerCase().includes("trang") ||
                                    selectedColor?.toLowerCase().includes("white")
                                        ? "thumbnail active"
                                        : "thumbnail"
                                }
                                title="Xem màu trắng"
                                onClick={() => {
                                    const colorTrang = chiTiets.find((item) => {
                                        const color = String(item.mauSac?.tenMau || "").toLowerCase();
                                        return color.includes("trắng") || color.includes("trang") || color.includes("white");
                                    })?.mauSac?.tenMau || "Trắng";

                                    setSelectedColor(colorTrang);
                                    setAnh(layAnhTheoMau(sanPham, colorTrang));
                                }}
                            >
                                <img
                                    src={layAnhTheoMau(sanPham, "Trắng")}
                                    alt={`${sanPham.tenSanPham} màu trắng`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* ================= INFO ================= */}
                    <div className="detail-info">

                        <div className="detail-brand">
                            {sanPham.thuongHieu?.tenThuongHieu || "FSHOP"}
                        </div>

                        <h1>{sanPham.tenSanPham}</h1>

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

                        {/* ================= SIZE ================= */}
                        {sizes.length > 0 && (
                            <div className="option-group">

                                <div className="option-title">
                                    Kích thước
                                    <span>
                                        {selectedSize || "Chọn size"}
                                    </span>
                                </div>

                                <div className="size-list">

                                    {sizes.map((size) => {
                                        const active =
                                            selectedSize === size;

                                        const disabled =
                                            !sizeCoTheChon(size);

                                        return (
                                            <button
                                                key={size}
                                                type="button"
                                                disabled={disabled}
                                                className={
                                                    active
                                                        ? "size-button selected"
                                                        : "size-button"
                                                }
                                                style={{
                                                    opacity: disabled ? 0.4 : 1,
                                                    cursor: disabled
                                                        ? "not-allowed"
                                                        : "pointer",
                                                }}
                                                onClick={() =>
                                                    chonSize(size)
                                                }
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}

                                </div>
                            </div>
                        )}

                        {/* ================= MÀU ================= */}
                        {colors.length > 0 && (
                            <div className="option-group">

                                <div className="option-title">
                                    Màu sắc
                                    <span>
                                        {selectedColor || "Chọn màu"}
                                    </span>
                                </div>

                                <div className="color-list">

                                    {colors.map((color) => {
                                        const active =
                                            selectedColor === color;

                                        const disabled =
                                            !mauCoTheChon(color);

                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                disabled={disabled}
                                                className={
                                                    active
                                                        ? "color-button selected"
                                                        : "color-button"
                                                }
                                                style={{
                                                    opacity: disabled ? 0.4 : 1,
                                                    cursor: disabled
                                                        ? "not-allowed"
                                                        : "pointer",
                                                }}
                                                onClick={() =>
                                                    chonMau(color)
                                                }
                                            >
                                                {color}
                                            </button>
                                        );
                                    })}

                                </div>
                            </div>
                        )}

                        {/* ================= STOCK ================= */}
                        <div className="stock">
                            {selectedVariant
                                ? stock > 0
                                    ? `Còn ${stock} sản phẩm`
                                    : "Sản phẩm đã hết hàng"
                                : "Vui lòng chọn size và màu"}
                        </div>

                        {/* ================= QUANTITY ================= */}
                        <div className="quantity-row">

                            <div className="quantity-control">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSoLuong(
                                            Math.max(
                                                1,
                                                soLuong - 1
                                            )
                                        )
                                    }
                                >
                                    −
                                </button>

                                <span>{soLuong}</span>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (
                                            selectedVariant &&
                                            stock > 0 &&
                                            soLuong < stock
                                        ) {
                                            setSoLuong(soLuong + 1);
                                        }
                                    }}
                                >
                                    +
                                </button>

                            </div>

                            <span className="quantity-label">
                                Số lượng
                            </span>

                        </div>

                        {/* ================= BUTTON ================= */}
                        <div className="detail-buttons">

                            {/* THÊM GIỎ */}
                            <button
                                type="button"
                                className="detail-add-cart"
                                onClick={async () => {

                                    if (!selectedVariant?.id) {
                                        alert(
                                            "Vui lòng chọn đúng size và màu"
                                        );
                                        return;
                                    }

                                    if (stock <= 0) {
                                        alert(
                                            "Sản phẩm đã hết hàng"
                                        );
                                        return;
                                    }

                                    await themVaoGio(
                                        sanPham,
                                        selectedVariant,
                                        soLuong
                                    );
                                }}
                            >
                                🛒 Thêm vào giỏ
                            </button>

                            {/* MUA NGAY */}
                            <button
                                type="button"
                                className="detail-buy"
                                onClick={async () => {

                                    if (!selectedVariant?.id) {
                                        alert(
                                            "Vui lòng chọn đúng size và màu"
                                        );
                                        return;
                                    }

                                    if (stock <= 0) {
                                        alert(
                                            "Sản phẩm đã hết hàng"
                                        );
                                        return;
                                    }

                                    const daThem =
                                        await themVaoGio(
                                            sanPham,
                                            selectedVariant,
                                            soLuong
                                        );

                                    if (daThem) {
                                        setPage("cart");
                                    }
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
                  taiKhoan,
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
                                                    layAnhTheoMau(
                                                        item.sanPham,
                                                        item.chiTiet?.mauSac?.tenMau
                                                    )
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
                                onClick={() => {
                                    if (!taiKhoan) {
                                        setPage("login");
                                        return;
                                    }
                                    setPage("checkout");
                                }}
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
                      gioHangId,
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

    const [maVoucher, setMaVoucher] = useState("");
    const [voucherInfo, setVoucherInfo] = useState(null);
    const [voucherError, setVoucherError] = useState("");
    const [checkingVoucher, setCheckingVoucher] = useState(false);

    const phiVanChuyen = 0;
    const tienGiam = voucherInfo?.tienGiam ? Number(voucherInfo.tienGiam) : 0;
    const tongThanhToan = Math.max(0, tongTien + phiVanChuyen - tienGiam);

    const apDungVoucher = async () => {
        if (!maVoucher.trim()) {
            setVoucherError("Vui lòng nhập mã giảm giá");
            return;
        }

        setCheckingVoucher(true);
        setVoucherError("");

        try {
            const khachHangId = (() => {
                        try {
                            const raw = localStorage.getItem("taiKhoan");
                            return raw ? JSON.parse(raw).khachHangId : null;
                        } catch {
                            return null;
                        }
                    })();
            const res = await fetch(`${API}/ma-giam-gia/kiem-tra`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ma: maVoucher,
                    tongTien: tongTien,
                    khachHangId : khachHangId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Mã giảm giá không hợp lệ");
            }

            setVoucherInfo(data);
            setVoucherError("");
        } catch (err) {
            setVoucherError(err.message);
            setVoucherInfo(null);
        } finally {
            setCheckingVoucher(false);
        }
    };

    const xoaVoucher = () => {
        setMaVoucher("");
        setVoucherInfo(null);
        setVoucherError("");
    };


    const NGAN_HANG_QR = "MB";
    const SO_TAI_KHOAN = "0123456789";
    const CHU_TAI_KHOAN = "FSHOP";


    const taoNoiDungChuyenKhoan = (maHoaDon = null) => {
        if (maHoaDon) {
            return `FSHOP ${maHoaDon}`;
        }

        return "FSHOP THANH TOAN";
    };


    const hienThiPhuongThuc = (phuongThucThanhToan) => {
        return phuongThucThanhToan === "CHUYEN_KHOAN"
            ? "Chuyển khoản"
            : "Tiền mặt khi nhận hàng";
    };


    const taoQrUrl = (soTien, maHoaDon = null) => {

        const amount = Math.round(Number(soTien) || 0);

        const noiDung = taoNoiDungChuyenKhoan(maHoaDon);

        return (
            `https://img.vietqr.io/image/` +
            `${NGAN_HANG_QR}-${SO_TAI_KHOAN}-compact2.png` +
            `?amount=${amount}` +
            `&addInfo=${encodeURIComponent(noiDung)}` +
            `&accountName=${encodeURIComponent(CHU_TAI_KHOAN)}`
        );
    };

    const saoChep = async (noiDung, thongBao) => {
        try {

            await navigator.clipboard.writeText(noiDung);

            alert(thongBao);

        } catch (error) {

            console.error("Không thể sao chép:", error);

            alert(
                `Không thể sao chép tự động.\n\n${noiDung}`
            );
        }
    };


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
            alert(
                "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0"
            );
            return;
        }

        if (!diaChi.trim()) {
            alert("Vui lòng nhập địa chỉ nhận hàng");
            return;
        }

        if (!gioHangId) {
            alert(
                "Không xác định được giỏ hàng của khách hàng. " +
                "Vui lòng đăng nhập lại."
            );
            return;
        }

        if (dangDatHang) {
            return;
        }

        const itemsForBill = gioHang.map((item) => ({
            ...item,
            sanPham: {
                ...item.sanPham,
            },
            chiTiet: item.chiTiet
                ? {
                    ...item.chiTiet,
                }
                : null,
        }));

        try {

            setDangDatHang(true);


            const cartDetailResponse = await fetch(
                `${API}/gio-hang/${gioHangId}/chi-tiet`
            );

            if (!cartDetailResponse.ok) {

                const errorText =
                    await cartDetailResponse.text();

                throw new Error(
                    errorText ||
                    "Không lấy được giỏ hàng trên hệ thống"
                );
            }

            const cartDetails =
                await cartDetailResponse.json();

            for (
                const detail of
                Array.isArray(cartDetails)
                    ? cartDetails
                    : []
                ) {

                const deleteResponse =
                    await fetch(
                        `${API}/gio-hang/chi-tiet/${detail.id}`,
                        {
                            method: "DELETE",
                        }
                    );

                if (!deleteResponse.ok) {

                    throw new Error(
                        `Không thể làm sạch sản phẩm cũ ` +
                        `(ID ${detail.id})`
                    );
                }
            }


            for (const item of itemsForBill) {

                if (!item.chiTiet?.id) {

                    throw new Error(
                        `Sản phẩm "${item.sanPham?.tenSanPham || "không xác định"}" ` +
                        `chưa có biến thể`
                    );
                }

                const addResponse =
                    await fetch(
                        `${API}/gio-hang/chi-tiet`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                gioHang: {
                                    id: gioHangId,
                                },

                                sanPhamChiTiet: {
                                    id: item.chiTiet.id,
                                },

                                soLuong:
                                item.soLuong,
                            }),
                        }
                    );

                const addText =
                    await addResponse.text();

                let addData = null;

                try {

                    addData =
                        addText
                            ? JSON.parse(addText)
                            : null;

                } catch {

                    addData = null;
                }

                if (!addResponse.ok) {

                    throw new Error(
                        addData?.message ||
                        addData?.error ||
                        addText ||
                        `Không thể thêm ` +
                        `${item.sanPham?.tenSanPham || "sản phẩm"} ` +
                        `vào giỏ hàng`
                    );
                }
            }

            const response =
                await fetch(
                    `${API}/hoa-don/dat-hang/${gioHangId}`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({

                            hoTen:
                                hoTen.trim(),

                            soDienThoai:
                                soDienThoai.trim(),

                            diaChi:
                                diaChi.trim(),

                            ghiChu:
                                ghiChu.trim(),

                            phuongThuc,

                            voucherId:voucherInfo?.id || null,
                            maVoucher :voucherInfo?.maVoucher || null,
                            tienGiam:tienGiam,

                        }),
                    }
                );

            const responseText =
                await response.text();

            let data = null;

            try {

                data =
                    responseText
                        ? JSON.parse(responseText)
                        : null;

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



            setBill({

                maHoaDon,

                ngayDat:
                    new Date().toLocaleString(
                        "vi-VN"
                    ),

                hoTen:
                    hoTen.trim(),

                soDienThoai:
                    soDienThoai.trim(),

                diaChi:
                    diaChi.trim(),

                ghiChu:
                    ghiChu.trim(),

                phuongThuc,

                items:
                itemsForBill,

                tamTinh:
                    Number(tongTien),
                tienGiam:tienGiam,
                maVoucher: voucherInfo?.maVoucher || null,
                tongThanhToan,

                noiDungChuyenKhoan:
                    taoNoiDungChuyenKhoan(
                        maHoaDon
                    ),
            });



            setGioHang([]);

        } catch (error) {

            console.error(
                "Lỗi đặt hàng:",
                error
            );

            alert(
                error.message ||
                "Có lỗi xảy ra khi đặt hàng"
            );

        } finally {

            setDangDatHang(false);
        }
    };


    if (bill) {

        const laChuyenKhoan =
            bill.phuongThuc === "CHUYEN_KHOAN";

        const qrUrl =
            laChuyenKhoan
                ? taoQrUrl(
                    bill.tongThanhToan,
                    bill.maHoaDon
                )
                : null;

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
                            boxShadow:
                                "0 10px 35px rgba(0,0,0,.06)",
                        }}
                    >

                        <div
                            style={{
                                textAlign: "center",
                                marginBottom: "28px",
                            }}
                        >

                            <div
                                style={{
                                    width: "58px",
                                    height: "58px",
                                    margin:
                                        "0 auto 14px",
                                    borderRadius: "50%",
                                    background:
                                        "#eaf7ed",
                                    color: "#24833b",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent:
                                        "center",
                                    fontSize: "30px",
                                    fontWeight: 700,
                                }}
                            >
                                ✓
                            </div>

                            <span className="section-label">
                                FSHOP
                            </span>

                            <h1
                                style={{
                                    margin:
                                        "8px 0",
                                    fontSize:
                                        "30px",
                                }}
                            >
                                Đặt hàng thành công!
                            </h1>

                            <p
                                style={{
                                    color: "#777",
                                    margin: 0,
                                }}
                            >
                                Cảm ơn bạn đã mua hàng.
                                Đây là hóa đơn của bạn.
                            </p>

                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "14px",
                                padding: "18px",
                                background: "#fafafa",
                                borderRadius: "6px",
                                marginBottom: "25px",
                                fontSize: "13px",
                            }}
                        >

                            <div>

                                <span
                                    style={{
                                        color: "#888",
                                        display: "block",
                                        marginBottom:
                                            "5px",
                                    }}
                                >
                                    Mã hóa đơn
                                </span>

                                <strong>
                                    {bill.maHoaDon}
                                </strong>

                            </div>

                            <div>

                                <span
                                    style={{
                                        color: "#888",
                                        display: "block",
                                        marginBottom:
                                            "5px",
                                    }}
                                >
                                    Ngày đặt
                                </span>

                                <strong>
                                    {bill.ngayDat}
                                </strong>

                            </div>

                            <div>

                                <span
                                    style={{
                                        color: "#888",
                                        display: "block",
                                        marginBottom:
                                            "5px",
                                    }}
                                >
                                    Phương thức thanh toán
                                </span>

                                <strong>
                                    {hienThiPhuongThuc(
                                        bill.phuongThuc
                                    )}
                                </strong>

                            </div>

                        </div>

                        {/* =========================
                            THÔNG TIN CHUYỂN KHOẢN
                        ========================= */}

                        {laChuyenKhoan && (

                            <div
                                style={{
                                    marginBottom: "28px",
                                    padding: "22px",
                                    border:
                                        "1px solid #e0e0e0",
                                    borderRadius:
                                        "12px",
                                    background:
                                        "#fffaf5",
                                }}
                            >

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            "space-between",
                                        alignItems:
                                            "center",
                                        gap: "15px",
                                        flexWrap:
                                            "wrap",
                                        marginBottom:
                                            "18px",
                                    }}
                                >

                                    <div>

                                        <h2
                                            style={{
                                                fontSize:
                                                    "19px",
                                                margin:
                                                    "0 0 6px",
                                            }}
                                        >
                                            🏦 Thông tin
                                            chuyển khoản
                                        </h2>

                                        <p
                                            style={{
                                                margin: 0,
                                                color:
                                                    "#777",
                                                fontSize:
                                                    "13px",
                                            }}
                                        >
                                            Vui lòng chuyển
                                            đúng số tiền
                                            và nội dung.
                                        </p>

                                    </div>

                                    <div
                                        style={{
                                            padding:
                                                "8px 12px",
                                            borderRadius:
                                                "999px",
                                            background:
                                                "#fff",
                                            border:
                                                "1px solid #eee",
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                700,
                                        }}
                                    >
                                        CHỜ THANH TOÁN
                                    </div>

                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "minmax(0, 1fr) 220px",
                                        gap: "25px",
                                        alignItems:
                                            "center",
                                    }}
                                >

                                    {/* THÔNG TIN NGÂN HÀNG */}

                                    <div
                                        style={{
                                            display:
                                                "grid",
                                            gap: "12px",
                                        }}
                                    >

                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                justifyContent:
                                                    "space-between",
                                                gap: "15px",
                                                padding:
                                                    "11px 0",
                                                borderBottom:
                                                    "1px solid #eee",
                                            }}
                                        >
                                            <span>
                                                Ngân hàng
                                            </span>

                                            <strong>
                                                {NGAN_HANG_QR}
                                            </strong>
                                        </div>

                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                justifyContent:
                                                    "space-between",
                                                gap: "15px",
                                                padding:
                                                    "11px 0",
                                                borderBottom:
                                                    "1px solid #eee",
                                            }}
                                        >

                                            <span>
                                                Số tài khoản
                                            </span>

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    gap: "8px",
                                                }}
                                            >

                                                <strong>
                                                    {SO_TAI_KHOAN}
                                                </strong>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        saoChep(
                                                            SO_TAI_KHOAN,
                                                            "Đã sao chép số tài khoản"
                                                        )
                                                    }
                                                    style={{
                                                        border:
                                                            "1px solid #ddd",
                                                        background:
                                                            "#fff",
                                                        borderRadius:
                                                            "6px",
                                                        padding:
                                                            "5px 8px",
                                                        cursor:
                                                            "pointer",
                                                    }}
                                                >
                                                    📋
                                                </button>

                                            </div>

                                        </div>

                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                justifyContent:
                                                    "space-between",
                                                gap: "15px",
                                                padding:
                                                    "11px 0",
                                                borderBottom:
                                                    "1px solid #eee",
                                            }}
                                        >
                                            <span>
                                                Chủ tài khoản
                                            </span>

                                            <strong>
                                                {CHU_TAI_KHOAN}
                                            </strong>
                                        </div>

                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                justifyContent:
                                                    "space-between",
                                                gap: "15px",
                                                padding:
                                                    "11px 0",
                                                borderBottom:
                                                    "1px solid #eee",
                                            }}
                                        >

                                            <span>
                                                Số tiền
                                            </span>

                                            <strong
                                                style={{
                                                    color:
                                                        "#e53935",
                                                    fontSize:
                                                        "18px",
                                                }}
                                            >
                                                {formatGia(
                                                    bill.tongThanhToan
                                                )}
                                            </strong>

                                        </div>

                                        <div
                                            style={{
                                                padding:
                                                    "13px",
                                                background:
                                                    "#fff",
                                                borderRadius:
                                                    "8px",
                                                border:
                                                    "1px solid #eee",
                                            }}
                                        >

                                            <div
                                                style={{
                                                    fontSize:
                                                        "12px",
                                                    color:
                                                        "#777",
                                                    marginBottom:
                                                        "5px",
                                                }}
                                            >
                                                Nội dung
                                                chuyển khoản
                                            </div>

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    justifyContent:
                                                        "space-between",
                                                    gap: "10px",
                                                }}
                                            >

                                                <strong
                                                    style={{
                                                        color:
                                                            "#111",
                                                        wordBreak:
                                                            "break-word",
                                                    }}
                                                >
                                                    {bill.noiDungChuyenKhoan}
                                                </strong>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        saoChep(
                                                            bill.noiDungChuyenKhoan,
                                                            "Đã sao chép nội dung chuyển khoản"
                                                        )
                                                    }
                                                    style={{
                                                        flexShrink:
                                                            0,
                                                        border:
                                                            "1px solid #ddd",
                                                        background:
                                                            "#fff",
                                                        borderRadius:
                                                            "6px",
                                                        padding:
                                                            "5px 8px",
                                                        cursor:
                                                            "pointer",
                                                    }}
                                                >
                                                    📋
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                    {/* QR */}

                                    <div
                                        style={{
                                            textAlign:
                                                "center",
                                        }}
                                    >

                                        <div
                                            style={{
                                                background:
                                                    "#fff",
                                                padding:
                                                    "10px",
                                                border:
                                                    "1px solid #eee",
                                                borderRadius:
                                                    "10px",
                                                display:
                                                    "inline-block",
                                            }}
                                        >

                                            <img
                                                src={qrUrl}
                                                alt="QR thanh toán"
                                                style={{
                                                    width:
                                                        "190px",
                                                    height:
                                                        "190px",
                                                    objectFit:
                                                        "contain",
                                                    display:
                                                        "block",
                                                }}
                                                onError={(e) => {
                                                    e.currentTarget.style.display =
                                                        "none";
                                                }}
                                            />

                                        </div>

                                        <div
                                            style={{
                                                marginTop:
                                                    "10px",
                                                fontSize:
                                                    "12px",
                                                color:
                                                    "#777",
                                            }}
                                        >
                                            Quét QR để
                                            thanh toán
                                        </div>

                                    </div>

                                </div>

                                <div
                                    style={{
                                        marginTop: "18px",
                                        padding: "12px 14px",
                                        background: "#fff",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        color: "#666",
                                    }}
                                >
                                    ⚠️ Sau khi chuyển khoản,
                                    FShop sẽ kiểm tra giao dịch
                                    và xác nhận thanh toán.
                                </div>

                            </div>
                        )}

                        {/* =========================
                            THÔNG TIN NHẬN HÀNG
                        ========================= */}

                        <h2
                            style={{
                                fontSize: "18px",
                                marginBottom: "15px",
                            }}
                        >
                            Thông tin nhận hàng
                        </h2>

                        <div
                            style={{
                                lineHeight: 1.8,
                                fontSize: "13px",
                                marginBottom: "25px",
                            }}
                        >

                            <div>
                                <strong>
                                    Người nhận:
                                </strong>{" "}
                                {bill.hoTen}
                            </div>

                            <div>
                                <strong>
                                    Số điện thoại:
                                </strong>{" "}
                                {bill.soDienThoai}
                            </div>

                            <div>
                                <strong>
                                    Địa chỉ:
                                </strong>{" "}
                                {bill.diaChi}
                            </div>

                            {bill.ghiChu && (
                                <div>
                                    <strong>
                                        Ghi chú:
                                    </strong>{" "}
                                    {bill.ghiChu}
                                </div>
                            )}

                        </div>

                        {/* =========================
                            CHI TIẾT HÓA ĐƠN
                        ========================= */}

                        <h2
                            style={{
                                fontSize: "18px",
                                marginBottom: "15px",
                            }}
                        >
                            Chi tiết hóa đơn
                        </h2>

                        <div
                            style={{
                                overflowX: "auto",
                            }}
                        >

                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse:
                                        "collapse",
                                    fontSize: "13px",
                                }}
                            >

                                <thead>

                                <tr
                                    style={{
                                        background:
                                            "#f7f7f7",
                                        textAlign:
                                            "left",
                                    }}
                                >

                                    <th
                                        style={{
                                            padding:
                                                "13px 10px",
                                        }}
                                    >
                                        Sản phẩm
                                    </th>

                                    <th
                                        style={{
                                            padding:
                                                "13px 10px",
                                        }}
                                    >
                                        Đơn giá
                                    </th>

                                    <th
                                        style={{
                                            padding:
                                                "13px 10px",
                                            textAlign:
                                                "center",
                                        }}
                                    >
                                        SL
                                    </th>

                                    <th
                                        style={{
                                            padding:
                                                "13px 10px",
                                            textAlign:
                                                "right",
                                        }}
                                    >
                                        Thành tiền
                                    </th>

                                </tr>

                                </thead>

                                <tbody>

                                {bill.items.map(
                                    (item, index) => {

                                        const donGia =
                                            Number(
                                                item.chiTiet
                                                    ?.giaBan ??
                                                item.sanPham
                                                    ?.giaBan ??
                                                0
                                            );

                                        const thanhTien =
                                            donGia *
                                            Number(
                                                item.soLuong ||
                                                0
                                            );

                                        return (
                                            <tr
                                                key={`${item.variantId}-${index}`}
                                            >

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 10px",
                                                        borderBottom:
                                                            "1px solid #eee",
                                                    }}
                                                >

                                                    <strong>
                                                        {item
                                                                .sanPham
                                                                ?.tenSanPham ||
                                                            "Sản phẩm"}
                                                    </strong>

                                                    <div
                                                        style={{
                                                            color:
                                                                "#888",
                                                            fontSize:
                                                                "11px",
                                                            marginTop:
                                                                "5px",
                                                        }}
                                                    >

                                                        {item
                                                            .chiTiet
                                                            ?.kichCo
                                                            ?.tenKichCo
                                                            ? `Size: ${item.chiTiet.kichCo.tenKichCo}`
                                                            : ""}

                                                        {item
                                                            .chiTiet
                                                            ?.mauSac
                                                            ?.tenMau
                                                            ? ` · Màu: ${item.chiTiet.mauSac.tenMau}`
                                                            : ""}

                                                    </div>

                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 10px",
                                                        borderBottom:
                                                            "1px solid #eee",
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                >
                                                    {formatGia(
                                                        donGia
                                                    )}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 10px",
                                                        borderBottom:
                                                            "1px solid #eee",
                                                        textAlign:
                                                            "center",
                                                    }}
                                                >
                                                    {item.soLuong}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 10px",
                                                        borderBottom:
                                                            "1px solid #eee",
                                                        textAlign:
                                                            "right",
                                                        whiteSpace:
                                                            "nowrap",
                                                        color:
                                                            "#e53935",
                                                        fontWeight:
                                                            700,
                                                    }}
                                                >
                                                    {formatGia(
                                                        thanhTien
                                                    )}
                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                                </tbody>

                            </table>

                        </div>

                        {/* =========================
                            TỔNG TIỀN
                        ========================= */}

                        <div
                            style={{
                                maxWidth: "360px",
                                margin:
                                    "22px 0 0 auto",
                            }}
                        >

                            <div className="summary-line">

                                <span>
                                    Tạm tính
                                </span>

                                <strong>
                                    {formatGia(
                                        bill.tamTinh
                                    )}
                                </strong>

                            </div>

                            <div className="summary-line">

                                <span>
                                    Phí vận chuyển
                                </span>

                                <strong>
                                    Miễn phí
                                </strong>

                            </div>
                             {/* ⭐ MỚI — DÒNG GIẢM GIÁ TRONG BILL */}
                             {bill.tienGiam > 0 && (
                               <div className="summary-line" style={{ color: "#24833b" }}>
                                <span>Giảm giá ({bill.maVoucher})</span>
                                <strong>-{formatGia(bill.tienGiam)}</strong>
                                </div>
                                 )}

                            <div className="summary-divider" />

                            <div className="summary-total">

                                <span>
                                    Tổng thanh toán
                                </span>

                                <strong>
                                    {formatGia(
                                        bill.tongThanhToan
                                    )}
                                </strong>

                            </div>

                        </div>

                        {/* =========================
                            NÚT
                        ========================= */}

                        <div
                            className="bill-actions"
                            style={{
                                display: "flex",
                                gap: "12px",
                                justifyContent:
                                    "center",
                                flexWrap:
                                    "wrap",
                                marginTop:
                                    "30px",
                            }}
                        >

                            <button
                                className="checkout-button"
                                style={{
                                    width: "auto",
                                    minWidth:
                                        "180px",
                                    padding:
                                        "0 22px",
                                }}
                                onClick={() =>
                                    window.print()
                                }
                            >
                                🖨 In hóa đơn / Lưu PDF
                            </button>

                            <button
                                className="continue-shopping"
                                style={{
                                    marginTop: 0,
                                    border:
                                        "1px solid #ddd",
                                    borderRadius:
                                        "4px",
                                    padding:
                                        "0 22px",
                                    minHeight:
                                        "48px",
                                }}
                                onClick={() =>
                                    setPage("home")
                                }
                            >
                                Tiếp tục mua hàng
                            </button>

                        </div>

                    </div>

                </div>

            </main>
        );
    }

    /*
     * =========================================================
     * GIỎ HÀNG TRỐNG
     * =========================================================
     */

    if (!gioHang || gioHang.length === 0) {

        return (
            <main className="cart-page">

                <div className="container">

                    <div className="empty-cart">

                        <div className="empty-cart-icon">
                            🛒
                        </div>

                        <h2>
                            Giỏ hàng đang trống
                        </h2>

                        <p>
                            Hãy thêm sản phẩm trước khi đặt hàng.
                        </p>

                        <button
                            onClick={() =>
                                setPage("products")
                            }
                        >
                            Tiếp tục mua hàng →
                        </button>

                    </div>

                </div>

            </main>
        );
    }

    /*
     * =========================================================
     * TRANG CHECKOUT
     * =========================================================
     */

    return (

        <main className="cart-page">

            <div className="container">

                <div className="breadcrumb">
                    Trang chủ / Giỏ hàng / Đặt hàng
                </div>

                <div className="cart-title">

                    <span className="section-label">
                        FSHOP
                    </span>

                    <h1>
                        Đặt hàng
                    </h1>

                    <p>
                        Nhập thông tin nhận hàng để hoàn tất đơn.
                    </p>

                </div>

                <div className="cart-layout">

                    {/* =================================================
                        FORM NHẬN HÀNG
                    ================================================= */}

                    <div className="cart-items">

                        <h2
                            style={{
                                marginTop: 0,
                            }}
                        >
                            Thông tin nhận hàng
                        </h2>

                        <div
                            style={{
                                display: "grid",
                                gap: "16px",
                                marginTop: "25px",
                            }}
                        >

                            {/* HỌ TÊN */}

                            <div>

                                <label
                                    style={{
                                        display:
                                            "block",
                                        fontSize:
                                            "12px",
                                        fontWeight:
                                            700,
                                        marginBottom:
                                            "8px",
                                    }}
                                >
                                    Họ và tên{" "}
                                    <span
                                        style={{
                                            color:
                                                "#e53935",
                                        }}
                                    >
                                        *
                                    </span>
                                </label>

                                <input
                                    className="price-input"
                                    type="text"
                                    value={hoTen}
                                    onChange={(e) =>
                                        setHoTen(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nhập họ và tên"
                                />

                            </div>

                            {/* SỐ ĐIỆN THOẠI */}

                            <div>

                                <label
                                    style={{
                                        display:
                                            "block",
                                        fontSize:
                                            "12px",
                                        fontWeight:
                                            700,
                                        marginBottom:
                                            "8px",
                                    }}
                                >
                                    Số điện thoại{" "}
                                    <span
                                        style={{
                                            color:
                                                "#e53935",
                                        }}
                                    >
                                        *
                                    </span>
                                </label>

                                <input
                                    className="price-input"
                                    type="tel"
                                    value={soDienThoai}
                                    onChange={(e) =>
                                        setSoDienThoai(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nhập số điện thoại"
                                />

                            </div>
                           {/* ⭐ Ô NHẬP VOUCHER — ĐẶT SAU ĐỊA CHỈ */}
                           <div>
                               <label
                                   style={{
                                       display: "block",
                                       fontSize: "12px",
                                       fontWeight: 700,
                                       marginBottom: "8px",
                                   }}
                               >
                                   🎫 Mã giảm giá
                               </label>

                               <div className="voucher-input-row">
                                   <input
                                       className="price-input"
                                       type="text"
                                       placeholder="Nhập mã (VD: SALE10)"
                                       value={maVoucher}
                                       onChange={(e) =>
                                           setMaVoucher(e.target.value.toUpperCase())
                                       }
                                       disabled={!!voucherInfo}
                                   />

                                   {voucherInfo ? (
                                       <button
                                           type="button"
                                           className="voucher-remove-btn"
                                           onClick={xoaVoucher}
                                       >
                                           Xóa
                                       </button>
                                   ) : (
                                       <button
                                           type="button"
                                           className="voucher-apply-btn"
                                           onClick={apDungVoucher}
                                           disabled={checkingVoucher}
                                       >
                                           {checkingVoucher ? "..." : "Áp dụng"}
                                       </button>
                                   )}
                               </div>

                               {voucherError && (
                                   <span
                                       style={{
                                           color: "#e53935",
                                           fontSize: 12,
                                           marginTop: 6,
                                           display: "block",
                                       }}
                                   >
                                       {voucherError}
                                   </span>
                               )}

                               {voucherInfo && (
                                   <div className="voucher-success">
                                       ✓ Đã áp dụng <strong>{voucherInfo.maVoucher}</strong>
                                       {" — "}
                                       giảm <strong>{formatGia(voucherInfo.tienGiam)}</strong>
                                   </div>
                               )}
                           </div>
                            {/* ĐỊA CHỈ */}

                            <div>

                                <label
                                    style={{
                                        display:
                                            "block",
                                        fontSize:
                                            "12px",
                                        fontWeight:
                                            700,
                                        marginBottom:
                                            "8px",
                                    }}
                                >
                                    Địa chỉ nhận hàng{" "}
                                    <span
                                        style={{
                                            color:
                                                "#e53935",
                                        }}
                                    >
                                        *
                                    </span>
                                </label>

                                <textarea
                                    className="price-input"
                                    value={diaChi}
                                    onChange={(e) =>
                                        setDiaChi(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nhập địa chỉ nhận hàng"
                                    style={{
                                        minHeight:
                                            "90px",
                                        paddingTop:
                                            "10px",
                                        resize:
                                            "vertical",
                                    }}
                                />

                            </div>

                            {/* =================================================
                                PHƯƠNG THỨC THANH TOÁN
                            ================================================= */}

                            <div>

                                <label
                                    style={{
                                        display:
                                            "block",
                                        fontSize:
                                            "12px",
                                        fontWeight:
                                            700,
                                        marginBottom:
                                            "8px",
                                    }}
                                >
                                    Phương thức thanh toán
                                </label>

                                <select
                                    className="price-input"
                                    value={phuongThuc}
                                    onChange={(e) =>
                                        setPhuongThuc(
                                            e.target.value
                                        )
                                    }
                                >

                                    <option value="TIEN_MAT">
                                        Tiền mặt khi nhận hàng
                                    </option>

                                    <option value="CHUYEN_KHOAN">
                                        Chuyển khoản
                                    </option>

                                </select>

                                {/* =================================================
                                    THÔNG TIN CHUYỂN KHOẢN
                                ================================================= */}

                                {phuongThuc ===
                                    "CHUYEN_KHOAN" && (

                                        <div
                                            style={{
                                                marginTop:
                                                    "15px",
                                                padding:
                                                    "20px",
                                                border:
                                                    "1px solid #e3e3e3",
                                                borderRadius:
                                                    "12px",
                                                background:
                                                    "#fffaf5",
                                            }}
                                        >

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems:
                                                        "center",
                                                    gap:
                                                        "12px",
                                                    flexWrap:
                                                        "wrap",
                                                    marginBottom:
                                                        "16px",
                                                }}
                                            >

                                                <div>

                                                    <h3
                                                        style={{
                                                            margin:
                                                                0,
                                                            fontSize:
                                                                "18px",
                                                        }}
                                                    >
                                                        🏦 Chuyển khoản ngân hàng
                                                    </h3>

                                                    <p
                                                        style={{
                                                            margin:
                                                                "5px 0 0",
                                                            color:
                                                                "#777",
                                                            fontSize:
                                                                "12px",
                                                        }}
                                                    >
                                                        Chuyển khoản
                                                        đúng số tiền
                                                        và nội dung.
                                                    </p>

                                                </div>

                                                <span
                                                    style={{
                                                        padding:
                                                            "6px 10px",
                                                        background:
                                                            "#fff",
                                                        border:
                                                            "1px solid #eee",
                                                        borderRadius:
                                                            "999px",
                                                        fontSize:
                                                            "11px",
                                                        fontWeight:
                                                            700,
                                                    }}
                                                >
                                                QR BANKING
                                            </span>

                                            </div>

                                            <div
                                                style={{
                                                    display:
                                                        "grid",
                                                    gridTemplateColumns:
                                                        "minmax(0, 1fr) 190px",
                                                    gap:
                                                        "20px",
                                                    alignItems:
                                                        "center",
                                                }}
                                            >

                                                <div
                                                    style={{
                                                        display:
                                                            "grid",
                                                        gap:
                                                            "10px",
                                                    }}
                                                >

                                                    {/* NGÂN HÀNG */}

                                                    <div
                                                        style={{
                                                            padding:
                                                                "10px 0",
                                                            borderBottom:
                                                                "1px solid #eee",
                                                        }}
                                                    >

                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color:
                                                                    "#777",
                                                            }}
                                                        >
                                                            Ngân hàng
                                                        </div>

                                                        <strong>
                                                            {NGAN_HANG_QR}
                                                        </strong>

                                                    </div>

                                                    {/* SỐ TÀI KHOẢN */}

                                                    <div
                                                        style={{
                                                            padding:
                                                                "10px 0",
                                                            borderBottom:
                                                                "1px solid #eee",
                                                        }}
                                                    >

                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color:
                                                                    "#777",
                                                                marginBottom:
                                                                    "4px",
                                                            }}
                                                        >
                                                            Số tài khoản
                                                        </div>

                                                        <div
                                                            style={{
                                                                display:
                                                                    "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap:
                                                                    "8px",
                                                            }}
                                                        >

                                                            <strong>
                                                                {SO_TAI_KHOAN}
                                                            </strong>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    saoChep(
                                                                        SO_TAI_KHOAN,
                                                                        "Đã sao chép số tài khoản"
                                                                    )
                                                                }
                                                                style={{
                                                                    border:
                                                                        "1px solid #ddd",
                                                                    background:
                                                                        "#fff",
                                                                    borderRadius:
                                                                        "6px",
                                                                    padding:
                                                                        "5px 8px",
                                                                    cursor:
                                                                        "pointer",
                                                                }}
                                                            >
                                                                📋
                                                            </button>

                                                        </div>

                                                    </div>

                                                    {/* CHỦ TÀI KHOẢN */}

                                                    <div
                                                        style={{
                                                            padding:
                                                                "10px 0",
                                                            borderBottom:
                                                                "1px solid #eee",
                                                        }}
                                                    >

                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color:
                                                                    "#777",
                                                            }}
                                                        >
                                                            Chủ tài khoản
                                                        </div>

                                                        <strong>
                                                            {CHU_TAI_KHOAN}
                                                        </strong>

                                                    </div>

                                                    {/* SỐ TIỀN */}

                                                    <div
                                                        style={{
                                                            padding:
                                                                "10px 0",
                                                            borderBottom:
                                                                "1px solid #eee",
                                                        }}
                                                    >

                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color:
                                                                    "#777",
                                                            }}
                                                        >
                                                            Số tiền cần chuyển
                                                        </div>

                                                        <strong
                                                            style={{
                                                                color:
                                                                    "#e53935",
                                                                fontSize:
                                                                    "20px",
                                                            }}
                                                        >
                                                            {formatGia(
                                                                tongThanhToan
                                                            )}
                                                        </strong>

                                                    </div>

                                                    {/* NỘI DUNG */}

                                                    <div
                                                        style={{
                                                            padding:
                                                                "12px",
                                                            background:
                                                                "#fff",
                                                            border:
                                                                "1px solid #eee",
                                                            borderRadius:
                                                                "8px",
                                                        }}
                                                    >

                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color:
                                                                    "#777",
                                                                marginBottom:
                                                                    "5px",
                                                            }}
                                                        >
                                                            Nội dung chuyển khoản
                                                        </div>

                                                        <strong>
                                                            {taoNoiDungChuyenKhoan()}
                                                        </strong>

                                                    </div>

                                                </div>

                                                {/* QR */}

                                                <div
                                                    style={{
                                                        textAlign:
                                                            "center",
                                                    }}
                                                >

                                                    <div
                                                        style={{
                                                            background:
                                                                "#fff",
                                                            padding:
                                                                "8px",
                                                            border:
                                                                "1px solid #eee",
                                                            borderRadius:
                                                                "10px",
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    >

                                                        <img
                                                            src={taoQrUrl(
                                                                tongTien
                                                            )}
                                                            alt="QR chuyển khoản"
                                                            style={{
                                                                width:
                                                                    "170px",
                                                                height:
                                                                    "170px",
                                                                display:
                                                                    "block",
                                                                objectFit:
                                                                    "contain",
                                                            }}
                                                        />

                                                    </div>

                                                    <div
                                                        style={{
                                                            marginTop:
                                                                "8px",
                                                            fontSize:
                                                                "11px",
                                                            color:
                                                                "#777",
                                                        }}
                                                    >
                                                        Quét QR bằng
                                                        ứng dụng ngân hàng
                                                    </div>

                                                </div>

                                            </div>

                                            <div
                                                style={{
                                                    marginTop:
                                                        "15px",
                                                    padding:
                                                        "11px 13px",
                                                    background:
                                                        "#fff",
                                                    borderRadius:
                                                        "8px",
                                                    fontSize:
                                                        "12px",
                                                    color:
                                                        "#666",
                                                }}
                                            >
                                                ⚠️ Sau khi chuyển khoản,
                                                FShop sẽ kiểm tra giao dịch
                                                và xác nhận thanh toán.
                                            </div>

                                        </div>
                                    )}

                            </div>

                            {/* GHI CHÚ */}

                            <div>

                                <label
                                    style={{
                                        display:
                                            "block",
                                        fontSize:
                                            "12px",
                                        fontWeight:
                                            700,
                                        marginBottom:
                                            "8px",
                                    }}
                                >
                                    Ghi chú
                                </label>

                                <textarea
                                    className="price-input"
                                    value={ghiChu}
                                    onChange={(e) =>
                                        setGhiChu(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ví dụ: Giao giờ hành chính..."
                                    style={{
                                        minHeight:
                                            "90px",
                                        paddingTop:
                                            "10px",
                                        resize:
                                            "vertical",
                                    }}
                                />

                            </div>


                        </div>

                    </div>

                    {/* =================================================
                        TÓM TẮT ĐƠN HÀNG
                    ================================================= */}

                    <aside className="cart-summary">

                        <h2>
                            Tóm tắt đơn hàng
                        </h2>

                        <div className="summary-line">

                            <span>
                                Số sản phẩm
                            </span>

                            <strong>
                                {gioHang.reduce(
                                    (total, item) =>
                                        total +
                                        item.soLuong,
                                    0
                                )}
                            </strong>

                        </div>

                        <div className="summary-line">

                            <span>
                                Tạm tính
                            </span>

                            <strong>
                                {formatGia(
                                    tongTien
                                )}
                            </strong>

                        </div>

                        <div className="summary-line">

                            <span>
                                Phí vận chuyển
                            </span>

                            <strong>
                                Miễn phí
                            </strong>

                        </div>
                             {/* ⭐ MỚI — DÒNG GIẢM GIÁ TRONG TÓM TẮT */}
                             {tienGiam > 0 && (
                                                       <div className="summary-line" style={{ color: "#24833b" }}>
                                                           <span>Giảm giá ({voucherInfo?.maVoucher})</span>
                                                           <strong>-{formatGia(tienGiam)}</strong>
                                                       </div>
                                                   )}


                        <div className="summary-divider" />

                        <div className="summary-total">

                            <span>
                                Tổng thanh toán
                            </span>

                            <strong>
                                {formatGia(
                                    tongThanhToan
                                )}
                            </strong>

                        </div>

                        {phuongThuc ===
                            "CHUYEN_KHOAN" && (

                                <div
                                    style={{
                                        marginTop:
                                            "15px",
                                        padding:
                                            "12px",
                                        background:
                                            "#fffaf5",
                                        border:
                                            "1px solid #eee",
                                        borderRadius:
                                            "8px",
                                        fontSize:
                                            "12px",
                                    }}
                                >

                                    <div
                                        style={{
                                            color:
                                                "#777",
                                            marginBottom:
                                                "4px",
                                        }}
                                    >
                                        Phương thức
                                    </div>

                                    <strong>
                                        🏦 Chuyển khoản
                                    </strong>

                                </div>
                            )}

                        <button
                            className="checkout-button"
                            onClick={datHang}
                            disabled={dangDatHang}
                            style={{
                                opacity:
                                    dangDatHang
                                        ? 0.6
                                        : 1,

                                cursor:
                                    dangDatHang
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >

                            {dangDatHang
                                ? "Đang xử lý..."
                                : "Xác nhận đặt hàng →"}

                        </button>

                        <button
                            className="continue-shopping"
                            onClick={() =>
                                setPage("cart")
                            }
                            disabled={dangDatHang}
                            style={{
                                marginTop:
                                    "15px",
                            }}
                        >
                            ← Quay lại giỏ hàng
                        </button>

                        <div
                            className="payment-note"
                        >
                            🔒 Thanh toán an toàn và bảo mật
                        </div>

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


