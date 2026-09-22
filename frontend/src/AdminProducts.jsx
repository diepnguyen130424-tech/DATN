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
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [keyword, setKeyword] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [brandFilter, setBrandFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);


    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [productRes, categoryRes, brandRes] = await Promise.all([
                fetch(`${API}/san-pham`),
                fetch(`${API}/danh-muc`),
                fetch(`${API}/thuong-hieu`),
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

            setProducts(Array.isArray(productData) ? productData : []);
            setCategories(Array.isArray(categoryData) ? categoryData : []);
            setBrands(Array.isArray(brandData) ? brandData : []);
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
        return products.filter((product) => {
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
        });
    }, [
        products,
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

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (product) => {
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

        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);

            const payload = {
                maSanPham: form.maSanPham,
                tenSanPham: form.tenSanPham,

                danhMuc: form.danhMucId
                    ? { id: Number(form.danhMucId) }
                    : null,

                thuongHieu: form.thuongHieuId
                    ? { id: Number(form.thuongHieuId) }
                    : null,

                chatLieu: form.chatLieu,
                kieuDang: form.kieuDang,
                xuatXu: form.xuatXu,
                moTa: form.moTa,
                hinhAnh: form.hinhAnh,
                trangThai: form.trangThai,
            };

            const url = editingId
                ? `${API}/san-pham/${editingId}`
                : `${API}/san-pham`;

            const method = editingId ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Lưu sản phẩm thất bại");
            }

            setShowModal(false);
            setForm(emptyForm);
            setEditingId(null);

            await loadData();
        } catch (err) {
            alert(err.message || "Có lỗi xảy ra");
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

            {/* CONTENT */}

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
                                <th>Tên sản phẩm</th>
                                <th>Danh mục</th>
                                <th>Thương hiệu</th>
                                <th>Xuất xứ</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                            </thead>

                            <tbody>

                            {filteredProducts.map((product) => (
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

                                        </div>
                                    </td>

                                </tr>
                            ))}

                            </tbody>

                        </table>

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

            {/* MODAL */}

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

                                        {categories.map((category) => (
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

                                        {brands.map((brand) => (
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

        </div>
    );
}

export default AdminProducts;