import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import "./EmployeeChat.css";

const API = "http://localhost:8080/api";
const POLL_LIST_MS = 4000;
const POLL_THREAD_MS = 3000;

const FILTERS = [
    {id: "all", label: "Tất cả"},
    {id: "unread", label: "Chưa đọc"},
    {id: "staff", label: "Cần nhân viên"},
];

const CANNED = [
    "Chào bạn, FShop có thể hỗ trợ gì cho bạn ạ?",
    "Bạn vui lòng cho mình xin mã đơn hàng để kiểm tra nhé.",
    "Sản phẩm này hiện còn hàng, bạn cho mình xin size và màu để tư vấn thêm nhé.",
    "Cảm ơn bạn đã liên hệ FShop. Chúc bạn một ngày vui vẻ!",
];

async function request(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }
    if (!res.ok) throw new Error(data?.message || "Không thể kết nối máy chủ");
    return data;
}

function timeLabel(value) {
    if (!value) return "";
    const d = new Date(value);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString("vi-VN", {hour: "2-digit", minute: "2-digit"});
    }
    return d.toLocaleDateString("vi-VN", {day: "2-digit", month: "2-digit"});
}

function fullTime(value) {
    return value
        ? new Date(value).toLocaleString("vi-VN", {hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit"})
        : "";
}

function initials(name) {
    const parts = String(name || "KH").trim().split(/\s+/);
    return (parts[parts.length - 1]?.[0] || "K").toUpperCase();
}

export default function EmployeeChat({nhanVienId, onUnreadChange}) {
    const [threads, setThreads] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [filter, setFilter] = useState("all");
    const [keyword, setKeyword] = useState("");
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const listRef = useRef(null);
    const sendingRef = useRef(false);

    const loadThreads = useCallback(async () => {
        try {
            const data = await request(`${API}/chat/hoi-thoai`);
            const list = Array.isArray(data) ? data : [];
            setThreads(list);
            onUnreadChange?.(list.reduce((sum, t) => sum + (t.chuaDoc || 0), 0));
            setError("");
        } catch (err) {
            setError(err.message || "Không tải được danh sách hội thoại.");
        } finally {
            setLoading(false);
        }
    }, [onUnreadChange]);

    const loadDetail = useCallback(async (id) => {
        if (!id) return;
        try {
            const data = await request(`${API}/chat/hoi-thoai/${id}?daXem=true`);
            if (!sendingRef.current) setDetail(data);
        } catch {
            /* giữ nguyên nội dung hiện có */
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadThreads();
        const timer = setInterval(loadThreads, POLL_LIST_MS);
        return () => clearInterval(timer);
    }, [loadThreads]);

    useEffect(() => {
        if (!selectedId) return undefined;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadDetail(selectedId);
        const timer = setInterval(() => loadDetail(selectedId), POLL_THREAD_MS);
        return () => clearInterval(timer);
    }, [selectedId, loadDetail]);

    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [detail?.tinNhan?.length, selectedId]);

    const filtered = useMemo(() => {
        const kw = keyword.trim().toLowerCase();
        return threads.filter((t) => {
            if (filter === "unread" && !t.chuaDoc) return false;
            if (filter === "staff" && t.cheDo !== "NHAN_VIEN") return false;
            if (!kw) return true;
            return (
                String(t.tenKhachHang || "").toLowerCase().includes(kw) ||
                String(t.soDienThoai || "").includes(kw) ||
                String(t.tinCuoi || "").toLowerCase().includes(kw)
            );
        });
    }, [threads, filter, keyword]);

    const chooseThread = (id) => {
        setSelectedId(id);
        setDetail(null);
        setInput("");
        setError("");
    };

    const reply = async (raw) => {
        const text = (raw ?? input).trim();
        if (!text || !selectedId || sending) return;

        setSending(true);
        sendingRef.current = true;
        setError("");
        try {
            const data = await request(`${API}/chat/hoi-thoai/${selectedId}/tra-loi`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({noiDung: text, nhanVienId: nhanVienId || null}),
            });
            setDetail(data);
            setInput("");
            loadThreads();
        } catch (err) {
            setError(err.message || "Gửi phản hồi thất bại.");
        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    };

    const setMode = async (mode) => {
        if (!selectedId) return;
        try {
            const data = await request(`${API}/chat/hoi-thoai/${selectedId}/che-do?cheDo=${mode}`, {method: "PUT"});
            setDetail(data);
            loadThreads();
        } catch (err) {
            setError(err.message || "Không thể đổi chế độ.");
        }
    };

    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            reply();
        }
    };

    const current = detail?.hoiThoai;

    return (
        <div className="ec-page">
            <div className="ec-heading">
                <div>
                    <span>FSHOP NHÂN VIÊN</span>
                    <h1>Phản hồi khách hàng</h1>
                    <p>Trả lời tin nhắn khách gửi từ khung chat trên website. Bot tự trả lời cho tới khi khách cần nhân viên.</p>
                </div>
            </div>

            {error && <div className="ec-error">{error}</div>}

            <div className="ec-shell">
                <aside className="ec-side">
                    <input
                        className="ec-search"
                        placeholder="Tìm theo tên, SĐT hoặc nội dung..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                    <div className="ec-filters">
                        {FILTERS.map((f) => (
                            <button
                                type="button"
                                key={f.id}
                                className={filter === f.id ? "active" : ""}
                                onClick={() => setFilter(f.id)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="ec-threads">
                        {loading && <div className="ec-empty">Đang tải...</div>}
                        {!loading && filtered.length === 0 && (
                            <div className="ec-empty">Chưa có hội thoại nào.</div>
                        )}
                        {filtered.map((t) => (
                            <button
                                type="button"
                                key={t.id}
                                className={`ec-thread ${selectedId === t.id ? "active" : ""} ${t.chuaDoc ? "unread" : ""}`}
                                onClick={() => chooseThread(t.id)}
                            >
                                <span className="ec-avatar">{initials(t.tenKhachHang)}</span>
                                <span className="ec-thread-main">
                                    <span className="ec-thread-top">
                                        <strong>{t.tenKhachHang}</strong>
                                        <small>{timeLabel(t.ngayCapNhat)}</small>
                                    </span>
                                    <span className="ec-thread-bottom">
                                        <em>{t.tinCuoi || "Chưa có tin nhắn"}</em>
                                        {t.chuaDoc > 0 && <b>{t.chuaDoc}</b>}
                                    </span>
                                    <span className={`ec-tag ${t.cheDo === "NHAN_VIEN" ? "staff" : "bot"}`}>
                                        {t.cheDo === "NHAN_VIEN" ? "Cần nhân viên" : "Bot đang trả lời"}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="ec-main">
                    {!selectedId ? (
                        <div className="ec-placeholder">
                            <div>💬</div>
                            <strong>Chọn một hội thoại để bắt đầu phản hồi</strong>
                            <span>Tin nhắn mới sẽ tự cập nhật sau vài giây.</span>
                        </div>
                    ) : !detail ? (
                        <div className="ec-placeholder"><span>Đang tải hội thoại...</span></div>
                    ) : (
                        <>
                            <header className="ec-main-head">
                                <span className="ec-avatar lg">{initials(current?.tenKhachHang)}</span>
                                <div>
                                    <strong>{current?.tenKhachHang}</strong>
                                    <small>
                                        {current?.soDienThoai || "Chưa có SĐT"} · Mã KH #{current?.khachHangId}
                                    </small>
                                </div>
                                <div className="ec-head-actions">
                                    <span className={`ec-tag ${current?.cheDo === "NHAN_VIEN" ? "staff" : "bot"}`}>
                                        {current?.cheDo === "NHAN_VIEN" ? "Nhân viên xử lý" : "Bot đang trả lời"}
                                    </span>
                                    {current?.cheDo === "NHAN_VIEN" ? (
                                        <button type="button" onClick={() => setMode("BOT")}>Trả về cho bot</button>
                                    ) : (
                                        <button type="button" onClick={() => setMode("NHAN_VIEN")}>Tiếp nhận hội thoại</button>
                                    )}
                                </div>
                            </header>

                            <div className="ec-messages" ref={listRef}>
                                {(detail.tinNhan || []).map((m) => {
                                    const mine = m.nguoiGui === "NHAN_VIEN";
                                    return (
                                        <div key={m.id} className={`ec-msg ${mine ? "mine" : ""} ${m.nguoiGui === "BOT" ? "bot" : ""}`}>
                                            <small className="ec-msg-who">
                                                {m.nguoiGui === "KHACH" ? current?.tenKhachHang : m.nguoiGui === "BOT" ? "Bot" : "Bạn"}
                                                {" · "}{fullTime(m.ngayGui)}
                                            </small>
                                            <div className="ec-bubble">{m.noiDung}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="ec-canned">
                                {CANNED.map((c) => (
                                    <button type="button" key={c} onClick={() => setInput(c)} title={c}>
                                        {c.length > 34 ? `${c.slice(0, 34)}…` : c}
                                    </button>
                                ))}
                            </div>

                            <div className="ec-compose">
                                <textarea
                                    rows={2}
                                    maxLength={1000}
                                    value={input}
                                    placeholder="Nhập phản hồi cho khách (Enter để gửi, Shift+Enter xuống dòng)"
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={onKeyDown}
                                />
                                <button type="button" onClick={() => reply()} disabled={!input.trim() || sending}>
                                    {sending ? "Đang gửi..." : "Gửi"}
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
