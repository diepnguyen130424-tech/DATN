
import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import AdminProducts from "./AdminProducts";
import EmployeeDashboard from "./EmployeeDashboard";
import AdminVoucher from "./AdminVoucher";
import AdminKhuyenMai from "./AdminKhuyenMai";
import AdminDanhMuc from "./AdminDanhMuc";
import AdminThuongHieu from "./AdminThuongHieu";
const API = "http://localhost:8080/api";


const menuItems = [
    { id: "dashboard", icon: "▦", label: "Tổng quan" },
    { id: "san-pham", icon: "□", label: "Sản phẩm" },
    { id: "danh-muc", icon: "▤", label: "Danh mục" },
    { id: "thuong-hieu", icon: "◇", label: "Thương hiệu" },
    { id: "kich-co", icon: "↔", label: "Kích cỡ" },
    { id: "mau-sac", icon: "●", label: "Màu sắc" },
    { id: "voucher", icon: "◇", label: "Voucher" },
    { id: "khuyen-mai", icon: "✦", label: "Khuyến mãi" },
    { id: "hoa-don", icon: "▧", label: "Hóa đơn" },
    { id: "thanh-toan", icon: "▤", label: "Thanh toán" },
    { id: "khach-hang", icon: "◎", label: "Khách hàng" },
    { id: "nhan-vien", icon: "♙", label: "Nhân viên" },
];

const TRANG_THAI_HOA_DON = [
    "CHO_XAC_NHAN",
    "DA_XAC_NHAN",
    "DANG_CHUAN_BI",
    "DANG_GIAO",
    "DA_GIAO",
    "DA_THANH_TOAN",
    "DA_HUY",
];

const TRANG_THAI_THANH_TOAN = [
    "CHO_THANH_TOAN",
    "DA_THANH_TOAN",
    "THAT_BAI",
];

function formatTien(value) {
    const number = Number(value || 0);

    return (
        number.toLocaleString("vi-VN") +
        "đ"
    );
}

function formatNgay(value) {
    if (!value) {
        return "-";
    }

    try {
        return new Date(value).toLocaleString(
            "vi-VN"
        );
    } catch {
        return String(value);
    }
}

function tenTrangThaiHoaDon(trangThai) {
    const map = {
        CHO_XAC_NHAN: "Chờ xác nhận",
        DA_XAC_NHAN: "Đã xác nhận",
        DANG_CHUAN_BI: "Đang chuẩn bị",
        DANG_GIAO: "Đang giao",
        DA_GIAO: "Đã giao",
        DA_THANH_TOAN: "Đã thanh toán",
        DA_HUY: "Đã hủy",
    };

    return (
        map[trangThai] ||
        trangThai ||
        "-"
    );
}

function tenTrangThaiThanhToan(
    trangThai
) {
    const map = {
        CHO_THANH_TOAN: "Chờ thanh toán",
        DA_THANH_TOAN: "Đã thanh toán",
        THAT_BAI: "Thanh toán thất bại",
    };

    return (
        map[trangThai] ||
        trangThai ||
        "-"
    );
}

function tenLoaiHoaDon(loaiHoaDon) {
    const map = {
        ONLINE: "Online",
        TAI_QUAY: "Tại quầy",
    };

    return (
        map[loaiHoaDon] ||
        loaiHoaDon ||
        "-"
    );
}

function tenPhuongThuc(phuongThuc) {
    const map = {
        COD: "Thanh toán khi nhận hàng",
        TIEN_MAT: "Tiền mặt",
        CHUYEN_KHOAN: "Chuyển khoản",
        VNPAY: "VNPay",
        MOMO: "MoMo",
    };

    return (
        map[phuongThuc] ||
        phuongThuc ||
        "-"
    );
}

function layTenSanPham(chiTiet) {
    return (
        chiTiet?.sanPhamChiTiet?.sanPham
            ?.tenSanPham ||
        chiTiet?.sanPhamChiTiet?.sanPham
            ?.ten ||
        chiTiet?.sanPham?.tenSanPham ||
        "Sản phẩm"
    );
}

const stats = [
    {
        label: "Tổng sản phẩm",
        value: "128",
        icon: "□",
        note: "+12%",
    },
    {
        label: "Đơn hàng",
        value: "56",
        icon: "▧",
        note: "+12%",
    },
    {
        label: "Khách hàng",
        value: "320",
        icon: "◎",
        note: "+12%",
    },
    {
        label: "Doanh thu",
        value: "48.500.000đ",
        icon: "₫",
        note: "+12%",
    },
];

const orders = [
    [
        "HD001",
        "Nguyễn Văn A",
        "4.800.000đ",
        "Chờ xác nhận",
    ],
    [
        "HD002",
        "Trần Văn B",
        "2.350.000đ",
        "Đang giao",
    ],
    [
        "HD003",
        "Lê Văn C",
        "1.500.000đ",
        "Đã giao",
    ],
    [
        "HD004",
        "Phạm Văn D",
        "3.200.000đ",
        "Đã thanh toán",
    ],
];

