import CatalogCrud from "./CatalogCrud";

const CONFIG = {
    endpoint: "thuong-hieu",
    nameField: "tenThuongHieu",
    codeField: "maThuongHieu",
    codeLabel: "Mã thương hiệu",
    breadcrumb: "Thương hiệu",
    title: "Thương hiệu",
    subtitle: "Quản lý các thương hiệu giày đang kinh doanh tại cửa hàng.",
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
