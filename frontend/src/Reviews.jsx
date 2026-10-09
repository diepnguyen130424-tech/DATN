/* eslint-disable react-hooks/set-state-in-effect, react-refresh/only-export-components */
import { useEffect, useMemo, useRef, useState } from "react";
import { anhUrl } from "./CatalogCrud";
import "./Reviews.css";

const API = "http://localhost:8080/api";
const NHAN_SAO = ["", "Rất tệ", "Không hài lòng", "Bình thường", "Hài lòng", "Tuyệt vời"];
const TOI_DA_ANH = 5;
const TOI_DA_KY_TU = 1000;
const TOI_DA_MB = 5;
const GOI_Y = ["Đúng mô tả", "Đi êm chân", "Form giày đẹp", "Chất liệu tốt", "Đóng gói cẩn thận", "Giao hàng nhanh"];

/* ---- Thống kê sao của mọi sản phẩm: tải 1 lần, dùng chung cho tất cả thẻ sản phẩm ---- */
let thongKeCache = null; // { time, promise }
const HAN_CACHE_MS = 60 * 1000;

export function lamMoiThongKeDanhGia() {
    thongKeCache = null;
}

function layThongKe() {
    if (!thongKeCache || Date.now() - thongKeCache.time > HAN_CACHE_MS) {
        const promise = fetch(`${API}/danh-gia/thong-ke`)
            .then((res) => (res.ok ? res.json() : []))
            .then((list) => {
                const map = {};
                (Array.isArray(list) ? list : []).forEach((x) => { map[x.sanPhamId] = x; });
                return map;
            })
            .catch(() => {
                thongKeCache = null;
                return {};
            });
        thongKeCache = { time: Date.now(), promise };
    }
    return thongKeCache.promise;
}

/**
 * Điểm sao THẬT của sản phẩm (thay cho số giả trước đây).
 * variant="card": dùng trong thẻ sản phẩm; variant="detail": dùng ở trang chi tiết.
 */
export function RatingBadge({ sanPhamId, variant = "card" }) {
    const [tk, setTk] = useState(undefined); // undefined = đang tải, null = chưa có đánh giá

    useEffect(() => {
        let huy = false;
        layThongKe().then((map) => { if (!huy) setTk(map[sanPhamId] || null); });
        return () => { huy = true; };
    }, [sanPhamId]);

    if (tk === undefined) return <small>&nbsp;</small>;

    if (!tk) {
        return variant === "detail"
            ? <span className="rating-count">Chưa có đánh giá</span>
            : <small>Chưa có đánh giá</small>;
    }

    if (variant === "detail") {
        return (
            <>
                <span>★</span> {tk.trungBinh.toFixed(1)}
                <button
                    type="button"
                    className="rv-jump"
                    onClick={() => document.getElementById("danh-gia")?.scrollIntoView({ behavior: "smooth" })}
                >
                    ({tk.tongSo} đánh giá)
                </button>
            </>
        );
    }

    return (
        <>
            <span>★</span> {tk.trungBinh.toFixed(1)}
            <small>({tk.tongSo})</small>
        </>
    );
}

function formatNgay(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
}

async function docLoi(res, macDinh) {
    try {
        const data = await res.json();
        return data?.message || macDinh;
    } catch {
        return macDinh;
    }
}

/** Hiển thị sao (hỗ trợ số lẻ, ví dụ 4.3) */
export function Stars({ value = 0, size = 16 }) {
    const pct = Math.max(0, Math.min(5, Number(value) || 0)) / 5 * 100;
    return (
        <span className="rv-stars" style={{ fontSize: size }} role="img" aria-label={`${value} trên 5 sao`}>
            <span className="rv-stars-bg">★★★★★</span>
            <span className="rv-stars-fg" style={{ width: `${pct}%` }}>★★★★★</span>
        </span>
    );
}

