import { useMemo, useState } from "react";
import "./EmployeeCustomers.css";

function PageHeading({ eyebrow = "FSHOP NHÂN VIÊN", title, description, action }) {
    return (
        <div className="employee-heading">
            <div>
                <span className="employee-eyebrow">{eyebrow}</span>
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            {action}
        </div>
    );
}

function formatGender(value) {
    if (!value) return "-";
    const v = String(value).toUpperCase();
    if (v === "NAM") return "Nam";
    if (v === "NU" || v === "NỮ") return "Nữ";
    if (v === "KHAC" || v === "KHÁC") return "Khác";
    return String(value);
}

const PAGE_SIZE = 5;

export default function EmployeeCustomers({ customers = [] }) {
    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState("asc");
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        const list = customers.filter((item) => {
            if (!keyword) return true;
            const hoTen = String(item?.hoTen ?? "").toLowerCase();
            const sdt = String(item?.soDienThoai ?? "").toLowerCase();
            const tk = String(item?.taiKhoan?.tenDangNhap ?? "").toLowerCase();
            const idStr = String(item?.id ?? "");
            return hoTen.includes(keyword) || sdt.includes(keyword) || tk.includes(keyword) || idStr.includes(keyword);
        });

        list.sort((a, b) => {
            const idA = Number(a?.id) || 0;
            const idB = Number(b?.id) || 0;
            return sortOrder === "asc" ? idA - idB : idB - idA;
        });
        return list;
    }, [customers, search, sortOrder]);

    const totalCustomers = customers.length;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const handleSearchChange = (value) => {
        setSearch(value);
        setPage(1);
    };

    const handleSort = () => {
        setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
        setPage(1);
    };

    return (
        <div className="employee-content">
            <PageHeading
                title="Khách hàng"
                description={`Tra cứu thông tin khách hàng từ database — Tổng: ${totalCustomers} khách hàng.`}
            />

            <section className="employee-card">
                <div className="emp-cus-toolbar">
                    <div className="emp-cus-search">
                        <span>⌕</span>
                        <input
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Tìm theo tên, số điện thoại, tài khoản..."
                        />
                        {search && (
                            <button type="button" onClick={() => handleSearchChange("")} aria-label="Xóa tìm kiếm">
                                ×
                            </button>
                        )}
                    </div>
                </div>

                <div className="employee-table-wrapper">
                    <table className="employee-table emp-cus-table">
                        <thead>
                        <tr>
                            <th
                                className="emp-cus-th-id"
                                onClick={handleSort}
                                style={{ cursor: "pointer", userSelect: "none" }}
                            >
                                ID {sortOrder === "asc" ? "↑" : "↓"}
                            </th>
                            <th>Họ tên</th>
                            <th>Tài khoản</th>
                            <th>Số điện thoại</th>
                            <th>Giới tính</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length > 0 ? (
                            pageItems.map((item) => (
                                <tr key={String(item?.id ?? `${item?.hoTen ?? "customer"}-${item?.soDienThoai ?? ""}`)}>
                                    <td>
                                        <strong className="emp-cus-id">#{item?.id ?? "-"}</strong>
                                    </td>
                                    <td>
                                        <strong>{item?.hoTen || "Khách hàng mới"}</strong>
                                    </td>
                                    <td>{item?.taiKhoan?.tenDangNhap || "-"}</td>
                                    <td>{item?.soDienThoai || "-"}</td>
                                    <td>{formatGender(item?.gioiTinh)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="employee-empty">
                                    Không tìm thấy khách hàng nào.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className="employee-pagination">
                            <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                                ←
                            </button>
                            {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                                <button
                                    key={number}
                                    type="button"
                                    className={safePage === number ? "active" : ""}
                                    onClick={() => setPage(number)}
                                >
                                    {number}
                                </button>
                            ))}
                            <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
                                →
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
