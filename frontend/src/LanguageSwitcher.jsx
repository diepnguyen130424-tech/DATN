import { useEffect, useMemo, useState } from "react";
import "./LanguageSwitcher.css";

/**
 * Chọn ngôn ngữ cho toàn bộ trang bằng Google Translate (miễn phí, không cần API key).
 * Trang gốc là tiếng Việt. Chọn "Việt" để quay về bản gốc.
 */

// Mã ngôn ngữ (BCP-47) mà Google Translate hỗ trợ
const MA_NGON_NGU = [
    "vi", "en", "zh-CN", "zh-TW", "ja", "ko", "th", "id", "ms", "fil", "km", "lo", "my",
    "hi", "bn", "ur", "ar", "fa", "he", "tr", "ru", "uk", "pl", "cs", "sk", "hu", "ro",
    "bg", "el", "de", "fr", "es", "pt", "it", "nl", "sv", "da", "no", "fi", "is", "hr",
    "sr", "sl", "lt", "lv", "et", "ca", "gl", "eu", "sq", "mk", "be", "ka", "hy", "az",
    "kk", "uz", "mn", "ne", "si", "ta", "te", "ml", "kn", "mr", "gu", "pa", "sw", "af",
    "zu", "am", "ha", "yo", "ig", "so", "mt", "cy", "ga", "eo", "jv", "su",
];

// Một số mã của Google khác chuẩn BCP-47
const SANG_GOOGLE = { he: "iw", fil: "tl", jv: "jw" };
const toGoogle = (code) => SANG_GOOGLE[code] || code;

const NHAN_RIENG = {
    vi: "Việt",
    "zh-CN": "Trung (Giản thể)",
    "zh-TW": "Trung (Phồn thể)",
};

const KHOA_LUU = "fshop_lang";

function layTenNgonNgu(code) {
    if (NHAN_RIENG[code]) return NHAN_RIENG[code];
    try {
        const ten = new Intl.DisplayNames(["vi"], { type: "language" }).of(code) || code;
        const gon = ten.replace(/^tiếng\s+/i, "");
        return gon.charAt(0).toUpperCase() + gon.slice(1);
    } catch {
        return code;
    }
}

function docNgonNguDaLuu() {
    try {
        const v = localStorage.getItem(KHOA_LUU);
        return MA_NGON_NGU.includes(v) ? v : "vi";
    } catch {
        return "vi";
    }
}

function luuNgonNgu(code) {
    try {
        localStorage.setItem(KHOA_LUU, code);
    } catch {
        /* bỏ qua nếu trình duyệt chặn localStorage */
    }
}

let hua = null;

function taiGoogleTranslate() {
    if (hua) return hua;

    hua = new Promise((resolve, reject) => {
        if (!document.getElementById("google_translate_element")) {
            const holder = document.createElement("div");
            holder.id = "google_translate_element";
            holder.className = "notranslate";
            holder.style.display = "none";
            document.body.appendChild(holder);
        }

        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement(
                { pageLanguage: "vi", autoDisplay: false },
                "google_translate_element"
            );
            resolve();
        };

        const script = document.createElement("script");
        script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        script.onerror = () => {
            hua = null;
            reject(new Error("Không tải được dịch vụ dịch"));
        };
        document.body.appendChild(script);
    });

    return hua;
}

function doiComboBox(timeout = 8000) {
    return new Promise((resolve, reject) => {
        const batDau = Date.now();
        const kiemTra = () => {
            const combo = document.querySelector("select.goog-te-combo");
            if (combo && combo.options.length > 1) return resolve(combo);
            if (Date.now() - batDau > timeout) return reject(new Error("Hết thời gian chờ"));
            setTimeout(kiemTra, 120);
        };
        kiemTra();
    });
}

function xoaCookieDich() {
    const host = window.location.hostname;
    const het = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = `googtrans=; ${het}; path=/`;
    document.cookie = `googtrans=; ${het}; path=/; domain=${host}`;
    document.cookie = `googtrans=; ${het}; path=/; domain=.${host}`;
}

async function apDungNgonNgu(code) {
    await taiGoogleTranslate();
    const combo = await doiComboBox();
    const dich = code === "vi" ? "" : toGoogle(code);

    if (dich && ![...combo.options].some((o) => o.value === dich)) {
        throw new Error("Ngôn ngữ này chưa được hỗ trợ");
    }

    combo.value = dich;
    combo.dispatchEvent(new Event("change"));

    // Quay về tiếng Việt: nếu Google chưa gỡ bản dịch thì xóa cookie rồi tải lại trang
    if (code === "vi") {
        await new Promise((r) => setTimeout(r, 1200));
        const html = document.documentElement.classList;
        if (html.contains("translated-ltr") || html.contains("translated-rtl")) {
            xoaCookieDich();
            window.location.reload();
        }
    }
}

export default function LanguageSwitcher() {
    const [lang, setLang] = useState(docNgonNguDaLuu);
    const [loi, setLoi] = useState("");
    const [dangTai, setDangTai] = useState(false);

    const danhSach = useMemo(() => {
        const [goc, ...con] = MA_NGON_NGU.map((code) => ({ code, ten: layTenNgonNgu(code) }));
        con.sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
        return [goc, ...con];
    }, []);

    // Khôi phục ngôn ngữ đã chọn lần trước
    useEffect(() => {
        if (lang === "vi") return;
        apDungNgonNgu(lang).catch(() => {});
        // chỉ chạy một lần khi mở trang
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const doiNgonNgu = async (e) => {
        const code = e.target.value;
        setLang(code);
        setLoi("");
        luuNgonNgu(code);

        // Đang ở tiếng Việt và vẫn chọn tiếng Việt: không cần làm gì
        if (code === "vi" && !document.querySelector("select.goog-te-combo")) return;

        setDangTai(true);
        try {
            await apDungNgonNgu(code);
        } catch (err) {
            setLoi(err.message || "Không đổi được ngôn ngữ");
        } finally {
            setDangTai(false);
        }
    };

    return (
        <div className="lang-topbar notranslate" translate="no">
            <div className="container lang-topbar-inner">
                {loi && <span className="lang-error">{loi}</span>}
                <label className="lang-switcher">
                    <span aria-hidden="true">🌐</span>
                    <select
                        value={lang}
                        onChange={doiNgonNgu}
                        disabled={dangTai}
                        aria-label="Chọn ngôn ngữ"
                    >
                        {danhSach.map((item) => (
                            <option key={item.code} value={item.code}>
                                {item.ten}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
        </div>
    );
}