/* =========================================================
   DANH SÁCH ĐÁNH GIÁ Ở TRANG CHI TIẾT SẢN PHẨM
========================================================= */
export function ProductReviews({ sanPhamId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [loc, setLoc] = useState("all"); // all | 1..5 | anh
    const [hienThi, setHienThi] = useState(5);
    const [anhLon, setAnhLon] = useState("");

    useEffect(() => {
        if (!sanPhamId) return;
        let huy = false;
        setLoading(true);
        setError("");
        fetch(`${API}/danh-gia/san-pham/${sanPhamId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Không tải được đánh giá");
                return res.json();
            })
            .then((json) => { if (!huy) setData(json); })
            .catch((err) => { if (!huy) setError(err.message); })
            .finally(() => { if (!huy) setLoading(false); });
        return () => { huy = true; };
    }, [sanPhamId]);

    const danhSach = useMemo(() => {
        const all = data?.danhGias || [];
        if (loc === "all") return all;
        if (loc === "anh") return all.filter((r) => r.hinhAnh?.length > 0);
        return all.filter((r) => String(r.soSao) === String(loc));
    }, [data, loc]);

    const soCoAnh = (data?.danhGias || []).filter((r) => r.hinhAnh?.length > 0).length;

    return (
        <section className="rv-section" id="danh-gia">
            <h2>Đánh giá sản phẩm</h2>

            {loading ? (
                <p className="rv-muted">Đang tải đánh giá...</p>
            ) : error ? (
                <p className="rv-muted">{error}</p>
            ) : !data || data.tongSo === 0 ? (
                <div className="rv-empty">
                    <span>★</span>
                    <p>Chưa có đánh giá nào. Hãy mua hàng và là người đầu tiên đánh giá sản phẩm này.</p>
                </div>
            ) : (
                <>
                    <div className="rv-summary">
                        <div className="rv-score">
                            <strong>{data.trungBinh.toFixed(1)}</strong>
                            <span>trên 5</span>
                            <Stars value={data.trungBinh} size={20} />
                        </div>
                        <div className="rv-filters">
                            <button type="button" className={loc === "all" ? "active" : ""} onClick={() => { setLoc("all"); setHienThi(5); }}>
                                Tất cả ({data.tongSo})
                            </button>
                            {[5, 4, 3, 2, 1].map((n) => (
                                <button
                                    type="button"
                                    key={n}
                                    className={String(loc) === String(n) ? "active" : ""}
                                    onClick={() => { setLoc(n); setHienThi(5); }}
                                >
                                    {n} sao ({data.phanBo?.[n] ?? 0})
                                </button>
                            ))}
                            <button type="button" className={loc === "anh" ? "active" : ""} onClick={() => { setLoc("anh"); setHienThi(5); }}>
                                Có hình ảnh ({soCoAnh})
                            </button>
                        </div>
                    </div>

                    {danhSach.length === 0 ? (
                        <p className="rv-muted">Không có đánh giá phù hợp bộ lọc.</p>
                    ) : (
                        <div className="rv-list">
                            {danhSach.slice(0, hienThi).map((r) => (
                                <article className="rv-item" key={r.id}>
                                    <div className="rv-avatar">{(r.tenKhachHang || "K").charAt(0).toUpperCase()}</div>
                                    <div className="rv-body">
                                        <strong className="rv-name">{r.tenKhachHang}</strong>
                                        <Stars value={r.soSao} size={14} />
                                        <div className="rv-meta">
                                            {formatNgay(r.ngayTao)}
                                            {r.phanLoai ? ` | Phân loại: ${r.phanLoai}` : ""}
                                        </div>
                                        {r.noiDung && <p className="rv-text">{r.noiDung}</p>}
                                        {r.hinhAnh?.length > 0 && (
                                            <div className="rv-images">
                                                {r.hinhAnh.map((url) => (
                                                    <button type="button" key={url} onClick={() => setAnhLon(anhUrl(url))}>
                                                        <img src={anhUrl(url)} alt="Ảnh đánh giá" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {r.phanHoi && (
                                            <div className="rv-reply">
                                                <strong>Phản hồi của FShop</strong>
                                                <p>{r.phanHoi}</p>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {danhSach.length > hienThi && (
                        <button type="button" className="rv-more" onClick={() => setHienThi(hienThi + 5)}>
                            Xem thêm đánh giá
                        </button>
                    )}
                </>
            )}

            {anhLon && (
                <div className="rv-lightbox" onClick={() => setAnhLon("")}>
                    <img src={anhLon} alt="Ảnh đánh giá phóng to" />
                </div>
            )}
        </section>
    );
}

/* =========================================================
   FORM VIẾT ĐÁNH GIÁ (mở từ trang "Đơn hàng của tôi")
========================================================= */
export function ReviewModal({ item, orderCode, khachHangId, onClose, onSubmitted }) {
    const spct = item?.sanPhamChiTiet || {};
    const sp = spct?.sanPham || {};
    const size = spct?.kichCo?.tenKichCo;
    const mau = spct?.mauSac?.tenMau;

    const [soSao, setSoSao] = useState(5);
    const [noiDung, setNoiDung] = useState("");
    const [anh, setAnh] = useState([]);
    const [dangTai, setDangTai] = useState(false);
    const [dangGui, setDangGui] = useState(false);
    const [loi, setLoi] = useState("");
    const fileRef = useRef(null);

    // Nhấn Esc để đóng
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape" && !dangGui) onClose?.(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [dangGui, onClose]);

    const themGoiY = (text) =>
        setNoiDung((prev) => {
            if (prev.includes(text)) return prev;
            const next = prev.trim() ? `${prev.trim()}. ${text}` : text;
            return next.slice(0, TOI_DA_KY_TU);
        });

    const chonAnh = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (files.length === 0) return;

        const quaLon = files.find((f) => f.size > TOI_DA_MB * 1024 * 1024);
        if (quaLon) {
            setLoi(`Ảnh "${quaLon.name}" vượt quá ${TOI_DA_MB}MB, vui lòng chọn ảnh nhỏ hơn`);
            return;
        }

        const conLai = TOI_DA_ANH - anh.length;
        if (conLai <= 0) {
            setLoi(`Tối đa ${TOI_DA_ANH} ảnh`);
            return;
        }

        setDangTai(true);
        setLoi("");
        try {
            const urls = [];
            for (const file of files.slice(0, conLai)) {
                const form = new FormData();
                form.append("file", file);
                form.append("folder", "danh-gia");
                const res = await fetch(`${API}/upload`, { method: "POST", body: form });
                if (!res.ok) throw new Error(await docLoi(res, "Không tải ảnh lên được"));
                const json = await res.json();
                urls.push(json.url);
            }
            setAnh((prev) => [...prev, ...urls]);
        } catch (err) {
            setLoi(err.message);
        } finally {
            setDangTai(false);
        }
    };

    const gui = async () => {
        setDangGui(true);
        setLoi("");
        try {
            const res = await fetch(`${API}/danh-gia`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chiTietHoaDonId: item.id,
                    khachHangId,
                    soSao,
                    noiDung: noiDung.trim(),
                    hinhAnh: anh,
                }),
            });
            if (!res.ok) throw new Error(await docLoi(res, "Không gửi được đánh giá"));
            lamMoiThongKeDanhGia();
            await onSubmitted?.();
        } catch (err) {
            setLoi(err.message);
        } finally {
            setDangGui(false);
        }
    };

    return (
        <div className="rv-modal-backdrop" onClick={onClose}>
            <div className="rv-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="rv-modal-head">
                    <h3>Đánh giá sản phẩm</h3>
                    <button type="button" onClick={onClose} aria-label="Đóng">×</button>
                </div>

                <div className="rv-modal-product">
                    <div className="rv-modal-thumb">
                        {sp?.hinhAnh ? <img src={anhUrl(sp.hinhAnh)} alt={sp.tenSanPham || ""} /> : <span>👟</span>}
                    </div>
                    <div>
                        <strong>{sp?.tenSanPham || "Sản phẩm"}</strong>
                        <span>{[size && `Size ${size}`, mau && `Màu ${mau}`].filter(Boolean).join(" · ")}</span>
                        <small>Đơn {orderCode}</small>
                    </div>
                </div>

                <div className="rv-pick">
                    <span>Chất lượng sản phẩm</span>
                    <div className="rv-pick-stars">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button
                                type="button"
                                key={n}
                                className={n <= soSao ? "on" : ""}
                                onClick={() => setSoSao(n)}
                                aria-label={`${n} sao`}
                            >
                                ★
                            </button>
                        ))}
                        <em>{NHAN_SAO[soSao]}</em>
                    </div>
                </div>

                {soSao <= 2 && (
                    <p className="rv-hint">
                        Rất tiếc vì trải nghiệm chưa tốt. Hãy cho FShop biết lý do để chúng mình cải thiện nhé.
                    </p>
                )}

                <div className="rv-chips">
                    {GOI_Y.map((g) => (
                        <button type="button" key={g} onClick={() => themGoiY(g)}>+ {g}</button>
                    ))}
                </div>

                <textarea
                    className="rv-textarea"
                    rows={4}
                    maxLength={TOI_DA_KY_TU}
                    placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm: chất lượng, form giày, độ êm, đúng size hay không..."
                    value={noiDung}
                    onChange={(e) => setNoiDung(e.target.value)}
                />
                <div className="rv-count">{noiDung.length}/{TOI_DA_KY_TU}</div>

                <div className="rv-upload">
                    {anh.map((url) => (
                        <div className="rv-thumb" key={url}>
                            <img src={anhUrl(url)} alt="Ảnh đã tải" />
                            <button type="button" onClick={() => setAnh((prev) => prev.filter((u) => u !== url))} aria-label="Xóa ảnh">×</button>
                        </div>
                    ))}
                    {anh.length < TOI_DA_ANH && (
                        <button
                            type="button"
                            className="rv-add-photo"
                            onClick={() => fileRef.current?.click()}
                            disabled={dangTai}
                        >
                            {dangTai ? "Đang tải..." : `📷 Thêm ảnh (${anh.length}/${TOI_DA_ANH})`}
                        </button>
                    )}
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        multiple
                        hidden
                        onChange={chonAnh}
                    />
                </div>

                {loi && <div className="rv-error">{loi}</div>}

                <div className="rv-actions">
                    <button type="button" className="rv-btn-ghost" onClick={onClose} disabled={dangGui}>Để sau</button>
                    <button type="button" className="rv-btn-primary" onClick={gui} disabled={dangGui || dangTai}>
                        {dangGui ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                </div>
            </div>
        </div>
    );
}
