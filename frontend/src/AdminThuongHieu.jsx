import CatalogCrud from "./CatalogCrud";

const CONFIG = {
    endpoint: "thuong-hieu",
    nameField: "tenThuongHieu",
    codeField: "maThuongHieu",
    codeLabel: "Mã thương hiệu",
    breadcrumb: "Thương hiệu",
    title: "Thương hiệu",
    subtitle: "Quản lý thương hiệu (kèm logo) hiển thị ở menu Thương hiệu trên trang cửa hàng.",
    singular: "thương hiệu",
    icon: "◇",
    namePlaceholder: "VD: Nike",
    descPlaceholder: "Mô tả ngắn về thương hiệu...",
    extraField: {
        key: "quocGiaThuongHieu",
        label: "Quốc gia xuất xứ",
        placeholder: "VD: Mỹ",
        column: "Quốc gia",
        statLabel: "Quốc gia xuất xứ",
    },
};

export default function AdminThuongHieu() {
    return <CatalogCrud config={CONFIG} />;
}
