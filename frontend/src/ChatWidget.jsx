import {useCallback, useEffect, useRef, useState} from "react";
import "./ChatWidget.css";

const API = "http://localhost:8080/api";
const POLL_OPEN_MS = 3000;
const POLL_CLOSED_MS = 10000;

const QUICK_REPLIES = [
    "Phí vận chuyển",
    "Chính sách đổi trả",
    "Khuyến mãi",
    "Gặp nhân viên",
];

const GUEST_GREETING = {
    id: "guest-hello",
    nguoiGui: "BOT",
    noiDung:
        "Xin chào! Mình là trợ lý ảo của FShop 👟\n" +
        "Bạn có thể hỏi về giá sản phẩm, vận chuyển, đổi trả, size...\n" +
        "Đăng nhập để nhắn tin trực tiếp với nhân viên nhé!",
    ngayGui: new Date().toISOString(),
};

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

function formatTime(value) {
    if (!value) return "";
    return new Date(value).toLocaleTimeString("vi-VN", {hour: "2-digit", minute: "2-digit"});
}

function MessengerIcon({size = 30}) {
    return (
        <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
            <path
                fill="currentColor"
                d="M18 3C9.4 3 3 9.3 3 17.2c0 4.4 2 8.3 5.2 10.9V33l4.8-2.6c1.6.4 3.3.7 5 .7 8.6 0 15-6.3 15-14.2S26.6 3 18 3z"
            />
            <path
                fill="var(--fchat-bubble-bg, #ed1c24)"
                d="M7.8 21.6l5.3-8.4c.8-1.2 2.5-1.5 3.7-.6l4.2 3.1c.4.3.9.3 1.3 0l5.7-4.3c.8-.6 1.8.4 1.2 1.2l-5.3 8.4c-.8 1.2-2.5 1.5-3.7.6l-4.2-3.1c-.4-.3-.9-.3-1.3 0l-5.7 4.3c-.8.6-1.8-.4-1.2-1.2z"
            />
        </svg>
    );
}