function DashboardContent() {
    return (
        <div className="admin-dashboard-content">

            <div className="admin-page-heading">

                <div>
                    <div className="admin-eyebrow">
                        FSHOP ADMIN
                    </div>

                    <h1>Tổng quan</h1>

                    <p>
                        Theo dõi hoạt động kinh doanh
                        của cửa hàng.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-date-button"
                >
                    <span>▣</span>
                    Tháng 09/2026
                </button>
            </div>

            <div className="admin-stats">

                {stats.map((item) => (
                    <div
                        className="admin-stat-card"
                        key={item.label}
                    >
                        <div className="admin-stat-top">

                            <div className="admin-stat-icon">
                                {item.icon}
                            </div>

                            <span className="admin-growth">
                                {item.note}
                            </span>

                        </div>

                        <div className="admin-stat-value">
                            {item.value}
                        </div>

                        <div className="admin-stat-label">
                            {item.label}
                        </div>
                    </div>
                ))}

            </div>

            <div className="admin-dashboard-grid">

                <section className="admin-card revenue-card">

                    <div className="admin-card-heading">

                        <div>
                            <h2>Doanh thu</h2>

                            <p>
                                Doanh thu trong 7 ngày
                                gần nhất
                            </p>
                        </div>

                        <strong>
                            48.500.000đ
                        </strong>

                    </div>

                    <div className="revenue-chart">

                        <div className="chart-labels">
                            <span>10tr</span>
                            <span>8tr</span>
                            <span>6tr</span>
                            <span>4tr</span>
                            <span>2tr</span>
                            <span>0</span>
                        </div>

                        <div className="chart-main">

                            <div className="chart-grid-lines">
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                            </div>

                            <div className="chart-bars">

                                {[
                                    35,
                                    52,
                                    42,
                                    72,
                                    58,
                                    88,
                                    76,
                                ].map(
                                    (
                                        height,
                                        index
                                    ) => (
                                        <div
                                            className="chart-bar-wrap"
                                            key={index}
                                        >
                                            <div
                                                className="chart-bar"
                                                style={{
                                                    height:
                                                        `${height}%`,
                                                }}
                                            />

                                            <span>
                                                {
                                                    [
                                                        "T2",
                                                        "T3",
                                                        "T4",
                                                        "T5",
                                                        "T6",
                                                        "T7",
                                                        "CN",
                                                    ][
                                                        index
                                                        ]
                                                }
                                            </span>
                                        </div>
                                    )
                                )}

                            </div>

                        </div>

                    </div>

                </section>

                <section className="admin-card">

                    <div className="admin-card-heading">

                        <div>
                            <h2>
                                Trạng thái đơn hàng
                            </h2>

                            <p>
                                Tổng quan đơn hàng
                            </p>
                        </div>

                    </div>

                    <div className="order-status-list">

                        <div>
                            <span className="status-dot pending" />
                            <span>
                                Chờ xác nhận
                            </span>
                            <strong>
                                12
                            </strong>
                        </div>

                        <div>
                            <span className="status-dot processing" />
                            <span>
                                Đang xử lý
                            </span>
                            <strong>
                                18
                            </strong>
                        </div>

                        <div>
                            <span className="status-dot shipping" />
                            <span>
                                Đang giao
                            </span>
                            <strong>
                                15
                            </strong>
                        </div>

                        <div>
                            <span className="status-dot done" />
                            <span>
                                Đã giao
                            </span>
                            <strong>
                                11
                            </strong>
                        </div>

                    </div>

                </section>

            </div>

            <section className="admin-card">

                <div className="admin-card-heading">

                    <div>
                        <h2>
                            Đơn hàng gần đây
                        </h2>

                        <p>
                            Các đơn hàng mới nhất
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-link-button"
                    >
                        Xem tất cả →
                    </button>

                </div>

                <div className="admin-table-scroll">

                    <table className="admin-table">

                        <thead>
                        <tr>
                            <th>
                                Mã hóa đơn
                            </th>

                            <th>
                                Khách hàng
                            </th>

                            <th>
                                Tổng tiền
                            </th>

                            <th>
                                Trạng thái
                            </th>
                        </tr>
                        </thead>

                        <tbody>

                        {orders.map(
                            (
                                [
                                    code,
                                    customer,
                                    total,
                                    status,
                                ]
                            ) => (
                                <tr key={code}>

                                    <td>
                                        <strong>
                                            {code}
                                        </strong>
                                    </td>

                                    <td>
                                        {customer}
                                    </td>

                                    <td>
                                        {total}
                                    </td>

                                    <td>
                                        <span className="order-status">
                                            {status}
                                        </span>
                                    </td>

                                </tr>
                            )
                        )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}

function HoaDonContent() {

    const [hoaDons, setHoaDons] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [filterTrangThai, setFilterTrangThai] =
        useState("");

    const [filterLoai, setFilterLoai] =
        useState("");

    const [selectedHoaDon, setSelectedHoaDon] =
        useState(null);

    const [chiTiet, setChiTiet] =
        useState([]);

    const [thanhToan, setThanhToan] =
        useState(null);

    const [lichSu, setLichSu] =
        useState([]);

    const [loadingDetail, setLoadingDetail] =
        useState(false);

    const [detailError, setDetailError] =
        useState("");

    const [updatingStatus, setUpdatingStatus] =
        useState(false);

    const taiHoaDon = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await fetch(
                    `${API}/hoa-don`
);

const text =
    await response.text();

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
        "Không thể tải danh sách hóa đơn"
    );
}

setHoaDons(
    Array.isArray(data)
        ? data
        : []
);

} catch (err) {

    console.error(
        "Lỗi tải hóa đơn:",
        err
    );

    setError(
        err.message ||
        "Không thể kết nối tới máy chủ"
    );

    setHoaDons([]);

} finally {

    setLoading(false);

}
};

useEffect(() => {
    taiHoaDon();
}, []);

const xemChiTiet = async (
    hoaDon
) => {

    try {

        setSelectedHoaDon(
            hoaDon
        );

        setLoadingDetail(
            true
        );

        setDetailError("");

        setChiTiet([]);

        setThanhToan(null);

        setLichSu([]);

        const [
            chiTietResponse,
            thanhToanResponse,
            lichSuResponse,
        ] =
            await Promise.all([
                fetch(
                    `${API}/hoa-don/${hoaDon.id}/chi-tiet`
                ),

                fetch(
                    `${API}/hoa-don/${hoaDon.id}/thanh-toan`
                ),

                fetch(
                    `${API}/hoa-don/${hoaDon.id}/lich-su`
                ),
            ]);

        if (
            chiTietResponse.ok
        ) {

            const data =
                await chiTietResponse.json();

            setChiTiet(
                Array.isArray(data)
                    ? data
                    : []
            );

        }

        if (
            thanhToanResponse.ok
        ) {

            const data =
                await thanhToanResponse.json();

            setThanhToan(
                data
            );

        }

        if (
            lichSuResponse.ok
        ) {

            const data =
                await lichSuResponse.json();

            setLichSu(
                Array.isArray(data)
                    ? data
                    : []
            );

        }

    } catch (err) {

        console.error(
            "Lỗi tải chi tiết:",
            err
        );

        setDetailError(
            err.message ||
            "Không thể tải chi tiết hóa đơn"
        );

    } finally {

        setLoadingDetail(
            false
        );

    }
};

const capNhatTrangThai =
    async (
        trangThai
    ) => {

        if (!selectedHoaDon) {
            return;
        }

        try {

            setUpdatingStatus(
                true
            );

            const params =
                new URLSearchParams();

            params.append(
                "trangThai",
                trangThai
            );

            const response =
                await fetch(
                    `${API}/hoa-don/${selectedHoaDon.id}/trang-thai?${params.toString()}`,
                    {
                        method: "PUT",
                    }
                );

            const text =
                await response.text();

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
                    "Không thể cập nhật trạng thái"
                );
            }

            setSelectedHoaDon(
                data
            );

            setHoaDons(
                (old) =>
                    old.map(
                        (item) =>
                            item.id ===
                            data.id
                                ? data
                                : item
                    )
            );

            const historyResponse =
                await fetch(
                    `${API}/hoa-don/${data.id}/lich-su`
                );

            if (
                historyResponse.ok
            ) {

                const historyData =
                    await historyResponse.json();

                setLichSu(
                    Array.isArray(
                        historyData
                    )
                        ? historyData
                        : []
                );
            }

            alert(
                "Đã cập nhật trạng thái hóa đơn"
            );

        } catch (err) {

            console.error(
                err
            );

            alert(
                err.message ||
                "Không thể cập nhật trạng thái"
            );

        } finally {

            setUpdatingStatus(
                false
            );

        }
    };

const danhSachLoc =
    hoaDons.filter(
        (hoaDon) => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();

            const maHoaDon =
                String(
                    hoaDon.maHoaDon ||
                    ""
                ).toLowerCase();

            const tenKhachHang =
                String(
                    hoaDon
                        .khachHang
                        ?.hoTen ||
                    hoaDon
                        .diaChi
                        ?.tenNguoiNhan ||
                    ""
                ).toLowerCase();

            const matchSearch =
                !keyword ||
                maHoaDon.includes(
                    keyword
                ) ||
                tenKhachHang.includes(
                    keyword
                );

            const matchTrangThai =
                !filterTrangThai ||
                hoaDon.trangThai ===
                filterTrangThai;

            const matchLoai =
                !filterLoai ||
                hoaDon.loaiHoaDon ===
                filterLoai;

            return (
                matchSearch &&
                matchTrangThai &&
                matchLoai
            );
        }
    );

