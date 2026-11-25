import { useEffect, useRef, useState } from "react";
import "./AIDoSize.css";
import "./AIDoSizeAuto.css";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

export default function AIDoSize({ onSelectSize, onClose }) {
    const inputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("Chọn ảnh bàn chân trần, AI sẽ ước lượng size trực tiếp.");
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (!file) {
            setPreview("");
            return undefined;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleFile = (nextFile) => {
        setError("");
        setResult(null);
        if (!nextFile) return;
        if (!/^image\/(jpeg|png|webp)$/i.test(nextFile.type)) {
            setError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.");
            return;
        }
        if (nextFile.size > 5 * 1024 * 1024) {
            setError("Ảnh tối đa 5MB. Vui lòng chọn ảnh nhỏ hơn.");
            return;
        }
        setFile(nextFile);
        setStatus("Đã nhận ảnh. Nhấn Phân tích và đo size.");
    };

    const analyze = async () => {
        if (!file || busy) return;
        setBusy(true);
        setError("");
        setResult(null);
        setStatus("AI đang nhận diện bàn chân và ước lượng size...");
        try {
            const body = new FormData();
            body.append("file", file);

            let response;
            try {
                response = await fetch(`${API_BASE}/ai-size/analyze`, {
                    method: "POST",
                    body,
                });
            } catch {
                throw new Error(
                    `Không kết nối được Backend tại ${API_BASE}. Hãy kiểm tra Spring Boot có đang chạy không.`
                );
            }

            const responseText = await response.text();
            let data = {};
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch {
                data = {};
            }

            if (!response.ok) {
                throw new Error(
                    data.message
                    || (response.status === 413
                        ? "Ảnh vượt quá giới hạn upload của Backend."
                        : `Backend trả lỗi HTTP ${response.status}. Hãy kiểm tra log Spring Boot.`)
                );
            }

            if (!data.success || !data.recommendedSize || !Number.isFinite(Number(data.lengthCm))) {
                throw new Error("AI chưa trả về size hợp lệ. Vui lòng thử ảnh khác.");
            }

            setResult(data);
            setStatus("Đã ước lượng xong size từ ảnh.");
        } catch (err) {
            setError(err.message || "Có lỗi khi phân tích ảnh.");
            setStatus("Chưa thể ước lượng size từ ảnh này.");
        } finally {
            setBusy(false);
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        setError("");
        setStatus("Chọn ảnh bàn chân trần, AI sẽ ước lượng size trực tiếp.");
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleSelect = () => {
        if (!result?.recommendedSize) return;
        onSelectSize?.(result.recommendedSize);
    };

    return (
        <div className="ai-size-overlay" onClick={onClose}>
            <section className="ai-size-modal ai-auto-modal" onClick={(event) => event.stopPropagation()}>
                <header className="ai-size-header ai-auto-header">
                    <div>
                        <span className="ai-size-eyebrow">FSHOP AI SIZE</span>
                        <h2>AI ước lượng size giày</h2>
                        <p>Chỉ cần tải một ảnh bàn chân lên rồi nhấn đo size.</p>
                    </div>
                    <button type="button" className="ai-size-close" onClick={onClose} aria-label="Đóng">×</button>
                </header>

                <div className="ai-size-body ai-auto-body">
                    <div className="ai-auto-left">
                        <div className="ai-auto-preview">
                            {preview ? (
                                <img src={preview} alt="Ảnh bàn chân đã chọn" />
                            ) : (
                                <div className="ai-auto-empty">
                                    <span className="ai-auto-camera-icon">◎</span>
                                    <strong>Chưa có ảnh</strong>
                                    <span>Chụp hoặc tải ảnh thấy trọn bàn chân trần từ trên xuống.</span>
                                </div>
                            )}
                            {busy && <div className="ai-auto-loading"><span className="ai-spinner" />AI đang phân tích ảnh...</div>}
                        </div>

                        <input
                            ref={inputRef}
                            className="ai-auto-file"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            capture="environment"
                            onChange={(event) => handleFile(event.target.files?.[0])}
                        />

                        <div className="ai-auto-actions">
                            <button
                                type="button"
                                className="ai-auto-secondary"
                                onClick={() => inputRef.current?.click()}
                                disabled={busy}
                            >
                                {file ? "Chọn ảnh khác / chụp lại" : "Chụp ảnh hoặc tải ảnh lên"}
                            </button>
                            <button
                                type="button"
                                className="ai-start-button ai-auto-analyze"
                                onClick={analyze}
                                disabled={!file || busy}
                            >
                                {busy ? "Đang phân tích..." : "✨ Phân tích và đo size"}
                            </button>
                        </div>

                        {file && (
                            <button type="button" className="ai-auto-reset" onClick={reset} disabled={busy}>
                                Xóa ảnh
                            </button>
                        )}
                    </div>

                    <div className="ai-size-instructions ai-auto-instructions">
                        <h3>Cách chụp ảnh</h3>
                        <div className="ai-step"><b>1</b><span>Đặt bàn chân trần trên mặt sàn, không mang tất hoặc giày.</span></div>
                        <div className="ai-step"><b>2</b><span>Chụp từ trên xuống, đủ sáng và thấy trọn gót chân đến đầu ngón dài nhất.</span></div>
                        <div className="ai-step"><b>3</b><span>Tải ảnh lên và nhấn nút. AI tự ước lượng chiều dài và quy đổi size.</span></div>

                        <div className="ai-auto-supported">
                            <strong>Không cần vật chuẩn</strong>
                            <span>Không cần giấy A4, thẻ ngân hàng, thước đo hoặc chọn điểm trên ảnh.</span>
                        </div>

                        <p className="ai-size-note">
                            Lưu ý: Ảnh không có vật chuẩn nên AI không thể xác định kích thước thực từ pixel.
                            Kết quả cm và size chỉ là ước lượng tham khảo, có thể sai lệch.
                        </p>

                        <div className="ai-status">{status}</div>
                        {error && <div className="ai-error">{error}</div>}

                        {result && (
                            <div className="ai-result ai-auto-result">
                                <div className="ai-success-title">
                                    <span className="ai-success-icon">✓</span>
                                    <div>
                                        <strong>ĐÃ ƯỚC LƯỢNG XONG</strong>
                                        <span>Nhận diện ảnh: {result.confidence}% · Không phải độ chính xác đo lường</span>
                                    </div>
                                </div>
                                <div className="ai-result-length">
                                    <span>Chiều dài ước lượng</span>
                                    <strong>{result.lengthCm} cm</strong>
                                </div>
                                <div className="ai-result-size">
                                    <span>SIZE THAM KHẢO</span>
                                    <strong>{result.recommendedSize}</strong>
                                </div>
                                <p className="ai-result-message">{result.message}</p>
                                <button type="button" className="ai-select-size" onClick={handleSelect}>
                                    ✓ Chọn size {result.recommendedSize}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