export default function ChatWidget({taiKhoan, setPage}) {
    const khachHangId = taiKhoan?.khachHangId || null;
    const isLoggedIn = Boolean(khachHangId);

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [cheDo, setCheDo] = useState("BOT");
    const [unread, setUnread] = useState(0);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [guestMessages, setGuestMessages] = useState([GUEST_GREETING]);

    const listRef = useRef(null);
    const inputRef = useRef(null);
    const sendingRef = useRef(false);

    const shown = isLoggedIn ? messages : guestMessages;

    /* ---------- đồng bộ hội thoại (khách đã đăng nhập) ---------- */
    const sync = useCallback(
        async (markRead) => {
            if (!khachHangId) return;
            try {
                const data = await request(
                    `${API}/chat/khach-hang/${khachHangId}?daXem=${markRead ? "true" : "false"}`
                );
                if (sendingRef.current) return; // đang gửi: bỏ qua lượt poll cũ
                setMessages(Array.isArray(data?.tinNhan) ? data.tinNhan : []);
                setCheDo(data?.cheDo || "BOT");
                setUnread(markRead ? 0 : data?.chuaDoc || 0);
                setError("");
            } catch {
                /* mất kết nối tạm thời: giữ nguyên nội dung hiện có */
            }
        },
        [khachHangId]
    );

    useEffect(() => {
        if (!isLoggedIn) return undefined;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        sync(open);
        const timer = setInterval(() => sync(open), open ? POLL_OPEN_MS : POLL_CLOSED_MS);
        return () => clearInterval(timer);
    }, [isLoggedIn, open, sync]);

    /* ---------- tự cuộn xuống cuối ---------- */
    useEffect(() => {
        if (open && listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [shown.length, open, sending]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    /* ---------- gửi tin ---------- */
    const send = async (raw) => {
        const text = (raw ?? input).trim();
        if (!text || sending) return;

        setInput("");
        setError("");
        setSending(true);
        sendingRef.current = true;

        try {
            if (isLoggedIn) {
                // hiện tin của khách ngay, không chờ server
                setMessages((old) => [
                    ...old,
                    {id: `tmp-${Date.now()}`, nguoiGui: "KHACH", noiDung: text, ngayGui: new Date().toISOString()},
                ]);
                const data = await request(`${API}/chat/khach-hang/${khachHangId}/gui`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({noiDung: text}),
                });
                setMessages(Array.isArray(data?.tinNhan) ? data.tinNhan : []);
                setCheDo(data?.cheDo || "BOT");
            } else {
                setGuestMessages((old) => [
                    ...old,
                    {id: `g-${Date.now()}`, nguoiGui: "KHACH", noiDung: text, ngayGui: new Date().toISOString()},
                ]);
                const data = await request(`${API}/chat/bot`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({noiDung: text}),
                });
                let reply = data?.traLoi || "Xin lỗi, mình chưa trả lời được.";
                let needLogin = false;
                if (reply.includes("chuyển cuộc trò chuyện cho nhân viên")) {
                    reply = "Để nhắn tin trực tiếp với nhân viên FShop, bạn vui lòng đăng nhập trước nhé 🙏";
                    needLogin = true;
                }
                setGuestMessages((old) => [
                    ...old,
                    {id: `gb-${Date.now()}`, nguoiGui: "BOT", noiDung: reply, ngayGui: new Date().toISOString(), needLogin},
                ]);
            }
        } catch (err) {
            setError(err.message || "Gửi tin nhắn thất bại, vui lòng thử lại.");
            if (isLoggedIn) await sync(true);
        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    };

    const switchMode = async (mode) => {
        if (!isLoggedIn || sending) return;
        try {
            const data = await request(
                `${API}/chat/khach-hang/${khachHangId}/che-do?cheDo=${mode}`,
                {method: "PUT"}
            );
            setMessages(Array.isArray(data?.tinNhan) ? data.tinNhan : []);
            setCheDo(data?.cheDo || mode);
        } catch (err) {
            setError(err.message || "Không thể đổi chế độ.");
        }
    };

    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const withStaff = isLoggedIn && cheDo === "NHAN_VIEN";

    return (
        <div className="fchat-root">
            {open && (
                <section className="fchat-panel" role="dialog" aria-label="Chat với FShop">
                    <header className="fchat-head">
                        <div className="fchat-head-avatar">{withStaff ? "NV" : "🤖"}</div>
                        <div className="fchat-head-info">
                            <strong>{withStaff ? "Nhân viên FShop" : "Trợ lý ảo FShop"}</strong>
                            <span>
                                <i className={withStaff ? "dot wait" : "dot"}/>
                                {withStaff ? "Đang chờ nhân viên phản hồi" : "Trả lời tự động 24/7"}
                            </span>
                        </div>
                        <button type="button" className="fchat-close" onClick={() => setOpen(false)} aria-label="Đóng">
                            ✕
                        </button>
                    </header>

                    <div className="fchat-list" ref={listRef}>
                        {shown.map((m) => {
                            const mine = m.nguoiGui === "KHACH";
                            return (
                                <div key={m.id} className={`fchat-row ${mine ? "mine" : ""}`}>
                                    {!mine && (
                                        <span className={`fchat-avatar ${m.nguoiGui === "NHAN_VIEN" ? "staff" : ""}`}>
                                            {m.nguoiGui === "NHAN_VIEN" ? "NV" : "🤖"}
                                        </span>
                                    )}
                                    <div className="fchat-msg">
                                        {!mine && (
                                            <small className="fchat-sender">
                                                {m.nguoiGui === "NHAN_VIEN" ? "Nhân viên" : "Bot FShop"}
                                            </small>
                                        )}
                                        <div className="fchat-bubble">{m.noiDung}</div>
                                        {m.needLogin && (
                                            <button
                                                type="button"
                                                className="fchat-login"
                                                onClick={() => {
                                                    setOpen(false);
                                                    setPage?.("login");
                                                }}
                                            >
                                                Đăng nhập ngay
                                            </button>
                                        )}
                                        <small className="fchat-time">{formatTime(m.ngayGui)}</small>
                                    </div>
                                </div>
                            );
                        })}

                        {sending && (
                            <div className="fchat-row">
                                <span className="fchat-avatar">🤖</span>
                                <div className="fchat-bubble fchat-typing"><i/><i/><i/></div>
                            </div>
                        )}
                    </div>

                    {!withStaff && (
                        <div className="fchat-quick">
                            {QUICK_REPLIES.map((q) => (
                                <button type="button" key={q} onClick={() => send(q)} disabled={sending}>
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {withStaff && (
                        <div className="fchat-mode">
                            <span>Bạn đang trò chuyện với nhân viên.</span>
                            <button type="button" onClick={() => switchMode("BOT")}>Quay lại chat với bot</button>
                        </div>
                    )}

                    {error && <div className="fchat-error">{error}</div>}

                    <div className="fchat-input">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            maxLength={1000}
                            value={input}
                            placeholder="Nhập tin nhắn..."
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={onKeyDown}
                        />
                        <button type="button" onClick={() => send()} disabled={!input.trim() || sending} aria-label="Gửi">
                            ➤
                        </button>
                    </div>
                </section>
            )}

            <button
                type="button"
                className={`fchat-fab ${open ? "open" : ""}`}
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Đóng chat" : "Mở chat với FShop"}
                title="Nhắn tin với FShop"
            >
                {open ? <span className="fchat-fab-x">✕</span> : <MessengerIcon/>}
                {!open && unread > 0 && <span className="fchat-badge">{unread > 9 ? "9+" : unread}</span>}
            </button>
        </div>
    );
}
