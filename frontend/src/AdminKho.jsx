import { useEffect, useMemo, useState } from "react";
import "./AdminKho.css";

const API = "http://localhost:8080/api";

const emptyPhieu = {
    loaiPhieu: "NHAP",
    khoId: "",
    nhaCungCapId: "",
    lyDo: "",
    ghiChu: "",
    chiTiet: [{ sanPhamChiTietId: "", soLuong: 1, donGia: "" }],
};

const emptyNcc = {
    maNcc: "",
    tenNcc: "",
    soDienThoai: "",
    email: "",
    diaChi: "",
};


function dateTime(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN");
}

function statusText(status) {
    if (status === "HET_HANG") return "Hết hàng";
    if (status === "SAP_HET") return "Sắp hết";
    return "Còn hàng";
}

export default function AdminKho() {
    const [tab, setTab] = useState("overview");
    const [overview, setOverview] = useState({
        tongTon: 0,
        soSapHet: 0,
        soHetHang: 0,
        soSanPhamDangCo: 0,
        canNhapThem: [],
    });
    const [tonKho, setTonKho] = useState([]);
    const [phieuKho, setPhieuKho] = useState([]);
    const [bienDong, setBienDong] = useState([]);
    const [khos, setKhos] = useState([]);
    const [nccs, setNccs] = useState([]);
    const [spcts, setSpcts] = useState([]);

    const [keyword, setKeyword] = useState("");
    const [stockStatus, setStockStatus] = useState("");

    const [showPhieuModal, setShowPhieuModal] = useState(false);
    const [showNccModal, setShowNccModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [phieuForm, setPhieuForm] = useState(emptyPhieu);
    const [nccForm, setNccForm] = useState(emptyNcc);

    const loadData = async () => {
        try {
            setError("");

            const [
                overviewRes,
                tonRes,
                phieuRes,
                movementRes,
                khoRes,
                nccRes,
                spctRes,
            ] = await Promise.all([
                fetch(`${API}/kho/overview`),
                fetch(`${API}/kho/ton-kho`),
                fetch(`${API}/kho/phieu`),
                fetch(`${API}/kho/bien-dong`),
                fetch(`${API}/kho/danh-sach`),
                fetch(`${API}/kho/nha-cung-cap`),
                fetch(`${API}/san-pham-chi-tiet`),
            ]);

            if (!overviewRes.ok || !tonRes.ok || !phieuRes.ok) {
                throw new Error("Không thể tải dữ liệu kho");
            }

            setOverview(await overviewRes.json());
            setTonKho(await tonRes.json());
            setPhieuKho(await phieuRes.json());
            setBienDong(movementRes.ok ? await movementRes.json() : []);
            setKhos(khoRes.ok ? await khoRes.json() : []);
            setNccs(nccRes.ok ? await nccRes.json() : []);
            setSpcts(spctRes.ok ? await spctRes.json() : []);
        } catch (e) {
            setError(e.message || "Không thể tải dữ liệu kho");
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, []);

    const filteredStock = useMemo(() => {
        const text = keyword.trim().toLowerCase();

        return tonKho.filter((item) => {
            const matchText =
                !text ||
                item.maSku?.toLowerCase().includes(text) ||
                item.tenSanPham?.toLowerCase().includes(text) ||
                item.kichCo?.toLowerCase().includes(text) ||
                item.mauSac?.toLowerCase().includes(text);

            const matchStatus =
                !stockStatus || item.trangThai === stockStatus;

            return matchText && matchStatus;
        });
    }, [tonKho, keyword, stockStatus]);

    const openPhieu = (type) => {
        setPhieuForm({
            ...emptyPhieu,
            loaiPhieu: type,
            khoId: khos[0]?.id || "",
        });
        setShowPhieuModal(true);
    };

    const changeDetail = (index, field, value) => {
        setPhieuForm((old) => ({
            ...old,
            chiTiet: old.chiTiet.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));
    };

    const addDetail = () => {
        setPhieuForm((old) => ({
            ...old,
            chiTiet: [
                ...old.chiTiet,
                { sanPhamChiTietId: "", soLuong: old.loaiPhieu === "DIEU_CHINH" ? 0 : 1, donGia: "" },
            ],
        }));
    };

    const removeDetail = (index) => {
        setPhieuForm((old) => ({
            ...old,
            chiTiet:
                old.chiTiet.length === 1
                    ? old.chiTiet
                    : old.chiTiet.filter((_, i) => i !== index),
        }));
    };

    const submitPhieu = async (e) => {
        e.preventDefault();

        if (!phieuForm.khoId) {
            alert("Vui lòng chọn kho");
            return;
        }

        if (phieuForm.chiTiet.some((x) => !x.sanPhamChiTietId || Number(x.soLuong) === 0)) {
            alert("Vui lòng chọn sản phẩm và nhập số lượng hợp lệ");
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(`${API}/kho/phieu`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    maPhieu: "",
                    loaiPhieu: phieuForm.loaiPhieu,
                    khoId: Number(phieuForm.khoId),
                    nhaCungCapId: phieuForm.nhaCungCapId
                        ? Number(phieuForm.nhaCungCapId)
                        : null,
                    nhanVienId: null,
                    lyDo: phieuForm.lyDo,
                    ghiChu: phieuForm.ghiChu,
                    chiTiet: phieuForm.chiTiet.map((x) => ({
                        sanPhamChiTietId: Number(x.sanPhamChiTietId),
                        soLuong: Number(x.soLuong),
                        donGia: x.donGia ? Number(x.donGia) : null,
                    })),
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.message || data?.error || "Tạo phiếu kho thất bại");
            }

            setShowPhieuModal(false);
            await loadData();
            alert("Đã tạo phiếu kho thành công");
        } catch (e) {
            alert(e.message || "Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    const submitNcc = async (e) => {
        e.preventDefault();

        if (!nccForm.tenNcc.trim()) {
            alert("Vui lòng nhập tên nhà cung cấp");
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(`${API}/kho/nha-cung-cap`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...nccForm,
                    maNcc: nccForm.maNcc || undefined,
                    trangThai: "HOAT_DONG",
                }),
            });

            if (!response.ok) {
                throw new Error("Thêm nhà cung cấp thất bại");
            }

            setShowNccModal(false);
            setNccForm(emptyNcc);
            await loadData();
            alert("Đã thêm nhà cung cấp");
        } catch (e) {
            alert(e.message || "Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-kho">
            <div className="kho-heading">
                <div>
                    <div className="kho-eyebrow">FSHOP ADMIN</div>
                    <h1>Quản lý kho</h1>
                    <p>Quản lý tồn kho, nhập hàng, xuất hàng và lịch sử biến động.</p>
                </div>

                <div className="kho-heading-actions">
                    <button className="kho-btn kho-btn-light" onClick={() => setShowNccModal(true)}>
                        + Nhà cung cấp
                    </button>
                    <button className="kho-btn kho-btn-primary" onClick={() => openPhieu("NHAP")}>
                        + Nhập kho
                    </button>
                </div>
            </div>

            {error && <div className="kho-error">{error}</div>}

            <div className="kho-stats">
                <div className="kho-stat">
                    <span className="kho-stat-icon">▣</span>
                    <strong>{overview.tongTon}</strong>
                    <span>Tổng số lượng tồn</span>
                </div>
                <div className="kho-stat">
                    <span className="kho-stat-icon">!</span>
                    <strong>{overview.soSapHet}</strong>
                    <span>Sản phẩm sắp hết</span>
                </div>
                <div className="kho-stat">
                    <span className="kho-stat-icon">×</span>
                    <strong>{overview.soHetHang}</strong>
                    <span>Sản phẩm hết hàng</span>
                </div>
                <div className="kho-stat">
                    <span className="kho-stat-icon">✓</span>
                    <strong>{overview.soSanPhamDangCo}</strong>
                    <span>SKU đang có hàng</span>
                </div>
            </div>

            <div className="kho-tabs">
                <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>
                    Tổng quan
                </button>
                <button className={tab === "ton" ? "active" : ""} onClick={() => setTab("ton")}>
                    Tồn kho
                </button>
                <button className={tab === "phieu" ? "active" : ""} onClick={() => setTab("phieu")}>
                    Phiếu kho
                </button>
                <button className={tab === "lich-su" ? "active" : ""} onClick={() => setTab("lich-su")}>
                    Lịch sử biến động
                </button>
                <button className={tab === "ncc" ? "active" : ""} onClick={() => setTab("ncc")}>
                    Nhà cung cấp
                </button>
            </div>

            {tab === "overview" && (
                <div className="kho-grid">
                    <section className="kho-card">
                        <div className="kho-card-title">
                            <div>
                                <h2>Sản phẩm cần nhập thêm</h2>
                                <p>Các SKU đang ở mức tồn tối thiểu.</p>
                            </div>
                            <button onClick={() => setTab("ton")}>Xem tồn kho →</button>
                        </div>

                        <div className="kho-table-wrap">
                            <table className="kho-table">
                                <thead>
                                <tr>
                                    <th>SKU</th>
                                    <th>Sản phẩm</th>
                                    <th>Size</th>
                                    <th>Màu</th>
                                    <th>Tồn</th>
                                    <th>Trạng thái</th>
                                </tr>
                                </thead>
                                <tbody>
                                {overview.canNhapThem.length === 0 ? (
                                    <tr><td colSpan="6" className="kho-empty">Kho đang đủ hàng.</td></tr>
                                ) : overview.canNhapThem.map((item) => (
                                    <tr key={item.id}>
                                        <td><strong>{item.maSku}</strong></td>
                                        <td>{item.tenSanPham}</td>
                                        <td>{item.kichCo}</td>
                                        <td>{item.mauSac}</td>
                                        <td><strong>{item.soLuongTon}</strong></td>
                                        <td><span className={`kho-badge ${item.trangThai.toLowerCase()}`}>{statusText(item.trangThai)}</span></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="kho-card kho-actions-card">
                        <div className="kho-card-title">
                            <div>
                                <h2>Thao tác nhanh</h2>
                                <p>Cập nhật kho ngay từ đây.</p>
                            </div>
                        </div>
                        <button onClick={() => openPhieu("NHAP")} className="quick-action">
                            <span>↓</span>
                            <div><strong>Nhập hàng</strong><small>Nhập hàng từ nhà cung cấp</small></div>
                        </button>
                        <button onClick={() => openPhieu("XUAT")} className="quick-action">
                            <span>↑</span>
                            <div><strong>Xuất hàng</strong><small>Xuất bán, hàng lỗi hoặc mục đích khác</small></div>
                        </button>
                        <button onClick={() => openPhieu("DIEU_CHINH")} className="quick-action">
                            <span>±</span>
                            <div><strong>Điều chỉnh tồn</strong><small>Cộng hoặc trừ sau khi kiểm kê</small></div>
                        </button>
                    </section>
                </div>
            )}

            {tab === "ton" && (
                <section className="kho-card">
                    <div className="kho-card-title">
                        <div>
                            <h2>Tồn kho theo SKU</h2>
                            <p>Tồn được quản lý theo từng size và màu.</p>
                        </div>
                        <button className="kho-btn kho-btn-primary" onClick={() => openPhieu("NHAP")}>+ Nhập kho</button>
                    </div>

                    <div className="kho-filter">
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Tìm kiếm sản phẩm, size, màu..."
                        />
                        <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}>
                            <option value="">Tất cả trạng thái</option>
                            <option value="CON_HANG">Còn hàng</option>
                            <option value="SAP_HET">Sắp hết</option>
                            <option value="HET_HANG">Hết hàng</option>
                        </select>
                        <button onClick={() => { setKeyword(""); setStockStatus(""); }}>Đặt lại</button>
                    </div>

                    <div className="kho-table-wrap">
                        <table className="kho-table">
                            <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Sản phẩm</th>
                                <th>Size</th>
                                <th>Màu</th>
                                <th>Tồn</th>
                                <th>Khả dụng</th>
                                <th>Mức tối thiểu</th>
                                <th>Trạng thái</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredStock.length === 0 ? (
                                <tr><td colSpan="8" className="kho-empty">Không có dữ liệu tồn kho.</td></tr>
                            ) : filteredStock.map((item) => (
                                <tr key={item.id}>
                                    <td><strong>{item.maSku}</strong></td>
                                    <td>{item.tenSanPham}</td>
                                    <td>{item.kichCo}</td>
                                    <td>{item.mauSac}</td>
                                    <td className="stock-number">{item.soLuongTon}</td>
                                    <td>{item.soLuongKhaDung}</td>
                                    <td>{item.mucTonToiThieu}</td>
                                    <td><span className={`kho-badge ${item.trangThai.toLowerCase()}`}>{statusText(item.trangThai)}</span></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {tab === "phieu" && (
                <section className="kho-card">
                    <div className="kho-card-title">
                        <div>
                            <h2>Phiếu kho</h2>
                            <p>Nhập, xuất và điều chỉnh hàng hóa.</p>
                        </div>
                        <div className="kho-heading-actions">
                            <button className="kho-btn kho-btn-light" onClick={() => openPhieu("DIEU_CHINH")}>Điều chỉnh</button>
                            <button className="kho-btn kho-btn-primary" onClick={() => openPhieu("NHAP")}>+ Tạo phiếu</button>
                        </div>
                    </div>

                    <div className="kho-table-wrap">
                        <table className="kho-table">
                            <thead>
                            <tr>
                                <th>Mã phiếu</th>
                                <th>Loại</th>
                                <th>Kho</th>
                                <th>Nhà cung cấp</th>
                                <th>Lý do</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                            </tr>
                            </thead>
                            <tbody>
                            {phieuKho.length === 0 ? (
                                <tr><td colSpan="7" className="kho-empty">Chưa có phiếu kho.</td></tr>
                            ) : phieuKho.map((item) => (
                                <tr key={item.id}>
                                    <td><strong>{item.maPhieu}</strong></td>
                                    <td><span className={`type-badge ${item.loaiPhieu.toLowerCase()}`}>{item.loaiPhieu}</span></td>
                                    <td>{item.kho}</td>
                                    <td>{item.nhaCungCap || "-"}</td>
                                    <td>{item.lyDo || "-"}</td>
                                    <td><span className="kho-badge con_hang">{item.trangThai}</span></td>
                                    <td>{dateTime(item.ngayTao)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {tab === "lich-su" && (
                <section className="kho-card">
                    <div className="kho-card-title">
                        <div>
                            <h2>Lịch sử biến động kho</h2>
                            <p>200 biến động gần nhất.</p>
                        </div>
                    </div>

                    <div className="kho-table-wrap">
                        <table className="kho-table">
                            <thead>
                            <tr>
                                <th>Thời gian</th>
                                <th>Loại</th>
                                <th>Mã phiếu</th>
                                <th>SKU</th>
                                <th>Sản phẩm</th>
                                <th>Thay đổi</th>
                                <th>Tồn trước</th>
                                <th>Tồn sau</th>
                            </tr>
                            </thead>
                            <tbody>
                            {bienDong.length === 0 ? (
                                <tr><td colSpan="8" className="kho-empty">Chưa có biến động.</td></tr>
                            ) : bienDong.map((item) => (
                                <tr key={item.id}>
                                    <td>{dateTime(item.ngayTao)}</td>
                                    <td><span className={`type-badge ${item.loaiBienDong.toLowerCase()}`}>{item.loaiBienDong}</span></td>
                                    <td>{item.maPhieu || "-"}</td>
                                    <td><strong>{item.maSku}</strong></td>
                                    <td>{item.tenSanPham} / {item.kichCo} / {item.mauSac}</td>
                                    <td className={item.soLuongThayDoi > 0 ? "stock-plus" : "stock-minus"}>
                                        {item.soLuongThayDoi > 0 ? "+" : ""}{item.soLuongThayDoi}
                                    </td>
                                    <td>{item.tonTruoc}</td>
                                    <td><strong>{item.tonSau}</strong></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {tab === "ncc" && (
                <section className="kho-card">
                    <div className="kho-card-title">
                        <div>
                            <h2>Nhà cung cấp</h2>
                            <p>Danh sách đối tác cung cấp giày.</p>
                        </div>
                        <button className="kho-btn kho-btn-primary" onClick={() => setShowNccModal(true)}>+ Thêm nhà cung cấp</button>
                    </div>

                    <div className="kho-table-wrap">
                        <table className="kho-table">
                            <thead>
                            <tr>
                                <th>Mã NCC</th>
                                <th>Tên nhà cung cấp</th>
                                <th>Số điện thoại</th>
                                <th>Email</th>
                                <th>Địa chỉ</th>
                                <th>Trạng thái</th>
                            </tr>
                            </thead>
                            <tbody>
                            {nccs.length === 0 ? (
                                <tr><td colSpan="6" className="kho-empty">Chưa có nhà cung cấp.</td></tr>
                            ) : nccs.map((ncc) => (
                                <tr key={ncc.id}>
                                    <td><strong>{ncc.maNcc}</strong></td>
                                    <td>{ncc.tenNcc}</td>
                                    <td>{ncc.soDienThoai || "-"}</td>
                                    <td>{ncc.email || "-"}</td>
                                    <td>{ncc.diaChi || "-"}</td>
                                    <td><span className="kho-badge con_hang">{ncc.trangThai}</span></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {showPhieuModal && (
                <div className="kho-modal-overlay" onMouseDown={() => !saving && setShowPhieuModal(false)}>
                    <div className="kho-modal" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="kho-modal-header">
                            <div>
                                <h2>
                                    {phieuForm.loaiPhieu === "NHAP" ? "Tạo phiếu nhập kho" :
                                        phieuForm.loaiPhieu === "XUAT" ? "Tạo phiếu xuất kho" :
                                            "Điều chỉnh tồn kho"}
                                </h2>
                                <p>Thay đổi tồn kho sẽ được ghi vào lịch sử.</p>
                            </div>
                            <button onClick={() => setShowPhieuModal(false)}>×</button>
                        </div>

                        <form onSubmit={submitPhieu}>
                            <div className="kho-form-grid">
                                <label>
                                    Loại phiếu
                                    <select value={phieuForm.loaiPhieu} onChange={(e) => setPhieuForm({ ...phieuForm, loaiPhieu: e.target.value })}>
                                        <option value="NHAP">Nhập kho</option>
                                        <option value="XUAT">Xuất kho</option>
                                        <option value="DIEU_CHINH">Điều chỉnh</option>
                                    </select>
                                </label>
                                <label>
                                    Kho
                                    <select value={phieuForm.khoId} onChange={(e) => setPhieuForm({ ...phieuForm, khoId: e.target.value })} required>
                                        <option value="">Chọn kho</option>
                                        {khos.map((kho) => <option key={kho.id} value={kho.id}>{kho.tenKho}</option>)}
                                    </select>
                                </label>
                                {phieuForm.loaiPhieu === "NHAP" && (
                                    <label>
                                        Nhà cung cấp
                                        <select value={phieuForm.nhaCungCapId} onChange={(e) => setPhieuForm({ ...phieuForm, nhaCungCapId: e.target.value })}>
                                            <option value="">Không chọn</option>
                                            {nccs.map((ncc) => <option key={ncc.id} value={ncc.id}>{ncc.tenNcc}</option>)}
                                        </select>
                                    </label>
                                )}
                                <label>
                                    Lý do
                                    <input value={phieuForm.lyDo} onChange={(e) => setPhieuForm({ ...phieuForm, lyDo: e.target.value })} placeholder="VD: Nhập hàng đợt tháng 9" />
                                </label>
                                <label className="full">
                                    Ghi chú
                                    <textarea value={phieuForm.ghiChu} onChange={(e) => setPhieuForm({ ...phieuForm, ghiChu: e.target.value })} rows="2" />
                                </label>
                            </div>

                            <div className="detail-heading">
                                <strong>Chi tiết sản phẩm</strong>
                                <button type="button" onClick={addDetail}>+ Thêm dòng</button>
                            </div>

                            <div className="detail-list">
                                {phieuForm.chiTiet.map((item, index) => (
                                    <div className="detail-row" key={index}>
                                        <select
                                            value={item.sanPhamChiTietId}
                                            onChange={(e) => changeDetail(index, "sanPhamChiTietId", e.target.value)}
                                            required
                                        >
                                            <option value="">Chọn SKU</option>
                                            {spcts.map((spct) => (
                                                <option key={spct.id} value={spct.id}>
                                                    {spct.maSku} - {spct.sanPham?.tenSanPham || "Sản phẩm"} - Size {spct.kichCo?.tenKichCo || "-"} - {spct.mauSac?.tenMau || "-"}
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            type="number"
                                            value={item.soLuong}
                                            onChange={(e) => changeDetail(index, "soLuong", e.target.value)}
                                            placeholder={phieuForm.loaiPhieu === "DIEU_CHINH" ? "± SL" : "Số lượng"}
                                            min={phieuForm.loaiPhieu === "DIEU_CHINH" ? undefined : "1"}
                                            required
                                        />

                                        {phieuForm.loaiPhieu === "NHAP" && (
                                            <input
                                                type="number"
                                                value={item.donGia}
                                                onChange={(e) => changeDetail(index, "donGia", e.target.value)}
                                                placeholder="Giá nhập"
                                                min="0"
                                            />
                                        )}

                                        <button type="button" className="remove-detail" onClick={() => removeDetail(index)}>×</button>
                                    </div>
                                ))}
                            </div>

                            {phieuForm.loaiPhieu === "DIEU_CHINH" && (
                                <div className="kho-note">
                                    Điều chỉnh: nhập <strong>+10</strong> để cộng 10 đôi hoặc <strong>-10</strong> để trừ 10 đôi.
                                </div>
                            )}

                            <div className="kho-modal-actions">
                                <button type="button" className="kho-btn kho-btn-light" onClick={() => setShowPhieuModal(false)}>Hủy</button>
                                <button type="submit" className="kho-btn kho-btn-primary" disabled={saving}>
                                    {saving ? "Đang lưu..." : "Lưu phiếu"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showNccModal && (
                <div className="kho-modal-overlay" onMouseDown={() => !saving && setShowNccModal(false)}>
                    <div className="kho-modal small" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="kho-modal-header">
                            <div>
                                <h2>Thêm nhà cung cấp</h2>
                                <p>Thông tin dùng cho phiếu nhập kho.</p>
                            </div>
                            <button onClick={() => setShowNccModal(false)}>×</button>
                        </div>

                        <form onSubmit={submitNcc}>
                            <div className="kho-form-grid">
                                <label>
                                    Mã NCC
                                    <input value={nccForm.maNcc} onChange={(e) => setNccForm({ ...nccForm, maNcc: e.target.value })} placeholder="NCC003" />
                                </label>
                                <label>
                                    Tên nhà cung cấp
                                    <input value={nccForm.tenNcc} onChange={(e) => setNccForm({ ...nccForm, tenNcc: e.target.value })} required />
                                </label>
                                <label>
                                    Số điện thoại
                                    <input value={nccForm.soDienThoai} onChange={(e) => setNccForm({ ...nccForm, soDienThoai: e.target.value })} />
                                </label>
                                <label>
                                    Email
                                    <input value={nccForm.email} onChange={(e) => setNccForm({ ...nccForm, email: e.target.value })} type="email" />
                                </label>
                                <label className="full">
                                    Địa chỉ
                                    <input value={nccForm.diaChi} onChange={(e) => setNccForm({ ...nccForm, diaChi: e.target.value })} />
                                </label>
                            </div>

                            <div className="kho-modal-actions">
                                <button type="button" className="kho-btn kho-btn-light" onClick={() => setShowNccModal(false)}>Hủy</button>
                                <button type="submit" className="kho-btn kho-btn-primary" disabled={saving}>
                                    {saving ? "Đang lưu..." : "Lưu nhà cung cấp"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
