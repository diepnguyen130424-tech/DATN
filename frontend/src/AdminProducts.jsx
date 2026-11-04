/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import "./AdminProducts.css";

const API = "http://localhost:8080/api";

const emptyForm = {
    maSanPham: "",
    tenSanPham: "",
    danhMucId: "",
    thuongHieuId: "",
    chatLieu: "",
    kieuDang: "",
    xuatXu: "",
    moTa: "",
    hinhAnh: "",
    trangThai: "HOAT_DONG",
};

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [stockByProductId, setStockByProductId] = useState({});
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [colors, setColors] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [variantDrafts, setVariantDrafts] = useState([]);

    const [keyword, setKeyword] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [brandFilter, setBrandFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;


    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [productRes, categoryRes, brandRes, sizeRes, colorRes, warehouseRes] = await Promise.all([
                fetch(`${API}/san-pham`),
                fetch(`${API}/danh-muc`),
                fetch(`${API}/thuong-hieu`),
                fetch(`${API}/kich-co`).catch(() => null),
                fetch(`${API}/mau-sac`).catch(() => null),
                fetch(`${API}/kho/danh-sach`).catch(() => null),
            ]);

            if (!productRes.ok) {
                throw new Error("Không thể tải danh sách sản phẩm");
            }

            const productData = await productRes.json();
            const categoryData = categoryRes.ok
                ? await categoryRes.json()
                : [];
            const brandData = brandRes.ok
                ? await brandRes.json()
                : [];
            const sizeData = sizeRes?.ok ? await sizeRes.json().catch(() => []) : [];
            const colorData = colorRes?.ok ? await colorRes.json().catch(() => []) : [];
            const warehouseData = warehouseRes?.ok ? await warehouseRes.json().catch(() => []) : [];

            setSizes(Array.isArray(sizeData) ? sizeData : []);
            setColors(Array.isArray(colorData) ? colorData : []);
            setWarehouses(Array.isArray(warehouseData) ? warehouseData : []);

            const productList = Array.isArray(productData) ? productData : [];
            setProducts(productList);
            setCategories(Array.isArray(categoryData) ? categoryData : []);
            setBrands(Array.isArray(brandData) ? brandData : []);

            // Tải tồn kho của từng sản phẩm từ danh sách biến thể (size/màu).
            // API chi tiết này cũng được dùng trong chức năng Xem sản phẩm.
            const stockEntries = await Promise.all(
                productList.map(async (product) => {
                    try {
                        const detailRes = await fetch(`${API}/san-pham/${product.id}/chi-tiet`);
                        if (!detailRes.ok) return [product.id, null];
                        const variants = await detailRes.json();
                        if (!Array.isArray(variants)) return [product.id, null];
                        const totalStock = variants.reduce(
                            (sum, variant) => sum + Math.max(0, Number(variant.soLuongTon) || 0),
                            0
                        );
                        return [product.id, totalStock];
                    } catch {
                        return [product.id, null];
                    }
                })
            );
            setStockByProductId(Object.fromEntries(stockEntries));
        } catch (err) {
            setError(err.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);


    const filteredProducts = useMemo(() => {
        return products
            .filter((product) => {
                const text = keyword.trim().toLowerCase();

                const matchKeyword =
                    !text ||
                    product.tenSanPham?.toLowerCase().includes(text) ||
                    product.maSanPham?.toLowerCase().includes(text);

                const matchCategory =
                    !categoryFilter ||
                    String(product.danhMuc?.id) === String(categoryFilter);

                const matchBrand =
                    !brandFilter ||
                    String(product.thuongHieu?.id) === String(brandFilter);

                const matchStatus =
                    !statusFilter ||
                    product.trangThai === statusFilter;

                return (
                    matchKeyword &&
                    matchCategory &&
                    matchBrand &&
                    matchStatus
                );
            })
            // Sản phẩm có ID lớn hơn thường được tạo sau, hiển thị trước.
            .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    }, [
        products,
        keyword,
        categoryFilter,
        brandFilter,
        statusFilter,
    ]);

    const totalPages = Math.ceil(
        filteredProducts.length / itemsPerPage
    );

    const startIndex =
        (currentPage - 1) * itemsPerPage;

    const currentProducts =
        filteredProducts.slice(
            startIndex,
            startIndex + itemsPerPage
        );

    useEffect(() => {
        setCurrentPage(1);
    }, [
        keyword,
        categoryFilter,
        brandFilter,
        statusFilter,
    ]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const emptyVariantDraft = () => ({
        id: null,
        kichCoId: "",
        mauSacId: "",
        giaBan: "",
        soLuongTon: "0",
        maSku: "",
        trangThai: "HOAT_DONG",
    });

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setVariantDrafts([emptyVariantDraft()]);
        setShowModal(true);
    };

    const openEdit = async (product) => {
        setEditingId(product.id);
        setForm({
            maSanPham: product.maSanPham || "",
            tenSanPham: product.tenSanPham || "",
            danhMucId: product.danhMuc?.id || "",
            thuongHieuId: product.thuongHieu?.id || "",
            chatLieu: product.chatLieu || "",
            kieuDang: product.kieuDang || "",
            xuatXu: product.xuatXu || "",
            moTa: product.moTa || "",
            hinhAnh: product.hinhAnh || "",
            trangThai: product.trangThai || "HOAT_DONG",
        });
        try {
            const response = await fetch(`${API}/san-pham/${product.id}/chi-tiet`);
            const data = response.ok ? await response.json() : [];
            const rows = Array.isArray(data) ? data.map((variant) => ({
                id: variant.id,
                kichCoId: String(variant.kichCo?.id || ""),
                mauSacId: String(variant.mauSac?.id || ""),
                giaBan: String(variant.giaBan ?? ""),
                soLuongTon: String(variant.soLuongTon ?? 0),
                maSku: variant.maSku || "",
                trangThai: variant.trangThai || "HOAT_DONG",
            })) : [];
            setVariantDrafts(rows.length ? [...rows, emptyVariantDraft()] : [emptyVariantDraft()]);
        } catch (error) {
            console.error("Không tải được biến thể sản phẩm:", error);
            setVariantDrafts([emptyVariantDraft()]);
        }
        setShowModal(true);
    };

    const updateVariantDraft = (index, field, value) => {
        setVariantDrafts((current) => current.map((row, rowIndex) =>
            rowIndex === index ? { ...row, [field]: value } : row
        ));
    };

    const addVariantDraft = () => setVariantDrafts((current) => [...current, emptyVariantDraft()]);
    const removeVariantDraft = (index) => setVariantDrafts((current) => current.filter((_, i) => i !== index));

    const taoMaSku = (maSanPham, sizeId, colorId) => {
        const size = sizes.find((item) => String(item.id) === String(sizeId));
        const color = colors.find((item) => String(item.id) === String(colorId));
        const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase();
        return `${clean(maSanPham)}-${clean(size?.tenKichCo || sizeId)}-${clean(color?.tenMau || colorId)}`;
    };

    // ⭐ SỬA — thêm async
    const openDetail = async (sp) => {
        setSelectedProduct({
            ...sp,
            chiTiets: [],
            loadingChiTiet: true,
        });
        setShowDetail(true);

        try {
            const res = await fetch(`${API}/san-pham/${sp.id}/chi-tiet`);
            const data = res.ok ? await res.json() : [];
            const chiTiets = Array.isArray(data) ? data : [];

            setSelectedProduct({
                ...sp,
                chiTiets,
                loadingChiTiet: false,
            });
        } catch (err) {
            console.error("Lỗi tải chi tiết:", err);
            setSelectedProduct({
                ...sp,
                chiTiets: [],
                loadingChiTiet: false,
            });
        }
    };

    const closeDetail = () => {
        setShowDetail(false);
        setSelectedProduct(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const partiallyFilled = variantDrafts.some((row) =>
            (row.kichCoId || row.mauSacId || row.giaBan !== "") &&
            (!row.kichCoId || !row.mauSacId || row.giaBan === "")
        );
        const validDrafts = variantDrafts.filter((row) =>
            row.kichCoId && row.mauSacId && row.giaBan !== ""
        );

        if (partiallyFilled) {
            alert("Vui lòng chọn đầy đủ size, màu sắc và giá bán cho từng biến thể.");
            return;
        }
        if (validDrafts.length === 0) {
            alert("Bạn cần thêm ít nhất một biến thể size/màu và giá bán để khách hàng có thể mua sản phẩm.");
            return;
        }
        const combinationKeys = validDrafts.map((row) => `${row.kichCoId}-${row.mauSacId}`);
        if (new Set(combinationKeys).size !== combinationKeys.length) {
            alert("Không thể tạo hai biến thể trùng cùng size và màu sắc.");
            return;
        }
        if (validDrafts.some((row) => Number(row.giaBan) <= 0 || !Number.isFinite(Number(row.giaBan)))) {
            alert("Giá bán của từng biến thể phải lớn hơn 0.");
            return;
        }
        if (validDrafts.some((row) => !row.id && (!Number.isInteger(Number(row.soLuongTon || 0)) || Number(row.soLuongTon || 0) < 0))) {
            alert("Số lượng ban đầu phải là số nguyên lớn hơn hoặc bằng 0.");
            return;
        }
        const newStockTotal = validDrafts.filter((row) => !row.id)
            .reduce((sum, row) => sum + Math.max(0, Number(row.soLuongTon) || 0), 0);
        if (newStockTotal > 0 && !warehouses[0]?.id) {
            alert("Chưa có kho hàng mặc định. Hãy tạo kho trong mục Kho hàng trước khi nhập số lượng ban đầu.");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                maSanPham: form.maSanPham,
                tenSanPham: form.tenSanPham,
                danhMuc: form.danhMucId ? { id: Number(form.danhMucId) } : null,
                thuongHieu: form.thuongHieuId ? { id: Number(form.thuongHieuId) } : null,
                chatLieu: form.chatLieu,
                kieuDang: form.kieuDang,
                xuatXu: form.xuatXu,
                moTa: form.moTa,
                hinhAnh: form.hinhAnh,
                trangThai: form.trangThai,
            };

            const url = editingId ? `${API}/san-pham/${editingId}` : `${API}/san-pham`;
            const response = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const responseText = await response.text();
            let savedProduct = null;
            try { savedProduct = responseText ? JSON.parse(responseText) : null; } catch { savedProduct = null; }
            if (!response.ok || !savedProduct?.id) {
                throw new Error(savedProduct?.message || savedProduct?.error || responseText || "Lưu sản phẩm thất bại");
            }

            const stockImportItems = [];
            for (const row of validDrafts) {
                const isNewVariant = !row.id;
                const sku = row.maSku || taoMaSku(form.maSanPham, row.kichCoId, row.mauSacId);
                const variantPayload = {
                    sanPham: { id: Number(savedProduct.id) },
                    kichCo: { id: Number(row.kichCoId) },
                    mauSac: { id: Number(row.mauSacId) },
                    maSku: sku,
                    giaBan: Number(row.giaBan),
                    // Tồn kho hiện có chỉ được điều chỉnh qua mục Kho hàng.
                    soLuongTon: isNewVariant ? 0 : Math.max(0, Number(row.soLuongTon) || 0),
                    trangThai: row.trangThai || "HOAT_DONG",
                };
                const variantResponse = await fetch(
                    isNewVariant ? `${API}/san-pham-chi-tiet` : `${API}/san-pham-chi-tiet/${row.id}`,
                    {
                        method: isNewVariant ? "POST" : "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(variantPayload),
                    }
                );
                const variantText = await variantResponse.text();
                let savedVariant = null;
                try { savedVariant = variantText ? JSON.parse(variantText) : null; } catch { savedVariant = null; }
                if (!variantResponse.ok || !savedVariant?.id) {
                    throw new Error(savedVariant?.message || savedVariant?.error || variantText || `Không lưu được biến thể ${sku}`);
                }
                const initialStock = isNewVariant ? Math.max(0, Number(row.soLuongTon) || 0) : 0;
                if (initialStock > 0) {
                    stockImportItems.push({
                        sanPhamChiTietId: savedVariant.id,
                        soLuong: initialStock,
                        donGia: Number(row.giaBan),
                    });
                }
            }

            // Ghi tồn ban đầu qua phiếu nhập để đồng bộ cả bảng tồn kho và lịch sử biến động.
            if (stockImportItems.length > 0) {
                const importResponse = await fetch(`${API}/kho/phieu`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        maPhieu: `NK-${Date.now()}`,
                        loaiPhieu: "NHAP",
                        khoId: Number(warehouses[0].id),
                        lyDo: "Nhập tồn kho ban đầu khi tạo biến thể sản phẩm",
                        ghiChu: `Tạo từ màn hình quản lý sản phẩm ${savedProduct.maSanPham || form.maSanPham}`,
                        chiTiet: stockImportItems,
                    }),
                });
                const importText = await importResponse.text();
                if (!importResponse.ok) {
                    throw new Error(importText || "Đã lưu sản phẩm/biến thể nhưng chưa nhập được tồn kho. Vui lòng vào Kho hàng để nhập bổ sung.");
                }
            }

            setShowModal(false);
            setForm(emptyForm);

            // Sau khi thêm mới, quay về trang đầu để thấy sản phẩm vừa tạo.
            if (!editingId) {
                setCurrentPage(1);
            }

            setEditingId(null);
            setVariantDrafts([]);
            await loadData();
        } catch (err) {
            alert(err.message || "Có lỗi xảy ra khi lưu sản phẩm và biến thể.");
            await loadData();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Bạn có chắc muốn xóa sản phẩm này?"
        );

        if (!confirmDelete) return;

        try {
            const response = await fetch(
                `${API}/san-pham/${id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error("Xóa sản phẩm thất bại");
            }

            await loadData();
        } catch (err) {
            alert(err.message || "Có lỗi xảy ra");
        }
    };

    const resetFilter = () => {
        setKeyword("");
        setCategoryFilter("");
        setBrandFilter("");
        setStatusFilter("");
    };

    // ⭐ Format tiền
    const formatGia = (gia) => {
        if (!gia && gia !== 0) return "—";
        return Number(gia).toLocaleString("vi-VN") + "đ";
    };

    return (
        <div className="admin-products">

            {/* HEADER */}

            <div className="products-header">
                <div>
                    <div className="products-breadcrumb">
                        Quản lý / Sản phẩm
                    </div>

                    <h1>Quản lý sản phẩm</h1>

                    <p>
                        Quản lý các sản phẩm giày nam của cửa hàng.
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={openCreate}
                >
                    + Thêm sản phẩm
                </button>
            </div>

            {/* FILTER */}

            <div className="products-filter">

                <div className="filter-search">
                    <span>🔍</span>

                    <input
                        value={keyword}
                        onChange={(e) =>
                            setKeyword(e.target.value)
                        }
                        placeholder="Tìm theo mã hoặc tên sản phẩm..."
                    />
                </div>

                <select
                    value={categoryFilter}
                    onChange={(e) =>
                        setCategoryFilter(e.target.value)
                    }
                >
                    <option value="">Tất cả danh mục</option>

                    {categories.map((category) => (
                        <option
                            key={category.id}
                            value={category.id}
                        >
                            {category.tenDanhMuc}
                        </option>
                    ))}
                </select>

                <select
                    value={brandFilter}
                    onChange={(e) =>
                        setBrandFilter(e.target.value)
                    }
                >
                    <option value="">Tất cả thương hiệu</option>

                    {brands.map((brand) => (
                        <option
                            key={brand.id}
                            value={brand.id}
                        >
                            {brand.tenThuongHieu}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value)
                    }
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="HOAT_DONG">
                        Hoạt động
                    </option>
                    <option value="NGUNG_HOAT_DONG">
                        Ngừng hoạt động
                    </option>
                </select>

                <button
                    className="btn-reset"
                    onClick={resetFilter}
                >
                    Đặt lại
                </button>
            </div>


            <div className="products-card">

                <div className="products-card-header">
                    <div>
                        <strong>Danh sách sản phẩm</strong>

                        <span>
              {filteredProducts.length} sản phẩm
            </span>
                    </div>
                </div>

                {loading && (
                    <div className="products-loading">
                        Đang tải sản phẩm...
                    </div>
                )}

                {error && (
                    <div className="products-error">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <div className="table-wrapper">

                        <table className="products-table">

                            <thead>
                            <tr>
                                <th>Ảnh</th>
                                <th>Mã SP</th>
                                <th>Tồn kho</th>
                                <th>Tên sản phẩm</th>
                                <th>Danh mục</th>
                                <th>Thương hiệu</th>
                                <th>Xuất xứ</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                            </thead>

                            <tbody>

                            {currentProducts.map((product) => (
                                <tr key={product.id}>

                                    <td>
                                        <div className="product-image">
                                            {product.hinhAnh ? (
                                                <img
                                                    src={product.hinhAnh}
                                                    alt={product.tenSanPham}
                                                />
                                            ) : (
                                                <span>👟</span>
                                            )}
                                        </div>
                                    </td>

                                    <td>
                                        <strong>
                                            {product.maSanPham || "-"}
                                        </strong>
                                    </td>

                                    <td>
                                        {stockByProductId[product.id] == null ? (
                                            <span title="Chưa tải được số lượng tồn kho">—</span>
                                        ) : (
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    minWidth: 38,
                                                    padding: "5px 9px",
                                                    borderRadius: 999,
                                                    fontWeight: 700,
                                                    fontSize: 13,
                                                    color: stockByProductId[product.id] === 0
                                                        ? "#dc2626"
                                                        : stockByProductId[product.id] <= 5
                                                            ? "#b45309"
                                                            : "#15803d",
                                                    background: stockByProductId[product.id] === 0
                                                        ? "#fee2e2"
                                                        : stockByProductId[product.id] <= 5
                                                            ? "#fef3c7"
                                                            : "#dcfce7",
                                                }}
                                                title={stockByProductId[product.id] === 0
                                                    ? "Hết hàng"
                                                    : stockByProductId[product.id] <= 5
                                                        ? "Sắp hết hàng"
                                                        : "Còn hàng"}
                                            >
                                                {stockByProductId[product.id]}
                                            </span>
                                        )}
                                    </td>

                                    <td>
                                        <div className="product-name">
                                            {product.tenSanPham}
                                        </div>

                                        <small>
                                            ID: {product.id}
                                        </small>
                                    </td>

                                    <td>
                                        {product.danhMuc?.tenDanhMuc || "-"}
                                    </td>

                                    <td>
                                        {product.thuongHieu?.tenThuongHieu || "-"}
                                    </td>

                                    <td>
                                        {product.xuatXu || "-"}
                                    </td>

                                    <td>
                      <span
                          className={
                              product.trangThai ===
                              "HOAT_DONG"
                                  ? "status active"
                                  : "status inactive"
                          }
                      >
                        {product.trangThai ===
                        "HOAT_DONG"
                            ? "Hoạt động"
                            : "Ngừng hoạt động"}
                      </span>
                                    </td>

                                    <td>
                                        <div className="action-buttons">

                                            <button
                                                className="btn-edit"
                                                onClick={() =>
                                                    openEdit(product)
                                                }
                                            >
                                                Sửa
                                            </button>

                                            <button
                                                className="btn-delete"
                                                onClick={() =>
                                                    handleDelete(product.id)
                                                }
                                            >
                                                Xóa
                                            </button>

                                            <button
                                                type="button"
                                                className="btn-edit"
                                                onClick={() => openDetail(product)}
                                                style={{ marginRight: 6, background: "#111", color: "#fff" }}
                                            >
                                                Xem
                                            </button>
                                        </div>
                                    </td>

                                </tr>
                            ))}

                            </tbody>

                        </table>

                        {totalPages > 1 && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "18px 0"
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage(
                                            (page) => page - 1
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    style={{
                                        minWidth: "38px",
                                        height: "38px",
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        background: "#fff",
                                        cursor:
                                            currentPage === 1
                                                ? "not-allowed"
                                                : "pointer"
                                    }}
                                >
                                    ←
                                </button>

                                {Array.from(
                                    { length: totalPages },
                                    (_, index) => index + 1
                                ).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage(page)
                                        }
                                        style={{
                                            minWidth: "38px",
                                            height: "38px",
                                            border: "1px solid #ddd",
                                            borderRadius: "8px",
                                            background:
                                                currentPage === page
                                                    ? "#d94b3f"
                                                    : "#fff",
                                            color:
                                                currentPage === page
                                                    ? "#fff"
                                                    : "#222",
                                            cursor: "pointer",
                                            fontWeight:
                                                currentPage === page
                                                    ? 600
                                                    : 400
                                        }}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage(
                                            (page) => page + 1
                                        )
                                    }
                                    disabled={
                                        currentPage === totalPages
                                    }
                                    style={{
                                        minWidth: "38px",
                                        height: "38px",
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        background: "#fff",
                                        cursor:
                                            currentPage === totalPages
                                                ? "not-allowed"
                                                : "pointer"
                                    }}
                                >
                                    →
                                </button>
                            </div>
                        )}

                        {filteredProducts.length === 0 && (
                            <div className="empty-products">
                                <div>👟</div>

                                <h3>
                                    Không tìm thấy sản phẩm
                                </h3>

                                <p>
                                    Hãy thử thay đổi bộ lọc hoặc thêm
                                    sản phẩm mới.
                                </p>
                            </div>
                        )}

                    </div>
                )}
            </div>

            {showModal && (
                <div
                    className="modal-overlay"
                    onMouseDown={() =>
                        setShowModal(false)
                    }
                >
                    <div
                        className="product-modal"
                        onMouseDown={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>
                                <h2>
                                    {editingId
                                        ? "Chỉnh sửa sản phẩm"
                                        : "Thêm sản phẩm"}
                                </h2>

                                <p>
                                    Nhập thông tin sản phẩm
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowModal(false)
                                }
                            >
                                ×
                            </button>

                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="form-grid">

                                <div className="form-group">
                                    <label>
                                        Mã sản phẩm *
                                    </label>

                                    <input
                                        name="maSanPham"
                                        value={form.maSanPham}
                                        onChange={handleChange}
                                        required
                                        placeholder="VD: SP001"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Tên sản phẩm *
                                    </label>

                                    <input
                                        name="tenSanPham"
                                        value={form.tenSanPham}
                                        onChange={handleChange}
                                        required
                                        placeholder="VD: Nike Air Max"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Danh mục
                                    </label>

                                    <select
                                        name="danhMucId"
                                        value={form.danhMucId}
                                        onChange={handleChange}
                                    >
                                        <option value="">
                                            Chọn danh mục
                                        </option>

                                        {categories
                                            .filter((category) =>
                                                ["HOAT_DONG", "ACTIVE"].includes(category.trangThai) ||
                                                String(category.id) === String(form.danhMucId)
                                            )
                                            .map((category) => (
                                                <option
                                                    key={category.id}
                                                    value={category.id}
                                                >
                                                    {category.tenDanhMuc}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>
                                        Thương hiệu
                                    </label>

                                    <select
                                        name="thuongHieuId"
                                        value={form.thuongHieuId}
                                        onChange={handleChange}
                                    >
                                        <option value="">
                                            Chọn thương hiệu
                                        </option>

                                        {brands
                                            .filter((brand) =>
                                                ["HOAT_DONG", "ACTIVE"].includes(brand.trangThai) ||
                                                String(brand.id) === String(form.thuongHieuId)
                                            )
                                            .map((brand) => (
                                                <option
                                                    key={brand.id}
                                                    value={brand.id}
                                                >
                                                    {brand.tenThuongHieu}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>
                                        Chất liệu
                                    </label>

                                    <input
                                        name="chatLieu"
                                        value={form.chatLieu}
                                        onChange={handleChange}
                                        placeholder="VD: Mesh"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Kiểu dáng
                                    </label>

                                    <input
                                        name="kieuDang"
                                        value={form.kieuDang}
                                        onChange={handleChange}
                                        placeholder="VD: Sneaker"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Xuất xứ
                                    </label>

                                    <input
                                        name="xuatXu"
                                        value={form.xuatXu}
                                        onChange={handleChange}
                                        placeholder="VD: Việt Nam"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Trạng thái
                                    </label>

                                    <select
                                        name="trangThai"
                                        value={form.trangThai}
                                        onChange={handleChange}
                                    >
                                        <option value="HOAT_DONG">
                                            Hoạt động
                                        </option>

                                        <option value="NGUNG_HOAT_DONG">
                                            Ngừng hoạt động
                                        </option>
                                    </select>
                                </div>

                                <div className="form-group full">
                                    <label>
                                        Link hình ảnh
                                    </label>

                                    <input
                                        name="hinhAnh"
                                        value={form.hinhAnh}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="form-group full">
                                    <label>
                                        Mô tả
                                    </label>

                                    <textarea
                                        name="moTa"
                                        value={form.moTa}
                                        onChange={handleChange}
                                        rows="4"
                                        placeholder="Mô tả sản phẩm..."
                                    />
                                </div>

                            </div>

                            <section className="product-variant-editor">
                                <div className="product-variant-editor-heading">
                                    <div>
                                        <h3>Biến thể sản phẩm</h3>
                                        <p>Chọn size, màu sắc, giá bán và số lượng ban đầu cho từng biến thể.</p>
                                    </div>
                                    <button type="button" className="variant-add-button" onClick={addVariantDraft}>+ Thêm biến thể</button>
                                </div>

                                {variantDrafts.map((row, index) => (
                                    <div className="product-variant-draft" key={row.id || `new-${index}`}>
                                        <div className="variant-draft-title">
                                            <strong>{row.id ? `Biến thể ${row.maSku || index + 1}` : `Biến thể mới ${index + 1}`}</strong>
                                            {row.id ? <span>Đang có {Number(row.soLuongTon || 0)} đôi trong kho</span> : <span>SKU sẽ tự tạo khi lưu</span>}
                                        </div>
                                        <div className="variant-draft-fields">
                                            <label>
                                                Size *
                                                <select value={row.kichCoId} onChange={(event) => updateVariantDraft(index, "kichCoId", event.target.value)}>
                                                    <option value="">Chọn size</option>
                                                    {sizes.filter((size) => ["HOAT_DONG", "ACTIVE"].includes(size.trangThai) || String(size.id) === String(row.kichCoId)).map((size) => (
                                                        <option key={size.id} value={size.id}>{size.tenKichCo}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                Màu sắc *
                                                <select value={row.mauSacId} onChange={(event) => updateVariantDraft(index, "mauSacId", event.target.value)}>
                                                    <option value="">Chọn màu</option>
                                                    {colors.filter((color) => ["HOAT_DONG", "ACTIVE"].includes(color.trangThai) || String(color.id) === String(row.mauSacId)).map((color) => (
                                                        <option key={color.id} value={color.id}>{color.tenMau}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                Giá bán (VNĐ) *
                                                <input type="number" min="1" step="1" value={row.giaBan} onChange={(event) => updateVariantDraft(index, "giaBan", event.target.value)} placeholder="Nhập giá bán tùy ý (VNĐ)" />
                                            </label>
                                            <label>
                                                Số lượng ban đầu
                                                <input type="number" min="0" step="1" value={row.soLuongTon} disabled={Boolean(row.id)} onChange={(event) => updateVariantDraft(index, "soLuongTon", event.target.value)} placeholder="0" />
                                                {row.id ? <small>Muốn tăng/giảm tồn hiện tại, thao tác trong mục Kho hàng.</small> : <small>Số lượng sẽ được ghi nhận bằng phiếu nhập kho.</small>}
                                            </label>
                                        </div>
                                        <div className="variant-draft-footer">
                                            {row.id ? <span>SKU: {row.maSku || "Tự động"}</span> : <span>Size + màu tạo thành một biến thể riêng.</span>}
                                            <button type="button" onClick={() => removeVariantDraft(index)} disabled={variantDrafts.length === 1 || Boolean(row.id)}>Xóa dòng</button>
                                        </div>
                                    </div>
                                ))}
                                {sizes.length === 0 || colors.length === 0 ? (
                                    <p className="variant-editor-warning">Chưa tải được danh sách size hoặc màu. Hãy kiểm tra mục Kích cỡ và Màu sắc trong Admin.</p>
                                ) : null}
                            </section>

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() =>
                                        setShowModal(false)
                                    }
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Đang lưu..."
                                        : editingId
                                            ? "Lưu thay đổi"
                                            : "Thêm sản phẩm"}
                                </button>

                            </div>

                        </form>

                    </div>
                </div>
            )}

            {/* ⭐ MODAL XEM CHI TIẾT SẢN PHẨM — CÓ BẢNG BIẾN THỂ */}
            {showDetail && selectedProduct && (
                <div
                    className="modal-overlay"
                    onMouseDown={closeDetail}
                >
                    <div
                        className="product-modal"
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ width: "min(1000px, 100%)" }}
                    >
                        <div className="modal-header">
                            <div>
                                <h2>Chi tiết sản phẩm</h2>
                                <p>Thông tin sản phẩm và các biến thể</p>
                            </div>
                            <button
                                className="modal-close"
                                onClick={closeDetail}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ padding: 24 }}>
                            {/* ===== THÔNG TIN SẢN PHẨM ===== */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "220px 1fr",
                                    gap: 24,
                                    marginBottom: 28,
                                }}
                            >
                                <img
                                    src={
                                        selectedProduct.hinhAnh ||
                                        "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80"
                                    }
                                    alt={selectedProduct.tenSanPham}
                                    style={{
                                        width: "100%",
                                        borderRadius: 10,
                                        border: "1px solid #eee",
                                        objectFit: "cover",
                                    }}
                                />

                                <div>
                                    <div style={{ marginBottom: 16 }}>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "4px 10px",
                                                background: "#f3f4f6",
                                                borderRadius: 6,
                                                fontSize: 12,
                                                fontWeight: 700,
                                                marginBottom: 8,
                                            }}
                                        >
                                            ID: {selectedProduct.id}
                                        </span>
                                        <h3
                                            style={{
                                                margin: "6px 0",
                                                fontSize: 20,
                                            }}
                                        >
                                            {selectedProduct.tenSanPham}
                                        </h3>
                                    </div>

                                    <table style={{ width: "100%", fontSize: 14 }}>
                                        <tbody>
                                        <tr>
                                            <td style={{ padding: "8px 0", color: "#888", width: 140 }}>
                                                Mã sản phẩm
                                            </td>
                                            <td style={{ padding: "8px 0", fontWeight: 600 }}>
                                                {selectedProduct.maSanPham || "—"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "8px 0", color: "#888" }}>
                                                Danh mục
                                            </td>
                                            <td style={{ padding: "8px 0", fontWeight: 600 }}>
                                                {selectedProduct.danhMuc?.tenDanhMuc || "—"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "8px 0", color: "#888" }}>
                                                Thương hiệu
                                            </td>
                                            <td style={{ padding: "8px 0", fontWeight: 600 }}>
                                                {selectedProduct.thuongHieu?.tenThuongHieu || "—"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "8px 0", color: "#888" }}>
                                                Xuất xứ
                                            </td>
                                            <td style={{ padding: "8px 0", fontWeight: 600 }}>
                                                {selectedProduct.xuatXu || "—"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "8px 0", color: "#888" }}>
                                                Chất liệu
                                            </td>
                                            <td style={{ padding: "8px 0", fontWeight: 600 }}>
                                                {selectedProduct.chatLieu || "—"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "8px 0", color: "#888" }}>
                                                Kiểu dáng
                                            </td>
                                            <td style={{ padding: "8px 0", fontWeight: 600 }}>
                                                {selectedProduct.kieuDang || "—"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "8px 0", color: "#888" }}>
                                                Trạng thái
                                            </td>
                                            <td style={{ padding: "8px 0" }}>
                                                    <span
                                                        className={
                                                            selectedProduct.trangThai === "HOAT_DONG"
                                                                ? "status active"
                                                                : "status inactive"
                                                        }
                                                    >
                                                        {selectedProduct.trangThai === "HOAT_DONG"
                                                            ? "Hoạt động"
                                                            : "Ngừng hoạt động"}
                                                    </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "8px 0", color: "#888" }}>
                                                Mô tả
                                            </td>
                                            <td style={{ padding: "8px 0" }}>
                                                {selectedProduct.moTa || "—"}
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ===== BẢNG BIẾN THỂ ===== */}
                            <div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 12,
                                    }}
                                >
                                    <h3 style={{ margin: 0, fontSize: 18 }}>
                                        Biến thể sản phẩm
                                    </h3>
                                    <span style={{ fontSize: 13, color: "#888" }}>
                                        {selectedProduct.chiTiets?.length || 0} biến thể
                                    </span>
                                </div>

                                {selectedProduct.loadingChiTiet ? (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: 40,
                                            color: "#888",
                                        }}
                                    >
                                        Đang tải biến thể...
                                    </div>
                                ) : !selectedProduct.chiTiets ||
                                selectedProduct.chiTiets.length === 0 ? (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: 40,
                                            background: "#fafafa",
                                            borderRadius: 10,
                                            color: "#888",
                                        }}
                                    >
                                        Sản phẩm chưa có biến thể nào
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            border: "1px solid #eee",
                                            borderRadius: 10,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <table
                                            style={{
                                                width: "100%",
                                                borderCollapse: "collapse",
                                                fontSize: 13,
                                            }}
                                        >
                                            <thead>
                                            <tr
                                                style={{
                                                    background: "#fafafa",
                                                    textAlign: "left",
                                                }}
                                            >
                                                <th style={{ padding: "12px 14px", color: "#666", fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>
                                                    SKU
                                                </th>
                                                <th style={{ padding: "12px 14px", color: "#666", fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>
                                                    Size
                                                </th>
                                                <th style={{ padding: "12px 14px", color: "#666", fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>
                                                    Màu
                                                </th>
                                                <th style={{ padding: "12px 14px", color: "#666", fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", textAlign: "right" }}>
                                                    Giá bán
                                                </th>
                                                <th style={{ padding: "12px 14px", color: "#666", fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", textAlign: "center" }}>
                                                    Tồn kho
                                                </th>
                                                <th style={{ padding: "12px 14px", color: "#666", fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", textAlign: "center" }}>
                                                    Tối thiểu
                                                </th>
                                                <th style={{ padding: "12px 14px", color: "#666", fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>
                                                    Trạng thái
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {selectedProduct.chiTiets.map((ct) => {
                                                const tonKho = Number(ct.soLuongTon ?? 0);
                                                const toiThieu = Number(ct.soLuongToiThieu ?? 0);
                                                const sapHet = tonKho <= toiThieu && tonKho > 0;
                                                const hetHang = tonKho === 0;

                                                return (
                                                    <tr
                                                        key={ct.id}
                                                        style={{
                                                            borderTop: "1px solid #f0f0f0",
                                                        }}
                                                    >
                                                        <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 600 }}>
                                                            {ct.maSku || "—"}
                                                        </td>
                                                        <td style={{ padding: "12px 14px" }}>
                                                            <strong>
                                                                {ct.kichCo?.tenKichCo || "—"}
                                                            </strong>
                                                        </td>
                                                        <td style={{ padding: "12px 14px" }}>
                                                            {ct.mauSac?.tenMau || "—"}
                                                        </td>
                                                        <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: "#e53935" }}>
                                                            {formatGia(ct.giaBan)}
                                                        </td>
                                                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                                                                <span
                                                                    style={{
                                                                        fontWeight: 700,
                                                                        color: hetHang
                                                                            ? "#e74c3c"
                                                                            : sapHet
                                                                                ? "#f39c12"
                                                                                : "#27ae60",
                                                                    }}
                                                                >
                                                                    {tonKho}
                                                                </span>
                                                        </td>
                                                        <td style={{ padding: "12px 14px", textAlign: "center", color: "#888" }}>
                                                            {toiThieu}
                                                        </td>
                                                        <td style={{ padding: "12px 14px" }}>
                                                                <span
                                                                    className={
                                                                        ct.trangThai === "HOAT_DONG"
                                                                            ? "status active"
                                                                            : "status inactive"
                                                                    }
                                                                >
                                                                    {ct.trangThai === "HOAT_DONG"
                                                                        ? "Hoạt động"
                                                                        : "Ngừng"}
                                                                </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* ===== NÚT ===== */}
                            <div
                                style={{
                                    marginTop: 24,
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 10,
                                }}
                            >
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => {
                                        closeDetail();
                                        openEdit(selectedProduct);
                                    }}
                                >
                                    Sửa sản phẩm
                                </button>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={closeDetail}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default AdminProducts;
