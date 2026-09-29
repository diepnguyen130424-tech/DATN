import { useEffect, useState } from "react";

const API = "http://localhost:8080/api";

const inputStyle = {
    width: "400px",
    maxWidth: "100%",
    height: "58px",
    boxSizing: "border-box",
    padding: "0 18px",
    border: "1px solid #d9d9d9",
    borderRadius: "10px",
    fontSize: "18px",
    outline: "none",
    background: "#fff"
};

const btn = {
    border: "1px solid #ddd",
    background: "#fff",
    padding: "8px 16px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "16px"
};

function hienThiTrangThai(trangThai) {
    if (
        trangThai === "ACTIVE" ||
        trangThai === "HOAT_DONG"
    ) {
        return "Hoạt động";
    }

    if (trangThai === "NGUNG_HOAT_DONG") {
        return "Ngừng hoạt động";
    }

    return trangThai || "-";
}

function AdminKichCo() {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({
        tenKichCo: "",
        trangThai: "HOAT_DONG"
    });
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const taiDuLieu = async () => {
        try {
            const res = await fetch(`${API}/kich-co`);

            if (res.ok) {
                setItems(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        taiDuLieu();
    }, []);

    const danhSach = items.filter((item) =>
        `${item.tenKichCo} ${item.trangThai}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const moThem = () => {
        setEditing(null);
        setForm({
            tenKichCo: "",
            trangThai: "HOAT_DONG"
        });
        setShowForm(true);
    };

    const moSua = (item) => {
        setEditing(item);
        setForm({
            tenKichCo: item.tenKichCo || "",
            trangThai: item.trangThai || "HOAT_DONG"
        });
        setShowForm(true);
    };

    const luu = async (e) => {
        e.preventDefault();

        const url = editing
            ? `${API}/kich-co/${editing.id}`
            : `${API}/kich-co`;

        try {
            const res = await fetch(url, {
                method: editing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            });

            const text = await res.text();

            if (!res.ok) {
                throw new Error(
                    text || "Không thể lưu kích cỡ"
                );
            }

            alert(
                editing
                    ? "Sửa kích cỡ thành công."
                    : "Thêm kích cỡ thành công."
            );

            setShowForm(false);
            await taiDuLieu();
        } catch (e) {
            alert(e.message);
        }
    };

    const xoa = async (item) => {
        if (
            !window.confirm(
                `Bạn có chắc muốn xóa kích cỡ ${item.tenKichCo}?`
            )
        ) {
            return;
        }

        try {
            const res = await fetch(
                `${API}/kich-co/${item.id}`,
                {
                    method: "DELETE"
                }
            );

            const text = await res.text();

            if (!res.ok) {
                throw new Error(
                    text || "Không thể xóa kích cỡ"
                );
            }

            await taiDuLieu();
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div className="admin-dashboard-content">
            <div className="admin-page-heading">
                <div>
                    <div className="admin-eyebrow">
                        FSHOP ADMIN
                    </div>

                    <h1>Kích cỡ</h1>

                    <p>
                        Quản lý kích cỡ sản phẩm.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={moThem}
                    style={{
                        ...btn,
                        border: "none",
                        background: "#111",
                        color: "#fff",
                        padding: "16px 24px",
                        borderRadius: "14px",
                        fontSize: "18px"
                    }}
                >
                    + Thêm kích cỡ
                </button>
            </div>

            <section className="admin-card">
                <input
                    style={inputStyle}
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    placeholder="Tìm tên kích cỡ..."
                />
            </section>

            <section className="admin-card">
                <div className="admin-table-scroll">
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên kích cỡ</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4">
                                    Đang tải...
                                </td>
                            </tr>
                        ) : danhSach.length ? (
                            danhSach.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        #{item.id}
                                    </td>

                                    <td>
                                        <strong>
                                            {item.tenKichCo}
                                        </strong>
                                    </td>

                                    <td>
                                        {hienThiTrangThai(
                                            item.trangThai
                                        )}
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                moSua(item)
                                            }
                                            style={btn}
                                        >
                                            Sửa
                                        </button>

                                        {" "}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                xoa(item)
                                            }
                                            style={{
                                                ...btn,
                                                color: "#c94a3b",
                                                background:
                                                    "#fff4f2",
                                                borderColor:
                                                    "#f2d9d5"
                                            }}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4">
                                    Không có dữ liệu.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>

            {showForm && (
                <div
                    onClick={() =>
                        setShowForm(false)
                    }
                    style={{
                        position: "fixed",
                        inset: 0,
                        background:
                            "rgba(0,0,0,.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999
                    }}
                >
                    <div
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                        style={{
                            width: "min(520px, 100%)",
                            background: "#fff",
                            borderRadius: "14px",
                            padding: "25px"
                        }}
                    >
                        <h2>
                            {editing
                                ? "Sửa kích cỡ"
                                : "Thêm kích cỡ"}
                        </h2>

                        <form onSubmit={luu}>
                            <label>
                                Tên kích cỡ *
                            </label>

                            <input
                                value={
                                    form.tenKichCo
                                }
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        tenKichCo:
                                        e.target.value
                                    })
                                }
                                required
                                style={{
                                    ...inputStyle,
                                    width: "100%",
                                    height: "46px",
                                    margin:
                                        "8px 0 16px"
                                }}
                            />

                            <label>
                                Trạng thái
                            </label>

                            <select
                                value={
                                    form.trangThai
                                }
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        trangThai:
                                        e.target.value
                                    })
                                }
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    margin:
                                        "8px 0 20px",
                                    border:
                                        "1px solid #ddd",
                                    borderRadius: "8px"
                                }}
                            >
                                <option value="HOAT_DONG">
                                    Hoạt động
                                </option>

                                <option value="NGUNG_HOAT_DONG">
                                    Ngừng hoạt động
                                </option>
                            </select>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent:
                                        "flex-end",
                                    gap: "10px"
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowForm(false)
                                    }
                                    style={btn}
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    style={{
                                        ...btn,
                                        background: "#111",
                                        color: "#fff",
                                        borderColor: "#111"
                                    }}
                                >
                                    Lưu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminKichCo;