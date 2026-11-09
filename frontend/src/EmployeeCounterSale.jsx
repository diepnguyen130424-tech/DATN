import {memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState} from "react";
import "./EmployeeCounterSale.css";

const API = "http://localhost:8080/api";

const BANK_CONFIG = {
    bankId: "MB",
    accountNo: "0867596002",
    accountName: "FBShop",
    template: "compact2",
};

const SHOP_CONFIG = {
    ten: "FSHOP",
    diaChi: "123 Đường ABC, Quận 1, TP.HCM",
    dienThoai: "1900 1234",
    website: "fshop.vn",
};

function formatMoney(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function parseMoneyInput(value) {
    return Number(String(value || "").replace(/[^\d]/g, "")) || 0;
}

function formatMoneyInput(value) {
    const n = parseMoneyInput(value);
    return n ? n.toLocaleString("vi-VN") : "";
}

function formatDateTime(value) {
    if (!value) return "-";
    const d = new Date(value);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

async function readJson(url, options) {
    const response = await fetch(url, options);
    const text = await response.text();
    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.message || data?.error || text || "Không thể kết nối máy chủ");
    }

    return data;
}

function PageHeading({eyebrow = "FSHOP NHÂN VIÊN", title, description, action}) {
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

function buildVietQrUrl(amount, content) {
    const base = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png`;
    const params = new URLSearchParams({
        amount: String(amount),
        addInfo: content,
        accountName: BANK_CONFIG.accountName,
    });
    return `${base}?${params.toString()}`;
}

function methodLabel(method) {
    if (method === "TIEN_MAT") return "Tiền mặt";
    if (method === "CHUYEN_KHOAN") return "Chuyển khoản";
    return method;
}

function InvoiceModal({invoice, onClose}) {
    if (!invoice) return null;

    // In riêng hóa đơn bằng iframe để không bị CSS in của AdminDashboard.css
    // (khổ giấy POS 80mm và visibility:hidden !important) làm trắng trang.
    const handlePrint = () => {
        const source = document.getElementById("invoice-print-area");
        if (!source) {
            window.alert("Không tìm thấy nội dung hóa đơn để in.");
            return;
        }

        const iframe = document.createElement("iframe");
        iframe.setAttribute("title", "In hóa đơn nhân viên");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        iframe.style.visibility = "hidden";
        document.body.appendChild(iframe);

        const printDocument = iframe.contentDocument;
        const printWindow = iframe.contentWindow;
        if (!printDocument || !printWindow) {
            iframe.remove();
            window.alert("Trình duyệt không hỗ trợ cửa sổ in hóa đơn.");
            return;
        }

        // Sao chép HTML và toàn bộ style đang hiển thị của từng phần tử,
        // không đưa các CSS @media print toàn cục của trang chính vào iframe.
        const copyWithComputedStyles = (node) => {
            // Giữ nguyên cả text node (tên sản phẩm, giá tiền, tiêu đề...).
            if (node.nodeType === Node.TEXT_NODE) return node.cloneNode(true);
            if (node.nodeType !== Node.ELEMENT_NODE) return node.cloneNode(false);

            const clone = node.cloneNode(false);
            const computed = window.getComputedStyle(node);
            for (let i = 0; i < computed.length; i += 1) {
                const property = computed[i];
                clone.style.setProperty(
                    property,
                    computed.getPropertyValue(property),
                    computed.getPropertyPriority(property)
                );
            }
            Array.from(node.childNodes).forEach((child) => {
                clone.appendChild(copyWithComputedStyles(child));
            });
            return clone;
        };

        const invoiceClone = copyWithComputedStyles(source);
        // Ép hóa đơn về đúng khổ cuộn 75mm của máy in tem/nhiệt.
        // Bản sao computed style từ màn hình modal có chiều rộng lớn (720px),
        // nên cần ghi đè để không bị cắt mất cột bên phải.
        invoiceClone.style.setProperty("width", "100%", "important");
        invoiceClone.style.setProperty("max-width", "100%", "important");
        invoiceClone.style.setProperty("min-width", "0", "important");
        invoiceClone.style.setProperty("box-sizing", "border-box", "important");
        invoiceClone.style.setProperty("padding", "2mm", "important");
        printDocument.open();
        printDocument.write(`<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Hóa đơn bán hàng</title>
<style>
    /* Khổ giấy cuộn 75mm: chừa lề 2mm mỗi bên, không dùng khổ A4 */
    @page { size: 75mm 200mm; margin: 2mm; }
    html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        min-width: 0 !important;
        background: #fff;
        overflow: visible !important;
    }
    body {
        color: #111;
        font-family: "Segoe UI", Tahoma, Arial, sans-serif;
        font-size: 10px;
    }
    #invoice-print-area {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        padding: 2mm !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        overflow: visible !important;
    }
    /* Header xếp dọc, tránh tràn chiều ngang trên giấy cuộn */
    .invoice-header {
        display: flex !important;
        flex-direction: column !important;
        gap: 6px !important;
        padding-bottom: 8px !important;
        margin-bottom: 8px !important;
    }
    .invoice-logo { gap: 7px !important; }
    .invoice-logo-mark {
        width: 32px !important;
        height: 32px !important;
        font-size: 18px !important;
    }
    .invoice-logo h1 { font-size: 16px !important; }
    .invoice-logo p { font-size: 9px !important; overflow-wrap: anywhere; }
    .invoice-title { width: 100% !important; text-align: left !important; }
    .invoice-title h2 { font-size: 13px !important; }
    .invoice-title span { font-size: 10px !important; }
    .invoice-meta {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 5px !important;
        padding: 7px 0 !important;
        margin-bottom: 8px !important;
    }
    .invoice-meta > div {
        display: flex !important;
        justify-content: space-between !important;
        gap: 5px !important;
        font-size: 9px !important;
        min-width: 0 !important;
    }
    .invoice-meta strong { overflow-wrap: anywhere; }
    .invoice-table {
        width: 100% !important;
        max-width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        margin-bottom: 8px !important;
    }
    .invoice-table th,
    .invoice-table td {
        padding: 5px 2px !important;
        font-size: 8px !important;
        overflow-wrap: anywhere !important;
        word-break: normal !important;
    }
    .invoice-table th { letter-spacing: 0 !important; }
    .invoice-table th:nth-child(1),
    .invoice-table td:nth-child(1) { width: 7% !important; }
    .invoice-table th:nth-child(2),
    .invoice-table td:nth-child(2) { width: 39% !important; }
    .invoice-table th:nth-child(3),
    .invoice-table td:nth-child(3) { width: 9% !important; text-align: center !important; }
    .invoice-table th:nth-child(4),
    .invoice-table td:nth-child(4) { width: 21% !important; }
    .invoice-table th:nth-child(5),
    .invoice-table td:nth-child(5) { width: 24% !important; }
    .invoice-table td small { font-size: 7px !important; }
    .invoice-total {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 0 10px auto !important;
    }
    .invoice-total > div { font-size: 9px !important; padding: 4px 0 !important; }
    .invoice-total-final span { font-size: 9px !important; }
    .invoice-total-final strong { font-size: 12px !important; }
    .invoice-footer { padding-top: 8px !important; }
    .invoice-footer p { font-size: 8px !important; overflow-wrap: anywhere; }
    .invoice-footer strong { font-size: 10px !important; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
</style>
</head>
<body></body>
</html>`);
        printDocument.body.appendChild(invoiceClone);
        printDocument.close();

        const cleanup = () => {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        };
        printWindow.addEventListener("afterprint", cleanup, { once: true });

        // Đợi iframe dựng xong nội dung rồi mới mở hộp thoại in.
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                printWindow.focus();
                printWindow.print();
                // Một số trình duyệt không phát afterprint khi hộp thoại bị hủy.
                window.setTimeout(cleanup, 60000);
            });
        });
    };
    const subtotal = invoice.chiTiet.reduce((s, i) => s + Number(i.thanhTien || 0), 0);

    return (
        <div className="invoice-modal-backdrop">
            <div className="invoice-modal">
                <div className="invoice-print-area" id="invoice-print-area">
                    <div className="invoice-header">
                        <div className="invoice-logo">
                            <div className="invoice-logo-mark">F</div>
                            <div>
                                <h1>{SHOP_CONFIG.ten}</h1>
                                <p>{SHOP_CONFIG.diaChi}</p>
                                <p>ĐT: {SHOP_CONFIG.dienThoai} · {SHOP_CONFIG.website}</p>
                            </div>
                        </div>
                        <div className="invoice-title">
                            <h2>HÓA ĐƠN BÁN HÀNG</h2>
                            <span>#{invoice.maHoaDon}</span>
                        </div>
                    </div>

                    <div className="invoice-meta">
                        <div><span>Ngày lập</span><strong>{formatDateTime(invoice.ngayLap)}</strong></div>
                        <div><span>Phương thức</span><strong>{methodLabel(invoice.phuongThucThanhToan)}</strong></div>
                        <div><span>Thu ngân</span><strong>{invoice.nhanVien || "Nhân viên"}</strong></div>
                        {invoice.maKhachHang && (
                            <div><span>ID khách hàng</span><strong>#{invoice.maKhachHang}</strong></div>
                        )}
                        {invoice.tenKhach && (
                            <div><span>Khách hàng</span><strong>{invoice.tenKhach}</strong></div>
                        )}
                        {invoice.soDienThoaiKhach && (
                            <div><span>SĐT khách</span><strong>{invoice.soDienThoaiKhach}</strong></div>
                        )}
                        <div><span>Trạng thái</span><strong className="invoice-paid">✓ Đã thanh toán</strong></div>
                    </div>

                    <table className="invoice-table">
                        <thead>
                        <tr>
                            <th style={{width: "40px"}}>#</th>
                            <th>Sản phẩm</th>
                            <th style={{width: "70px"}}>SL</th>
                            <th style={{width: "110px"}}>Đơn giá</th>
                            <th style={{width: "120px"}}>Thành tiền</th>
                        </tr>
                        </thead>
                        <tbody>
                        {invoice.chiTiet.map((item, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>
                                    <strong>{item.tenSanPham}</strong>
                                    <small>
                                        {item.maSanPham || ""}
                                        {item.kichCo ? ` · Size ${item.kichCo}` : ""}
                                        {item.mauSac ? ` · ${item.mauSac}` : ""}
                                    </small>
                                </td>
                                <td style={{textAlign: "center"}}>{item.soLuong}</td>
                                <td style={{textAlign: "right"}}>{formatMoney(item.donGia)}</td>
                                <td style={{textAlign: "right"}}><strong>{formatMoney(item.thanhTien)}</strong></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <div className="invoice-total">
                        <div><span>Tạm tính</span><strong>{formatMoney(subtotal)}</strong></div>
                        <div><span>Giảm giá</span><strong>0đ</strong></div>
                        <div className="invoice-total-final">
                            <span>TỔNG THANH TOÁN</span>
                            <strong>{formatMoney(invoice.tongThanhToan)}</strong>
                        </div>
                    </div>

                    <div className="invoice-footer">
                        <p><strong>Cảm ơn quý khách đã mua hàng!</strong></p>
                        <p>Hóa đơn chỉ có giá trị trong ngày. Vui lòng giữ hóa đơn để đổi trả trong vòng 7 ngày.</p>
                    </div>
                </div>

                <div className="invoice-modal-footer no-print">
                    <button type="button" className="invoice-btn-close" onClick={onClose}>Đóng</button>
                    <button type="button" className="invoice-btn-print" onClick={handlePrint}>🖨 In hóa đơn</button>
                </div>
            </div>
        </div>
    );
}

function PaymentModal({open, onClose, method, total, onConfirm, loading}) {
    const [cashReceived, setCashReceived] = useState("");
    const [note, setNote] = useState("");
    const [paidConfirmed, setPaidConfirmed] = useState(false);
    const [payCode, setPayCode] = useState("");

    useEffect(() => {
        if (open) {
            setCashReceived("");
            setNote("");
            setPaidConfirmed(false);
            setPayCode(`POS${Date.now().toString().slice(-6)}`);
        }
    }, [open, method]);

    const received = parseMoneyInput(cashReceived);
    const change = received - total;
    const isCashEnough = received >= total;
    const transferContent = `${note.trim() || "Thanh toan don hang"} ${payCode}`;

    const qrUrl = useMemo(
        () => buildVietQrUrl(total, transferContent),
        [total, transferContent]
    );

    const quickCash = useMemo(() => {
        const set = new Set();
        [50000, 100000, 200000, 500000].forEach((step) =>
            set.add(Math.ceil(total / step) * step)
        );
        return [...set].filter((v) => v > total).slice(0, 4);
    }, [total]);

    const canConfirm = method === "TIEN_MAT" ? isCashEnough : paidConfirmed;

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape" && !loading) onClose();
            if (e.key === "Enter" && canConfirm && !loading) {
                e.preventDefault();
                onConfirm({method, total});
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, canConfirm, loading, method, total, onClose, onConfirm]);

    if (!open) return null;

    return (
        <div className="pos-pay-backdrop" onClick={onClose}>
            <div className="pos-pay-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pos-pay-modal-head">
                    <div>
                        <span className="employee-eyebrow">XÁC NHẬN THANH TOÁN</span>
                        <h2>{method === "TIEN_MAT" ? "💵 Tiền mặt" : "🏦 Chuyển khoản ngân hàng"}</h2>
                    </div>
                    <button type="button" className="pos-pay-close" onClick={onClose}>×</button>
                </div>

                <div className="pos-pay-amount">
                    <span>Số tiền cần thanh toán</span>
                    <strong>{formatMoney(total)}</strong>
                </div>

                {method === "TIEN_MAT" && (
                    <div className="pos-pay-body">
                        <label className="pos-pay-label">Tiền khách đưa</label>
                        <div className="pos-pay-cash-input">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(formatMoneyInput(e.target.value))}
                                placeholder="Nhập số tiền khách đưa"
                                autoFocus
                            />
                            <span>đ</span>
                        </div>
                        <div className="pos-quick-cash">
                            {quickCash.map((amt) => (
                                <button key={amt} type="button" onClick={() => setCashReceived(formatMoneyInput(String(amt)))}>
                                    {formatMoney(amt)}
                                </button>
                            ))}
                            <button type="button" className="exact" onClick={() => setCashReceived(formatMoneyInput(String(total)))}>
                                Đủ tiền
                            </button>
                        </div>
                        <div className={`pos-change ${isCashEnough ? "ok" : "warn"}`}>
                            <span>Tiền thừa trả khách</span>
                            <strong>
                                {isCashEnough ? formatMoney(change) : received > 0 ? `Còn thiếu ${formatMoney(total - received)}` : "—"}
                            </strong>
                        </div>
                    </div>
                )}

                {method === "CHUYEN_KHOAN" && (
                    <div className="pos-pay-body pos-pay-qr-body">
                        <div className="pos-qr-wrapper">
                            <img src={qrUrl} alt="QR thanh toán" className="pos-qr-image" />
                            <span className="pos-qr-badge">VietQR</span>
                        </div>
                        <div className="pos-bank-info">
                            <div><span>Ngân hàng</span><strong>MB Bank</strong></div>
                            <div><span>Số tài khoản</span><strong>{BANK_CONFIG.accountNo}</strong></div>
                            <div><span>Chủ tài khoản</span><strong>{BANK_CONFIG.accountName}</strong></div>
                            <div><span>Số tiền</span><strong className="highlight">{formatMoney(total)}</strong></div>
                            <div><span>Nội dung CK</span><strong className="content">{transferContent}</strong></div>
                        </div>
                        <input
                            type="text"
                            className="pos-pay-note-input"
                            placeholder="Ghi chú (tuỳ chọn)"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                        <label className="pos-paid-checkbox">
                            <input type="checkbox" checked={paidConfirmed} onChange={(e) => setPaidConfirmed(e.target.checked)} />
                            <span>Tôi đã xác nhận khách đã chuyển khoản thành công</span>
                        </label>
                    </div>
                )}

                <div className="pos-pay-modal-footer">
                    <button type="button" className="pos-btn-cancel" onClick={onClose} disabled={loading}>Hủy</button>
                    <button type="button" className="pos-btn-confirm" disabled={!canConfirm || loading} onClick={() => onConfirm({method, total})}>
                        {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function VariantPickerModal({open, product, variants, onClose, onConfirm}) {
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);

    const colors = useMemo(() => {
        const order = ["Đen", "Trắng"];
        const unique = [...new Set(variants.map(v => v.mauSac?.tenMau).filter(Boolean))];
        return unique.sort((a, b) => {
            const ia = order.indexOf(a);
            const ib = order.indexOf(b);
            if (ia === -1 && ib === -1) return a.localeCompare(b);
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
        });
    }, [variants]);

    const sizes = useMemo(() => {
        if (!selectedColor) return [];
        return variants
            .filter(v => v.mauSac?.tenMau === selectedColor)
            .map(v => ({
                size: v.kichCo?.tenKichCo,
                stock: Number(v.soLuongTon || 0),
                variant: v,
            }))
            .sort((a, b) => {
                const na = Number(a.size);
                const nb = Number(b.size);
                if (!isNaN(na) && !isNaN(nb)) return na - nb;
                return String(a.size).localeCompare(String(b.size));
            });
    }, [variants, selectedColor]);

    const currentVariant = useMemo(() => {
        return variants.find(
            v => v.mauSac?.tenMau === selectedColor && v.kichCo?.tenKichCo === selectedSize
        );
    }, [variants, selectedColor, selectedSize]);

    useEffect(() => {
        if (!open || !variants.length) {
            setSelectedColor(null);
            setSelectedSize(null);
            return;
        }
        const firstColor = colors.find(c =>
            variants.some(v => v.mauSac?.tenMau === c && Number(v.soLuongTon) > 0)
        ) || colors[0];

        const firstSize = variants
                .filter(v => v.mauSac?.tenMau === firstColor)
                .find(v => Number(v.soLuongTon) > 0)?.kichCo?.tenKichCo
            || variants.find(v => v.mauSac?.tenMau === firstColor)?.kichCo?.tenKichCo
            || null;

        setSelectedColor(firstColor);
        setSelectedSize(firstSize);
    }, [open, variants, colors]);

    const handleSelectColor = (color) => {
        setSelectedColor(color);
        const firstSize = variants
                .filter(v => v.mauSac?.tenMau === color)
                .find(v => Number(v.soLuongTon) > 0)?.kichCo?.tenKichCo
            || variants.find(v => v.mauSac?.tenMau === color)?.kichCo?.tenKichCo
            || null;
        setSelectedSize(firstSize);
    };

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter" && currentVariant && Number(currentVariant.soLuongTon || 0) > 0) {
                e.preventDefault();
                onConfirm(currentVariant);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, currentVariant, onClose, onConfirm]);

    if (!open || !product) return null;

    const handleConfirm = () => {
        if (!currentVariant) return;
        if (Number(currentVariant.soLuongTon || 0) <= 0) {
            alert("Biến thể này đã hết hàng, vui lòng chọn size/màu khác.");
            return;
        }
        onConfirm(currentVariant);
    };

    return (
        <div className="variant-modal-backdrop" onClick={onClose}>
            <div className="variant-modal" onClick={(e) => e.stopPropagation()}>
                <div className="variant-modal-header">
                    <img
                        src={product.hinhAnh || "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=300&q=80"}
                        alt={product.tenSanPham}
                    />
                    <div>
                        <h3>{product.tenSanPham}</h3>
                        <p>Đang chọn: {selectedSize || "—"} · {selectedColor || "—"}</p>
                    </div>
                    <button type="button" className="variant-modal-close" onClick={onClose}>×</button>
                </div>

                <div className="variant-section">
                    <h4>MÀU SẮC</h4>
                    <div className="variant-options">
                        {colors.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={`variant-option ${selectedColor === color ? "active" : ""}`}
                                onClick={() => handleSelectColor(color)}
                            >
                                {color}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="variant-section">
                    <h4>KÍCH THƯỚC</h4>
                    <div className="variant-options">
                        {sizes.map(({size, stock}) => (
                            <button
                                key={size}
                                type="button"
                                disabled={stock <= 0}
                                className={`variant-option ${selectedSize === size ? "active" : ""} ${stock <= 0 ? "disabled" : ""}`}
                                onClick={() => stock > 0 && setSelectedSize(size)}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="variant-info">
                    <span>Còn lại: <b>{currentVariant ? currentVariant.soLuongTon : 0}</b> sản phẩm</span>
                    <span>Giá: <b>{formatMoney(currentVariant?.giaBan || 0)}</b></span>
                </div>

                <button
                    type="button"
                    className="variant-btn-confirm"
                    disabled={!currentVariant || Number(currentVariant.soLuongTon) <= 0}
                    onClick={handleConfirm}
                >
                    Thêm vào giỏ hàng
                </button>
            </div>
        </div>
    );
}

const STORAGE_KEY = "fshop_pos_orders_v1";
const MAX_TABS = 5;
const PAGE_SIZE = 40;
const FALLBACK_IMG = "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80";

const isSellable = (v) =>
    Number(v?.soLuongTon || 0) > 0 &&
    ["HOAT_DONG", "ACTIVE"].includes(String(v?.trangThai || "").toUpperCase());

const isProductInactive = (product) => {
    const status = String(product?.trangThai || "").trim().toUpperCase();

    return [
        "NGUNG_HOAT_DONG",
        "NGUNG_KINH_DOANH",
        "NGUNG_BAN",
        "INACTIVE",
        "DISABLED"
    ].includes(status);
};
function createOrder(id) {
    return {id, cart: [], method: "TIEN_MAT", tenKhach: "", soDienThoaiKhach: ""};
}

function loadSavedOrders() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.orders?.length) return null;
        return parsed;
    } catch {
        return null;
    }
}

async function fetchAllVariants(products) {
    try {
        const all = await readJson(`${API}/san-pham-chi-tiet`);
        if (Array.isArray(all)) {
            const map = {};
            products.forEach((p) => (map[p.id] = []));
            all.forEach((v) => {
                const pid = v.sanPham?.id;
                if (pid != null && map[pid]) map[pid].push(v);
            });
            return map;
        }
    } catch {
        /* fallback */
    }

    const entries = await Promise.all(
        products.map(async (p) => {
            try {
                const data = await readJson(`${API}/san-pham/${p.id}/chi-tiet`);
                return [p.id, Array.isArray(data) ? data : []];
            } catch {
                return [p.id, []];
            }
        })
    );
    return Object.fromEntries(entries);
}

const ProductCard = memo(function ProductCard({product, stats, onSelect}) {
    const {loaded, minPrice, stock} = stats;
    const inactive = isProductInactive(product);
    const out = loaded && stock <= 0;
    const low = loaded && stock > 0 && stock <= 5;
    const price = minPrice > 0 ? minPrice : Number(product.giaBan || 0);

    return (
        <button
            type="button"
            className={`pos-product-card ${out ? "sold-out" : ""} ${inactive ? "not-for-sale" : ""}`}
            disabled={inactive}
            onClick={() => !inactive && onSelect(product)}
        >
            <div className="pos-product-image">
                <img
                    src={product.hinhAnh || FALLBACK_IMG}
                    alt={product.tenSanPham}
                    loading="lazy"
                    decoding="async"
                />

                {inactive && (
                    <span className="pos-product-status">
                        Ngừng kinh doanh
                    </span>
                )}

                {!inactive && (
                    <span className="pos-product-add">＋</span>
                )}
            </div>

            <div className="pos-product-brand">
                {product.thuongHieu?.tenThuongHieu || "FShop"}
            </div>

            <strong>{product.tenSanPham}</strong>
            <span className="pos-product-code">{product.maSanPham || "-"}</span>

            <div className="pos-product-price">
                {price > 0 ? formatMoney(price) : "Chưa có giá"}
            </div>

            <div className="pos-product-meta">
                <span className={`pos-stock-dot ${out ? "out" : low ? "low" : ""}`}></span>
                <span>
                    {!loaded
                        ? "Đang tải..."
                        : inactive
                            ? "Ngừng kinh doanh"
                            : out
                                ? "Hết hàng"
                                : low
                                    ? `Sắp hết (${stock})`
                                    : `Còn hàng (${stock})`}
                </span>
            </div>

            <div className="pos-product-bottom">
                <small>{inactive ? "Ngừng kinh doanh" : "Thêm vào giỏ"}</small>
                {!inactive && <span>＋</span>}
            </div>
        </button>
    );
});
export default function EmployeeCounterSale({products = [], onRefresh, actor = null}) {
    const saved = useMemo(() => loadSavedOrders(), []);

    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search);
    const [pageState, setPageState] = useState({key: "", count: PAGE_SIZE});

    const [orders, setOrders] = useState(saved?.orders || [createOrder(1)]);
    const [activeId, setActiveId] = useState(saved?.activeId || 1);
    const nextIdRef = useRef(Math.max(1, ...(saved?.orders || [{id: 1}]).map((o) => o.id)) + 1);

    const [variantMap, setVariantMap] = useState({});
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [invoice, setInvoice] = useState(null);
    const [variantModal, setVariantModal] = useState({open: false, product: null, variants: []});
    const [toast, setToast] = useState(null);

    // ⭐ State cho thông tin khách hàng (giống Admin)
    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [showNewCustomer, setShowNewCustomer] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerPhone, setNewCustomerPhone] = useState("");

    const searchRef = useRef(null);
    const toastTimer = useRef(null);

    const activeOrder = orders.find((o) => o.id === activeId) || orders[0];
    const cart = activeOrder.cart;
    const paymentMethod = activeOrder.method;
    const tenKhach = activeOrder.tenKhach || "";
    const soDienThoaiKhach = activeOrder.soDienThoaiKhach || "";

    const showToast = useCallback((message, type = "warn") => {
        setToast({message, type});
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 2600);
    }, []);

    useEffect(() => () => clearTimeout(toastTimer.current), []);

    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({orders, activeId}));
        } catch {
            /* ignore */
        }
    }, [orders, activeId]);

    const patchActive = useCallback(
        (patch) =>
            setOrders((old) =>
                old.map((o) =>
                    o.id === activeId
                        ? {...o, ...(typeof patch === "function" ? patch(o) : patch)}
                        : o
                )
            ),
        [activeId]
    );

    useEffect(() => {
        let mounted = true;
        fetch(`${API}/khach-hang`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                if (mounted) setCustomers(Array.isArray(data) ? data : []);
            })
            .catch(err => console.error("Lỗi tải KH:", err));
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        if (!products.length) return undefined;

        fetchAllVariants(products).then((map) => {
            if (!cancelled) setVariantMap(map);
        });

        return () => {
            cancelled = true;
        };
    }, [products]);

    const {productStats, variantById, skuIndex, searchText} = useMemo(() => {
        const stats = {};
        const byId = new Map();
        const skus = new Map();
        const text = {};

        products.forEach((p) => {
            const vs = variantMap[p.id];
            if (!vs) {
                stats[p.id] = {loaded: false, minPrice: 0, stock: 0};
                text[p.id] = "";
                return;
            }
            let stock = 0;
            let min = 0;
            const skuList = [];
            vs.forEach((v) => {
                byId.set(v.id, v);
                stock += Number(v.soLuongTon || 0);
                const price = Number(v.giaBan || 0);
                if (price > 0 && (min === 0 || price < min)) min = price;
                if (v.maSku) {
                    const key = String(v.maSku).toLowerCase();
                    skus.set(key, {product: p, variant: v});
                    skuList.push(key);
                }
            });
            stats[p.id] = {loaded: true, minPrice: min, stock};
            text[p.id] = skuList.join(" ");
        });

        return {productStats: stats, variantById: byId, skuIndex: skus, searchText: text};
    }, [products, variantMap]);

    const filteredProducts = useMemo(() => {
        const keyword = deferredSearch.trim().toLowerCase();
        return products.filter((product) => {
            if (!keyword) return true;
            return (
                String(product.tenSanPham || "").toLowerCase().includes(keyword) ||
                String(product.maSanPham || "").toLowerCase().includes(keyword) ||
                String(product.thuongHieu?.tenThuongHieu || "").toLowerCase().includes(keyword) ||
                (searchText[product.id] || "").includes(keyword)
            );
        });
    }, [products, deferredSearch, searchText]);

    const filterKey = deferredSearch;
    const visibleCount = pageState.key === filterKey ? pageState.count : PAGE_SIZE;
    const visibleProducts = filteredProducts.slice(0, visibleCount);

    const liveStock = useCallback(
        (variant) => Number((variantById.get(variant.id) || variant).soLuongTon || 0),
        [variantById]
    );

    const addToCart = useCallback(
        (product, variant, qty = 1) => {
            if (isProductInactive(product)) {
                showToast("Sản phẩm đã ngừng kinh doanh, không thể thêm vào giỏ hàng.");
                return false;
            }

            if (!isSellable(variant)) {
                showToast("Biến thể đã hết hàng hoặc ngừng kinh doanh.");
                return false;
            }
            const stock = liveStock(variant);
            const existing = cart.find((i) => i.variant.id === variant.id);
            const current = existing ? existing.quantity : 0;

            if (current + qty > stock) {
                showToast(`Chỉ còn ${stock} sản phẩm (${variant.maSku || "biến thể này"}).`);
                return false;
            }

            patchActive((o) => ({
                cart: existing
                    ? o.cart.map((i) => i.variant.id === variant.id ? {...i, quantity: i.quantity + qty} : i)
                    : [...o.cart, {product, variant, quantity: qty}],
            }));
            showToast(`Đã thêm ${product.tenSanPham} · Size ${variant.kichCo?.tenKichCo || "-"}`, "ok");
            return true;
        },
        [cart, liveStock, patchActive, showToast]
    );

    const updateQty = (variantId, delta) => {
        const item = cart.find((i) => i.variant.id === variantId);
        if (!item) return;
        const next = item.quantity + delta;
        if (next > liveStock(item.variant)) {
            showToast(`Chỉ còn ${liveStock(item.variant)} sản phẩm.`);
            return;
        }
        patchActive((o) => ({
            cart: o.cart
                .map((i) => (i.variant.id === variantId ? {...i, quantity: next} : i))
                .filter((i) => i.quantity > 0),
        }));
    };

    const removeItem = (variantId) =>
        patchActive((o) => ({cart: o.cart.filter((i) => i.variant.id !== variantId)}));

    const total = useMemo(
        () => cart.reduce((sum, item) => sum + Number(item.variant.giaBan || 0) * item.quantity, 0),
        [cart]
    );
    const totalQty = cart.reduce((s, i) => s + i.quantity, 0);

    const selectProduct = useCallback(
        async (product) => {
            if (isProductInactive(product)) {
                showToast("Sản phẩm đã ngừng kinh doanh, không thể bán.");
                return;
            }

            let variants = variantMap[product.id];

            if (!variants) {
                try {
                    const data = await readJson(`${API}/san-pham/${product.id}/chi-tiet`);
                    variants = Array.isArray(data) ? data : [];
                } catch (e) {
                    showToast(e.message || "Không thể lấy biến thể sản phẩm.");
                    return;
                }
            }

            if (!variants.length) {
                showToast("Sản phẩm này chưa có biến thể.");
                return;
            }

            const sellable = variants.filter(isSellable);
            if (!sellable.length) {
                showToast("Sản phẩm này hiện không còn tồn kho.");
                return;
            }

            if (sellable.length === 1) {
                addToCart(product, sellable[0]);
                return;
            }

            setVariantModal({open: true, product, variants});
        },
        [variantMap, addToCart, showToast]
    );

    const closeVariantModal = useCallback(
        () => setVariantModal({open: false, product: null, variants: []}),
        []
    );

    const addVariantFromModal = useCallback(
        (variant) => {
            const ok = addToCart(variantModal.product, variant);
            if (ok) closeVariantModal();
        },
        [addToCart, variantModal.product, closeVariantModal]
    );

    const handleSearchKeyDown = (e) => {
        if (e.key === "Escape") {
            setSearch("");
            return;
        }
        if (e.key !== "Enter") return;

        const kw = search.trim().toLowerCase();
        if (!kw) return;
        e.preventDefault();

        const hit = skuIndex.get(kw);
        if (hit) {
            if (isProductInactive(hit.product)) {
                showToast("Sản phẩm đã ngừng kinh doanh, không thể bán.");
            } else if (isSellable(hit.variant)) {
                addToCart(hit.product, hit.variant);
            } else {
                showToast(`${hit.variant.maSku} đã hết hàng hoặc ngừng bán.`);
            }

            setSearch("");
            return;
        }

        const exact = products.find((p) => String(p.maSanPham || "").toLowerCase() === kw);
        const target = exact || (filteredProducts.length === 1 ? filteredProducts[0] : null);

        if (target) {
            selectProduct(target);
            setSearch("");
        } else if (!filteredProducts.length) {
            showToast("Không tìm thấy sản phẩm / mã SKU này.");
        }
    };

    const newOrderTab = useCallback(() => {
        if (orders.length >= MAX_TABS) {
            showToast(`Tối đa ${MAX_TABS} hóa đơn chờ.`);
            return;
        }
        const id = nextIdRef.current++;
        setOrders((old) => [...old, createOrder(id)]);
        setActiveId(id);
    }, [orders.length, showToast]);

    const closeOrderTab = (id) => {
        const target = orders.find((o) => o.id === id);
        if (
            target?.cart.length &&
            !window.confirm("Hóa đơn này còn sản phẩm trong giỏ. Bạn muốn xóa?")
        ) {
            return;
        }
        const rest = orders.filter((o) => o.id !== id);
        if (!rest.length) {
            const fresh = createOrder(nextIdRef.current++);
            setOrders([fresh]);
            setActiveId(fresh.id);
            return;
        }
        setOrders(rest);
        if (activeId === id) setActiveId(rest[0].id);
    };

    const openPaymentModal = useCallback(() => {
        if (!cart.length) return;
        setShowPayment(true);
    }, [cart.length]);

    const confirmPayment = async () => {
        if (loadingCheckout || !cart.length) return;

        try {
            setLoadingCheckout(true);
            const payload = {
                phuongThucThanhToan: paymentMethod,
                tenKhach: tenKhach.trim() || null,
                soDienThoaiKhach: soDienThoaiKhach.trim() || null,
                // Người bán tại quầy → ghi vào hóa đơn & lịch sử
                nhanVienId: actor?.nhanVienId || null,
                taiKhoanId: actor?.taiKhoanId || null,
                chiTiet: cart.map((item) => ({
                    sanPhamChiTietId: item.variant.id,
                    soLuong: item.quantity,
                })),
            };

            const result = await readJson(`${API}/hoa-don/tao-tai-quay`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });

            const cartSnapshot = [...cart];
            const totalPaid = Number(result?.tongThanhToan || total);

            setShowPayment(false);
            setInvoice({
                maHoaDon: result?.maHoaDon || `HD${Date.now()}`,
                ngayLap: result?.ngayLap || new Date().toISOString(),
                phuongThucThanhToan: paymentMethod,
                tenKhach: result?.tenKhach || tenKhach,
                maKhachHang: result?.maKhachHang || null,
                soDienThoaiKhach: result?.soDienThoaiKhach || soDienThoaiKhach,
                tongThanhToan: totalPaid,
                chiTiet: cartSnapshot.map((item) => ({
                    tenSanPham: item.product.tenSanPham,
                    maSanPham: item.product.maSanPham,
                    kichCo: item.variant.kichCo?.tenKichCo,
                    mauSac: item.variant.mauSac?.tenMau,
                    soLuong: item.quantity,
                    donGia: Number(item.variant.giaBan || 0),
                    thanhTien: Number(item.variant.giaBan || 0) * item.quantity,
                })),
            });

            setVariantMap((old) => {
                const next = {...old};
                cartSnapshot.forEach(({product, variant, quantity}) => {
                    if (!next[product.id]) return;
                    next[product.id] = next[product.id].map((v) =>
                        v.id === variant.id
                            ? {...v, soLuongTon: Math.max(0, Number(v.soLuongTon || 0) - quantity)}
                            : v
                    );
                });
                return next;
            });

            patchActive({cart: [], tenKhach: "", soDienThoaiKhach: ""});
        } catch (err) {
            console.error(err);
            showToast(err.message || "Không thể tạo hóa đơn tại quầy.", "error");
        } finally {
            setLoadingCheckout(false);
        }
    };

    const closeInvoice = useCallback(() => {
        setInvoice(null);
        if (onRefresh) {
            Promise.resolve(onRefresh()).catch((e) => console.error(e));
        }
        setTimeout(() => searchRef.current?.focus(), 0);
    }, [onRefresh]);

    useEffect(() => {
        searchRef.current?.focus();
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if (invoice) {
                if (e.key === "Escape" || e.key === "Enter") {
                    e.preventDefault();
                    closeInvoice();
                }
                return;
            }
            if (variantModal.open || showPayment) return;

            if (e.key === "F2") {
                e.preventDefault();
                searchRef.current?.focus();
                searchRef.current?.select();
            } else if (e.key === "F4") {
                e.preventDefault();
                newOrderTab();
            } else if (e.key === "F8") {
                e.preventDefault();
                patchActive((o) => ({
                    method: o.method === "TIEN_MAT" ? "CHUYEN_KHOAN" : "TIEN_MAT",
                }));
            } else if (e.key === "F9") {
                e.preventDefault();
                openPaymentModal();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [
        invoice,
        variantModal.open,
        showPayment,
        closeInvoice,
        newOrderTab,
        patchActive,
        openPaymentModal,
    ]);

    return (
        <div className="employee-content">
            <PageHeading
                title="Bán hàng tại quầy"
                description="Quét mã SKU hoặc tìm sản phẩm, thêm vào giỏ và thanh toán."
                action={
                    <div className="pos-shortcuts">
                        <span><kbd>F2</kbd> Tìm</span>
                        <span><kbd>F4</kbd> Đơn mới</span>
                        <span><kbd>F8</kbd> Đổi thanh toán</span>
                        <span><kbd>F9</kbd> Thanh toán</span>
                    </div>
                }
            />

            <div className="pos-tabs">
                {orders.map((o, idx) => {
                    const qty = o.cart.reduce((s, i) => s + i.quantity, 0);
                    return (
                        <div
                            key={o.id}
                            className={`pos-tab ${o.id === activeId ? "active" : ""}`}
                        >
                            <button type="button" onClick={() => setActiveId(o.id)}>
                                Đơn {idx + 1}
                                {qty > 0 && <b>{qty}</b>}
                            </button>
                            {(orders.length > 1 || o.cart.length > 0) && (
                                <button
                                    type="button"
                                    className="pos-tab-close"
                                    title="Xóa hóa đơn này"
                                    onClick={() => closeOrderTab(o.id)}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    );
                })}
                <button
                    type="button"
                    className="pos-tab-add"
                    onClick={newOrderTab}
                    title="Hóa đơn mới (F4)"
                >
                    ＋
                </button>
            </div>

            <div className="pos-main-container">
                <div className="pos-layout" style={{gridTemplateColumns: "minmax(0, 1fr) 390px"}}>
                    <section className="pos-products">
                        <div className="pos-products-head">
                            <div>
                                <h2>Sản phẩm</h2>
                                <p>Nhấn Enter khi nhập đúng mã SKU để thêm ngay vào hóa đơn</p>
                            </div>
                            <span className="pos-product-count">
                                {filteredProducts.length} sản phẩm
                            </span>
                        </div>

                        <div className="pos-search-box">
                            <span>⌕</span>
                            <input
                                ref={searchRef}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Quét mã SKU hoặc tìm theo tên, mã sản phẩm, thương hiệu... (F2)"
                            />
                            {search && (
                                <button type="button" onClick={() => setSearch("")}>
                                    ×
                                </button>
                            )}
                        </div>

                        <div className="pos-product-grid">
                            {visibleProducts.length ? (
                                visibleProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        stats={productStats[product.id]}
                                        onSelect={selectProduct}
                                    />
                                ))
                            ) : (
                                <div className="pos-no-products">
                                    <div>⌕</div>
                                    <strong>Không tìm thấy sản phẩm</strong>
                                </div>
                            )}
                        </div>

                        {filteredProducts.length > visibleCount && (
                            <button
                                type="button"
                                className="pos-load-more"
                                onClick={() =>
                                    setPageState({key: filterKey, count: visibleCount + PAGE_SIZE})
                                }
                            >
                                Xem thêm {filteredProducts.length - visibleCount} sản phẩm
                            </button>
                        )}
                    </section>

                    <aside className="pos-cart">
                        <div className="employee-card-heading">
                            <div>
                                <h2>Giỏ hàng ({totalQty})</h2>
                                <p>Hóa đơn tại quầy</p>
                            </div>
                            {cart.length > 0 && (
                                <button
                                    type="button"
                                    className="employee-link"
                                    onClick={() => patchActive({cart: []})}
                                >
                                    Xóa tất cả
                                </button>
                            )}
                        </div>

                        <div className="pos-cart-list">
                            {cart.length ? (
                                cart.map((item) => (
                                    <div className="pos-cart-item" key={item.variant.id}>
                                        <img
                                            src={item.product.hinhAnh || FALLBACK_IMG}
                                            alt={item.product.tenSanPham}
                                        />
                                        <div className="pos-cart-info">
                                            <strong>{item.product.tenSanPham}</strong>
                                            <small>
                                                Size {item.variant.kichCo?.tenKichCo || "-"} ·{" "}
                                                {item.variant.mauSac?.tenMau || "-"}
                                            </small>
                                            <b>
                                                {formatMoney(
                                                    Number(item.variant.giaBan || 0) * item.quantity
                                                )}
                                            </b>

                                            <div className="quantity-control">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(item.variant.id, -1)}
                                                >
                                                    −
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(item.variant.id, 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="pos-remove"
                                            onClick={() => removeItem(item.variant.id)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="pos-empty-cart">
                                    <div>🛒</div>
                                    <strong>Chưa có sản phẩm</strong>
                                    <span>Quét mã hoặc chọn sản phẩm bên trái.</span>
                                </div>
                            )}
                        </div>

                        {/* ⭐ PHẦN THÔNG TIN KHÁCH HÀNG (ĐỒNG BỘ ADMIN) */}
                        <div className="pos-customer-section" style={{paddingTop: "16px", borderTop: "1px solid #eee", marginTop: "16px"}}>
                            <h4 style={{margin: "0 0 10px", fontSize: "13px", fontWeight: "700"}}>Thông tin khách hàng</h4>
                            <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                                <input
                                    type="text"
                                    placeholder="Tên khách hàng (Không bắt buộc)"
                                    value={tenKhach}
                                    onChange={(e) => patchActive({tenKhach: e.target.value})}
                                    style={{padding: "10px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "13px"}}
                                />
                                <input
                                    type="tel"
                                    placeholder="Số điện thoại (Không bắt buộc)"
                                    value={soDienThoaiKhach}
                                    onChange={(e) => patchActive({soDienThoaiKhach: e.target.value})}
                                    style={{padding: "10px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "13px"}}
                                />
                            </div>
                            <div style={{marginTop: "10px"}}>
                                <select
                                    onChange={(e) => {
                                        const kh = customers.find(c => String(c.id) === e.target.value);
                                        if (kh) {
                                            patchActive({
                                                tenKhach: kh.hoTen || "",
                                                soDienThoaiKhach: kh.soDienThoai || ""
                                            });
                                        }
                                        e.target.value = "";
                                    }}
                                    style={{width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "13px"}}
                                >
                                    <option value="">-- Chọn khách quen --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.hoTen || "Khách"} ({c.soDienThoai || "Chưa có SĐT"})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pos-summary">
                            <div>
                                <span>Tạm tính</span>
                                <strong>{formatMoney(total)}</strong>
                            </div>
                            <div>
                                <span>Giảm giá</span>
                                <strong>0đ</strong>
                            </div>
                            <div className="pos-total">
                                <span>Tổng tiền</span>
                                <strong>{formatMoney(total)}</strong>
                            </div>
                        </div>

                        <div className="pos-payment-section">
                            <div className="pos-payment-title">
                                <span>Phương thức thanh toán (F8)</span>
                            </div>

                            <div className="pos-payment-options">
                                {[
                                    ["TIEN_MAT", "💵", "Tiền mặt"],
                                    ["CHUYEN_KHOAN", "🏦", "Chuyển khoản"],
                                ].map(([value, icon, label]) => (
                                    <button
                                        type="button"
                                        key={value}
                                        className={`pos-payment-option ${
                                            paymentMethod === value ? "active" : ""
                                        }`}
                                        onClick={() => patchActive({method: value})}
                                    >
                                        <span className="pos-payment-icon">{icon}</span>
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            className="pos-pay-button"
                            disabled={!cart.length}
                            onClick={openPaymentModal}
                        >
                            <span>▣</span>
                            <strong>Thanh toán (F9)</strong>
                            <b>{formatMoney(total)}</b>
                        </button>

                        <small className="pos-note">
                            * Hóa đơn tại quầy được ghi trực tiếp vào database.
                        </small>
                    </aside>
                </div>
            </div>

            {toast && (
                <div className={`pos-toast ${toast.type}`} role="status">
                    {toast.message}
                </div>
            )}

            <PaymentModal
                open={showPayment}
                onClose={() => !loadingCheckout && setShowPayment(false)}
                method={paymentMethod}
                total={total}
                loading={loadingCheckout}
                onConfirm={confirmPayment}
            />

            <InvoiceModal invoice={invoice} onClose={closeInvoice} />

            <VariantPickerModal
                open={variantModal.open}
                product={variantModal.product}
                variants={variantModal.variants}
                onClose={closeVariantModal}
                onConfirm={addVariantFromModal}
            />
        </div>
    );
}