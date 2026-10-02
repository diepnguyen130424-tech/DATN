import CatalogCrud from "./CatalogCrud";

const CONFIG = {
    endpoint: "danh-muc",
    nameField: "tenDanhMuc",
    codeField: "maDanhMuc",
    codeLabel: "Mã danh mục",
    breadcrumb: "Danh mục",
    title: "Danh mục sản phẩm",
    subtitle: "Quản lý danh mục (kèm ảnh) hiển thị ở menu Danh mục trên trang cửa hàng.",
    singular: "danh mục",
    icon: "▤",
    namePlaceholder: "VD: Giày chạy bộ",
    descPlaceholder: "Mô tả ngắn về danh mục...",
};

export default function AdminDanhMuc() {
    return <CatalogCrud config={CONFIG} />;
}