return (
    <div
        style={{
            padding: "4px",
        }}
    >

        <div
            style={{
                display:
                    "flex",
                justifyContent:
                    "space-between",
                alignItems:
                    "flex-start",
                gap: "20px",
                marginBottom:
                    "24px",
                flexWrap:
                    "wrap",
            }}
        >

            <div>

                <div className="admin-eyebrow">
                    FSHOP ADMIN
                </div>

                <h1
                    style={{
                        margin:
                            "5px 0 8px",
                    }}
                >
                    Hóa đơn
                </h1>

                <p
                    style={{
                        margin: 0,
                        color:
                            "#777",
                    }}
                >
                    Quản lý đơn hàng và
                    trạng thái xử lý.
                </p>

            </div>

            <button
                type="button"
                onClick={
                    taiHoaDon
                }
                style={{
                    border:
                        "1px solid #ddd",
                    background:
                        "#fff",
                    padding:
                        "10px 16px",
                    borderRadius:
                        "8px",
                    cursor:
                        "pointer",
                    fontWeight:
                        600,
                }}
            >
                ↻ Làm mới
            </button>

        </div>

        <section
            className="admin-card"
            style={{
                marginBottom:
                    "20px",
            }}
        >

            <div
                style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "minmax(250px,1fr) 220px 180px",
                    gap: "12px",
                }}
            >

                <input
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                    placeholder="Tìm mã hóa đơn hoặc tên khách hàng..."
                    style={{
                        width:
                            "100%",
                        boxSizing:
                            "border-box",
                        padding:
                            "12px 14px",
                        border:
                            "1px solid #ddd",
                        borderRadius:
                            "8px",
                    }}
                />

                <select
                    value={
                        filterTrangThai
                    }
                    onChange={(e) =>
                        setFilterTrangThai(
                            e.target.value
                        )
                    }
                    style={{
                        padding:
                            "12px 14px",
                        border:
                            "1px solid #ddd",
                        borderRadius:
                            "8px",
                        background:
                            "#fff",
                    }}
                >

                    <option value="">
                        Tất cả trạng thái
                    </option>

                    {TRANG_THAI_HOA_DON.map(
                        (item) => (
                            <option
                                key={item}
                                value={item}
                            >
                                {tenTrangThaiHoaDon(
                                    item
                                )}
                            </option>
                        )
                    )}

                </select>

                <select
                    value={
                        filterLoai
                    }
                    onChange={(e) =>
                        setFilterLoai(
                            e.target.value
                        )
                    }
                    style={{
                        padding:
                            "12px 14px",
                        border:
                            "1px solid #ddd",
                        borderRadius:
                            "8px",
                        background:
                            "#fff",
                    }}
                >

                    <option value="">
                        Tất cả loại
                    </option>

                    <option value="ONLINE">
                        Online
                    </option>

                    <option value="TAI_QUAY">
                        Tại quầy
                    </option>

                </select>

            </div>

        </section>

        <section className="admin-card">

            <div className="admin-card-heading">

                <div>
                    <h2>
                        Danh sách hóa đơn
                    </h2>

                    <p>
                        {danhSachLoc.length} hóa đơn
                    </p>
                </div>

            </div>

            {loading ? (

                <div
                    style={{
                        padding:
                            "50px",
                        textAlign:
                            "center",
                        color:
                            "#777",
                    }}
                >
                    Đang tải hóa đơn...
                </div>

            ) : error ? (

                <div
                    style={{
                        padding:
                            "30px",
                        textAlign:
                            "center",
                        color:
                            "#c62828",
                    }}
                >

                    <div
                        style={{
                            marginBottom:
                                "12px",
                        }}
                    >
                        {error}
                    </div>

                    <button
                        type="button"
                        onClick={
                            taiHoaDon
                        }
                    >
                        Thử lại
                    </button>

                </div>

            ) : danhSachLoc.length ===
            0 ? (

                <div
                    style={{
                        padding:
                            "50px",
                        textAlign:
                            "center",
                        color:
                            "#777",
                    }}
                >
                    Không có hóa đơn.
                </div>

            ) : (

                <div
                    style={{
                        overflowX:
                            "auto",
                    }}
                >

                    <table
                        className="admin-table"
                        style={{
                            minWidth:
                                "1000px",
                        }}
                    >

                        <thead>

                        <tr>

                            <th>
                                Mã hóa đơn
                            </th>

                            <th>
                                Khách hàng
                            </th>

                            <th>
                                Ngày lập
                            </th>

                            <th>
                                Loại
                            </th>

                            <th>
                                Tổng tiền
                            </th>

                            <th>
                                Trạng thái
                            </th>

                            <th>
                                Thao tác
                            </th>

                        </tr>

                        </thead>

                        <tbody>

                        {danhSachLoc.map(
                            (hoaDon) => (

                                <tr
                                    key={
                                        hoaDon.id
                                    }
                                >

                                    <td>
                                        <strong>
                                            {
                                                hoaDon.maHoaDon
                                            }
                                        </strong>
                                    </td>

                                    <td>
                                        {
                                            hoaDon
                                                .khachHang
                                                ?.hoTen ||
                                            hoaDon
                                                .diaChi
                                                ?.tenNguoiNhan ||
                                            "Khách lẻ"
                                        }
                                    </td>

                                    <td>
                                        {formatNgay(
                                            hoaDon.ngayLap
                                        )}
                                    </td>

                                    <td>
                                        {tenLoaiHoaDon(
                                            hoaDon.loaiHoaDon
                                        )}
                                    </td>

                                    <td>
                                        <strong>
                                            {formatTien(
                                                hoaDon.tongThanhToan
                                            )}
                                        </strong>
                                    </td>

                                    <td>
                                        {tenTrangThaiHoaDon(
                                            hoaDon.trangThai
                                        )}
                                    </td>

                                    <td>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                xemChiTiet(
                                                    hoaDon
                                                )
                                            }
                                            style={{
                                                border:
                                                    "1px solid #ddd",
                                                background:
                                                    "#fff",
                                                padding:
                                                    "7px 12px",
                                                borderRadius:
                                                    "7px",
                                                cursor:
                                                    "pointer",
                                            }}
                                        >
                                            Xem
                                        </button>

                                    </td>

                                </tr>

                            )
                        )}

                        </tbody>

                    </table>

                </div>

            )}

        </section>

        {selectedHoaDon && (

            <div
                onClick={() =>
                    setSelectedHoaDon(
                        null
                    )
                }
                style={{
                    position:
                        "fixed",
                    inset: 0,
                    background:
                        "rgba(0,0,0,.45)",
                    zIndex:
                        9999,
                    display:
                        "flex",
                    alignItems:
                        "center",
                    justifyContent:
                        "center",
                    padding:
                        "20px",
                }}
            >

                <div
                    onClick={(e) =>
                        e.stopPropagation()
                    }
                    style={{
                        width:
                            "min(1100px,100%)",
                        maxHeight:
                            "90vh",
                        overflowY:
                            "auto",
                        background:
                            "#fff",
                        borderRadius:
                            "14px",
                        padding:
                            "28px",
                    }}
                >

                    <div
                        style={{
                            display:
                                "flex",
                            justifyContent:
                                "space-between",
                            marginBottom:
                                "24px",
                        }}
                    >

                        <div>

                            <div
                                style={{
                                    color:
                                        "#888",
                                    fontSize:
                                        "12px",
                                }}
                            >
                                CHI TIẾT HÓA ĐƠN
                            </div>

                            <h2>
                                {
                                    selectedHoaDon.maHoaDon
                                }
                            </h2>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setSelectedHoaDon(
                                    null
                                )
                            }
                        >
                            ×
                        </button>

                    </div>

                    {detailError && (

                        <div
                            style={{
                                color:
                                    "#c62828",
                                marginBottom:
                                    "15px",
                            }}
                        >
                            {detailError}
                        </div>

                    )}

                    <div
                        style={{
                            display:
                                "grid",
                            gridTemplateColumns:
                                "repeat(4,1fr)",
                            gap:
                                "12px",
                            marginBottom:
                                "25px",
                        }}
                    >

                        <div>
                            <small>
                                Khách hàng
                            </small>

                            <strong
                                style={{
                                    display:
                                        "block",
                                }}
                            >
                                {
                                    selectedHoaDon
                                        .khachHang
                                        ?.hoTen ||
                                    selectedHoaDon
                                        .diaChi
                                        ?.tenNguoiNhan ||
                                    "Khách lẻ"
                                }
                            </strong>
                        </div>

                        <div>
                            <small>
                                Ngày lập
                            </small>

                            <strong
                                style={{
                                    display:
                                        "block",
                                }}
                            >
                                {formatNgay(
                                    selectedHoaDon.ngayLap
                                )}
                            </strong>
                        </div>

                        <div>
                            <small>
                                Loại
                            </small>

                            <strong
                                style={{
                                    display:
                                        "block",
                                }}
                            >
                                {tenLoaiHoaDon(
                                    selectedHoaDon.loaiHoaDon
                                )}
                            </strong>
                        </div>

                        <div>
                            <small>
                                Tổng tiền
                            </small>

                            <strong
                                style={{
                                    display:
                                        "block",
                                    color:
                                        "#e53935",
                                }}
                            >
                                {formatTien(
                                    selectedHoaDon.tongThanhToan
                                )}
                            </strong>
                        </div>

                    </div>

                    <section
                        style={{
                            marginBottom:
                                "25px",
                        }}
                    >

                        <h3>
                            Xử lý hóa đơn
                        </h3>

                        <select
                            value={
                                selectedHoaDon.trangThai ||
                                ""
                            }
                            disabled={
                                updatingStatus
                            }
                            onChange={(e) =>
                                capNhatTrangThai(
                                    e.target
                                        .value
                                )
                            }
                            style={{
                                padding:
                                    "10px",
                                border:
                                    "1px solid #ddd",
                                borderRadius:
                                    "8px",
                                minWidth:
                                    "250px",
                            }}
                        >

                            {TRANG_THAI_HOA_DON.map(
                                (item) => (
                                    <option
                                        key={
                                            item
                                        }
                                        value={
                                            item
                                        }
                                    >
                                        {tenTrangThaiHoaDon(
                                            item
                                        )}
                                    </option>
                                )
                            )}

                        </select>

                    </section>

                    <section
                        style={{
                            marginBottom:
                                "25px",
                        }}
                    >

                        <h3>
                            Chi tiết sản phẩm
                        </h3>

                        {loadingDetail ? (

                            <div>
                                Đang tải...
                            </div>

                        ) : chiTiet.length ===
                        0 ? (

                            <div>
                                Không có sản phẩm.
                            </div>

                        ) : (

                            <div
                                style={{
                                    overflowX:
                                        "auto",
                                }}
                            >

                                <table
                                    className="admin-table"
                                    style={{
                                        width:
                                            "100%",
                                    }}
                                >

                                    <thead>

                                    <tr>

                                        <th>
                                            Sản phẩm
                                        </th>

                                        <th>
                                            SKU
                                        </th>

                                        <th>
                                            Số lượng
                                        </th>

                                        <th>
                                            Đơn giá
                                        </th>

                                        <th>
                                            Thành tiền
                                        </th>

                                    </tr>

                                    </thead>

                                    <tbody>

                                    {chiTiet.map(
                                        (item) => {

                                            const spct =
                                                item.sanPhamChiTiet;

                                            return (
                                                <tr
                                                    key={
                                                        item.id
                                                    }
                                                >

                                                    <td>
                                                        {layTenSanPham(
                                                            item
                                                        )}
                                                    </td>

                                                    <td>
                                                        {
                                                            spct?.maSku ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            item.soLuong
                                                        }
                                                    </td>

                                                    <td>
                                                        {formatTien(
                                                            item.donGia
                                                        )}
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {formatTien(
                                                                item.thanhTien
                                                            )}
                                                        </strong>
                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </section>

                    <section
                        style={{
                            marginBottom:
                                "25px",
                        }}
                    >

                        <h3>
                            Thanh toán
                        </h3>

                        {thanhToan ? (

                            <div
                                style={{
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                        "repeat(4,1fr)",
                                    gap:
                                        "12px",
                                }}
                            >

                                <div>
                                    <small>
                                        Phương thức
                                    </small>

                                    <strong
                                        style={{
                                            display:
                                                "block",
                                        }}
                                    >
                                        {tenPhuongThuc(
                                            thanhToan.phuongThuc
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <small>
                                        Số tiền
                                    </small>

                                    <strong
                                        style={{
                                            display:
                                                "block",
                                        }}
                                    >
                                        {formatTien(
                                            thanhToan.soTien
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <small>
                                        Trạng thái
                                    </small>

                                    <strong
                                        style={{
                                            display:
                                                "block",
                                        }}
                                    >
                                        {tenTrangThaiThanhToan(
                                            thanhToan.trangThai
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <small>
                                        Ngày thanh toán
                                    </small>

                                    <strong
                                        style={{
                                            display:
                                                "block",
                                        }}
                                    >
                                        {formatNgay(
                                            thanhToan.ngayThanhToan
                                        )}
                                    </strong>
                                </div>

                            </div>

                        ) : (

                            <div>
                                Chưa có thông tin
                                thanh toán.
                            </div>

                        )}

                    </section>

                    <section>

                        <h3>
                            Lịch sử hóa đơn
                        </h3>

                        {lichSu.length ===
                        0 ? (

                            <div>
                                Chưa có lịch sử.
                            </div>

                        ) : (

                            lichSu.map(
                                (item) => (
                                    <div
                                        key={
                                            item.id
                                        }
                                        style={{
                                            padding:
                                                "10px",
                                            borderBottom:
                                                "1px solid #eee",
                                        }}
                                    >

                                        <strong>
                                            {tenTrangThaiHoaDon(
                                                item.trangThai
                                            )}
                                        </strong>

                                        <div>
                                            {formatNgay(
                                                item.thoiGian
                                            )}
                                        </div>

                                        {item.ghiChu && (
                                            <div>
                                                {
                                                    item.ghiChu
                                                }
                                            </div>
                                        )}

                                    </div>
                                )
                            )

                        )}

                    </section>

                </div>

            </div>

        )}

    </div>
);
}

function ThanhToanContent() {

    const [hoaDons, setHoaDons] =
        useState([]);

    const [thanhToans, setThanhToans] =
        useState({});

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [filterTrangThai, setFilterTrangThai] =
        useState("");

    const taiThanhToan = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await fetch(
                    `${API}/hoa-don`
                );

            const text =
                await response.text();

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
                    "Không thể tải thanh toán"
                );
            }

            const danhSach =
                Array.isArray(data)
                    ? data
                    : [];

            setHoaDons(
                danhSach
            );

            const result = {};

            await Promise.all(
                danhSach.map(
                    async (hoaDon) => {

                        try {

                            const paymentResponse =
                                await fetch(
                                    `${API}/hoa-don/${hoaDon.id}/thanh-toan`
                                );

                            if (
                                paymentResponse.ok
                            ) {

                                result[
                                    hoaDon.id
                                    ] =
                                    await paymentResponse.json();

                            }

                        } catch (
                            paymentError
                            ) {

                            console.error(
                                paymentError
                            );

                        }

                    }
                )
            );

            setThanhToans(
                result
            );

        } catch (err) {

            console.error(
                "Lỗi tải thanh toán:",
                err
            );

            setError(
                err.message ||
                "Không thể kết nối tới máy chủ"
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        taiThanhToan();
    }, []);

    const xacNhanThanhToan =
        async (
            hoaDon,
            thanhToan
        ) => {

            if (!thanhToan) {

                alert(
                    "Hóa đơn chưa có bản ghi thanh toán."
                );

                return;
            }

            if (
                thanhToan.trangThai ===
                "DA_THANH_TOAN"
            ) {

                alert(
                    "Khoản thanh toán này đã được xác nhận."
                );

                return;
            }

            try {

                const paymentResponse =
                    await fetch(
                        `${API}/hoa-don/thanh-toan`,
                        {
                            method:
                                "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                            body:
                                JSON.stringify(
                                    {
                                        id:
                                        thanhToan.id,

                                        hoaDon: {
                                            id:
                                            hoaDon.id,
                                        },

                                        phuongThuc:
                                        thanhToan.phuongThuc,

                                        trangThai:
                                            "DA_THANH_TOAN",

                                        maGiaoDich:
                                        thanhToan.maGiaoDich,
                                    }
                                ),
                        }
                    );

                const paymentText =
                    await paymentResponse.text();

                let paymentData =
                    null;

                try {

                    paymentData =
                        paymentText
                            ? JSON.parse(
                                paymentText
                            )
                            : null;

                } catch {

                    paymentData =
                        null;

                }

                if (
                    !paymentResponse.ok
                ) {

                    throw new Error(
                        paymentData?.message ||
                        paymentData?.error ||
                        paymentText ||
                        "Không thể cập nhật thanh toán"
                    );

                }

                const params =
                    new URLSearchParams();

                params.append(
                    "trangThai",
                    "DA_THANH_TOAN"
                );

                params.append(
                    "ghiChu",
                    "Admin xác nhận đã thanh toán"
                );

                const invoiceResponse =
                    await fetch(
                        `${API}/hoa-don/${hoaDon.id}/trang-thai?${params.toString()}`,
                        {
                            method:
                                "PUT",
                        }
                    );

                if (
                    !invoiceResponse.ok
                ) {

                    const invoiceText =
                        await invoiceResponse.text();

                    throw new Error(
                        invoiceText ||
                        "Không thể cập nhật trạng thái hóa đơn"
                    );

                }

                alert(
                    "Đã xác nhận thanh toán thành công."
                );

                await taiThanhToan();

            } catch (err) {

                console.error(
                    "Lỗi xác nhận thanh toán:",
                    err
                );

                alert(
                    err.message ||
                    "Không thể xác nhận thanh toán"
                );

            }
        };

    const danhSachLoc =
        hoaDons.filter(
            (hoaDon) => {

                const payment =
                    thanhToans[
                        hoaDon.id
                        ];

                const keyword =
                    search
                        .trim()
                        .toLowerCase();

                const maHoaDon =
                    String(
                        hoaDon.maHoaDon ||
                        ""
                    ).toLowerCase();

                const tenKhachHang =
                    String(
                        hoaDon
                            .khachHang
                            ?.hoTen ||
                        hoaDon
                            .diaChi
                            ?.tenNguoiNhan ||
                        ""
                    ).toLowerCase();

                const matchSearch =
                    !keyword ||
                    maHoaDon.includes(
                        keyword
                    ) ||
                    tenKhachHang.includes(
                        keyword
                    );

                const matchTrangThai =
                    !filterTrangThai ||
                    payment?.trangThai ===
                    filterTrangThai;

                return (
                    matchSearch &&
                    matchTrangThai
                );
            }
        );

    return (
        <div
            style={{
                padding: "4px",
            }}
        >

            <div
                style={{
                    display:
                        "flex",
                    justifyContent:
                        "space-between",
                    alignItems:
                        "flex-start",
                    gap: "20px",
                    marginBottom:
                        "24px",
                    flexWrap:
                        "wrap",
                }}
            >

                <div>

                    <div className="admin-eyebrow">
                        FSHOP ADMIN
                    </div>

                    <h1
                        style={{
                            margin:
                                "5px 0 8px",
                        }}
                    >
                        Thanh toán
                    </h1>

                    <p
                        style={{
                            margin: 0,
                            color:
                                "#777",
                        }}
                    >
                        Quản lý trạng thái
                        thanh toán của
                        các hóa đơn.
                    </p>

                </div>

                <button
                    type="button"
                    onClick={
                        taiThanhToan
                    }
                    style={{
                        border:
                            "1px solid #ddd",
                        background:
                            "#fff",
                        padding:
                            "10px 16px",
                        borderRadius:
                            "8px",
                        cursor:
                            "pointer",
                        fontWeight:
                            600,
                    }}
                >
                    ↻ Làm mới
                </button>

            </div>

            <section
                className="admin-card"
                style={{
                    marginBottom:
                        "20px",
                }}
            >

                <div
                    style={{
                        display:
                            "grid",
                        gridTemplateColumns:
                            "1fr 220px",
                        gap:
                            "12px",
                    }}
                >

                    <input
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        placeholder="Tìm mã hóa đơn hoặc tên khách hàng..."
                        style={{
                            width:
                                "100%",
                            boxSizing:
                                "border-box",
                            padding:
                                "12px 14px",
                            border:
                                "1px solid #ddd",
                            borderRadius:
                                "8px",
                        }}
                    />

                    <select
                        value={
                            filterTrangThai
                        }
                        onChange={(e) =>
                            setFilterTrangThai(
                                e.target
                                    .value
                            )
                        }
                        style={{
                            padding:
                                "12px 14px",
                            border:
                                "1px solid #ddd",
                            borderRadius:
                                "8px",
                            background:
                                "#fff",
                        }}
                    >

                        <option value="">
                            Tất cả thanh toán
                        </option>

                        {TRANG_THAI_THANH_TOAN.map(
                            (item) => (
                                <option
                                    key={
                                        item
                                    }
                                    value={
                                        item
                                    }
                                >
                                    {tenTrangThaiThanhToan(
                                        item
                                    )}
                                </option>
                            )
                        )}

                    </select>

                </div>

            </section>

            <section className="admin-card">

                <div className="admin-card-heading">

                    <div>

                        <h2>
                            Danh sách thanh toán
                        </h2>

                        <p>
                            {danhSachLoc.length} hóa đơn
                        </p>

                    </div>

                </div>

                {loading ? (

                    <div
                        style={{
                            padding:
                                "50px",
                            textAlign:
                                "center",
                            color:
                                "#777",
                        }}
                    >
                        Đang tải thanh toán...
                    </div>

                ) : error ? (

                    <div
                        style={{
                            padding:
                                "30px",
                            textAlign:
                                "center",
                            color:
                                "#c62828",
                        }}
                    >
                        {error}
                    </div>

                ) : danhSachLoc.length ===
                0 ? (

                    <div
                        style={{
                            padding:
                                "50px",
                            textAlign:
                                "center",
                            color:
                                "#777",
                        }}
                    >
                        Không có thanh toán.
                    </div>

                ) : (

                    <div
                        style={{
                            overflowX:
                                "auto",
                        }}
                    >

                        <table
                            className="admin-table"
                            style={{
                                minWidth:
                                    "1100px",
                            }}
                        >

                            <thead>

                            <tr>

                                <th>
                                    Mã hóa đơn
                                </th>

                                <th>
                                    Khách hàng
                                </th>

                                <th>
                                    Phương thức
                                </th>

                                <th>
                                    Số tiền
                                </th>

                                <th>
                                    Mã giao dịch
                                </th>

                                <th>
                                    Trạng thái
                                </th>

                                <th>
                                    Ngày thanh toán
                                </th>

                                <th>
                                    Thao tác
                                </th>

                            </tr>

                            </thead>

                            <tbody>

                            {danhSachLoc.map(
                                (hoaDon) => {

                                    const payment =
                                        thanhToans[
                                            hoaDon.id
                                            ];

                                    return (
                                        <tr
                                            key={
                                                hoaDon.id
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        hoaDon.maHoaDon
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    hoaDon
                                                        .khachHang
                                                        ?.hoTen ||
                                                    hoaDon
                                                        .diaChi
                                                        ?.tenNguoiNhan ||
                                                    "Khách lẻ"
                                                }
                                            </td>

                                            <td>
                                                {tenPhuongThuc(
                                                    payment
                                                        ?.phuongThuc
                                                )}
                                            </td>

                                            <td>
                                                <strong>
                                                    {formatTien(
                                                        payment
                                                            ?.soTien ??
                                                        hoaDon.tongThanhToan
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    payment
                                                        ?.maGiaoDich ||
                                                    "-"
                                                }
                                            </td>

                                            <td>

                                                <span
                                                    style={{
                                                        display:
                                                            "inline-block",
                                                        padding:
                                                            "5px 10px",
                                                        borderRadius:
                                                            "20px",
                                                        background:
                                                            payment
                                                                ?.trangThai ===
                                                            "DA_THANH_TOAN"
                                                                ? "#e8f5e9"
                                                                : payment
                                                                    ?.trangThai ===
                                                                "THAT_BAI"
                                                                    ? "#ffebee"
                                                                    : "#fff3e0",
                                                        color:
                                                            payment
                                                                ?.trangThai ===
                                                            "DA_THANH_TOAN"
                                                                ? "#2e7d32"
                                                                : payment
                                                                    ?.trangThai ===
                                                                "THAT_BAI"
                                                                    ? "#c62828"
                                                                    : "#ef6c00",
                                                        fontSize:
                                                            "12px",
                                                        fontWeight:
                                                            600,
                                                    }}
                                                >
                                                    {tenTrangThaiThanhToan(
                                                        payment
                                                            ?.trangThai
                                                    )}
                                                </span>

                                            </td>

                                            <td>
                                                {formatNgay(
                                                    payment
                                                        ?.ngayThanhToan
                                                )}
                                            </td>

                                            <td>

                                                {payment &&
                                                payment.trangThai !==
                                                "DA_THANH_TOAN" ? (

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            xacNhanThanhToan(
                                                                hoaDon,
                                                                payment
                                                            )
                                                        }
                                                        style={{
                                                            border:
                                                                "none",
                                                            background:
                                                                "#2e7d32",
                                                            color:
                                                                "#fff",
                                                            padding:
                                                                "8px 12px",
                                                            borderRadius:
                                                                "7px",
                                                            cursor:
                                                                "pointer",
                                                            fontWeight:
                                                                600,
                                                        }}
                                                    >
                                                        ✓ Xác nhận
                                                    </button>

                                                ) : (

                                                    <span
                                                        style={{
                                                            color:
                                                                "#2e7d32",
                                                            fontWeight:
                                                                600,
                                                        }}
                                                    >
                                                        ✓ Hoàn tất
                                                    </span>

                                                )}

                                            </td>

                                        </tr>
                                    );
                                }
                            )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

        </div>
    );
}


const searchInputStyle = {
    width: "400px",
    maxWidth: "100%",
    height: "58px",
    boxSizing: "border-box",
    padding: "0 18px",
    border: "1px solid #d9d9d9",
    borderRadius: "10px",
    fontSize: "18px",
    color: "#222",
    outline: "none",
    background: "#fff"
};

function CustomerContent() {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [addresses, setAddresses] = useState([]);

    const taiKhachHang = async () => {
        try {
            const res = await fetch(`${API}/khach-hang`);
            if (res.ok) setCustomers(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        taiKhachHang();
    }, []);

    const filtered = customers.filter((item) =>
        `${item.hoTen} ${item.taiKhoan?.tenDangNhap || ""} ${item.soDienThoai || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const formatGioiTinh = (value) => {
        if (value === "NAM") return "Nam";
        if (value === "NU") return "Nữ";
        return value || "-";
    };

    const formatNgaySinh = (value) => {
        if (!value) return "-";
        const [year, month, day] = value.split("-");
        return `${day}/${month}/${year}`;
    };

    const xemChiTiet = async (customer) => {
        setSelected(customer);
        setAddresses([]);

        try {
            const res = await fetch(`${API}/dia-chi/khach-hang/${customer.id}`);
            if (res.ok) {
                const data = await res.json();
                setAddresses(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="admin-dashboard-content">
            <div className="admin-page-heading">
                <div>
                    <div className="admin-eyebrow">FSHOP ADMIN</div>
                    <h1>Khách hàng</h1>
                    <p>Quản lý thông tin khách hàng.</p>
                </div>
            </div>

            <section className="admin-card">
                <div className="customer-toolbar">
                    <input
                        className="customer-search-input"
                        style={searchInputStyle}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm tên, tên đăng nhập hoặc số điện thoại..."
                    />
                </div>
            </section>

            <section className="admin-card">
                <div className="admin-table-scroll">
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Họ tên</th>
                            <th>Tên đăng nhập</th>
                            <th>Số điện thoại</th>
                            <th>Giới tính</th>
                            <th>Thao tác</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="customer-empty">
                                    Đang tải khách hàng...
                                </td>
                            </tr>
                        ) : filtered.length ? (
                            filtered.map((item) => (
                                <tr key={item.id}>
                                    <td>#{item.id}</td>
                                    <td><strong>{item.hoTen}</strong></td>
                                    <td>{item.taiKhoan?.tenDangNhap || "-"}</td>
                                    <td>{item.soDienThoai || "-"}</td>
                                    <td>{formatGioiTinh(item.gioiTinh)}</td>
                                    <td>
                                        <button
                                            type="button"
                                            onClick={() => xemChiTiet(item)}
                                            style={{
                                                border: "1px solid #ddd",
                                                background: "#fff",
                                                color: "#222",
                                                padding: "8px 16px",
                                                borderRadius: "9px",
                                                cursor: "pointer",
                                                fontSize: "16px",
                                                fontWeight: 400
                                            }}
                                        >
                                            Xem
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="customer-empty">
                                    Không có khách hàng.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>
            {selected && (
                <div
                    onClick={() => setSelected(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "min(650px,100%)",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            background: "#fff",
                            borderRadius: "14px",
                            padding: "25px"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between"
                            }}
                        >
                            <h2>Chi tiết khách hàng</h2>
                            <button onClick={() => setSelected(null)}>×</button>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "14px",
                                marginBottom: "25px"
                            }}
                        >
                            <div><strong>ID</strong><p>#{selected.id}</p></div>
                            <div><strong>Họ tên</strong><p>{selected.hoTen}</p></div>
                            <div>
                                <strong>Tên đăng nhập</strong>
                                <p>{selected.taiKhoan?.tenDangNhap || "-"}</p>
                            </div>
                            <div>
                                <strong>Số điện thoại</strong>
                                <p>{selected.soDienThoai || "-"}</p>
                            </div>
                            <div>
                                <strong>Ngày sinh</strong>
                                <p>{formatNgaySinh(selected.ngaySinh)}</p>
                            </div>
                            <div>
                                <strong>Giới tính</strong>
                                <p>{formatGioiTinh(selected.gioiTinh)}</p>
                            </div>
                        </div>

                        <h3>Địa chỉ mặc định</h3>

                        {addresses.find((item) => item.macDinh) ? (
                            (() => {
                                const item = addresses.find(
                                    (item) => item.macDinh
                                );

                                return (
                                    <div
                                        style={{
                                            padding: "12px",
                                            border: "1px solid #eee",
                                            borderRadius: "8px"
                                        }}
                                    >
                                        <strong>{item.tenNguoiNhan}</strong>
                                        <div>{item.soDienThoai}</div>
                                        <div>{item.diaChi}</div>
                                    </div>
                                );
                            })()
                        ) : (
                            <p>Khách hàng chưa có địa chỉ mặc định.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}



function EmployeeContent() {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [selectedEdit, setSelectedEdit] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [form, setForm] = useState({
        tenDangNhap: "",
        matKhau: "",
        hoTen: "",
        soDienThoai: "",
        chucVu: "",
        trangThai: "HOAT_DONG",
        ngayVaoLam: ""
    });

    const taiNhanVien = async () => {
        try {
            const res = await fetch(`${API}/nhan-vien`);

            if (res.ok) {
                setEmployees(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        taiNhanVien();
    }, []);

    const filtered = employees.filter((item) =>
        `${item.hoTen} ${item.taiKhoan?.tenDangNhap || ""} ${item.soDienThoai || ""} ${item.chucVu || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const formatNgay = (value) => {
        if (!value) return "-";

        const [year, month, day] = value.split("-");
        return `${day}/${month}/${year}`;
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const moSua = (item) => {
        setSelected(null);
        setSelectedEdit(item);
        setForm({
            tenDangNhap: item.taiKhoan?.tenDangNhap || "",
            matKhau: "",
            hoTen: item.hoTen || "",
            soDienThoai: item.soDienThoai || "",
            chucVu: item.chucVu || "",
            trangThai: item.trangThai || "HOAT_DONG",
            ngayVaoLam: item.ngayVaoLam || ""
        });
        setShowEdit(true);
    };

    const suaNhanVien = async (e) => {
        e.preventDefault();

        if (!form.hoTen || !form.chucVu) {
            alert("Vui lòng nhập đầy đủ thông tin bắt buộc.");
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(`${API}/nhan-vien/${selectedEdit.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    hoTen: form.hoTen,
                    soDienThoai: form.soDienThoai,
                    chucVu: form.chucVu,
                    trangThai: form.trangThai,
                    ngayVaoLam: form.ngayVaoLam || null
                })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Không thể sửa nhân viên");
            }

            alert("Sửa nhân viên thành công.");
            setShowEdit(false);
            setSelectedEdit(null);
            await taiNhanVien();
        } catch (err) {
            alert(err.message || "Không thể sửa nhân viên");
        } finally {
            setSaving(false);
        }
    };

    const xoaNhanVien = async (item) => {
        if (!window.confirm(`Bạn có chắc muốn xóa nhân viên ${item.hoTen}?`)) {
            return;
        }

        try {
            setDeleting(true);

            const response = await fetch(`${API}/nhan-vien/${item.id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Không thể xóa nhân viên");
            }

            alert("Xóa nhân viên thành công.");
            setSelected(null);
            setSelectedEdit(null);
            await taiNhanVien();
        } catch (err) {
            alert(err.message || "Không thể xóa nhân viên");
        } finally {
            setDeleting(false);
        }
    };

    const themNhanVien = async (e) => {
        e.preventDefault();

        if (
            !form.tenDangNhap ||
            !form.matKhau ||
            !form.hoTen ||
            !form.chucVu
        ) {
            alert("Vui lòng nhập đầy đủ thông tin bắt buộc.");
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(`${API}/nhan-vien`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    hoTen: form.hoTen,
                    soDienThoai: form.soDienThoai,
                    chucVu: form.chucVu,
                    trangThai: form.trangThai,
                    ngayVaoLam: form.ngayVaoLam || null,
                    taiKhoan: {
                        tenDangNhap: form.tenDangNhap,
                        matKhau: form.matKhau
                    }
                })
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
                    "Không thể thêm nhân viên"
                );
            }

            alert("Thêm nhân viên thành công.");

            setForm({
                tenDangNhap: "",
                matKhau: "",
                hoTen: "",
                soDienThoai: "",
                chucVu: "",
                trangThai: "HOAT_DONG",
                ngayVaoLam: ""
            });

            setShowAdd(false);
            await taiNhanVien();
        } catch (err) {
            alert(err.message || "Không thể thêm nhân viên");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-dashboard-content">
            <div className="admin-page-heading">
                <div>
                    <div className="admin-eyebrow">FSHOP ADMIN</div>
                    <h1>Nhân viên</h1>
                    <p>Quản lý thông tin nhân viên.</p>
                </div>

                <button
                    type="button"
                    className="customer-add-button"
                    onClick={() => setShowAdd(true)}
                    style={{
                        border: "none",
                        background: "#111",
                        color: "#fff",
                        padding: "16px 24px",
                        borderRadius: "14px",
                        cursor: "pointer",
                        fontSize: "18px",
                        fontWeight: 500,
                        minWidth: "174px"
                    }}
                >
                    + Thêm nhân viên
                </button>
            </div>

            <section className="admin-card">
                <div className="customer-toolbar">
                    <input
                        className="customer-search-input"
                        style={searchInputStyle}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm tên, tên đăng nhập, số điện thoại hoặc chức vụ..."
                    />
                </div>
            </section>

            <section className="admin-card">
                <div className="admin-table-scroll">
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Họ tên</th>
                            <th>Tên đăng nhập</th>
                            <th>Số điện thoại</th>
                            <th>Chức vụ</th>
                            <th>Ngày vào làm</th>
                            <th>Thao tác</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="customer-empty">
                                    Đang tải nhân viên...
                                </td>
                            </tr>
                        ) : filtered.length ? (
                            filtered.map((item) => (
                                <tr key={item.id}>
                                    <td>#{item.id}</td>
                                    <td><strong>{item.hoTen}</strong></td>
                                    <td>{item.taiKhoan?.tenDangNhap || "-"}</td>
                                    <td>{item.soDienThoai || "-"}</td>
                                    <td>{item.chucVu || "-"}</td>
                                    <td>{formatNgay(item.ngayVaoLam)}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "6px" }}>
                                            <button
                                                type="button"
                                                onClick={() => setSelected(item)}
                                                style={{
                                                    border: "1px solid #ddd",
                                                    background: "#fff",
                                                    color: "#222",
                                                    padding: "8px 16px",
                                                    borderRadius: "9px",
                                                    cursor: "pointer",
                                                    fontSize: "16px",
                                                    fontWeight: 400
                                                }}
                                            >
                                                Xem
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moSua(item)}
                                                style={{
                                                    border: "1px solid #ddd",
                                                    background: "#fff",
                                                    color: "#222",
                                                    padding: "8px 16px",
                                                    borderRadius: "9px",
                                                    cursor: "pointer",
                                                    fontSize: "16px",
                                                    fontWeight: 400
                                                }}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => xoaNhanVien(item)}
                                                disabled={deleting}
                                                style={{
                                                    border: "1px solid #f3d6d1",
                                                    background: "#fff3f1",
                                                    color: "#c84b3c",
                                                    padding: "8px 16px",
                                                    borderRadius: "9px",
                                                    cursor: deleting ? "not-allowed" : "pointer",
                                                    fontSize: "16px",
                                                    fontWeight: 400
                                                }}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="customer-empty">
                                    Không có nhân viên.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>

            {showAdd && (
                <div
                    onClick={() => setShowAdd(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "min(700px,100%)",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            background: "#fff",
                            borderRadius: "14px",
                            padding: "25px"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px"
                            }}
                        >
                            <h2>Thêm nhân viên</h2>

                            <button
                                type="button"
                                onClick={() => setShowAdd(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={themNhanVien}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "14px"
                                }}
                            >
                                <div>
                                    <label>Tên đăng nhập *</label>
                                    <input
                                        name="tenDangNhap"
                                        value={form.tenDangNhap}
                                        onChange={handleChange}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px",
                                            marginTop: "6px"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label>Mật khẩu *</label>
                                    <input
                                        type="password"
                                        name="matKhau"
                                        value={form.matKhau}
                                        onChange={handleChange}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px",
                                            marginTop: "6px"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label>Họ tên *</label>
                                    <input
                                        name="hoTen"
                                        value={form.hoTen}
                                        onChange={handleChange}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px",
                                            marginTop: "6px"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label>Số điện thoại</label>
                                    <input
                                        name="soDienThoai"
                                        value={form.soDienThoai}
                                        onChange={handleChange}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px",
                                            marginTop: "6px"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label>Chức vụ *</label>
                                    <input
                                        name="chucVu"
                                        value={form.chucVu}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: Nhân viên bán hàng"
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px",
                                            marginTop: "6px"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label>Ngày vào làm</label>
                                    <input
                                        type="date"
                                        name="ngayVaoLam"
                                        value={form.ngayVaoLam}
                                        onChange={handleChange}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px",
                                            marginTop: "6px"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label>Trạng thái</label>
                                    <select
                                        name="trangThai"
                                        value={form.trangThai}
                                        onChange={handleChange}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px",
                                            marginTop: "6px"
                                        }}
                                    >
                                        <option value="HOAT_DONG">Hoạt động</option>
                                        <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                                    </select>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "10px",
                                    marginTop: "25px"
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowAdd(false)}
                                    style={{
                                        padding: "10px 18px",
                                        border: "1px solid #ddd",
                                        background: "#fff",
                                        borderRadius: "8px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{
                                        padding: "10px 18px",
                                        border: "none",
                                        background: "#222",
                                        color: "#fff",
                                        borderRadius: "8px",
                                        cursor: "pointer"
                                    }}
                                >
                                    {saving ? "Đang lưu..." : "Thêm nhân viên"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEdit && selectedEdit && (
                <div
                    onClick={() => setShowEdit(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "min(700px,100%)",
                            background: "#fff",
                            borderRadius: "14px",
                            padding: "25px"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2>Sửa nhân viên</h2>
                            <button type="button" onClick={() => setShowEdit(false)}>×</button>
                        </div>

                        <form onSubmit={suaNhanVien}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                <div>
                                    <label>Tên đăng nhập</label>
                                    <input value={form.tenDangNhap} disabled style={{ width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }} />
                                </div>
                                <div>
                                    <label>Họ tên *</label>
                                    <input name="hoTen" value={form.hoTen} onChange={handleChange} style={{ width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }} />
                                </div>
                                <div>
                                    <label>Số điện thoại</label>
                                    <input name="soDienThoai" value={form.soDienThoai} onChange={handleChange} style={{ width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }} />
                                </div>
                                <div>
                                    <label>Chức vụ *</label>
                                    <input name="chucVu" value={form.chucVu} onChange={handleChange} style={{ width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }} />
                                </div>
                                <div>
                                    <label>Ngày vào làm</label>
                                    <input type="date" name="ngayVaoLam" value={form.ngayVaoLam} onChange={handleChange} style={{ width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }} />
                                </div>
                                <div>
                                    <label>Trạng thái</label>
                                    <select name="trangThai" value={form.trangThai} onChange={handleChange} style={{ width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }}>
                                        <option value="HOAT_DONG">Hoạt động</option>
                                        <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "25px" }}>
                                <button type="button" onClick={() => setShowEdit(false)}>Hủy</button>
                                <button type="submit" disabled={saving}>
                                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selected && (
                <div
                    onClick={() => setSelected(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "min(650px,100%)",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            background: "#fff",
                            borderRadius: "14px",
                            padding: "25px"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between"
                            }}
                        >
                            <h2>Chi tiết nhân viên</h2>

                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "14px"
                            }}
                        >
                            <div>
                                <strong>ID</strong>
                                <p>#{selected.id}</p>
                            </div>

                            <div>
                                <strong>Họ tên</strong>
                                <p>{selected.hoTen}</p>
                            </div>

                            <div>
                                <strong>Tên đăng nhập</strong>
                                <p>{selected.taiKhoan?.tenDangNhap || "-"}</p>
                            </div>

                            <div>
                                <strong>Số điện thoại</strong>
                                <p>{selected.soDienThoai || "-"}</p>
                            </div>

                            <div>
                                <strong>Chức vụ</strong>
                                <p>{selected.chucVu || "-"}</p>
                            </div>

                            <div>
                                <strong>Trạng thái</strong>
                                <p>{selected.trangThai || "-"}</p>
                            </div>

                            <div>
                                <strong>Ngày vào làm</strong>
                                <p>{formatNgay(selected.ngayVaoLam)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ComingSoon({
                        title,
                    }) {
    return (
        <div className="admin-placeholder">

            <div className="admin-placeholder-icon">
                ✦
            </div>

            <h2>
                {title}
            </h2>

            <p>
                Giao diện chức năng này sẽ được team
                triển khai ở bước tiếp theo.
            </p>

        </div>
    );
}

export default function AdminDashboard({
                                           dangXuat,
                                       }) {

    const [activeMenu, setActiveMenu] =
        useState("dashboard");

    const activeLabel =
        menuItems.find(
            (item) =>
                item.id ===
                activeMenu
        )?.label ||
        "Tổng quan";

    return (
        <div className="admin-layout">

            {/* SIDEBAR */}

            <aside className="admin-sidebar">

                <div className="admin-brand">

                    <div className="admin-brand-mark">
                        F
                    </div>

                    <div>

                        <strong>
                            FShop
                        </strong>

                        <span>
                            ADMIN PANEL
                        </span>

                    </div>

                </div>

                <div className="admin-section-title">
                    QUẢN LÝ
                </div>

                <nav className="admin-nav">

                    {menuItems.map(
                        (item) => (

                            <button
                                type="button"
                                key={
                                    item.id
                                }
                                className={
                                    activeMenu ===
                                    item.id
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setActiveMenu(
                                        item.id
                                    )
                                }
                            >

                                <span className="admin-nav-icon">
                                    {item.icon}
                                </span>

                                <span>
                                    {item.label}
                                </span>

                            </button>

                        )
                    )}

                </nav>

                <div className="admin-sidebar-footer">

                    <button
                        type="button"
                    >
                        <span>
                            ⚙
                        </span>

                        Cài đặt
                    </button>

                    <button
                        type="button"
                        onClick={
                            dangXuat
                        }
                    >
                        <span>
                            ↪
                        </span>

                        Đăng xuất
                    </button>

                </div>

            </aside>

            {/* MAIN */}

            <main className="admin-main">

                <header className="admin-topbar">

                    <div className="admin-topbar-left">

                        <div className="admin-breadcrumb">

                            FShop

                            <span>
                                /
                            </span>

                            Admin

                            <span>
                                /
                            </span>

                            <strong>
                                {activeLabel}
                            </strong>

                        </div>

                    </div>

                    <div className="admin-account">

                        <button
                            type="button"
                            className="admin-notification"
                        >
                            ♢
                        </button>

                        <div className="admin-avatar">
                            A
                        </div>

                        <div className="admin-account-info">

                            <strong>
                                Quản trị viên
                            </strong>

                            <span>
                                ADMIN
                            </span>

                        </div>

                    </div>

                </header>

                <div className="admin-main-body">

                    {activeMenu ===
                    "dashboard" ? (

                        <DashboardContent />

                    ) : activeMenu ===
                    "hoa-don" ? (

                        <HoaDonContent />

                    ) : activeMenu ===
                    "thanh-toan" ? (
                        <ThanhToanContent />
                    ) : activeMenu === "san-pham" ? (
                        <AdminProducts />
                    ) : activeMenu === "danh-muc" ? (
                        <AdminDanhMuc />
                    ) : activeMenu === "thuong-hieu" ? (
                        <AdminThuongHieu />
                    ) : activeMenu === "kho" ? (
                        <AdminKho />
                    ) : activeMenu === "voucher" ? (
                        <AdminVoucher />
                    ) : activeMenu === "khuyen-mai" ? (
                        <AdminKhuyenMai />

                    ) : activeMenu ===
                    "khach-hang" ? (

                        <CustomerContent />

                    ) : activeMenu ===
                    "nhan-vien" ? (

                        <EmployeeContent />

                    ) : (

                        <ComingSoon
                            title={
                                activeLabel
                            }
                        />

                    )}

                </div>

            </main>

        </div>
    );
}

