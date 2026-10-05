import { useState } from "react";
import "./Contact.css";

const CONTACT_INFO = [
    { icon: "☎", title: "Hotline", value: "0923456789", note: "Hỗ trợ 24/7" },
    { icon: "✉", title: "Email", value: "fbshop@fshop.vn", note: "Phản hồi trong 24h" },
    { icon: "⌖", title: "Địa chỉ cửa hàng", value: "Hà Nội, Việt Nam", note: "Ghé thăm cửa hàng FShop" },
    { icon: "◷", title: "Giờ làm việc", value: "08:00 - 22:00", note: "Tất cả các ngày trong tuần" },
];

const FAQS = [
    "Làm sao để kiểm tra đơn hàng?",
    "Tôi có thể đổi size giày không?",
    "Thời gian giao hàng bao lâu?",
    "Tôi có thể thanh toán bằng hình thức nào?",
    "Làm sao để sử dụng mã giảm giá?",
    "Tôi cần hỗ trợ thêm, liên hệ như thế nào?",
];

function Contact({ setPage }) {
    const [form, setForm] = useState({
        hoTen: "",
        email: "",
        soDienThoai: "",
        chuDe: "Hỏi về sản phẩm",
        noiDung: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        setSubmitted(false);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!form.hoTen.trim() || !form.email.trim() || !form.noiDung.trim()) return;
        setSubmitted(true);
        setForm((current) => ({ ...current, noiDung: "" }));
    };

    return (
        <main className="contact-page">
            <section className="contact-hero">
                <div className="contact-hero-overlay" />
                <div className="container contact-hero-content">
                    <div className="contact-breadcrumb">
                        <button type="button" onClick={() => setPage("home")}>Trang chủ</button>
                        <span>›</span>
                        <strong>Liên hệ</strong>
                    </div>
                    <span className="contact-kicker">FSHOP SUPPORT</span>
                    <h1>LIÊN HỆ FSHOP</h1>
                    <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn trong mọi thắc mắc về sản phẩm, đơn hàng và dịch vụ của FShop.</p>
                </div>
            </section>

            <section className="container contact-info-grid">
                {CONTACT_INFO.map((item) => (
                    <article className="contact-info-card" key={item.title}>
                        <span className="contact-info-icon">{item.icon}</span>
                        <div>
                            <small>{item.title}</small>
                            <strong>{item.value}</strong>
                            <span>{item.note}</span>
                        </div>
                    </article>
                ))}
            </section>

            <section className="container contact-main-grid">
                <form className="contact-form-card" onSubmit={handleSubmit}>
                    <div className="contact-section-heading">
                        <span>HỖ TRỢ KHÁCH HÀNG</span>
                        <h2>Gửi tin nhắn cho chúng tôi</h2>
                        <p>Vui lòng điền đầy đủ thông tin, chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
                    </div>

                    <div className="contact-form-grid">
                        <label>
                            Họ và tên <b>*</b>
                            <span className="contact-input-wrap">♙<input value={form.hoTen} onChange={(e) => updateField("hoTen", e.target.value)} placeholder="Nhập họ và tên của bạn" /></span>
                        </label>
                        <label>
                            Email <b>*</b>
                            <span className="contact-input-wrap">✉<input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="Nhập email của bạn" /></span>
                        </label>
                        <label>
                            Số điện thoại
                            <span className="contact-input-wrap">☎<input value={form.soDienThoai} onChange={(e) => updateField("soDienThoai", e.target.value)} placeholder="Nhập số điện thoại" /></span>
                        </label>
                        <label>
                            Chủ đề
                            <span className="contact-input-wrap">▤
                <select value={form.chuDe} onChange={(e) => updateField("chuDe", e.target.value)}>
                  <option>Hỏi về sản phẩm</option>
                  <option>Hỏi về đơn hàng</option>
                  <option>Đổi / trả hàng</option>
                  <option>Thanh toán</option>
                  <option>Góp ý</option>
                  <option>Khác</option>
                </select>
              </span>
                        </label>
                    </div>

                    <label className="contact-message-label">
                        Nội dung <b>*</b>
                        <span className="contact-input-wrap contact-textarea-wrap">✎<textarea value={form.noiDung} onChange={(e) => updateField("noiDung", e.target.value)} placeholder="Nhập nội dung cần hỗ trợ..." rows={6} /></span>
                    </label>

                    <button className="contact-submit" type="submit">➤&nbsp; Gửi liên hệ</button>
                    {submitted && <div className="contact-success">✓ Đã nhận thông tin. FShop sẽ liên hệ với bạn sớm nhất.</div>}
                </form>

                <aside className="contact-store-card">
                    <div className="contact-section-heading">
                        <span>THÔNG TIN CỬA HÀNG</span>
                        <h2>FShop Store</h2>
                        <p>Thông tin liên hệ và địa điểm cửa hàng</p>
                    </div>

                    <div className="contact-store-list">
                        <div><i>⌖</i><span><b>Địa chỉ</b><small>Hà Nội, Việt Nam</small></span></div>
                        <div><i>☎</i><span><b>Hotline</b><small>0123 456 789</small></span></div>
                        <div><i>✉</i><span><b>Email</b><small>support@fshop.vn</small></span></div>
                        <div><i>◷</i><span><b>Thời gian làm việc</b><small>08:00 - 22:00 (Tất cả các ngày trong tuần)</small></span></div>
                    </div>

                    <div className="contact-map">
                        <iframe title="Bản đồ FShop" src="https://www.google.com/maps?q=H%C3%A0%20N%E1%BB%99i%2C%20Vi%E1%BB%87t%20Nam&output=embed" loading="lazy" />
                    </div>
                </aside>
            </section>

            <section className="contact-faq-section">
                <div className="container">
                    <div className="contact-faq-heading">
                        <span>CÂU HỎI THƯỜNG GẶP</span>
                        <h2>Giải đáp nhanh những điều khách hàng quan tâm</h2>
                    </div>
                    <div className="contact-faq-grid">
                        {FAQS.map((question, index) => (
                            <button
                                type="button"
                                className={`contact-faq-item ${openFaq === index ? "open" : ""}`}
                                key={question}
                                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                            >
                                <span><b>{["▣", "↶", "▱", "▤", "%", "☏"][index]}</b>{question}</span>
                                <strong>⌄</strong>
                                {openFaq === index && (
                                    <small>
                                        Bạn có thể liên hệ FShop qua hotline hoặc gửi biểu mẫu ở phía trên. Đội ngũ hỗ trợ sẽ tiếp nhận và phản hồi sớm nhất.
                                    </small>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Contact;
