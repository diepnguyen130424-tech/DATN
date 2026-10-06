/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import "./App.css";
import "./Auth.css";
import "./Cart.css";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";
import Login from "./Login";
import Register from "./Register";
import KhuyenMai from "./KhuyenMai";
import AIDoSize from "./ai/AIDoSize";
import ChatWidget from "./chat/ChatWidget";
import Contact from "./Contact";
import { anhUrl, isActive } from "./CatalogCrud";
const API = "http://localhost:8080/api";
const PHI_SHIP_MAC_DINH = 30000;
const isHoatDong = (trangThai) => trangThai === "HOAT_DONG" || trangThai === "ACTIVE";
const isVariantHoatDong = (item) => isHoatDong(item?.mauSac?.trangThai) &&
    isHoatDong(item?.kichCo?.trangThai);
const danhMuc = [ {
    ten: "Giày thể thao", moTa: "Năng động, thoải mái",
    anh: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85", },
    {
        ten: "Sneaker", moTa: "Thời trang, dễ phối đồ",
        anh: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85", },
    {
        ten: "Giày chạy bộ", moTa: "Êm nhẹ, bền bỉ",
        anh: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=85", },
    {
        ten: "Giày đi chơi", moTa: "Thoải mái, cá tính",
        anh: "https://gagliottacalzature.com/cdn/shop/files/airforcebianconeroct_4.jpg?v=1721234744&width=1214", },
];
const thuongHieu = [ "Nike",
    "adidas", "Puma Sport",
    "Converse", ];
const ANH_THUONG_HIEU = { nike: {
        den: "https://static.nike.com/a/images/t_web_pdp_936_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/d3e09821-478f-4eb6-9597-aed72268365f/NIKE+FLEX+TRAIN.png",
        trang: "https://ash.vn/cdn/shop/files/d92eca3620053ee340820f88c1df2355_1800x.jpg?v=1764240841", },
    adidas: { den: "https://kallos.co/cdn/shop/products/Black_EG4959_01_standard.jpg?v=1674061906&width=840",
        trang: "https://loadbalancer.dktvnblog.com/blog/wp-content/uploads/2025/07/gia-thanh-cua-giay-auth-chenh-lech-nhieu-so-voi-giay-fake.jpg",
    }, puma: {
        den: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMR9JB1zJoOlUvuSjHetbioHMvcvZpVJWgwrjAq7VnIQ8_CF0sdyYAWlje&s=10",
        trang: "https://myshoes.vn/image/catalog/2025/puma/puma07/giay-puma-caven-mix-nam-trang-xam-01.jpg", },
    converse: { den: "https://www.converse.vn/media/catalog/product/0/8/0882-CON162050C000005-1.jpg",
        trang: "https://sneakerholicvietnam.vn/wp-content/uploads/2020/08/converse-chuck-taylor-all-star-move-white-568498c-1.jpg",
    }, };
function layTenThuongHieu(sanPham) { return String(
    sanPham?.thuongHieu?.tenThuongHieu || sanPham?.tenThuongHieu ||
    "" )
    .trim() .toLowerCase();
}
function layAnhTheoMau(sanPham, mau) {
    const variant = Array.isArray(sanPham?.chiTiets)
        ? sanPham.chiTiets.find((item) =>
            String(item?.mauSac?.tenMau || "").trim().toLowerCase() ===
            String(mau || "").trim().toLowerCase() &&
            (item?.hinhAnh || item?.anh || item?.urlAnh || item?.hinhAnhSanPham)
        )
        : null;

    const anhTuDuLieu =
        variant?.hinhAnh || variant?.anh || variant?.urlAnh || variant?.hinhAnhSanPham ||
        sanPham?.hinhAnh || sanPham?.anh || sanPham?.urlAnh || sanPham?.hinhAnhSanPham;

    if (anhTuDuLieu) return anhUrl(anhTuDuLieu);

    const ten = String(sanPham?.tenSanPham || "").toLowerCase();
    const thuongHieu = layTenThuongHieu(sanPham);

    // Bộ ảnh fallback để giao diện luôn giống mẫu FShop ngay cả khi DB chưa có ảnh.
    const fallback = [
        { match: /converse.*chuck|converse(?!.*sp008)/i, url: "https://www.converse.sg/media/catalog/product/0/8/0883-CONM7650COPT013-1.jpg" },
        { match: /nike.*(air force|sp005)/i, url: "https://en-sa.sssports.com/dw/image/v2/BDVB_PRD/on/demandware.static/-/Sites-akeneo-master-catalog/default/dwe4ed894d/sss/SSS2/N/K/F/Q/4/SSS2_NKFQ4296_101_197593621351_1.jpg" },
        { match: /adidas.*(samba|sp006)/i, url: "https://www.sneaker10.cy/3043431-product_large/adidas-originals-samba-og.jpg" },
        { match: /puma.*(rs-x|sp007)/i, url: "https://amazingred.ru/upload/iblock/2ec/twujd09m9djh11nybacuc0kplq7h8278.jpg" },
        { match: /converse.*sp008|converse.*low/i, url: "https://www.privatesneakers.com/cdn/shop/products/167493F_A_107X1_d1e924cf-d67f-41fd-9348-1ba5f88d759c_1080x.jpg?v=1659422326" },
        { match: /nike.*pegasus/i, url: "https://images.all4running.be/catalog/product/e/4/7/a/e47a854424e8d0952c4c4bc16e046b4a88350e90_FD2722_108_0.jpg?auto=format&cb_ts=1675675617&fit=fill&h=500&s=c741465f0f70249ecb4f17170949b8ff&w=500" },
        { match: /adidas.*ultra/i, url: "https://cdn.idealo.com/folder/Product/202665/4/202665495/s1_produktbild_max/adidas-ultraboost-1-0-women-cloud-white-cloud-white-cloud-white-hq4207.jpg" },
        { match: /puma.*suede/i, url: "https://item-shopping.c.yimg.jp/i/n/lowtex_384852-01_3" },
    ];
    const matched = fallback.find((item) => item.match.test(ten));
    if (matched) return matched.url;

    if (thuongHieu.includes("nike")) return "https://en-sa.sssports.com/dw/image/v2/BDVB_PRD/on/demandware.static/-/Sites-akeneo-master-catalog/default/dwe4ed894d/sss/SSS2/N/K/F/Q/4/SSS2_NKFQ4296_101_197593621351_1.jpg";
    if (thuongHieu.includes("adidas")) return "https://www.sneaker10.cy/3043431-product_large/adidas-originals-samba-og.jpg";
    if (thuongHieu.includes("puma")) return "https://amazingred.ru/upload/iblock/2ec/twujd09m9djh11nybacuc0kplq7h8278.jpg";
    if (thuongHieu.includes("converse")) return "https://www.converse.sg/media/catalog/product/0/8/0883-CONM7650COPT013-1.jpg";

    return "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85";
}
function layAnhSanPham(sanPham) { const variant = sanPham?.chiTiets?.find(
    isVariantHoatDong );
    return layAnhTheoMau( sanPham,
        variant?.mauSac?.tenMau || "" );
}
const dichVu = [ {
    icon: "🚚", title: "Miễn phí vận chuyển",
    desc: "Cho đơn hàng từ 500.000đ", },
    {
        icon: "✓", title: "Hàng chính hãng",
        desc: "Cam kết chất lượng sản phẩm", },
    {
        icon: "↻", title: "Đổi trả 7 ngày",
        desc: "Nếu sản phẩm có lỗi", },
    {
        icon: "🔒", title: "Thanh toán an toàn",
        desc: "Bảo mật thông tin khách hàng", },
];
const heroSlides = [
    { image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=2000&q=90", label: "BỘ SƯU TẬP GIÀY NAM 2026", title1: "Phong cách", title2: "cho mọi bước đi", description: "Những mẫu giày nam hiện đại, năng động dành cho mọi hành trình của bạn." },
    { image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=2000&q=90", label: "SNEAKER MỚI VỀ", title1: "Cá tính", title2: "trong từng bước chân", description: "Khám phá những mẫu sneaker trẻ trung, dễ phối đồ và phù hợp mỗi ngày." },
    { image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=2000&q=90", label: "RUNNING COLLECTION", title1: "Êm nhẹ", title2: "chạy xa hơn", description: "Thiết kế năng động, thoải mái cho luyện tập, chạy bộ và hoạt động hàng ngày." },
    { image: "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=2000&q=90", label: "SPORT COLLECTION", title1: "Sẵn sàng", title2: "cho mọi cuộc chơi", description: "Những mẫu giày thể thao nổi bật dành cho phong cách năng động của bạn." },
    { image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=2000&q=90", label: "NEW ARRIVAL", title1: "Mẫu mới", title2: "đã có tại FShop", description: "Cập nhật những mẫu giày mới nhất và chọn phong cách phù hợp với bạn." },
];
function formatGia(gia) { if (gia === null || gia === undefined || gia === "") {
    return "0đ";
}
    return Number(gia).toLocaleString("vi-VN") + "đ";
}
function layTrangTheoVaiTro(taiKhoan) { const vaiTro = String(taiKhoan?.vaiTro || "").toUpperCase();
    if (vaiTro === "QUAN_TRI") return "admin";
    if (vaiTro === "NHAN_VIEN" || vaiTro === "NHÂN_VIÊN") return "employee";
    return "home";
}
/* =========================================================
   HELPER: nhận diện voucher FREESHIP (bản mở rộng)
========================================================= */
function isVoucherFreeship(v) {
    if (!v) return false;

    if (v.mienPhiVanChuyen === true) return true;
    if (v.freeShip === true || v.freeship === true) return true;

    const loai = String(v.loaiVoucher || v.loai || v.type || v.loaiGiamGia || "")
        .toUpperCase()
        .replace(/[\s_-]+/g, "");
    if (loai.includes("FREESHIP") || loai.includes("MIENPHI")) return true;

    const ma = String(v.maVoucher || v.ma || v.code || "")
        .toUpperCase()
        .trim()
        .replace(/[\s_-]+/g, "");

    if (!ma) return false;

    if (ma === "FREE") return true;
    if (ma.startsWith("FREE")) return true;
    if (ma.endsWith("FREE")) return true;
    if (ma.includes("FREESHIP")) return true;
    if (ma.includes("MIENPHI")) return true;

    const tienGiam = Number(v.tienGiam || v.giaTriGiam || 0);
    if (tienGiam === 0 && ma.includes("FREE")) return true;

    return false;
}

function App() { const taiKhoanDaLuu = (() => {
    try { const data = localStorage.getItem("taiKhoan");
        return data ? JSON.parse(data) : null;
    } catch { return null;
    }
})();
    const [taiKhoan, setTaiKhoan] = useState(taiKhoanDaLuu);
    const [page, setPage] = useState( taiKhoanDaLuu ? layTrangTheoVaiTro(taiKhoanDaLuu) : "home"
    );
    const [sanPhams, setSanPhams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [gioHang, setGioHang] = useState([]);
    const [gioHangId, setGioHangId] = useState(null);
    const [selectedVariantIds, setSelectedVariantIds] = useState([]);
    const [yeuThichIds, setYeuThichIds] = useState([]);
    const [toast, setToast] = useState("");
    // Danh mục & thương hiệu lấy từ admin (kèm ảnh) + bộ lọc đang chọn
    const [thuongHieuList, setThuongHieuList] = useState([]);
    const [danhMucList, setDanhMucList] = useState([]);
    const [locBrand, setLocBrand] = useState("Tất cả");
    const [locDanhMuc, setLocDanhMuc] = useState("Tất cả");
    const trangTruoc = useRef(page);
    const taiDanhMucThuongHieu = async () => { try {
        const [thRes, dmRes] = await Promise.all([
            fetch(`${API}/thuong-hieu`),
            fetch(`${API}/danh-muc`),
        ]);
        if (thRes.ok) { const data = await thRes.json();
            setThuongHieuList(Array.isArray(data) ? data.filter((x) => isActive(x.trangThai)) : []);
        }
        if (dmRes.ok) { const data = await dmRes.json();
            setDanhMucList(Array.isArray(data) ? data.filter((x) => isActive(x.trangThai)) : []);
        }
    } catch (error) { console.error("Lỗi tải danh mục/thương hiệu:", error);
    }
    };
    const chonThuongHieu = (ten) => { setLocBrand(ten || "Tất cả");
        setLocDanhMuc("Tất cả");
        setSearch("");
        setPage("products");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const chonDanhMuc = (ten) => { setLocDanhMuc(ten || "Tất cả");
        setLocBrand("Tất cả");
        setSearch("");
        setPage("products");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const taiGioHang = async (taiKhoanHienTai, danhSachSanPham = sanPhams) => { try {
        const khachHangId = taiKhoanHienTai?.khachHangId;
        if (!khachHangId) { setGioHangId(null);
            setGioHang([]);
            return null;
        }
        const gioHangResponse = await fetch(
            `${API}/gio-hang/khach-hang/${khachHangId}/lay-hoac-tao`
        );
        if (!gioHangResponse.ok) { throw new Error("Không lấy được giỏ hàng");
        }
        const gioHangData = await gioHangResponse.json();
        setGioHangId(gioHangData.id);
        const detailResponse = await fetch(
            `${API}/gio-hang/${gioHangData.id}/chi-tiet`
        );
        if (!detailResponse.ok) { throw new Error("Không lấy được chi tiết giỏ hàng");
        }
        const details = await detailResponse.json();
        if (!Array.isArray(details)) { setGioHang([]);
            return gioHangData.id;
        }
        const cartFrontend = details .map((detail) => {
            const spct = detail?.sanPhamChiTiet;
            const sanPham = danhSachSanPham.find(
                    (sp) => sp.id === spct?.sanPham?.id ) ||
                spct?.sanPham || null;
            return { id: detail.id,
                variantId: spct?.id, sanPham,
                chiTiet: spct, soLuong: detail.soLuong,
            };
        }) .filter((item) => item.variantId && item.sanPham);
        setGioHang(cartFrontend);
        return gioHangData.id;
    } catch (error) { console.error("Lỗi tải giỏ hàng:", error);
        setGioHang([]);
        setGioHangId(null);
        return null;
    }
    };
    const layKhachHangId = async (taiKhoanHienTai = taiKhoan) => {
        const idCoSan = Number(taiKhoanHienTai?.khachHangId || 0);
        if (idCoSan > 0) return idCoSan;

        const taiKhoanId = Number(taiKhoanHienTai?.id || 0);
        if (!taiKhoanId) return null;

        try {
            const response = await fetch(
                `${API}/khach-hang/tai-khoan/${taiKhoanId}/id`
            );

            if (!response.ok) return null;

            const khachHangId = await response.json();
            return Number(khachHangId || 0) || null;
        } catch (error) {
            console.error("Lỗi lấy ID khách hàng:", error);
            return null;
        }
    };

    const taiYeuThich = async (taiKhoanHienTai = taiKhoan) => {
        const vaiTro = String(
            taiKhoanHienTai?.vaiTro || ""
        ).toUpperCase();

        if (!taiKhoanHienTai || vaiTro !== "KHACH_HANG") {
            setYeuThichIds([]);
            return;
        }

        const khachHangId = await layKhachHangId(taiKhoanHienTai);

        if (!khachHangId) {
            setYeuThichIds([]);
            return;
        }

        try {
            const response = await fetch(
                `${API}/yeu-thich/khach-hang/${khachHangId}`
            );

            if (!response.ok) {
                throw new Error("Không thể tải sản phẩm yêu thích");
            }

            const data = await response.json();

            setYeuThichIds(
                Array.isArray(data)
                    ? data.map((id) => Number(id))
                    : []
            );
        } catch (error) {
            console.error("Lỗi tải sản phẩm yêu thích:", error);
            setYeuThichIds([]);
        }
    };

    const moTrangYeuThich = () => {
        if (!taiKhoan) {
            setPage("login");
            return;
        }

        if (
            String(taiKhoan.vaiTro || "").toUpperCase() !==
            "KHACH_HANG"
        ) {
            alert("Chỉ khách hàng mới có danh sách yêu thích.");
            return;
        }

        setPage("favorites");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleYeuThich = async (sanPhamId) => {
        if (!taiKhoan) {
            setPage("login");
            return false;
        }

        if (
            String(taiKhoan.vaiTro || "").toUpperCase() !==
            "KHACH_HANG"
        ) {
            alert("Chỉ khách hàng mới có thể lưu sản phẩm yêu thích.");
            return false;
        }

        const khachHangId = await layKhachHangId(taiKhoan);

        if (!khachHangId) {
            alert("Không xác định được khách hàng.");
            return false;
        }

        const dangYeuThich = yeuThichIds.includes(Number(sanPhamId));

        try {
            const response = await fetch(
                `${API}/yeu-thich/khach-hang/${khachHangId}/san-pham/${sanPhamId}`,
                {
                    method: dangYeuThich ? "DELETE" : "POST",
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
                    "Không thể cập nhật yêu thích"
                );
            }

            const ids = Array.isArray(data)
                ? data.map((id) => Number(id))
                : [];

            setYeuThichIds(ids);

            showToast(
                dangYeuThich
                    ? "Đã bỏ khỏi yêu thích"
                    : "Đã thêm vào yêu thích"
            );

            return true;
        } catch (error) {
            console.error("Lỗi cập nhật yêu thích:", error);
            alert(
                error.message ||
                "Không thể cập nhật sản phẩm yêu thích"
            );
            return false;
        }
    };


    const xoaTatCaYeuThich = async () => {
        if (!taiKhoan) {
            setPage("login");
            return false;
        }

        if (
            String(taiKhoan.vaiTro || "").toUpperCase() !==
            "KHACH_HANG"
        ) {
            alert("Chỉ khách hàng mới có danh sách yêu thích.");
            return false;
        }

        if (yeuThichIds.length === 0) {
            return true;
        }

        const khachHangId = await layKhachHangId(taiKhoan);

        if (!khachHangId) {
            alert("Không xác định được khách hàng.");
            return false;
        }

        try {
            const ids = [...yeuThichIds];

            const ketQua = await Promise.all(
                ids.map(async (sanPhamId) => {
                    const response = await fetch(
                        `${API}/yeu-thich/khach-hang/${khachHangId}/san-pham/${sanPhamId}`,
                        {
                            method: "DELETE",
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            `Không thể xóa sản phẩm ${sanPhamId} khỏi yêu thích`
                        );
                    }

                    return true;
                })
            );

            if (ketQua.length > 0) {
                setYeuThichIds([]);
                showToast("Đã xóa tất cả sản phẩm yêu thích");
            }

            return true;
        } catch (error) {
            console.error("Lỗi xóa tất cả yêu thích:", error);
            alert(
                error.message ||
                "Không thể xóa tất cả sản phẩm yêu thích"
            );
            return false;
        }
    };

    const xuLyDangNhapThanhCong = async (data) => { const vaiTro = String(data?.vaiTro || "").toUpperCase();
        setTaiKhoan(data);
        localStorage.setItem("taiKhoan", JSON.stringify(data));
        if (vaiTro === "QUAN_TRI") { setPage("admin");
            return;
        }
        if (vaiTro === "NHAN_VIEN" || vaiTro === "NHÂN_VIÊN") { setPage("employee");
            return;
        }
        setPage("home");
    };
    useEffect(() => { if (
        taiKhoan && String(taiKhoan.vaiTro || "").toUpperCase() === "KHACH_HANG" &&
        sanPhams.length > 0 ) {
        taiGioHang(taiKhoan, sanPhams);
    }
    }, [taiKhoan, sanPhams]);

    useEffect(() => {
        taiYeuThich(taiKhoan);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taiKhoan]);
    const dangXuat = () => { localStorage.removeItem("taiKhoan");
        setTaiKhoan(null);
        setGioHang([]);
        setYeuThichIds([]);
        setPage("home");
    };
    const taiSanPham = async () => { try {
        setLoading(true);
        const response = await fetch(`${API}/san-pham`);
        if (!response.ok) { throw new Error("Không thể lấy danh sách sản phẩm");
        }
        const data = await response.json();
        const danhSach = Array.isArray(data) ? data : [];
        const sanPhamCoGia = await Promise.all( danhSach.map(async (sanPham) => {
            try { const detailResponse = await fetch(
                `${API}/san-pham/${sanPham.id}/chi-tiet`
            );
                if (!detailResponse.ok) { return {
                    ...sanPham, chiTiets: [],
                    giaBan: null, };
                }
                const details = await detailResponse.json();
                return { ...sanPham,
                    chiTiets: Array.isArray(details) ? details : [], giaBan:
                        Array.isArray(details) && details.length > 0
                            ? details[0].giaBan : null,
                };
            } catch { return {
                ...sanPham, chiTiets: [],
                giaBan: null, };
            }
        }) );
        setSanPhams(sanPhamCoGia);
    } catch (error) { console.error(error);
        setSanPhams([]);
    } finally { setLoading(false);
    }
    };
    useEffect(() => { taiSanPham();
    }, []);
// Cập nhật dữ liệu khi quay lại từ Admin hoặc đổi tab
    useEffect(() => { taiDanhMucThuongHieu();
        const truoc = trangTruoc.current;
        if ( (truoc === "admin" || truoc === "employee") &&
            page !== "admin" && page !== "employee"
        ) { taiSanPham();
        }
        trangTruoc.current = page;
        const onFocus = () => { taiDanhMucThuongHieu();
            if (page !== "admin" && page !== "employee") { taiSanPham();
            }
        };
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);
    const showToast = (message) => { setToast(message);
        setTimeout(() => { setToast("");
        }, 2000);
    };
    const xemSanPham = async (sanPham) => { try {
        const response = await fetch(
            `${API}/san-pham/${sanPham.id}/chi-tiet`
        );
        let chiTiets = [];
        if (response.ok) { const data = await response.json();
            chiTiets = Array.isArray(data) ? data : [];
        }
        setSelectedProduct({ ...sanPham,
            chiTiets, });
        setPage("detail");
        window.scrollTo({ top: 0,
            behavior: "smooth", });
    } catch (error) { console.error(error);
        setSelectedProduct({ ...sanPham,
            chiTiets: sanPham.chiTiets || [], });
        setPage("detail");
    }
    };
    const themVaoGio = async (sanPham, chiTiet = null, soLuong = 1) => { if (!taiKhoan) {
        setPage("login");
        return false;
    }
        if (String(taiKhoan.vaiTro || "").toUpperCase() !== "KHACH_HANG") {
            alert("Chỉ khách hàng mới có thể thêm sản phẩm vào giỏ");
            return false;
        }
        if (!chiTiet?.id) { alert("Sản phẩm chưa có biến thể để mua");
            return false;
        }
        const variantId = chiTiet.id;
        const tonKho = Number(chiTiet.soLuongTon ?? 0);
        if (tonKho <= 0) { alert("Sản phẩm đã hết hàng");
            return false;
        }
        let currentGioHangId = gioHangId;
        if (!currentGioHangId) { currentGioHangId = await taiGioHang(taiKhoan, sanPhams);
        }
        if (!currentGioHangId) { alert("Không thể khởi tạo giỏ hàng");
            return false;
        }
        const soLuongThem = Math.max(1, Number(soLuong) || 1);
        const existing = gioHang.find( (item) => item.variantId === variantId
        );
        try { if (existing) {
            const soLuongMoi = existing.soLuong + soLuongThem;
            if (soLuongMoi > tonKho) {
                alert(`Sản phẩm chỉ còn ${tonKho} sản phẩm trong kho`);
                return false;
            }
            const response = await fetch(
                `${API}/gio-hang/chi-tiet/${existing.id}`,
                {
                    method: "PUT", headers: {
                        "Content-Type": "application/json", },
                    body: JSON.stringify({ gioHang: { id: currentGioHangId },
                        sanPhamChiTiet: { id: variantId }, soLuong: soLuongMoi,
                    }), }
            );
            if (!response.ok) { const text = await response.text();
                throw new Error(text || "Không thể cập nhật giỏ hàng");
            }
            setGioHang((oldCart) => oldCart.map((item) =>
                item.variantId === variantId ? { ...item, soLuong: soLuongMoi }
                    : item )
            );
            showToast("Đã cập nhật số lượng");
            return true;
        }
            const soLuongMoi = Math.min(soLuongThem, tonKho);
            const response = await fetch(`${API}/gio-hang/chi-tiet`, {
                method: "POST", headers: {
                    "Content-Type": "application/json", },
                body: JSON.stringify({ gioHang: { id: currentGioHangId },
                    sanPhamChiTiet: { id: variantId }, soLuong: soLuongMoi,
                }), });
            const text = await response.text();
            let data = null;
            try { data = text ? JSON.parse(text) : null;
            } catch { data = null;
            }
            if (!response.ok) { throw new Error(
                data?.message || data?.error ||
                text || "Không thể thêm sản phẩm vào giỏ"
            );
            }
            setGioHang((oldCart) => [ ...oldCart,
                {
                    id: data.id, variantId,
                    sanPham, chiTiet: data.sanPhamChiTiet || chiTiet,
                    soLuong: data.soLuong, },
            ]);
            showToast("Đã thêm sản phẩm vào giỏ hàng");
            return true;
        } catch (error) { console.error("Lỗi thêm sản phẩm vào giỏ:", error);
            alert(error.message || "Không thể thêm sản phẩm vào giỏ");
            return false;
        }
    };
    const tangSoLuong = async (variantId) => {
        const item = gioHang.find((i) => i.variantId === variantId);
        if (!item) return;
        const tonKho = Number(item.chiTiet?.soLuongTon ?? 0);
        const soLuongMoi = item.soLuong + 1;
        if (tonKho > 0 && soLuongMoi > tonKho) {
            alert(`Sản phẩm chỉ còn ${tonKho} sản phẩm trong kho`);
            return;
        }
        try {
            const response = await fetch(`${API}/gio-hang/chi-tiet/${item.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gioHang: { id: gioHangId },
                    sanPhamChiTiet: { id: variantId },
                    soLuong: soLuongMoi,
                }),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Không thể tăng số lượng");
            }
            setGioHang((oldCart) => oldCart.map((cartItem) =>
                cartItem.variantId === variantId ? { ...cartItem, soLuong: soLuongMoi } : cartItem
            ));
        } catch (error) {
            console.error("Lỗi tăng số lượng:", error);
            alert(error.message || "Không thể tăng số lượng");
        }
    };

    const giamSoLuong = async (variantId) => {
        const item = gioHang.find((i) => i.variantId === variantId);
        if (!item) return;
        if (item.soLuong <= 1) { await xoaKhoiGio(variantId); return; }
        const soLuongMoi = item.soLuong - 1;
        try {
            const response = await fetch(`${API}/gio-hang/chi-tiet/${item.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gioHang: { id: gioHangId },
                    sanPhamChiTiet: { id: variantId },
                    soLuong: soLuongMoi,
                }),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Không thể giảm số lượng");
            }
            setGioHang((oldCart) => oldCart.map((cartItem) =>
                cartItem.variantId === variantId ? { ...cartItem, soLuong: soLuongMoi } : cartItem
            ));
        } catch (error) {
            console.error("Lỗi giảm số lượng:", error);
            alert(error.message || "Không thể giảm số lượng");
        }
    };

    const xoaKhoiGio = async (variantId) => {
        const item = gioHang.find((i) => i.variantId === variantId);
        if (!item) return;
        try {
            const response = await fetch(`${API}/gio-hang/chi-tiet/${item.id}`, { method: "DELETE" });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Không thể xóa sản phẩm khỏi giỏ");
            }
            setGioHang((oldCart) => oldCart.filter((cartItem) => cartItem.variantId !== variantId));
            setSelectedVariantIds((prev) => prev.filter((id) => id !== variantId));
            showToast("Đã xóa sản phẩm khỏi giỏ");
        } catch (error) {
            console.error("Lỗi xóa sản phẩm khỏi giỏ:", error);
            alert(error.message || "Không thể xóa sản phẩm khỏi giỏ");
        }
    };

    /* ⭐ Cập nhật số lượng trực tiếp (dùng cho input gõ tay) */
    const capNhatSoLuong = async (itemId, variantId, soLuongMoi) => {
        const soLuong = Math.max(1, Number(soLuongMoi) || 1);
        try {
            const response = await fetch(`${API}/gio-hang/chi-tiet/${itemId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gioHang: { id: gioHangId },
                    sanPhamChiTiet: { id: variantId },
                    soLuong,
                }),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Không thể cập nhật số lượng");
            }
            setGioHang((oldCart) => oldCart.map((i) =>
                i.variantId === variantId ? { ...i, soLuong } : i
            ));
            return true;
        } catch (error) {
            console.error("Lỗi cập nhật số lượng:", error);
            alert(error.message || "Không thể cập nhật số lượng");
            return false;
        }
    };

    /* ⭐ Cập nhật biến thể (màu/size) trong giỏ
       - Nếu variant mới trùng item khác đã có → gộp số lượng
       - Nếu chưa có → xóa cũ, thêm mới
    */
    const capNhatBienThe = async (variantIdCu, chiTietMoi, soLuongMoi) => {
        const itemCu = gioHang.find((i) => i.variantId === variantIdCu);
        if (!itemCu) return false;
        if (!chiTietMoi?.id) { alert("Biến thể không hợp lệ"); return false; }

        const soLuong = Math.max(1, Number(soLuongMoi) || 1);
        const tonKhoMoi = Number(chiTietMoi.soLuongTon ?? 0);
        if (tonKhoMoi > 0 && soLuong > tonKhoMoi) {
            alert(`Sản phẩm chỉ còn ${tonKhoMoi} trong kho`);
            return false;
        }

        /* Chỉ đổi số lượng */
        if (chiTietMoi.id === variantIdCu) {
            if (soLuong === itemCu.soLuong) return true;
            return await capNhatSoLuong(itemCu.id, variantIdCu, soLuong);
        }

        /* Variant đổi */
        const itemTrung = gioHang.find((i) => i.variantId === chiTietMoi.id);

        try {
            if (itemTrung) {
                /* Gộp số lượng vào item trùng, xóa item cũ */
                const soLuongGop = itemTrung.soLuong + soLuong;
                if (tonKhoMoi > 0 && soLuongGop > tonKhoMoi) {
                    alert(`Sản phẩm chỉ còn ${tonKhoMoi} trong kho`);
                    return false;
                }
                const r1 = await fetch(`${API}/gio-hang/chi-tiet/${itemTrung.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        gioHang: { id: gioHangId },
                        sanPhamChiTiet: { id: chiTietMoi.id },
                        soLuong: soLuongGop,
                    }),
                });
                if (!r1.ok) throw new Error("Không thể cập nhật giỏ hàng");
                const r2 = await fetch(`${API}/gio-hang/chi-tiet/${itemCu.id}`, { method: "DELETE" });
                if (!r2.ok) throw new Error("Không thể xóa sản phẩm cũ");

                setGioHang((old) => old
                    .filter((i) => i.variantId !== variantIdCu)
                    .map((i) => i.variantId === chiTietMoi.id ? { ...i, soLuong: soLuongGop } : i)
                );
                setSelectedVariantIds((prev) => {
                    const next = prev.filter((id) => id !== variantIdCu);
                    if (!next.includes(chiTietMoi.id)) next.push(chiTietMoi.id);
                    return next;
                });
            } else {
                /* Xóa cũ + thêm mới */
                const r1 = await fetch(`${API}/gio-hang/chi-tiet/${itemCu.id}`, { method: "DELETE" });
                if (!r1.ok) throw new Error("Không thể xóa sản phẩm cũ");

                const r2 = await fetch(`${API}/gio-hang/chi-tiet`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        gioHang: { id: gioHangId },
                        sanPhamChiTiet: { id: chiTietMoi.id },
                        soLuong,
                    }),
                });
                const text = await r2.text();
                let data = null;
                try { data = text ? JSON.parse(text) : null; } catch { data = null; }
                if (!r2.ok) throw new Error(data?.message || data?.error || text || "Không thể cập nhật");

                setGioHang((old) => old.map((i) => i.variantId === variantIdCu
                    ? {
                        ...i,
                        id: data?.id ?? i.id,
                        variantId: chiTietMoi.id,
                        chiTiet: data?.sanPhamChiTiet || chiTietMoi,
                        soLuong: data?.soLuong || soLuong,
                    }
                    : i
                ));
                setSelectedVariantIds((prev) => prev.map((id) => id === variantIdCu ? chiTietMoi.id : id));
            }
            showToast("Đã cập nhật sản phẩm");
            return true;
        } catch (err) {
            console.error("Lỗi cập nhật biến thể:", err);
            alert(err.message || "Không thể cập nhật sản phẩm");
            return false;
        }
    };

    const tongSoLuong = gioHang.reduce( (total, item) => total + item.soLuong,
        0 );
    const tongTien = gioHang.reduce((total, item) => { const gia =
        item.chiTiet?.giaBan || item.sanPham?.giaBan ||
        0;
        return total + Number(gia) * item.soLuong;
    }, 0);
    if (page === "admin") { const vaiTro = String(taiKhoan?.vaiTro || "").toUpperCase();
        if (vaiTro === "QUAN_TRI") { return <AdminDashboard dangXuat={dangXuat} />;
        }
        if (vaiTro === "NHAN_VIEN" || vaiTro === "NHÂN_VIÊN") { return (
            <EmployeeDashboard
                taiKhoan={taiKhoan}
                dangXuat={dangXuat}
                onBackToShop={() => setPage("home")}
            /> );
        }
        return ( <Login
            setPage={setPage}
            onLoginSuccess={xuLyDangNhapThanhCong}
        /> );
    }
    if (page === "employee") { const vaiTro = String(taiKhoan?.vaiTro || "").toUpperCase();
        if (vaiTro !== "NHAN_VIEN" && vaiTro !== "NHÂN_VIÊN") { return (
            <Login
                setPage={setPage}
                onLoginSuccess={xuLyDangNhapThanhCong}
            /> );
        }
        return ( <EmployeeDashboard
            taiKhoan={taiKhoan}
            dangXuat={dangXuat}
            onBackToShop={() => setPage("home")}
        /> );
    }
    if (page === "login") { return (
        <Login
            setPage={setPage}
            onLoginSuccess={xuLyDangNhapThanhCong}
        /> );
    }
    if (page === "register") { return <Register setPage={setPage} />;
    }
    const gioHangDuocChon = gioHang.filter((item) =>
        selectedVariantIds.includes(item.variantId)
    );

    const tongTienDuocChon = gioHangDuocChon.reduce((total, item) => {
        const gia = item.chiTiet?.giaBan || item.sanPham?.giaBan || 0;
        return total + Number(gia) * item.soLuong;
    }, 0);

    return ( <div className="fshop">
        <Header
            page={page}
            setPage={setPage}
            search={search}
            setSearch={setSearch}
            tongSoLuong={tongSoLuong}
            taiKhoan={taiKhoan}
            dangXuat={dangXuat}
            thuongHieuList={thuongHieuList}
            danhMucList={danhMucList}
            chonThuongHieu={chonThuongHieu}
            chonDanhMuc={chonDanhMuc}
            yeuThichCount={yeuThichIds.length}
            moTrangYeuThich={moTrangYeuThich}
        />
        {page === "home" && ( <Home
            sanPhams={sanPhams}
            loading={loading}
            xemSanPham={xemSanPham}
            themVaoGio={themVaoGio}
            setPage={setPage}
            thuongHieuList={thuongHieuList}
            danhMucList={danhMucList}
            chonThuongHieu={chonThuongHieu}
            chonDanhMuc={chonDanhMuc}
            yeuThichIds={yeuThichIds}
            toggleYeuThich={toggleYeuThich}
        /> )}
        {page === "products" && ( <ProductList
            sanPhams={sanPhams}
            loading={loading}
            search={search}
            setSearch={setSearch}
            xemSanPham={xemSanPham}
            themVaoGio={themVaoGio}
            thuongHieuList={thuongHieuList}
            danhMucList={danhMucList}
            brand={locBrand}
            setBrand={setLocBrand}
            danhMucLoc={locDanhMuc}
            setDanhMucLoc={setLocDanhMuc}
            yeuThichIds={yeuThichIds}
            toggleYeuThich={toggleYeuThich}
        /> )}
        {page === "detail" && selectedProduct && ( <ProductDetail
            sanPham={selectedProduct}
            themVaoGio={themVaoGio}
            setPage={setPage}
        /> )}
        {page === "cart" && ( <Cart
            gioHang={gioHang}
            tongTien={tongTien}
            tangSoLuong={tangSoLuong}
            giamSoLuong={giamSoLuong}
            xoaKhoiGio={xoaKhoiGio}
            setPage={setPage}
            taiKhoan={taiKhoan}
            selectedVariantIds={selectedVariantIds}
            setSelectedVariantIds={setSelectedVariantIds}
            capNhatSoLuong={capNhatSoLuong}
            capNhatBienThe={capNhatBienThe}
        /> )}
        {page === "orders" && ( <OrderHistory
            taiKhoan={taiKhoan}
            setPage={setPage}
        /> )}
        {page === "favorites" && (
            <FavoriteProducts
                sanPhams={sanPhams}
                yeuThichIds={yeuThichIds}
                loading={loading}
                xemSanPham={xemSanPham}
                themVaoGio={themVaoGio}
                toggleYeuThich={toggleYeuThich}
                xoaTatCaYeuThich={xoaTatCaYeuThich}
                setPage={setPage}
            />
        )}
        {page === "khuyen-mai" && ( <KhuyenMai setPage={setPage} />
        )}
        {page === "contact" && ( <Contact setPage={setPage} /> )}
        {page === "checkout" && ( <Checkout
            gioHang={gioHangDuocChon}
            tatCaGioHang={gioHang}
            gioHangId={gioHangId}
            tongTien={tongTienDuocChon}
            setPage={setPage}
            setGioHang={setGioHang}
            setSelectedVariantIds={setSelectedVariantIds}
        /> )}
        <Footer setPage={setPage} />

        {/* Chatbot FShop của Team: chỉ hiện với khách hàng/người dùng thường,
            không hiện trong màn hình quản trị hoặc nhân viên. */}
        {!["QUAN_TRI", "NHAN_VIEN", "NHÂN_VIÊN"].includes(
            String(taiKhoan?.vaiTro || "").toUpperCase()
        ) && (
            <ChatWidget
                taiKhoan={taiKhoan}
                setPage={setPage}
            />
        )}

        {toast && ( <div className="toast">
            <span>✓</span>
            {toast}
        </div> )}
    </div> );
}
function Header({
                    page,
                    setPage,
                    search,
                    setSearch,
                    tongSoLuong,
                    taiKhoan,
                    dangXuat,
                    thuongHieuList = [],
                    danhMucList = [],
                    chonThuongHieu,
                    chonDanhMuc,
                    yeuThichCount = 0,
                    moTrangYeuThich,
                }) {
    const [menuMo, setMenuMo] = useState(null);

    const submitSearch = () => {
        setPage("products");
        setMenuMo(null);
    };

    const vaiTro = String(taiKhoan?.vaiTro || "").toUpperCase();

    return (
        <header className="site-header" onMouseLeave={() => setMenuMo(null)}>
            <div className="container site-header-inner">
                <button
                    type="button"
                    className="site-logo"
                    onClick={() => setPage("home")}
                    aria-label="FShop - Trang chủ"
                >
                    <span className="site-logo-box">F</span>
                    <span className="site-logo-name">FShop</span>
                </button>

                <nav className="site-nav">
                    <button
                        type="button"
                        className={page === "home" ? "site-nav-link active" : "site-nav-link"}
                        onClick={() => setPage("home")}
                    >
                        Trang chủ
                    </button>
                    <button
                        type="button"
                        className={page === "products" ? "site-nav-link active" : "site-nav-link"}
                        onClick={() => setPage("products")}
                    >
                        Sản phẩm
                    </button>
                    <button
                        type="button"
                        className={menuMo === "danhmuc" ? "site-nav-link active" : "site-nav-link"}
                        onClick={() => setMenuMo(menuMo === "danhmuc" ? null : "danhmuc")}
                    >
                        Danh mục <span className="nav-chevron">⌄</span>
                    </button>
                    <button
                        type="button"
                        className={menuMo === "thuonghieu" ? "site-nav-link active" : "site-nav-link"}
                        onClick={() => setMenuMo(menuMo === "thuonghieu" ? null : "thuonghieu")}
                    >
                        Thương hiệu
                    </button>
                    <button
                        type="button"
                        className={page === "khuyen-mai" ? "site-nav-link active" : "site-nav-link"}
                        onClick={() => setPage("khuyen-mai")}
                    >
                        Khuyến mãi
                    </button>
                    <button
                        type="button"
                        className={page === "contact" ? "site-nav-link active" : "site-nav-link"}
                        onClick={() => {
                            setMenuMo(null);
                            setPage("contact");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                    >
                        Liên hệ
                    </button>
                </nav>

                <form
                    className="site-search"
                    onSubmit={(e) => {
                        e.preventDefault();
                        submitSearch();
                    }}
                >
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm, thương hiệu, danh mục..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" aria-label="Tìm kiếm">⌕</button>
                </form>

                <div className="site-actions">
                    {vaiTro === "QUAN_TRI" && (
                        <button
                            type="button"
                            className="site-action admin"
                            onClick={() => setPage("admin")}
                        >
                            Admin
                        </button>
                    )}

                    {(vaiTro === "NHAN_VIEN" || vaiTro === "NHÂN_VIÊN") && (
                        <button
                            type="button"
                            className="site-action admin"
                            onClick={() => setPage("employee")}
                        >
                            Nhân viên
                        </button>
                    )}

                    {!taiKhoan ? (
                        <>
                            <button
                                type="button"
                                className="site-action login"
                                onClick={() => setPage("login")}
                            >
                                Đăng nhập
                            </button>
                            <button
                                type="button"
                                className="site-action register"
                                onClick={() => setPage("register")}
                            >
                                Đăng ký
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="site-user">
                                <span className="site-user-icon">♙</span>
                                <span>
                                    <small>Tài khoản</small>
                                    <strong>{taiKhoan.tenDangNhap}</strong>
                                </span>
                            </div>
                            <button
                                type="button"
                                className="site-action logout"
                                onClick={dangXuat}
                            >
                                Đăng xuất
                            </button>
                        </>
                    )}

                    <button
                        type="button"
                        className={`site-action mini-action favorite-header-action ${page === "favorites" ? "active" : ""}`}
                        onClick={moTrangYeuThich}
                    >
                        <span className="mini-icon">
                            {yeuThichCount > 0 ? "♥" : "♡"}
                            {yeuThichCount > 0 && (
                                <b className="favorite-header-count">
                                    {yeuThichCount}
                                </b>
                            )}
                        </span>
                        <span>
                            <small>Yêu thích</small>
                            <strong>{yeuThichCount} sản phẩm</strong>
                        </span>
                    </button>

                    {vaiTro === "KHACH_HANG" && (
                        <button
                            type="button"
                            className={`site-action mini-action order-action ${page === "orders" ? "active" : ""}`}
                            onClick={() => setPage("orders")}
                        >
                            <span className="mini-icon">📦</span>
                            <span>
                                <small>Đơn hàng</small>
                                <strong>Trạng thái</strong>
                            </span>
                        </button>
                    )}

                    <button
                        type="button"
                        className="site-action mini-action cart-action"
                        onClick={() => setPage("cart")}
                    >
                        <span className="mini-icon cart-mini-icon">
                            🛒
                            {tongSoLuong > 0 && <b>{tongSoLuong}</b>}
                        </span>
                        <span>
                            <small>Giỏ hàng</small>
                            <strong>{tongSoLuong} sản phẩm</strong>
                        </span>
                    </button>
                </div>
            </div>

            {menuMo && (
                <div className="site-mega-menu">
                    <div className="container">
                        {menuMo === "thuonghieu" && (
                            thuongHieuList.length === 0 ? (
                                <p className="mega-empty">Chưa có thương hiệu nào.</p>
                            ) : (
                                <div className="mega-grid mega-brand-grid">
                                    {thuongHieuList.map((th) => {
                                        const tenHienThi =
                                            String(th.tenThuongHieu || "").trim().toLowerCase() === "post"
                                                ? "Adidas"
                                                : th.tenThuongHieu;

                                        return (
                                            <button
                                                type="button"
                                                key={th.id}
                                                className="mega-brand"
                                                title={tenHienThi}
                                                onClick={() => {
                                                    setMenuMo(null);
                                                    chonThuongHieu(
                                                        String(th.tenThuongHieu || "").trim().toLowerCase() === "post"
                                                            ? "adidas"
                                                            : th.tenThuongHieu
                                                    );
                                                }}
                                            >
                                                {th.hinhAnh ? (
                                                    <img src={anhUrl(th.hinhAnh)} alt={tenHienThi} />
                                                ) : (
                                                    <span className="mega-brand-text">{tenHienThi}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )
                        )}

                        {menuMo === "danhmuc" && (
                            danhMucList.length === 0 ? (
                                <p className="mega-empty">Chưa có danh mục nào.</p>
                            ) : (
                                <div className="mega-grid mega-category-grid">
                                    {danhMucList.map((dm) => (
                                        <button
                                            type="button"
                                            key={dm.id}
                                            className="mega-category"
                                            onClick={() => {
                                                setMenuMo(null);
                                                chonDanhMuc(dm.tenDanhMuc);
                                            }}
                                        >
                                            <span className="mega-category-img">
                                                {dm.hinhAnh ? (
                                                    <img src={anhUrl(dm.hinhAnh)} alt={dm.tenDanhMuc} />
                                                ) : (
                                                    <span>▤</span>
                                                )}
                                            </span>
                                            <span className="mega-category-name">{dm.tenDanhMuc}</span>
                                        </button>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
function Home({ sanPhams,
                  loading, xemSanPham,
                  themVaoGio, setPage,
                  thuongHieuList = [], danhMucList = [],
                  chonThuongHieu, chonDanhMuc,
                  yeuThichIds = [],
                  toggleYeuThich = () => {},
              }) { const [heroIndex, setHeroIndex] = useState(0);
    useEffect(() => { const timer = setInterval(() => {
        setHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 4500);
        return () => clearInterval(timer);
    }, []);
    const hero = heroSlides[heroIndex];
    const nextHero = () => setHeroIndex((current) => (current + 1) % heroSlides.length);
    const prevHero = () => setHeroIndex((current) => (current - 1 + heroSlides.length) % heroSlides.length);
    return ( <>
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
                        </div> ))}
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
                {dichVu.map((item) => ( <div
                    className="service-card" key={item.title}
                >
                    <div className="service-card-icon">
                        {item.icon}
                    </div>
                    <div>
                        <strong>{item.title}</strong>
                        <p>{item.desc}</p>
                    </div>
                </div> ))}
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
                        className="view-all" onClick={() => setPage("products")}
                    >
                        Xem tất cả →
                    </button>
                </div>
                <div className="category-grid">
                    {(danhMucList.length > 0 ? danhMucList.slice(0, 4).map((dm, i) => ({
                            ten: dm.tenDanhMuc, moTa: dm.moTa || "",
                            anh: dm.hinhAnh ? anhUrl(dm.hinhAnh) : danhMuc[i % danhMuc.length].anh,
                        })) : danhMuc
                    ).map((item) => ( <div
                        className="category-card" key={item.ten}
                        onClick={() => chonDanhMuc(item.ten)}
                        style={{ cursor: "pointer" }}
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    chonDanhMuc(item.ten);
                                }}
                            >
                                →
                            </button>
                        </div>
                    </div> ))}
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
                        className="view-all" onClick={() => setPage("products")}
                    >
                        Xem tất cả →
                    </button>
                </div>
                {loading ? ( <Loading />
                ) : ( <div className="product-grid">
                    {sanPhams .slice(0, 4)
                        .map((sp, index) => ( <ProductCard
                            key={sp.id}
                            sanPham={sp}
                            index={index}
                            xemSanPham={xemSanPham}
                            themVaoGio={themVaoGio}
                            isFavorite={yeuThichIds.includes(Number(sp.id))}
                            toggleYeuThich={toggleYeuThich}
                        /> ))}
                </div> )}
            </div>
        </section>
        <section className="container promotion-section">
            <div className="promotion-main">
                <img
                    src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1400&q=85"
                    alt="Khuyến mãi" />
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
                    alt="Bộ sưu tập" />
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
                    alt="Freeship" />
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
                    {(thuongHieuList.length > 0 ? thuongHieuList
                            : thuongHieu.map((ten) => ({ id: ten, tenThuongHieu: ten }))
                    ).map((brand) => {
                        const tenHienThi =
                            String(brand.tenThuongHieu || "").trim().toLowerCase() === "post"
                                ? "Adidas"
                                : brand.tenThuongHieu;

                        return (
                            <div
                                className="brand-card"
                                key={brand.id}
                                onClick={() => chonThuongHieu(brand.tenThuongHieu)}
                                style={{ cursor: "pointer" }}
                            >
                                {brand.hinhAnh ? (
                                    <img
                                        src={anhUrl(brand.hinhAnh)}
                                        alt={tenHienThi}
                                        style={{
                                            maxWidth: "80%",
                                            maxHeight: "44px",
                                            objectFit: "contain"
                                        }}
                                    />
                                ) : (
                                    tenHienThi
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    </> );
}
function ProductCard({ sanPham,
                         index, xemSanPham,
                         themVaoGio, selectedColor = "",
                         selectedSize = "",
                         isFavorite = false,
                         toggleYeuThich = () => {}, }) {
    const chiTiets = Array.isArray(sanPham?.chiTiets)
        ? sanPham.chiTiets.filter(isVariantHoatDong)
        : [];
    const normalize = (value) => String(value || "").trim().toLowerCase();
    const variant = chiTiets.find((item) => {
        const mau = normalize(item?.mauSac?.tenMau);
        const size = String(item?.kichCo?.tenKichCo || "");
        return ((!selectedColor || mau === normalize(selectedColor)) &&
            (!selectedSize || size === String(selectedSize)));
    }) || chiTiets[0] || null;
    const mauHienThi = selectedColor || variant?.mauSac?.tenMau || "";
    const anhHienThi = mauHienThi
        ? layAnhTheoMau(sanPham, mauHienThi)
        : layAnhSanPham(sanPham);
    const gia = variant?.giaBan ?? sanPham.giaBan ?? 0;
    const rating = (4.6 + (index % 4) * 0.1).toFixed(1);
    const reviewCount = 20 + index * 13;
    const sold = [1200, 856, 931, 1400, 640, 720, 1100, 950][index % 8];
    const soldText = sold >= 1000 ? `${(sold / 1000).toFixed(1).replace(".0", "")}k` : sold;
    return (
        <article className={`product-card ${index === 0 ? "is-featured" : ""}`}>
            <div className="product-image" onClick={() => xemSanPham(sanPham)}>
                <img
                    src={anhHienThi}
                    alt={sanPham.tenSanPham}
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=90";
                    }}
                />
                {index === 0 && <span className="best-seller-badge">🔥 Bán chạy</span>}
                <button
                    type="button"
                    className={`favorite ${isFavorite ? "active" : ""}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleYeuThich(sanPham.id);
                    }}
                    aria-label={
                        isFavorite
                            ? "Bỏ yêu thích"
                            : "Thêm vào yêu thích"
                    }
                    title={
                        isFavorite
                            ? "Bỏ yêu thích"
                            : "Thêm vào yêu thích"
                    }
                >
                    {isFavorite ? "♥" : "♡"}
                </button>
            </div>
            <div className="product-content">
                <div className="product-brand">{sanPham.thuongHieu?.tenThuongHieu || "FShop"}</div>
                <h3>{sanPham.tenSanPham}</h3>
                <div className="rating">
                    <span>★</span> {rating}
                    <small>({reviewCount})</small>
                    <i>|</i>
                    <small>Đã bán {soldText}</small>
                </div>
                <div className="price-row">
                    <strong>{formatGia(gia)}</strong>
                </div>
                <div className="product-buttons">
                    <button type="button" className="detail-button" onClick={() => xemSanPham(sanPham)}>
                        ◉&nbsp; Xem chi tiết
                    </button>
                    <button type="button" className="add-cart" onClick={() => themVaoGio(sanPham, variant)}>
                        🛒&nbsp; Thêm vào giỏ
                    </button>
                </div>
            </div>
        </article>
    );
}
function ProductList({ sanPhams,
                         loading, search,
                         setSearch, xemSanPham,
                         themVaoGio, thuongHieuList = [],
                         yeuThichIds = [],
                         toggleYeuThich = () => {},
                         danhMucList = [], brand = "Tất cả",
                         setBrand = () => {}, danhMucLoc = "Tất cả",
                         setDanhMucLoc = () => {}, }) {
    const [sort, setSort] = useState("default");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [selectedSize, setSelectedSize] = useState("");
    const normalizeText = (value) => String(value || "")
        .trim() .toLowerCase();
    const chiTietsHoatDong = sanPhams.flatMap((sp) => Array.isArray(sp?.chiTiets)
        ? sp.chiTiets.filter(isVariantHoatDong) : []
    );
    const colors = [ ...new Set(
        chiTietsHoatDong .map((item) => item?.mauSac?.tenMau)
            .filter(Boolean) ),
    ];
    const sizes = [ ...new Set(
        chiTietsHoatDong .map((item) => item?.kichCo?.tenKichCo)
            .filter(Boolean) ),
    ].sort((a, b) => { const numberA = Number(String(a).replace(",", "."));
        const numberB = Number(String(b).replace(",", "."));
        if (!Number.isNaN(numberA) && !Number.isNaN(numberB)) { return numberA - numberB;
        }
        return String(a).localeCompare(String(b), "vi");
    });
    const getColorStyle = (color) => { const variant = chiTietsHoatDong.find(
        (item) => normalizeText(item?.mauSac?.tenMau) ===
            normalizeText(color) );
        const maMau = variant?.mauSac?.maMau;
        if (/^#[0-9a-f]{6}$/i.test(maMau || "")) { return {
            backgroundColor: maMau,
            border: `1px solid ${maMau}`
        };
        }
        const mau = normalizeText(color);
        const map = [ ["đen", "#000"], ["den", "#000"], ["black", "#000"],
            ["trắng", "#fff"], ["trang", "#fff"], ["white", "#fff"],
            ["đỏ", "#d62828"], ["do", "#d62828"], ["red", "#d62828"],
            ["xanh dương", "#2563eb"], ["xanh lam", "#2563eb"], ["blue", "#2563eb"],
            ["xanh lá", "#4caf50"], ["xanh la", "#4caf50"], ["green", "#4caf50"],
            ["vàng", "#facc15"], ["vang", "#facc15"], ["yellow", "#facc15"],
            ["hồng", "#ec4899"], ["hong", "#ec4899"], ["pink", "#ec4899"],
            ["tím", "#a855f7"], ["tim", "#a855f7"], ["purple", "#a855f7"],
            ["xám", "#808080"], ["xam", "#808080"], ["gray", "#808080"], ["grey", "#808080"],
            ["nâu", "#795548"], ["nau", "#795548"], ["brown", "#795548"] ];
        const mauCoBan = map.find(([key]) => mau.includes(key))?.[1];
        return mauCoBan
            ? { backgroundColor: mauCoBan, border: `1px solid ${mauCoBan}` }
            : { backgroundColor: "#eee", border: "1px solid #ccc" };
    };
    const productHasVariant = (sanPham) => { const chiTiets = Array.isArray(sanPham?.chiTiets)
        ? sanPham.chiTiets.filter(isVariantHoatDong) : [];
        return chiTiets.some((chiTiet) => { const mau = chiTiet?.mauSac?.tenMau || "";
            const size = chiTiet?.kichCo?.tenKichCo || "";
            const matchColor = !selectedColor ||
                normalizeText(mau) === normalizeText(selectedColor);
            const matchSize = !selectedSize ||
                String(size) === String(selectedSize);
            return matchColor && matchSize;
        });
    };
    let products = sanPhams.filter((sp) => { const keyword = normalizeText(search);
        const tenSanPham = normalizeText(sp?.tenSanPham);
        const keywordMatch = !keyword || tenSanPham.includes(keyword);
        const productBrand = sp?.thuongHieu?.tenThuongHieu || "";
        const brandMatch = brand === "Tất cả" ||
            normalizeText(productBrand) === normalizeText(brand);
        const categoryMatch = danhMucLoc === "Tất cả" ||
            normalizeText(sp?.danhMuc?.tenDanhMuc) === normalizeText(danhMucLoc);
        const price = Number( sp?.giaBan ?? sp?.chiTiets?.[0]?.giaBan ?? 0
        );
        const minMatch = !minPrice || price >= Number(minPrice);
        const maxMatch = !maxPrice || price <= Number(maxPrice);
        return ( keywordMatch &&
            brandMatch && categoryMatch &&
            minMatch && maxMatch &&
            productHasVariant(sp) );
    });
    if (sort === "priceAsc") { products = [...products].sort(
        (a, b) => Number(a?.giaBan ?? a?.chiTiets?.[0]?.giaBan ?? 0) -
            Number(b?.giaBan ?? b?.chiTiets?.[0]?.giaBan ?? 0) );
    }
    if (sort === "priceDesc") { products = [...products].sort(
        (a, b) => Number(b?.giaBan ?? b?.chiTiets?.[0]?.giaBan ?? 0) -
            Number(a?.giaBan ?? a?.chiTiets?.[0]?.giaBan ?? 0) );
    }
    const clearFilters = () => { setBrand("Tất cả");
        setDanhMucLoc("Tất cả");
        setMinPrice("");
        setMaxPrice("");
        setSelectedColor("");
        setSelectedSize("");
        setSearch("");
        setSort("default");
    };
    const sizeAvailableWithColor = (size) => { if (!selectedColor) return true;
        return sanPhams.some((sp) => { const chiTiets = Array.isArray(sp?.chiTiets)
            ? sp.chiTiets.filter(isVariantHoatDong) : [];
            return chiTiets.some((chiTiet) => { const mau = chiTiet?.mauSac?.tenMau || "";
                const sizeValue = chiTiet?.kichCo?.tenKichCo || "";
                return ( normalizeText(mau) === normalizeText(selectedColor) &&
                    String(sizeValue) === String(size) );
            });
        });
    };
    return ( <main className="product-list-page">
        <div className="container">
            <div className="breadcrumb">
                Trang chủ / Sản phẩm
            </div>
            <div className="product-list-heading">
                <div>
                    <div className="product-list-breadcrumb-title">
                        <span>Trang chủ</span><b>›</b><span>Sản phẩm</span><b>›</b><strong>Giày nam</strong>
                    </div>
                    <h1>
                        {brand !== "Tất cả"
                            ? `Giày ${brand}`
                            : danhMucLoc !== "Tất cả" ? danhMucLoc
                                : "Giày nam"}
                    </h1>
                    <p>Khám phá bộ sưu tập giày nam phong cách, chất lượng tại FShop.</p>
                </div>
                <strong className="product-list-count">{products.length} sản phẩm</strong>
            </div>
            <div className="product-layout">
                <aside className="filter-sidebar">
                    <div className="filter-header">
                        <h3>Bộ lọc</h3>
                        {(brand !== "Tất cả" || danhMucLoc !== "Tất cả" ||
                            minPrice || maxPrice ||
                            selectedColor || selectedSize ||
                            search) && ( <button
                            type="button" className="clear-filter-button"
                            onClick={clearFilters}
                        >
                            Xóa lọc
                        </button> )}
                    </div>
                    <div className="filter-group">
                        <h4>Thương hiệu</h4>
                        <label>
                            <input
                                type="radio" checked={brand === "Tất cả"}
                                onChange={() => setBrand("Tất cả")}
                            />
                            <span>Tất cả</span>
                        </label>
                        {(thuongHieuList.length > 0
                                ? thuongHieuList.map((x) => x.tenThuongHieu)
                                : thuongHieu
                        ).map((item) => {
                            const tenHienThi =
                                String(item).trim().toLowerCase() === "post"
                                    ? "Adidas"
                                    : item;

                            const giaTriLoc =
                                String(item).trim().toLowerCase() === "post"
                                    ? "Adidas"
                                    : item;

                            return (
                                <label key={item}>
                                    <input
                                        type="radio"
                                        checked={brand === giaTriLoc}
                                        onChange={() => setBrand(giaTriLoc)}
                                    />
                                    <span>{tenHienThi}</span>
                                </label>
                            );
                        })}
                    </div>
                    {danhMucList.length > 0 && ( <div className="filter-group">
                        <h4>Danh mục</h4>
                        <label>
                            <input
                                type="radio"
                                checked={danhMucLoc === "Tất cả"}
                                onChange={() => setDanhMucLoc("Tất cả")}
                            />
                            <span>Tất cả</span>
                        </label>
                        {danhMucList.map((dm) => ( <label key={dm.id}>
                            <input
                                type="radio"
                                checked={danhMucLoc === dm.tenDanhMuc}
                                onChange={() => setDanhMucLoc(dm.tenDanhMuc)}
                            />
                            <span>{dm.tenDanhMuc}</span>
                        </label> ))}
                    </div> )}
                    <div className="filter-group color-filter-group">
                        <h4>
                            Màu sắc
                            {selectedColor && (
                                <span className="selected-filter-text">
                                        {selectedColor}
</span> )}
                        </h4>
                        <div className="filter-color-grid">
                            {colors.map((color) => { const active =
                                normalizeText(selectedColor) ===
                                normalizeText(color);
                                return ( <button
                                    key={color}
                                    type="button" className={
                                    active
                                        ? "filter-color-button active"
                                        : "filter-color-button"
                                }
                                    onClick={() =>
                                        setSelectedColor(
                                            active ? "" : color
                                        ) }
                                    title={color}
                                >
                                            <span
                                                className="filter-color-dot"
                                                style={getColorStyle(color)}
                                            />
                                    <span className="filter-color-name">
                                                {color}
                                            </span>
                                </button> );
                            })}
                        </div>
                    </div>
                    <div className="filter-group">
                        <h4>
                            Kích thước
                            {selectedSize && (
                                <span className="selected-filter-text">
                                        {selectedSize}
</span> )}
                        </h4>
                        <div className="filter-size-grid">
                            {sizes.map((size) => { const active =
                                String(selectedSize) === String(size);
                                const available =
                                    sizeAvailableWithColor(size);
                                return ( <button
                                    key={size}
                                    type="button"
                                    disabled={!available}
                                    className={`filter-size-button ${
                                        active ? "active" : "" } ${
                                        !available ? "disabled" : ""
                                    }`}
                                    onClick={() => {
                                        if (!available) return;
                                        setSelectedSize(
                                            active ? "" : size
                                        );
                                    }}
                                >
                                    {size}
                                </button> );
                            })}
                        </div>
                    </div>
                    <div className="filter-group">
                        <h4>Khoảng giá</h4>
                        <input
                            className="price-input" type="number"
                            min="0" placeholder="Giá từ"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)
                            }
                        />
                        <input
                            className="price-input" type="number"
                            min="0" placeholder="Giá đến"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)
                            }
                        />
                    </div>
                </aside>
                <section className="product-result">
                    <div className="product-toolbar">
                        <div className="search-result-box">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)
                                }
                                placeholder="Tìm kiếm sản phẩm..." />
                            <span>🔍</span>
                        </div>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                        >
                            <option value="default">Sắp xếp</option>
                            <option value="priceAsc">
                                Giá thấp → cao
                            </option>
                            <option value="priceDesc">
                                Giá cao → thấp
                            </option>
                        </select>
                    </div>
                    {(selectedColor || selectedSize ||
                        brand !== "Tất cả" || danhMucLoc !== "Tất cả" ||
                        minPrice || maxPrice) && (
                        <div className="active-filter-bar">
                                <span className="active-filter-title">
Đang lọc: </span>
                            {selectedColor && ( <button
                                type="button" onClick={() =>
                                setSelectedColor("") }
                            >
                                Màu: <strong>{selectedColor}</strong>
                                <span>×</span>
                            </button> )}
                            {selectedSize && ( <button
                                type="button"
                                onClick={() => setSelectedSize("")}
                            >
                                Size: <strong>{selectedSize}</strong>
                                <span>×</span>
                            </button> )}
                            {brand !== "Tất cả" && ( <button
                                type="button"
                                onClick={() => setBrand("Tất cả")}
                            >
                                Hãng: <strong>{brand}</strong>
                                <span>×</span>
                            </button> )}
                            {danhMucLoc !== "Tất cả" && ( <button
                                type="button"
                                onClick={() => setDanhMucLoc("Tất cả")}
                            >
                                Danh mục: <strong>{danhMucLoc}</strong>
                                <span>×</span>
                            </button> )}
                            {(minPrice || maxPrice) && ( <button
                                type="button" onClick={() => {
                                setMinPrice("");
                                setMaxPrice("");
                            }}
                            >
                                Giá <span>×</span>
                            </button> )}
                        </div> )}
                    {loading ? ( <Loading />
                    ) : products.length === 0 ? ( <div className="no-result">
                        <div>🔍</div>
                        <h3>Không tìm thấy sản phẩm</h3>
                        <p>
                            Không có sản phẩm phù hợp với bộ lọc hiện tại.
                        </p>
                        <button
                            type="button" className="reset-result-button"
                            onClick={clearFilters}
                        >
                            Xóa bộ lọc
                        </button>
                    </div> ) : (
                        <div className="product-grid list-grid">
                            {products.map((sp, index) => ( <ProductCard
                                key={sp.id}
                                sanPham={sp}
                                index={index}
                                xemSanPham={xemSanPham}
                                themVaoGio={themVaoGio}
                                selectedColor={selectedColor}
                                selectedSize={selectedSize}
                                isFavorite={yeuThichIds.includes(Number(sp.id))}
                                toggleYeuThich={toggleYeuThich}
                            /> ))}
                        </div> )}
                </section>
            </div>
        </div>
    </main> );
}
function FavoriteProducts({
                              sanPhams,
                              yeuThichIds = [],
                              loading,
                              xemSanPham,
                              themVaoGio,
                              toggleYeuThich,
                              xoaTatCaYeuThich,
                              setPage,
                          }) {
    const favoriteProducts = sanPhams.filter((item) =>
        yeuThichIds.includes(Number(item.id))
    );

    const handleDeleteAll = async () => {
        if (favoriteProducts.length === 0) return;

        const xacNhan = window.confirm(
            "Bạn có chắc muốn xóa tất cả sản phẩm yêu thích không?"
        );

        if (!xacNhan) return;

        await xoaTatCaYeuThich();
    };

    return (
        <main className="favorite-page">

            {/* =====================================================
                HERO YÊU THÍCH
            ====================================================== */}

            <section className="favorite-hero">
                <div className="container">
                    <div className="favorite-hero-inner">

                        <div className="favorite-hero-left">

                            <div className="favorite-hero-icon">
                                ♥
                            </div>

                            <div className="favorite-hero-content">

                                <h1>
                                    Sản phẩm{" "}
                                    <span>yêu thích</span>
                                </h1>

                                <p>
                                    Những sản phẩm bạn đã lưu để xem lại
                                    nhanh hơn.
                                </p>

                                <div className="favorite-hero-lines">
                                    <span />
                                    <span />
                                    <span />
                                </div>

                            </div>

                        </div>


                        <div className="favorite-hero-decoration">

                            <div className="favorite-outline-heart">
                                ♡
                            </div>

                            <div className="favorite-floating-heart">
                                ♥
                            </div>

                            <div className="favorite-shopping-bag">
                                F
                            </div>

                            <div className="favorite-bag-handle" />

                            <div className="favorite-decoration-leaf leaf-1" />
                            <div className="favorite-decoration-leaf leaf-2" />

                        </div>

                    </div>
                </div>
            </section>


            {/* =====================================================
                NỘI DUNG
            ====================================================== */}

            <section className="favorite-content">

                <div className="container">

                    {!loading && favoriteProducts.length > 0 && (
                        <div className="favorite-toolbar">

                            <div className="favorite-total">

                                <span className="favorite-total-icon">
                                    ♥
                                </span>

                                <span>
                                    Tất cả sản phẩm yêu thích
                                </span>

                                <strong>
                                    ({favoriteProducts.length})
                                </strong>

                            </div>

                            <button
                                type="button"
                                className="favorite-delete-all"
                                onClick={handleDeleteAll}
                            >
                                <span>♙</span>
                                Xóa tất cả
                            </button>

                        </div>
                    )}


                    {loading ? (
                        <div className="favorite-loading">
                            <div className="favorite-loading-spinner" />
                            <p>Đang tải sản phẩm yêu thích...</p>
                        </div>
                    ) : favoriteProducts.length === 0 ? (

                        <div className="favorite-empty">

                            <div className="favorite-empty-icon">
                                ♡
                            </div>

                            <h2>
                                Chưa có sản phẩm yêu thích
                            </h2>

                            <p>
                                Hãy bấm biểu tượng ♡ trên sản phẩm
                                để lưu lại những sản phẩm bạn thích.
                            </p>

                            <button
                                type="button"
                                onClick={() => setPage("products")}
                            >
                                Khám phá sản phẩm →
                            </button>

                        </div>

                    ) : (

                        <div className="product-grid favorite-product-grid">

                            {favoriteProducts.map((sp, index) => (
                                <ProductCard
                                    key={sp.id}
                                    sanPham={sp}
                                    index={index}
                                    xemSanPham={xemSanPham}
                                    themVaoGio={themVaoGio}
                                    isFavorite={true}
                                    toggleYeuThich={toggleYeuThich}
                                />
                            ))}

                        </div>

                    )}

                </div>

            </section>

        </main>
    );
}

function ProductDetail({ sanPham,
                           themVaoGio, setPage,
                       }) { const chiTiets = sanPham.chiTiets || [];
    const chiTietsHoatDong = chiTiets.filter( isVariantHoatDong
    );
    const firstVariant = chiTietsHoatDong[0] || null;
    const [selectedSize, setSelectedSize] = useState( firstVariant?.kichCo?.tenKichCo || ""
    );
    const [selectedColor, setSelectedColor] = useState( firstVariant?.mauSac?.tenMau || ""
    );
    const [soLuong, setSoLuong] = useState(1);
    const [showAIDoSize, setShowAIDoSize] = useState(false);
    const [anh, setAnh] = useState( layAnhTheoMau(sanPham, firstVariant?.mauSac?.tenMau || "")
    );
    const sizes = [ ...new Set(
        chiTietsHoatDong .map((item) => item?.kichCo?.tenKichCo)
            .filter(Boolean) ),
    ].sort((a, b) => { const numberA = Number(
        String(a).replace(",", ".") );
        const numberB = Number( String(b).replace(",", ".")
        );
        if ( !Number.isNaN(numberA) &&
            !Number.isNaN(numberB) ) {
            return numberA - numberB;
        }
        return String(a).localeCompare( String(b),
            "vi" );
    });
    const colors = [ ...new Set(
        chiTietsHoatDong .map((item) => item.mauSac?.tenMau)
            .filter(Boolean) ),
    ];
    const selectedVariant = chiTietsHoatDong.find( (item) =>
        item.kichCo?.tenKichCo === selectedSize && item.mauSac?.tenMau === selectedColor
    ) || null;
    const gia = selectedVariant?.giaBan ||
        sanPham.giaBan || 0;
    const stock = Number( selectedVariant?.soLuongTon ?? 0
    );
    const sizeCoTheChon = (size) => { return chiTietsHoatDong.some(
        (item) => item.kichCo?.tenKichCo === size &&
            item.mauSac?.tenMau === selectedColor );
    };
    const mauCoTheChon = (color) => { return chiTietsHoatDong.some(
        (item) => item.mauSac?.tenMau === color &&
            item.kichCo?.tenKichCo === selectedSize );
    };
    const chonSize = (size) => { const variant = chiTietsHoatDong.find(
        (item) => item.kichCo?.tenKichCo === size &&
            item.mauSac?.tenMau === selectedColor );
        if (variant) { setSelectedSize(size);
            setAnh(layAnhTheoMau(sanPham, selectedColor));
            return;
        }
        const variantTheoSize = chiTietsHoatDong.find( (item) => item.kichCo?.tenKichCo === size
        );
        if (variantTheoSize) { const mauMoi = variantTheoSize.mauSac?.tenMau || "";
            setSelectedSize(size);
            setSelectedColor(mauMoi);
            setAnh(layAnhTheoMau(sanPham, mauMoi));
        }
    };
    const chonMau = (color) => { const variant = chiTietsHoatDong.find(
        (item) => item.mauSac?.tenMau === color &&
            item.kichCo?.tenKichCo === selectedSize );
        if (variant) { setSelectedColor(color);
            setAnh(layAnhTheoMau(sanPham, color));
            return;
        }
        const variantTheoMau = chiTietsHoatDong.find( (item) => item.mauSac?.tenMau === color
        );
        if (variantTheoMau) { const sizeMoi = variantTheoMau.kichCo?.tenKichCo || "";
            setSelectedColor(color);
            setSelectedSize(sizeMoi);
            setAnh(layAnhTheoMau(sanPham, color));
        }
    };
    return ( <>
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
                            className="detail-thumbnails" style={{
                            display: "flex", gap: "8px",
                            alignItems: "center", flexWrap: "nowrap",
                        }}
                        >
                            {colors.map((color) => ( <button
                                key={color}
                                type="button"
                                className={selectedColor === color ? "thumbnail active" : "thumbnail"}
                                title={`Xem màu ${color}`}
                                onClick={() => chonMau(color)}
                            >
                                <img
                                    src={layAnhTheoMau(sanPham, color)}
                                    alt={`${sanPham.tenSanPham} màu ${color}`}
                                />
                            </button> ))}
                        </div>
                        {/* ================= MÔ TẢ - NGAY DƯỚI ẢNH ================= */}
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
                                            {sanPham.xuatXu || "Đang cập nhật"}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
                            {gia ? formatGia(Number(gia) * 1.2)
                                : ""}
                        </div>
                        <div className="detail-line"></div>
                        {sizes.length > 0 && ( <div className="option-group">
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
                                    return ( <button
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
                                    </button> );
                                })}
                            </div>
                        </div> )}
                        <div className="ai-size-box">
                            <div className="ai-size-box-content">
                                <div className="ai-size-icon">📷</div>
                                <div>
                                    <strong>Không biết chọn size?</strong>
                                    <p>Đặt chân lên giấy A4 và để AI đo chiều dài bàn chân.</p>
                                </div>
                            </div>
                            <button
                                type="button" className="ai-size-button"
                                onClick={() => setShowAIDoSize(true)}
                            >
                                📏 Đo size giày bằng AI
                            </button>
                        </div>
                        {colors.length > 0 && ( <div className="option-group">
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
                                    return ( <button
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
                                    </button> );
                                })}
                            </div>
                        </div> )}
                        <div className="stock">
                            {selectedVariant ? stock > 0
                                    ? `Còn ${stock} sản phẩm`
                                    : "Sản phẩm đã hết hàng"
                                : "Vui lòng chọn size và màu"}
                        </div>
                        <div className="quantity-row">
                            <div className="quantity-control">
                                <button
                                    type="button" onClick={() =>
                                    setSoLuong( Math.max(
                                        1, soLuong - 1
                                    ) )
                                }
                                >
                                    −
                                </button>
                                <span>{soLuong}</span>
                                <button
                                    type="button" onClick={() => {
                                    if ( selectedVariant &&
                                        stock > 0 &&
                                        soLuong < stock ) {
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
                        <div className="detail-buttons">
                            {/* THÊM GIỎ */}
                            <button
                                type="button" className="detail-add-cart"
                                onClick={async () => {
                                    if (!selectedVariant?.id) { alert(
                                        "Vui lòng chọn đúng size và màu"
                                    );
                                        return;
                                    }
                                    if (stock <= 0) { alert(
                                        "Sản phẩm đã hết hàng" );
                                        return;
                                    }
                                    await themVaoGio( sanPham,
                                        selectedVariant, soLuong
                                    );
                                }}
                            >
                                🛒 Thêm vào giỏ
                            </button>
                            {/* MUA NGAY */}
                            <button
                                type="button" className="detail-buy"
                                onClick={async () => {
                                    if (!selectedVariant?.id) { alert(
                                        "Vui lòng chọn đúng size và màu"
                                    );
                                        return;
                                    }
                                    if (stock <= 0) { alert(
                                        "Sản phẩm đã hết hàng" );
                                        return;
                                    }
                                    const daThem = await themVaoGio(
                                        sanPham,
                                        selectedVariant, soLuong
                                    );
                                    if (daThem) { setPage("cart");
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
            </div>
        </main>
        {showAIDoSize && ( <AIDoSize
            onSelectSize={(size) => { const sizeText = String(size);
                const variant = chiTietsHoatDong.find(
                    (item) => String(item?.kichCo?.tenKichCo) === sizeText );
                if (variant) {
                    setSelectedSize(variant.kichCo?.tenKichCo || sizeText);
                    const color = variant.mauSac?.tenMau || selectedColor;
                    if (color) { setSelectedColor(color);
                        setAnh(layAnhTheoMau(sanPham, color));
                    }
                }
                setShowAIDoSize(false);
            }}
            onClose={() => setShowAIDoSize(false)}
        /> )}
    </> );
}
function Cart({
                  gioHang, tongTien, tangSoLuong, giamSoLuong, xoaKhoiGio, setPage, taiKhoan,
                  selectedVariantIds = [], setSelectedVariantIds = () => {},
                  capNhatSoLuong = async () => false,
                  capNhatBienThe = async () => false,
              }) {
    const phiVanChuyen = PHI_SHIP_MAC_DINH;

    const [editingItem, setEditingItem] = useState(null);
    const [editColor, setEditColor] = useState("");
    const [editSize, setEditSize] = useState("");
    const [quantityDraft, setQuantityDraft] = useState({});

    const selectedItems = gioHang.filter((item) => selectedVariantIds.includes(item.variantId));
    const tongTienSelected = selectedItems.reduce((total, item) => {
        const gia = item.chiTiet?.giaBan || item.sanPham?.giaBan || 0;
        return total + Number(gia) * item.soLuong;
    }, 0);
    const tongThanhToan = tongTienSelected + phiVanChuyen;

    const allSelected = gioHang.length > 0 && gioHang.every((item) => selectedVariantIds.includes(item.variantId));

    const toggleSelectAll = () => {
        if (allSelected) setSelectedVariantIds([]);
        else setSelectedVariantIds(gioHang.map((item) => item.variantId));
    };

    const toggleSelect = (variantId) => {
        setSelectedVariantIds((prev) =>
            prev.includes(variantId)
                ? prev.filter((id) => id !== variantId)
                : [...prev, variantId]
        );
    };

    const handleCheckout = () => {
        if (selectedVariantIds.length === 0) {
            alert("Vui lòng chọn ít nhất 1 sản phẩm để đặt hàng");
            return;
        }
        if (!taiKhoan) { setPage("login"); return; }
        setPage("checkout");
    };

    /* Mở modal sửa sản phẩm */
    const openEdit = (item) => {
        setEditingItem(item);
        setEditColor(item.chiTiet?.mauSac?.tenMau || "");
        setEditSize(item.chiTiet?.kichCo?.tenKichCo || "");
    };
    const closeEdit = () => {
        setEditingItem(null);
        setEditColor("");
        setEditSize("");
    };

    const chiTietsHoatDong = editingItem?.sanPham?.chiTiets
        ? editingItem.sanPham.chiTiets.filter(isVariantHoatDong)
        : [];

    const editColors = [...new Set(chiTietsHoatDong.map((x) => x?.mauSac?.tenMau).filter(Boolean))];
    const editSizes = [...new Set(chiTietsHoatDong.map((x) => x?.kichCo?.tenKichCo).filter(Boolean))].sort((a, b) => {
        const na = Number(String(a).replace(",", "."));
        const nb = Number(String(b).replace(",", "."));
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        return String(a).localeCompare(String(b), "vi");
    });

    const sizeCoTheChon = (size) => chiTietsHoatDong.some(
        (x) => x?.kichCo?.tenKichCo === size && x?.mauSac?.tenMau === editColor
    );
    const mauCoTheChon = (color) => chiTietsHoatDong.some(
        (x) => x?.mauSac?.tenMau === color && x?.kichCo?.tenKichCo === editSize
    );

    const variantDangChon = chiTietsHoatDong.find(
        (x) => x?.kichCo?.tenKichCo === editSize && x?.mauSac?.tenMau === editColor
    );

    const luuChinhSua = async () => {
        if (!editingItem) return;
        if (!variantDangChon?.id) {
            alert("Vui lòng chọn đủ size và màu");
            return;
        }
        const ok = await capNhatBienThe(editingItem.variantId, variantDangChon, editingItem.soLuong);
        if (ok) closeEdit();
    };

    /* Gõ tay số lượng */
    const setQtyDraft = (variantId, value) => {
        setQuantityDraft((prev) => ({ ...prev, [variantId]: value }));
    };
    const clearQtyDraft = (variantId) => {
        setQuantityDraft((prev) => {
            const cp = { ...prev };
            delete cp[variantId];
            return cp;
        });
    };
    const commitQty = async (item) => {
        const raw = quantityDraft[item.variantId];
        if (raw === undefined) return;
        const num = Number(raw);
        const itemSoLuong = Number(item.soLuong) || 1;

        if (!Number.isFinite(num) || num < 1) { clearQtyDraft(item.variantId); return; }
        if (num === itemSoLuong) { clearQtyDraft(item.variantId); return; }

        const tonKho = Number(item.chiTiet?.soLuongTon ?? 0);
        const final = tonKho > 0 ? Math.min(num, tonKho) : num;
        if (tonKho > 0 && num > tonKho) alert(`Sản phẩm chỉ còn ${tonKho} trong kho`);

        await capNhatSoLuong(item.id, item.variantId, final);
        clearQtyDraft(item.variantId);
    };

    return (
        <main className="cart-page">
            <div className="container">
                <div className="breadcrumb">Trang chủ / Giỏ hàng</div>
                <div className="cart-title">
                    <span className="section-label">FSHOP</span>
                    <h1>Giỏ hàng</h1>
                    <p>{gioHang.length} sản phẩm</p>
                </div>

                {gioHang.length === 0 ? (
                    <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <h2>Giỏ hàng đang trống</h2>
                        <p>Hãy khám phá những mẫu giày nam mới nhất của FShop.</p>
                        <button onClick={() => setPage("products")}>Tiếp tục mua hàng →</button>
                    </div>
                ) : (
                    <div className="cart-layout">
                        <div className="cart-items">
                            <div className="cart-table-head">
                <span className="cart-select-all">
                  <input
                      type="checkbox"
                      className="cart-checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                  />
                  Chọn tất cả
                </span>
                                <span>Đơn giá</span>
                                <span>Số lượng</span>
                                <span>Thành tiền</span>
                            </div>

                            {gioHang.map((item) => {
                                const gia = item.chiTiet?.giaBan || item.sanPham?.giaBan || 0;
                                const isChecked = selectedVariantIds.includes(item.variantId);
                                const draft = quantityDraft[item.variantId];
                                return (
                                    <div
                                        className={`cart-item-row ${isChecked ? "" : "unselected"}`}
                                        key={item.variantId}
                                    >
                                        {/* 👉 Bấm vào CẢ Ô SẢN PHẨM để mở modal sửa màu/size */}
                                        <div
                                            className="cart-product"
                                            onClick={() => openEdit(item)}
                                            title="Bấm để đổi màu / size"
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    openEdit(item);
                                                }
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                className="cart-checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleSelect(item.variantId)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <img
                                                src={layAnhTheoMau(item.sanPham, item.chiTiet?.mauSac?.tenMau)}
                                                alt={item.sanPham.tenSanPham}
                                                className="cart-product-image"
                                            />
                                            <div className="cart-product-info">
                                                <strong className="cart-product-name">
                                                    {item.sanPham.tenSanPham}
                                                </strong>
                                                {item.chiTiet?.kichCo && <small>Size: {item.chiTiet.kichCo.tenKichCo}</small>}
                                                {item.chiTiet?.mauSac && <small>Màu: {item.chiTiet.mauSac.tenMau}</small>}
                                                <div
                                                    className="cart-product-actions"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        className="remove-cart"
                                                        onClick={() => xoaKhoiGio(item.variantId)}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="cart-price">{formatGia(gia)}</div>
                                        <div className="cart-quantity">
                                            <button type="button" onClick={() => giamSoLuong(item.variantId)}>−</button>
                                            <input
                                                type="number"
                                                min="1"
                                                className="cart-quantity-input"
                                                value={draft !== undefined ? draft : item.soLuong}
                                                onChange={(e) => setQtyDraft(item.variantId, e.target.value)}
                                                onBlur={() => commitQty(item)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        e.currentTarget.blur();
                                                    }
                                                }}
                                            />
                                            <button type="button" onClick={() => tangSoLuong(item.variantId)}>+</button>
                                        </div>
                                        <strong className="cart-total">{formatGia(Number(gia) * item.soLuong)}</strong>
                                    </div>
                                );
                            })}

                            <button className="continue-shopping" onClick={() => setPage("products")}>← Tiếp tục mua hàng</button>
                        </div>

                        <aside className="cart-summary">
                            <h2>Tóm tắt đơn hàng</h2>
                            <div className="summary-line">
                                <span>Sản phẩm đã chọn</span>
                                <strong>{selectedItems.length}/{gioHang.length}</strong>
                            </div>
                            <div className="summary-line">
                                <span>Tạm tính</span>
                                <strong>{formatGia(tongTienSelected)}</strong>
                            </div>
                            <div className="summary-line">
                                <span>Phí vận chuyển</span>
                                <strong className="ship-fee">{formatGia(phiVanChuyen)}</strong>
                            </div>
                            <div className="summary-divider"></div>
                            <div className="summary-total">
                                <span>Tổng thanh toán</span>
                                <strong>{formatGia(tongThanhToan)}</strong>
                            </div>
                            <button
                                className="checkout-button"
                                onClick={handleCheckout}
                                disabled={selectedVariantIds.length === 0}
                            >
                                Tiến hành đặt hàng →
                            </button>
                            <div className="payment-note">🔒 Thanh toán an toàn và bảo mật</div>
                        </aside>
                    </div>
                )}
            </div>

            {/* =============== MODAL ĐỔI MÀU / SIZE =============== */}
            {editingItem && (
                <div className="cart-edit-overlay" onClick={closeEdit}>
                    <div className="cart-edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cart-edit-header">
                            <h3>Chọn lại màu / size</h3>
                            <button type="button" className="cart-edit-close" onClick={closeEdit}>×</button>
                        </div>

                        <div className="cart-edit-product">
                            <img
                                src={layAnhTheoMau(editingItem.sanPham, editColor || editingItem.chiTiet?.mauSac?.tenMau)}
                                alt={editingItem.sanPham.tenSanPham}
                            />
                            <div>
                                <strong>{editingItem.sanPham.tenSanPham}</strong>
                                <span>Đang chọn: {editSize} · {editColor}</span>
                            </div>
                        </div>

                        <div className="cart-edit-section">
                            <label>Màu sắc</label>
                            <div className="cart-edit-options">
                                {editColors.map((c) => {
                                    const active = c === editColor;
                                    const disabled = !mauCoTheChon(c);
                                    return (
                                        <button
                                            key={c}
                                            type="button"
                                            disabled={disabled}
                                            className={`cart-edit-option ${active ? "active" : ""}`}
                                            onClick={() => !disabled && setEditColor(c)}
                                        >
                                            {c}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="cart-edit-section">
                            <label>Kích thước</label>
                            <div className="cart-edit-options">
                                {editSizes.map((s) => {
                                    const active = s === editSize;
                                    const disabled = !sizeCoTheChon(s);
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            disabled={disabled}
                                            className={`cart-edit-option ${active ? "active" : ""}`}
                                            onClick={() => !disabled && setEditSize(s)}
                                        >
                                            {s}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="cart-edit-info">
                            {variantDangChon ? (
                                <>
                                    <span>Còn lại: <strong>{Number(variantDangChon.soLuongTon || 0)}</strong> sản phẩm</span>
                                    <span>Giá: <strong>{formatGia(variantDangChon.giaBan)}</strong></span>
                                </>
                            ) : (
                                <span>Biến thể này chưa có</span>
                            )}
                        </div>

                        <div className="cart-edit-actions">
                            <button type="button" className="cart-edit-cancel" onClick={closeEdit}>Hủy</button>
                            <button
                                type="button"
                                className="cart-edit-save"
                                onClick={luuChinhSua}
                                disabled={!variantDangChon?.id}
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

/* =========================================================
   CHECKOUT — 2 voucher, chỉ FREESHIP mới free ship
========================================================= */
function Checkout({
                      gioHang, tatCaGioHang, gioHangId, tongTien, setPage, setGioHang, setSelectedVariantIds,
                  }) {
    const [hoTen, setHoTen] = useState("");
    const [soDienThoai, setSoDienThoai] = useState("");
    const [diaChi, setDiaChi] = useState("");
    const [ghiChu, setGhiChu] = useState("");
    const [phuongThuc, setPhuongThuc] = useState("TIEN_MAT");
    const [dangDatHang, setDangDatHang] = useState(false);
    const [bill, setBill] = useState(null);

    const [vouchers, setVouchers] = useState([]);
    const [maVoucher, setMaVoucher] = useState("");
    const [voucherError, setVoucherError] = useState("");
    const [checkingVoucher, setCheckingVoucher] = useState(false);

    const MAX_VOUCHER = 2;

    const coVoucherFreeship = vouchers.some(isVoucherFreeship);
    const phiVanChuyen = coVoucherFreeship ? 0 : PHI_SHIP_MAC_DINH;

    const tienGiam = vouchers.reduce((sum, v) => sum + Number(v.tienGiam || 0), 0);
    const tongThanhToan = Math.max(0, tongTien + phiVanChuyen - tienGiam);

    const apDungVoucher = async () => {
        const code = maVoucher.trim().toUpperCase();
        if (!code) { setVoucherError("Vui lòng nhập mã giảm giá"); return; }
        if (vouchers.length >= MAX_VOUCHER) {
            setVoucherError(`Chỉ được áp dụng tối đa ${MAX_VOUCHER} mã giảm giá`);
            return;
        }
        if (vouchers.some((v) => String(v.maVoucher || "").toUpperCase() === code)) {
            setVoucherError("Mã này đã được áp dụng");
            return;
        }
        setCheckingVoucher(true);
        setVoucherError("");
        try {
            const khachHangId = (() => {
                try {
                    const raw = localStorage.getItem("taiKhoan");
                    return raw ? JSON.parse(raw).khachHangId : null;
                } catch { return null; }
            })();
            const res = await fetch(`${API}/ma-giam-gia/kiem-tra`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ma: code, tongTien, khachHangId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Mã giảm giá không hợp lệ");

            console.log("Voucher data từ backend:", data);

            setVouchers((prev) => [...prev, data]);
            setMaVoucher("");
        } catch (err) {
            setVoucherError(err.message || "Mã không hợp lệ");
        } finally {
            setCheckingVoucher(false);
        }
    };

    const xoaVoucher = (index) => {
        setVouchers((prev) => prev.filter((_, i) => i !== index));
        setVoucherError("");
    };

    const NGAN_HANG_QR = "MB";
    const SO_TAI_KHOAN = "0857325488";
    const CHU_TAI_KHOAN = "FSHOP";

    const taoNoiDungChuyenKhoan = (maHoaDon = null) =>
        maHoaDon ? `FSHOP ${maHoaDon}` : "FSHOP THANH TOAN";

    const hienThiPhuongThuc = (pt) =>
        pt === "CHUYEN_KHOAN" ? "Chuyển khoản" : "Tiền mặt khi nhận hàng";

    const taoQrUrl = (soTien, maHoaDon = null) => {
        const amount = Math.round(Number(soTien) || 0);
        const noiDung = taoNoiDungChuyenKhoan(maHoaDon);
        return `https://img.vietqr.io/image/${NGAN_HANG_QR}-${SO_TAI_KHOAN}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(noiDung)}&accountName=${encodeURIComponent(CHU_TAI_KHOAN)}`;
    };

    const saoChep = async (noiDung, thongBao) => {
        try {
            await navigator.clipboard.writeText(noiDung);
            alert(thongBao);
        } catch (error) {
            console.error("Không thể sao chép:", error);
            alert(`Không thể sao chép tự động.\n\n${noiDung}`);
        }
    };

    const datHang = async () => {
        if (!gioHang || gioHang.length === 0) {
            alert("Chưa có sản phẩm nào được chọn");
            setPage("cart");
            return;
        }
        if (!hoTen.trim()) { alert("Vui lòng nhập họ và tên"); return; }
        if (!soDienThoai.trim()) { alert("Vui lòng nhập số điện thoại"); return; }
        if (!/^0\d{9}$/.test(soDienThoai.trim())) {
            alert("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0");
            return;
        }
        if (!diaChi.trim()) { alert("Vui lòng nhập địa chỉ nhận hàng"); return; }
        if (!gioHangId) {
            alert("Không xác định được giỏ hàng của khách hàng. Vui lòng đăng nhập lại.");
            return;
        }
        if (dangDatHang) return;

        const itemsForBill = gioHang.map((item) => ({
            ...item,
            sanPham: { ...item.sanPham },
            chiTiet: item.chiTiet ? { ...item.chiTiet } : null,
        }));

        const variantIdsDat = itemsForBill.map((it) => it.variantId).filter(Boolean);

        try {
            setDangDatHang(true);

            const cartDetailResponse = await fetch(`${API}/gio-hang/${gioHangId}/chi-tiet`);
            if (!cartDetailResponse.ok) {
                const errorText = await cartDetailResponse.text();
                throw new Error(errorText || "Không lấy được giỏ hàng trên hệ thống");
            }
            const cartDetails = await cartDetailResponse.json();
            const cartDetailsArr = Array.isArray(cartDetails) ? cartDetails : [];

            for (const detail of cartDetailsArr) {
                const detailVariantId = detail?.sanPhamChiTiet?.id;
                if (!variantIdsDat.includes(detailVariantId)) continue;
                const deleteResponse = await fetch(`${API}/gio-hang/chi-tiet/${detail.id}`, { method: "DELETE" });
                if (!deleteResponse.ok) {
                    throw new Error(`Không thể làm sạch sản phẩm cũ (ID ${detail.id})`);
                }
            }

            for (const item of itemsForBill) {
                if (!item.chiTiet?.id) {
                    throw new Error(`Sản phẩm "${item.sanPham?.tenSanPham || "không xác định"}" chưa có biến thể`);
                }
                const addResponse = await fetch(`${API}/gio-hang/chi-tiet`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        gioHang: { id: gioHangId },
                        sanPhamChiTiet: { id: item.chiTiet.id },
                        soLuong: item.soLuong,
                    }),
                });
                const addText = await addResponse.text();
                let addData = null;
                try { addData = addText ? JSON.parse(addText) : null; } catch { addData = null; }
                if (!addResponse.ok) {
                    throw new Error(addData?.message || addData?.error || addText ||
                        `Không thể thêm ${item.sanPham?.tenSanPham || "sản phẩm"} vào giỏ hàng`);
                }
            }

            const response = await fetch(`${API}/hoa-don/dat-hang/${gioHangId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hoTen: hoTen.trim(),
                    soDienThoai: soDienThoai.trim(),
                    diaChi: diaChi.trim(),
                    ghiChu: ghiChu.trim(),
                    phuongThuc,
                    voucherId: vouchers[0]?.id || null,
                    maVoucher: vouchers.map((v) => v.maVoucher).filter(Boolean).join("+") || null,
                    tienGiam: tienGiam,
                    danhSachVoucherId: vouchers.map((v) => v.id),
                }),
            });
            const responseText = await response.text();
            let data = null;
            try { data = responseText ? JSON.parse(responseText) : null; } catch { data = null; }
            if (!response.ok) {
                throw new Error(data?.message || data?.error || responseText || "Không thể đặt hàng");
            }

            const maHoaDon = data?.maHoaDon || data?.id || data?.hoaDon?.maHoaDon || data?.hoaDon?.id || `FS-${Date.now()}`;

            setBill({
                maHoaDon,
                ngayDat: new Date().toLocaleString("vi-VN"),
                hoTen: hoTen.trim(),
                soDienThoai: soDienThoai.trim(),
                diaChi: diaChi.trim(),
                ghiChu: ghiChu.trim(),
                phuongThuc,
                items: itemsForBill,
                tamTinh: Number(tongTien),
                phiVanChuyen,
                tienGiam,
                maVoucher: vouchers.map((v) => v.maVoucher).filter(Boolean).join(" + ") || null,
                tongThanhToan,
                noiDungChuyenKhoan: taoNoiDungChuyenKhoan(maHoaDon),
            });

            setGioHang((old) => old.filter((it) => !variantIdsDat.includes(it.variantId)));
            if (setSelectedVariantIds) {
                setSelectedVariantIds((prev) => prev.filter((id) => !variantIdsDat.includes(id)));
            }
        } catch (error) {
            console.error("Lỗi đặt hàng:", error);
            alert(error.message || "Có lỗi xảy ra khi đặt hàng");
        } finally {
            setDangDatHang(false);
        }
    };

    /* ================== BILL ================== */
    if (bill) {
        const laChuyenKhoan = bill.phuongThuc === "CHUYEN_KHOAN";
        const qrUrl = laChuyenKhoan ? taoQrUrl(bill.tongThanhToan, bill.maHoaDon) : null;
        return (
            <main className="cart-page">
                <div className="container">
                    <div className="bill-card" style={{ maxWidth: "900px", margin: "20px auto", padding: "35px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: "10px", boxShadow: "0 10px 35px rgba(0,0,0,.06)" }}>
                        <div style={{ textAlign: "center", marginBottom: "28px" }}>
                            <div style={{ width: "58px", height: "58px", margin: "0 auto 14px", borderRadius: "50%", background: "#eaf7ed", color: "#24833b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", fontWeight: 700 }}>✓</div>
                            <span className="section-label">FSHOP</span>
                            <h1 style={{ margin: "8px 0", fontSize: "30px" }}>Đặt hàng thành công!</h1>
                            <p style={{ color: "#777", margin: 0 }}>Cảm ơn bạn đã mua hàng. Đây là hóa đơn của bạn.</p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", padding: "18px", background: "#fafafa", borderRadius: "6px", marginBottom: "25px", fontSize: "13px" }}>
                            <div><span style={{ color: "#888", display: "block", marginBottom: "5px" }}>Mã hóa đơn</span><strong>{bill.maHoaDon}</strong></div>
                            <div><span style={{ color: "#888", display: "block", marginBottom: "5px" }}>Ngày đặt</span><strong>{bill.ngayDat}</strong></div>
                            <div><span style={{ color: "#888", display: "block", marginBottom: "5px" }}>Phương thức thanh toán</span><strong>{hienThiPhuongThuc(bill.phuongThuc)}</strong></div>
                        </div>

                        {laChuyenKhoan && (
                            <div style={{ marginBottom: "28px", padding: "22px", border: "1px solid #e0e0e0", borderRadius: "12px", background: "#fffaf5" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", flexWrap: "wrap", marginBottom: "18px" }}>
                                    <div>
                                        <h2 style={{ fontSize: "19px", margin: "0 0 6px" }}>🏦 Thông tin chuyển khoản</h2>
                                        <p style={{ margin: 0, color: "#777", fontSize: "13px" }}>Vui lòng chuyển đúng số tiền và nội dung.</p>
                                    </div>
                                    <div style={{ padding: "8px 12px", borderRadius: "999px", background: "#fff", border: "1px solid #eee", fontSize: "12px", fontWeight: 700 }}>CHỜ THANH TOÁN</div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 220px", gap: "25px", alignItems: "center" }}>
                                    <div style={{ display: "grid", gap: "12px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "15px", padding: "11px 0", borderBottom: "1px solid #eee" }}><span>Ngân hàng</span><strong>{NGAN_HANG_QR}</strong></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "15px", padding: "11px 0", borderBottom: "1px solid #eee" }}>
                                            <span>Số tài khoản</span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <strong>{SO_TAI_KHOAN}</strong>
                                                <button type="button" onClick={() => saoChep(SO_TAI_KHOAN, "Đã sao chép số tài khoản")} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: "6px", padding: "5px 8px", cursor: "pointer" }}>📋</button>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "15px", padding: "11px 0", borderBottom: "1px solid #eee" }}><span>Chủ tài khoản</span><strong>{CHU_TAI_KHOAN}</strong></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "15px", padding: "11px 0", borderBottom: "1px solid #eee" }}><span>Số tiền</span><strong style={{ color: "#e53935", fontSize: "18px" }}>{formatGia(bill.tongThanhToan)}</strong></div>
                                        <div style={{ padding: "13px", background: "#fff", borderRadius: "8px", border: "1px solid #eee" }}>
                                            <div style={{ fontSize: "12px", color: "#777", marginBottom: "5px" }}>Nội dung chuyển khoản</div>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                                                <strong style={{ color: "#111", wordBreak: "break-word" }}>{bill.noiDungChuyenKhoan}</strong>
                                                <button type="button" onClick={() => saoChep(bill.noiDungChuyenKhoan, "Đã sao chép nội dung chuyển khoản")} style={{ flexShrink: 0, border: "1px solid #ddd", background: "#fff", borderRadius: "6px", padding: "5px 8px", cursor: "pointer" }}>📋</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ background: "#fff", padding: "10px", border: "1px solid #eee", borderRadius: "10px", display: "inline-block" }}>
                                            <img src={qrUrl} alt="QR thanh toán" style={{ width: "190px", height: "190px", objectFit: "contain", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                        </div>
                                        <div style={{ marginTop: "10px", fontSize: "12px", color: "#777" }}>Quét QR để thanh toán</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: "18px", padding: "12px 14px", background: "#fff", borderRadius: "8px", fontSize: "13px", color: "#666" }}>⚠️ Sau khi chuyển khoản, FShop sẽ kiểm tra giao dịch và xác nhận thanh toán.</div>
                            </div>
                        )}

                        <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>Thông tin nhận hàng</h2>
                        <div style={{ lineHeight: 1.8, fontSize: "13px", marginBottom: "25px" }}>
                            <div><strong>Người nhận: </strong>{bill.hoTen}</div>
                            <div><strong>Số điện thoại: </strong>{bill.soDienThoai}</div>
                            <div><strong>Địa chỉ: </strong>{bill.diaChi}</div>
                            {bill.ghiChu && <div><strong>Ghi chú: </strong>{bill.ghiChu}</div>}
                        </div>

                        <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>Chi tiết hóa đơn</h2>
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
                                    const donGia = Number(item.chiTiet?.giaBan ?? item.sanPham?.giaBan ?? 0);
                                    const thanhTien = donGia * Number(item.soLuong || 0);
                                    return (
                                        <tr key={`${item.variantId}-${index}`}>
                                            <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee" }}>
                                                <strong>{item.sanPham?.tenSanPham || "Sản phẩm"}</strong>
                                                <div style={{ color: "#888", fontSize: "11px", marginTop: "5px" }}>
                                                    {item.chiTiet?.kichCo?.tenKichCo ? `Size: ${item.chiTiet.kichCo.tenKichCo}` : ""}
                                                    {item.chiTiet?.mauSac?.tenMau ? ` · Màu: ${item.chiTiet.mauSac.tenMau}` : ""}
                                                </div>
                                            </td>
                                            <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>{formatGia(donGia)}</td>
                                            <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee", textAlign: "center" }}>{item.soLuong}</td>
                                            <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee", textAlign: "right", whiteSpace: "nowrap", color: "#e53935", fontWeight: 700 }}>{formatGia(thanhTien)}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ maxWidth: "360px", margin: "22px 0 0 auto" }}>
                            <div className="summary-line"><span>Tạm tính</span><strong>{formatGia(bill.tamTinh)}</strong></div>
                            <div className="summary-line">
                                <span>Phí vận chuyển</span>
                                <strong className={`ship-fee ${bill.phiVanChuyen === 0 ? "free" : ""}`}>
                                    {bill.phiVanChuyen === 0 ? "Miễn phí" : formatGia(bill.phiVanChuyen)}
                                    {bill.phiVanChuyen === 0 && <span className="ship-fee-tag">FREE SHIP</span>}
                                </strong>
                            </div>
                            {bill.tienGiam > 0 && (
                                <div className="summary-line discount-line">
                                    <span>Giảm giá ({bill.maVoucher})</span>
                                    <strong>-{formatGia(bill.tienGiam)}</strong>
                                </div>
                            )}
                            <div className="summary-divider" />
                            <div className="summary-total"><span>Tổng thanh toán</span><strong>{formatGia(bill.tongThanhToan)}</strong></div>
                        </div>
                        <div className="bill-actions" style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "30px" }}>
                            <button className="checkout-button" style={{ width: "auto", minWidth: "180px", padding: "0 22px" }} onClick={() => window.print()}>🖨 In hóa đơn / Lưu PDF</button>
                            <button className="continue-shopping" style={{ marginTop: 0, border: "1px solid #ddd", borderRadius: "4px", padding: "0 22px", minHeight: "48px" }} onClick={() => setPage("home")}>Tiếp tục mua hàng</button>
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
                        <h2>Chưa chọn sản phẩm nào</h2>
                        <p>Hãy chọn ít nhất 1 sản phẩm trong giỏ hàng trước khi đặt hàng.</p>
                        <button onClick={() => setPage("cart")}>Quay lại giỏ hàng →</button>
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
                                <input className="price-input" type="text" value={hoTen} onChange={(e) => setHoTen(e.target.value)} placeholder="Nhập họ và tên" />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                                    Số điện thoại <span style={{ color: "#e53935" }}>*</span>
                                </label>
                                <input className="price-input" type="tel" value={soDienThoai} onChange={(e) => setSoDienThoai(e.target.value)} placeholder="Nhập số điện thoại" />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                                    🎫 Mã giảm giá
                                </label>
                                <div className="voucher-input-row">
                                    <input
                                        className="price-input" type="text"
                                        placeholder="Nhập mã (VD: SALE10)"
                                        value={maVoucher}
                                        onChange={(e) => setMaVoucher(e.target.value.toUpperCase())}
                                        disabled={vouchers.length >= MAX_VOUCHER}
                                    />
                                    <button
                                        type="button" className="voucher-apply-btn"
                                        onClick={apDungVoucher}
                                        disabled={checkingVoucher || vouchers.length >= MAX_VOUCHER}
                                    >
                                        {checkingVoucher ? "..." : "Áp dụng"}
                                    </button>
                                </div>
                                {voucherError && <span style={{ color: "#e53935", fontSize: 12, marginTop: 6, display: "block" }}>{voucherError}</span>}

                                {vouchers.length > 0 && (
                                    <div className="voucher-list">
                                        {vouchers.map((v, idx) => {
                                            const isFree = isVoucherFreeship(v);
                                            return (
                                                <div
                                                    key={`${v.id || v.maVoucher}-${idx}`}
                                                    className={`voucher-item ${isFree ? "is-freeship" : ""}`}
                                                >
                          <span>
                            ✓ <strong>{v.maVoucher}</strong>
                              {isFree
                                  ? <> — <strong>Miễn phí vận chuyển</strong></>
                                  : <> — giảm <strong>{formatGia(v.tienGiam)}</strong></>}
                          </span>
                                                    <button
                                                        type="button"
                                                        className="voucher-remove-btn"
                                                        onClick={() => xoaVoucher(idx)}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        {coVoucherFreeship && (
                                            <div className="freeship-notice">
                                                🚚 Đã áp dụng voucher FREESHIP — Miễn phí vận chuyển
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                                    Địa chỉ nhận hàng <span style={{ color: "#e53935" }}>*</span>
                                </label>
                                <textarea className="price-input" value={diaChi} onChange={(e) => setDiaChi(e.target.value)}
                                          placeholder="Nhập địa chỉ nhận hàng"
                                          style={{ minHeight: "90px", paddingTop: "10px", resize: "vertical" }} />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>Phương thức thanh toán</label>
                                <select className="price-input" value={phuongThuc} onChange={(e) => setPhuongThuc(e.target.value)}>
                                    <option value="TIEN_MAT">Tiền mặt khi nhận hàng</option>
                                    <option value="CHUYEN_KHOAN">Chuyển khoản</option>
                                </select>

                                {phuongThuc === "CHUYEN_KHOAN" && (
                                    <div style={{ marginTop: "15px", padding: "20px", border: "1px solid #e3e3e3", borderRadius: "12px", background: "#fffaf5" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: "18px" }}>🏦 Chuyển khoản ngân hàng</h3>
                                                <p style={{ margin: "5px 0 0", color: "#777", fontSize: "12px" }}>Chuyển khoản đúng số tiền và nội dung.</p>
                                            </div>
                                            <span style={{ padding: "6px 10px", background: "#fff", border: "1px solid #eee", borderRadius: "999px", fontSize: "11px", fontWeight: 700 }}>QR BANKING</span>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 190px", gap: "20px", alignItems: "center" }}>
                                            <div style={{ display: "grid", gap: "10px" }}>
                                                <div style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                                                    <div style={{ fontSize: "12px", color: "#777" }}>Ngân hàng</div>
                                                    <strong>{NGAN_HANG_QR}</strong>
                                                </div>
                                                <div style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                                                    <div style={{ fontSize: "12px", color: "#777", marginBottom: "4px" }}>Số tài khoản</div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <strong>{SO_TAI_KHOAN}</strong>
                                                        <button type="button" onClick={() => saoChep(SO_TAI_KHOAN, "Đã sao chép số tài khoản")} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: "6px", padding: "5px 8px", cursor: "pointer" }}>📋</button>
                                                    </div>
                                                </div>
                                                <div style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                                                    <div style={{ fontSize: "12px", color: "#777" }}>Chủ tài khoản</div>
                                                    <strong>{CHU_TAI_KHOAN}</strong>
                                                </div>
                                                <div style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                                                    <div style={{ fontSize: "12px", color: "#777" }}>Số tiền cần chuyển</div>
                                                    <strong style={{ color: "#e53935", fontSize: "20px" }}>{formatGia(tongThanhToan)}</strong>
                                                </div>
                                                <div style={{ padding: "12px", background: "#fff", border: "1px solid #eee", borderRadius: "8px" }}>
                                                    <div style={{ fontSize: "12px", color: "#777", marginBottom: "5px" }}>Nội dung chuyển khoản</div>
                                                    <strong>{taoNoiDungChuyenKhoan()}</strong>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "center" }}>
                                                <div style={{ background: "#fff", padding: "8px", border: "1px solid #eee", borderRadius: "10px", display: "inline-block" }}>
                                                    <img src={taoQrUrl(tongThanhToan)} alt="QR chuyển khoản" style={{ width: "170px", height: "170px", display: "block", objectFit: "contain" }} />
                                                </div>
                                                <div style={{ marginTop: "8px", fontSize: "11px", color: "#777" }}>Quét QR bằng ứng dụng ngân hàng</div>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: "15px", padding: "11px 13px", background: "#fff", borderRadius: "8px", fontSize: "12px", color: "#666" }}>
                                            ⚠️ Sau khi chuyển khoản, FShop sẽ kiểm tra giao dịch và xác nhận thanh toán.
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>Ghi chú</label>
                                <textarea className="price-input" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}
                                          placeholder="Ví dụ: Giao giờ hành chính..."
                                          style={{ minHeight: "90px", paddingTop: "10px", resize: "vertical" }} />
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
                            <strong className={`ship-fee ${phiVanChuyen === 0 ? "free" : ""}`}>
                                {phiVanChuyen === 0 ? "Miễn phí" : formatGia(phiVanChuyen)}
                                {phiVanChuyen === 0 && <span className="ship-fee-tag">FREE SHIP</span>}
                            </strong>
                        </div>
                        {tienGiam > 0 && (
                            <div className="summary-line discount-line">
                                <span>Giảm giá ({vouchers.map((v) => v.maVoucher).filter(Boolean).join(" + ")})</span>
                                <strong>-{formatGia(tienGiam)}</strong>
                            </div>
                        )}
                        <div className="summary-divider" />
                        <div className="summary-total">
                            <span>Tổng thanh toán</span>
                            <strong>{formatGia(tongThanhToan)}</strong>
                        </div>
                        {phuongThuc === "CHUYEN_KHOAN" && (
                            <div style={{ marginTop: "15px", padding: "12px", background: "#fffaf5", border: "1px solid #eee", borderRadius: "8px", fontSize: "12px" }}>
                                <div style={{ color: "#777", marginBottom: "4px" }}>Phương thức</div>
                                <strong>🏦 Chuyển khoản</strong>
                            </div>
                        )}
                        <button className="checkout-button" onClick={datHang} disabled={dangDatHang}
                                style={{ opacity: dangDatHang ? 0.6 : 1, cursor: dangDatHang ? "not-allowed" : "pointer" }}>
                            {dangDatHang ? "Đang xử lý..." : "Xác nhận đặt hàng →"}
                        </button>
                        <button className="continue-shopping" onClick={() => setPage("cart")} disabled={dangDatHang} style={{ marginTop: "15px" }}>
                            ← Quay lại giỏ hàng
                        </button>
                        <div className="payment-note">🔒 Thanh toán an toàn và bảo mật</div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

function Loading() { return (
    <div className="loading">
        <div className="loading-spinner"></div>
        <p>Đang tải sản phẩm...</p>
    </div> );
}

function OrderHistory({ taiKhoan, setPage }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");

    const khachHangId = taiKhoan?.khachHangId;

    const statusMap = {
        CHO_XAC_NHAN: { label: "Chờ xác nhận", step: 1, className: "waiting" },
        DA_XAC_NHAN: { label: "Đã xác nhận", step: 2, className: "confirmed" },
        DANG_CHUAN_BI: { label: "Đang chuẩn bị", step: 3, className: "preparing" },
        DANG_GIAO: { label: "Đang giao", step: 4, className: "shipping" },
        DA_GIAO: { label: "Đã giao", step: 5, className: "delivered" },
        DA_HUY: { label: "Đã hủy", step: 0, className: "cancelled" },
    };

    const normalizeStatus = (value) =>
        String(value || "")
            .trim()
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[\s-]+/g, "_");

    const getStatus = (order) => {
        const raw = order?.trangThai || order?.trangThaiDonHang || order?.trangThaiHoaDon;
        const key = normalizeStatus(raw);
        return statusMap[key] || {
            label: raw || "Chưa cập nhật",
            step: 1,
            className: "unknown",
        };
    };

    const getOrderId = (order) => order?.id ?? order?.hoaDonId ?? order?.maHoaDon;
    const getOrderCode = (order) => order?.maHoaDon || `#${order?.id ?? ""}`;
    const getTotal = (order) =>
        Number(order?.tongThanhToan ?? order?.tongTienSauGiam ?? order?.tongTienHang ?? 0);

    const formatDate = (value) => {
        if (!value) return "Chưa cập nhật";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const loadOrders = async (keepSelected = false) => {
        if (!khachHangId) {
            setOrders([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await fetch(`${API}/hoa-don/khach-hang/${khachHangId}`);
            if (!response.ok) {
                throw new Error("Không thể tải danh sách đơn hàng");
            }

            const data = await response.json();
            const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
            list.sort((a, b) => {
                const da = new Date(a?.ngayLap || a?.ngayTao || 0).getTime();
                const db = new Date(b?.ngayLap || b?.ngayTao || 0).getTime();
                return db - da;
            });
            setOrders(list);

            if (keepSelected && selectedOrder) {
                const selectedId = getOrderId(selectedOrder);
                const fresh = list.find((item) => String(getOrderId(item)) === String(selectedId));
                if (fresh) {
                    await openOrder(fresh);
                }
            }
        } catch (err) {
            console.error("Lỗi tải đơn hàng:", err);
            setError(err.message || "Không thể tải đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    const openOrder = async (order) => {
        setSelectedOrder({ ...order, __chiTiet: order.__chiTiet || [], __lichSu: order.__lichSu || [] });
        setDetailLoading(true);
        setDetailError("");

        const id = getOrderId(order);
        if (!id) {
            setDetailLoading(false);
            return;
        }

        try {
            const [detailResponse, historyResponse] = await Promise.all([
                fetch(`${API}/hoa-don/${id}/chi-tiet`),
                fetch(`${API}/hoa-don/${id}/lich-su`),
            ]);

            const detailData = detailResponse.ok ? await detailResponse.json() : [];
            const historyData = historyResponse.ok ? await historyResponse.json() : [];

            setSelectedOrder({
                ...order,
                __chiTiet: Array.isArray(detailData) ? detailData : [],
                __lichSu: Array.isArray(historyData) ? historyData : [],
            });
        } catch (err) {
            console.error("Lỗi tải chi tiết đơn hàng:", err);
            setDetailError("Không tải được chi tiết đơn hàng. Bạn vẫn có thể xem trạng thái hiện tại.");
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [khachHangId]);

    const steps = [
        ["CHO_XAC_NHAN", "Chờ xác nhận"],
        ["DA_XAC_NHAN", "Đã xác nhận"],
        ["DANG_CHUAN_BI", "Đang chuẩn bị"],
        ["DANG_GIAO", "Đang giao"],
        ["DA_GIAO", "Đã giao"],
    ];

    return (
        <main className="order-history-page">
            <div className="container">
                <div className="order-history-heading">
                    <div>
                        <span className="section-kicker">FShop</span>
                        <h1>Đơn hàng của tôi</h1>
                        <p>Theo dõi trạng thái và xem lại chi tiết các đơn hàng bạn đã đặt.</p>
                    </div>
                    <button
                        type="button"
                        className="order-refresh-btn"
                        onClick={() => loadOrders(true)}
                        disabled={loading}
                    >
                        ↻ {loading ? "Đang tải..." : "Làm mới"}
                    </button>
                </div>

                {loading && orders.length === 0 ? (
                    <div className="order-state-card">
                        <div className="order-loading-spinner" />
                        <h3>Đang tải đơn hàng...</h3>
                        <p>Vui lòng chờ một chút.</p>
                    </div>
                ) : error ? (
                    <div className="order-state-card order-error-card">
                        <div className="order-state-icon">!</div>
                        <h3>Không tải được đơn hàng</h3>
                        <p>{error}</p>
                        <button type="button" onClick={() => loadOrders()}>Thử lại</button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="order-state-card">
                        <div className="order-state-icon">📦</div>
                        <h3>Bạn chưa có đơn hàng nào</h3>
                        <p>Hãy chọn sản phẩm và đặt hàng, đơn hàng của bạn sẽ xuất hiện tại đây.</p>
                        <button type="button" onClick={() => setPage("products")}>Mua sắm ngay</button>
                    </div>
                ) : (
                    <div className="order-history-layout">
                        <section className="order-list">
                            {orders.map((order) => {
                                const status = getStatus(order);
                                const selected = String(getOrderId(selectedOrder)) === String(getOrderId(order));
                                return (
                                    <button
                                        type="button"
                                        key={getOrderId(order) || getOrderCode(order)}
                                        className={`order-card ${selected ? "selected" : ""}`}
                                        onClick={() => openOrder(order)}
                                    >
                                        <div className="order-card-top">
                                            <div>
                                                <span className="order-code">{getOrderCode(order)}</span>
                                                <span className="order-date">{formatDate(order.ngayLap || order.ngayTao)}</span>
                                            </div>
                                            <span className={`order-status-badge ${status.className}`}>{status.label}</span>
                                        </div>
                                        <div className="order-card-bottom">
                                            <strong>{formatGia(getTotal(order))}</strong>
                                            <span>Xem chi tiết →</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </section>

                        <section className="order-detail-card">
                            {!selectedOrder ? (
                                <div className="order-detail-empty">
                                    <div>📋</div>
                                    <h3>Chọn một đơn hàng</h3>
                                    <p>Chọn đơn hàng bên trái để xem tiến trình giao hàng và chi tiết.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="order-detail-header">
                                        <div>
                                            <span className="section-kicker">Chi tiết đơn hàng</span>
                                            <h2>{getOrderCode(selectedOrder)}</h2>
                                            <p>Đặt lúc {formatDate(selectedOrder.ngayLap || selectedOrder.ngayTao)}</p>
                                        </div>
                                        <span className={`order-status-badge ${getStatus(selectedOrder).className}`}>
                                            {getStatus(selectedOrder).label}
                                        </span>
                                    </div>

                                    {detailError && <div className="order-inline-error">{detailError}</div>}

                                    <div className={`order-progress ${getStatus(selectedOrder).className}`}>
                                        {steps.map(([key, label], index) => {
                                            const currentStep = getStatus(selectedOrder).step;
                                            const done = currentStep > index + 1;
                                            const current = currentStep === index + 1;
                                            return (
                                                <div className={`order-step ${done ? "done" : ""} ${current ? "current" : ""}`} key={key}>
                                                    <span className="order-step-dot">{done ? "✓" : index + 1}</span>
                                                    <span>{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {getStatus(selectedOrder).className === "cancelled" && (
                                        <div className="order-cancel-note">
                                            Đơn hàng đã được hủy. Nếu cần hỗ trợ, vui lòng liên hệ cửa hàng.
                                        </div>
                                    )}

                                    <div className="order-info-grid">
                                        <div>
                                            <span>Người nhận</span>
                                            <strong>{selectedOrder.khachHang?.hoTen || "Chưa cập nhật"}</strong>
                                        </div>
                                        <div>
                                            <span>Số điện thoại</span>
                                            <strong>{selectedOrder.khachHang?.soDienThoai || "Chưa cập nhật"}</strong>
                                        </div>
                                        <div>
                                            <span>Địa chỉ</span>
                                            <strong>
                                                {selectedOrder.diaChi?.diaChi ||
                                                    selectedOrder.diaChi?.diaChiChiTiet ||
                                                    selectedOrder.diaChi?.chiTiet ||
                                                    selectedOrder.ghiChu ||
                                                    "Địa chỉ giao hàng đã lưu"}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Phương thức</span>
                                            <strong>{selectedOrder.loaiHoaDon || "Đơn hàng online"}</strong>
                                        </div>
                                    </div>

                                    <div className="order-section-block">
                                        <div className="order-section-title">
                                            <h3>Sản phẩm</h3>
                                            {detailLoading && <span>Đang tải...</span>}
                                        </div>
                                        {selectedOrder.__chiTiet?.length ? (
                                            <div className="order-item-list">
                                                {selectedOrder.__chiTiet.map((item, index) => {
                                                    const spct = item?.sanPhamChiTiet || {};
                                                    const sp = spct?.sanPham || {};
                                                    const size = spct?.kichCo?.tenKichCo || spct?.kichCo?.ten || spct?.kichCo?.size;
                                                    const color = spct?.mauSac?.tenMauSac || spct?.mauSac?.ten;
                                                    return (
                                                        <div className="order-item-row" key={item?.id || index}>
                                                            <div className="order-item-image">
                                                                {sp?.hinhAnh ? <img src={anhUrl(sp.hinhAnh)} alt={sp.tenSanPham || "Sản phẩm"} /> : <span>👟</span>}
                                                            </div>
                                                            <div className="order-item-main">
                                                                <strong>{sp?.tenSanPham || spct?.maSku || "Sản phẩm"}</strong>
                                                                <span>
                                                                    {[size && `Size ${size}`, color && `Màu ${color}`].filter(Boolean).join(" · ") || "Chi tiết sản phẩm"}
                                                                </span>
                                                                <small>x{item?.soLuong || 0}</small>
                                                            </div>
                                                            <strong>{formatGia(item?.thanhTien ?? (Number(item?.donGia || 0) * Number(item?.soLuong || 0)))}</strong>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="order-muted">Chưa có dữ liệu chi tiết sản phẩm.</p>
                                        )}
                                    </div>

                                    <div className="order-total-box">
                                        <div><span>Tiền hàng</span><strong>{formatGia(selectedOrder.tongTienHang || 0)}</strong></div>
                                        <div><span>Giảm giá</span><strong>-{formatGia(selectedOrder.tienGiam || 0)}</strong></div>
                                        <div><span>Phí vận chuyển</span><strong>{formatGia(selectedOrder.phiVanChuyen || 0)}</strong></div>
                                        <div className="grand"><span>Tổng thanh toán</span><strong>{formatGia(getTotal(selectedOrder))}</strong></div>
                                    </div>

                                    {selectedOrder.__lichSu?.length > 0 && (
                                        <div className="order-section-block order-history-log">
                                            <div className="order-section-title"><h3>Lịch sử trạng thái</h3></div>
                                            <div className="order-log-list">
                                                {[...selectedOrder.__lichSu]
                                                    .sort((a, b) => new Date(b?.thoiGian || 0) - new Date(a?.thoiGian || 0))
                                                    .map((item, index) => {
                                                        const st = getStatus({ trangThai: item?.trangThai });
                                                        return (
                                                            <div className="order-log-item" key={item?.id || index}>
                                                                <span className="order-log-dot" />
                                                                <div>
                                                                    <strong>{st.label}</strong>
                                                                    <span>{formatDate(item?.thoiGian)}</span>
                                                                    {item?.ghiChu && <p>{item.ghiChu}</p>}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </main>
    );
}

function Footer({ setPage }) { return (
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
                    FShop - Shop giày nam uy tín, chất lượng, giá tốt. Đồng hành
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
                <a
                    onClick={() => {
                        setPage("contact");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{ cursor: "pointer" }}
                >
                    Liên hệ
                </a>
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
                        type="email" placeholder="Nhập email của bạn"
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
    </footer> );
}
export default App;
