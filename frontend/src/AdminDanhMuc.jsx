import CatalogCrud from "./CatalogCrud";

const CONFIG = {
    endpoint: "danh-muc",
    nameField: "tenDanhMuc",
    title: "Danh mục sản phẩm",
    subtitle: "Quản lý các danh mục dùng để phân loại sản phẩm trong cửa hàng.",
    singular: "danh mục",
    icon: "▤",
    namePlaceholder: "VD: Giày chạy bộ",
    descPlaceholder: "Mô tả ngắn về danh mục...",
};

export default function AdminDanhMuc() {
    return <CatalogCrud config={CONFIG} />;
}
