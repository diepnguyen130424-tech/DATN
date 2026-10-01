import { useEffect, useRef, useState } from "react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import "./AIDoSize.css";

const WASM_URL =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const SIZE_TABLE = [
    { size: "39", min: 24.0, max: 24.6 },
    { size: "40", min: 24.7, max: 25.3 },
    { size: "41", min: 25.4, max: 26.0 },
    { size: "42", min: 26.1, max: 26.7 },
    { size: "43", min: 26.8, max: 27.4 },
    { size: "44", min: 27.5, max: 28.2 },
];

function distance2D(a, b) {
    if (!a || !b) return 0;

    const dx = Number(a.x) - Number(b.x);
    const dy = Number(a.y) - Number(b.y);

    return Math.sqrt(dx * dx + dy * dy);
}

function getBestFootLength(landmarks) {
    if (!Array.isArray(landmarks)) return 0;

    const leftHeel = landmarks[29];
    const leftToe = landmarks[31];
    const rightHeel = landmarks[30];
    const rightToe = landmarks[32];

    const candidates = [];

    if (
        leftHeel &&
        leftToe &&
        (leftHeel.visibility ?? 1) >= 0.35 &&
        (leftToe.visibility ?? 1) >= 0.35
    ) {
        candidates.push(distance2D(leftHeel, leftToe));
    }

    if (
        rightHeel &&
        rightToe &&
        (rightHeel.visibility ?? 1) >= 0.35 &&
        (rightToe.visibility ?? 1) >= 0.35
    ) {
        candidates.push(distance2D(rightHeel, rightToe));
    }

    if (candidates.length === 0) return 0;

    return Math.max(...candidates);
}

function recommendSize(lengthCm) {
    if (!lengthCm) return null;

    let closest = SIZE_TABLE[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    SIZE_TABLE.forEach((item) => {
        if (lengthCm >= item.min && lengthCm <= item.max) {
            closest = item;
            closestDistance = 0;
            return;
        }

        const distance =
            lengthCm < item.min
                ? item.min - lengthCm
                : lengthCm - item.max;

        if (distance < closestDistance) {
            closestDistance = distance;
            closest = item;
        }
    });

    return closest;
}

export default function AIDoSize({ onSelectSize, onClose }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const landmarkerRef = useRef(null);
    const animationRef = useRef(null);
    const lastVideoTimeRef = useRef(-1);
    const runningRef = useRef(false);

    const [status, setStatus] = useState("Đang khởi tạo camera...");
    const [error, setError] = useState("");
    const [measuring, setMeasuring] = useState(false);
    const [lengthCm, setLengthCm] = useState(null);
    const [recommendedSize, setRecommendedSize] = useState(null);
    const [showGuide, setShowGuide] = useState(true);

    const stopCamera = () => {
        runningRef.current = false;

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (landmarkerRef.current) {
            try {
                landmarkerRef.current.close();
            } catch {
                // Model đã được đóng.
            }
            landmarkerRef.current = null;
        }
    };

    useEffect(() => {
        let cancelled = false;

        const start = async () => {
            try {
                setError("");
                setStatus("Đang xin quyền sử dụng camera...");

                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error(
                        "Trình duyệt không hỗ trợ camera. Hãy mở bằng Chrome/Edge trên localhost hoặc HTTPS."
                    );
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "environment",
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                setStatus("Đang tải AI đo bàn chân...");

                const vision = await FilesetResolver.forVisionTasks(WASM_URL);

                const landmarker = await PoseLandmarker.createFromOptions(
                    vision,
                    {
                        baseOptions: {
                            modelAssetPath: MODEL_URL,
                            delegate: "GPU",
                        },
                        runningMode: "VIDEO",
                        numPoses: 1,
                        minPoseDetectionConfidence: 0.45,
                        minPosePresenceConfidence: 0.45,
                        minTrackingConfidence: 0.45,
                    }
                );

                if (cancelled) {
                    landmarker.close();
                    return;
                }

                landmarkerRef.current = landmarker;
                runningRef.current = true;

                setStatus(
                    "Đặt bàn chân vào khung A4, giữ chân yên rồi bấm Bắt đầu đo."
                );
            } catch (err) {
                console.error("Lỗi AI đo size:", err);

                setError(
                    err?.message ||
                    "Không thể khởi động camera hoặc AI đo size."
                );
                setStatus("");
            }
        };

        start();

        return () => {
            cancelled = true;
            stopCamera();
        };
    }, []);

    const detectOnce = () => {
        const video = videoRef.current;
        const landmarker = landmarkerRef.current;

        if (!video || !landmarker || video.readyState < 2) {
            return null;
        }

        const currentTime = video.currentTime;

        if (currentTime === lastVideoTimeRef.current) {
            return null;
        }

        lastVideoTimeRef.current = currentTime;

        const result = landmarker.detectForVideo(
            video,
            performance.now()
        );

        if (!result?.landmarks?.length) {
            return null;
        }

        return getBestFootLength(result.landmarks[0]);
    };

    const startMeasuring = () => {
        if (!landmarkerRef.current || !videoRef.current) {
            setError("AI chưa sẵn sàng. Vui lòng chờ vài giây.");
            return;
        }

        setError("");
        setLengthCm(null);
        setRecommendedSize(null);
        setMeasuring(true);
        setShowGuide(false);
        setStatus("Đang đo... Giữ chân yên trong khung.");

        let samples = [];
        const startedAt = performance.now();

        const loop = () => {
            if (!runningRef.current) return;

            const normalizedLength = detectOnce();

            if (normalizedLength > 0) {
                const A4_WIDTH_NORMALIZED = 0.72;
                const length =
                    normalizedLength * (21 / A4_WIDTH_NORMALIZED);

                if (length >= 18 && length <= 34) {
                    samples.push(length);

                    if (samples.length > 25) {
                        samples = samples.slice(-25);
                    }
                }
            }

            const elapsed = performance.now() - startedAt;

            if (elapsed < 3000) {
                animationRef.current = requestAnimationFrame(loop);
                return;
            }

            if (samples.length < 5) {
                setMeasuring(false);
                setShowGuide(true);
                setStatus(
                    "Chưa nhận diện rõ bàn chân. Hãy đặt chân thẳng, để cả cổ chân và bàn chân trong khung rồi thử lại."
                );
                return;
            }

            const sorted = [...samples].sort((a, b) => a - b);

            const trimmed = sorted.slice(
                Math.floor(sorted.length * 0.2),
                Math.ceil(sorted.length * 0.8)
            );

            const average =
                trimmed.reduce((sum, value) => sum + value, 0) /
                trimmed.length;

            const rounded = Number(average.toFixed(1));
            const size = recommendSize(rounded);

            setLengthCm(rounded);
            setRecommendedSize(size);
            setMeasuring(false);
            setShowGuide(false);
            setStatus("Đã đo size thành công.");
        };

        animationRef.current = requestAnimationFrame(loop);
    };

    const handleSelect = () => {
        if (!recommendedSize) return;

        if (typeof onSelectSize === "function") {
            onSelectSize(recommendedSize.size);
        }

        stopCamera();
    };

    const handleClose = () => {
        stopCamera();

        if (typeof onClose === "function") {
            onClose();
        }
    };

    return (
        <div className="ai-size-overlay" onClick={handleClose}>
            <div
                className="ai-size-modal"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="ai-size-header">
                    <div>
                        <span className="ai-size-eyebrow">
                            FSHOP AI SIZE
                        </span>
                        <h2>Đo size giày bằng AI</h2>
                    </div>

                    <button
                        type="button"
                        className="ai-size-close"
                        onClick={handleClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="ai-size-body">
                    <div className="ai-camera">
                        <video
                            ref={videoRef}
                            className="ai-camera-video"
                            autoPlay
                            playsInline
                            muted
                        />

                        <div
                            className={`ai-a4-guide ${
                                showGuide ? "show" : ""
                            }`}
                        >
                            <div className="ai-a4-corner top-left" />
                            <div className="ai-a4-corner top-right" />
                            <div className="ai-a4-corner bottom-left" />
                            <div className="ai-a4-corner bottom-right" />

                            <div className="ai-a4-label">
                                Căn A4 vào khung này
                            </div>
                        </div>

                        {measuring && (
                            <div className="ai-measuring">
                                <span className="ai-spinner" />
                                Đang đo...
                            </div>
                        )}
                    </div>

                    <div className="ai-size-instructions">
                        <div className="ai-step">
                            <b>1</b>
                            <span>
                                Đặt một tờ giấy A4 nằm phẳng trên sàn.
                            </span>
                        </div>

                        <div className="ai-step">
                            <b>2</b>
                            <span>
                                Đặt bàn chân lên giấy, để cả cổ chân và bàn
                                chân nằm trong khung camera.
                            </span>
                        </div>

                        <div className="ai-step">
                            <b>3</b>
                            <span>
                                Giữ chân yên rồi bấm{" "}
                                <strong>Bắt đầu đo</strong>.
                            </span>
                        </div>

                        <div className="ai-size-note">
                            Kết quả là kích thước tham khảo. Size thực tế có
                            thể thay đổi theo form và thương hiệu giày.
                        </div>

                        {status && (
                            <div className="ai-status">
                                {status}
                            </div>
                        )}

                        {error && (
                            <div className="ai-error">
                                {error}
                            </div>
                        )}

                        {lengthCm && recommendedSize && (
                            <div className="ai-result">
                                <div className="ai-success-title">
                                    <span className="ai-success-icon">
                                        ✓
                                    </span>

                                    <div>
                                        <strong>ĐO SIZE THÀNH CÔNG</strong>
                                        <span>
                                            AI đã phân tích bàn chân của bạn
                                        </span>
                                    </div>
                                </div>

                                <div className="ai-result-length">
                                    <span>Chiều dài bàn chân</span>
                                    <strong>{lengthCm} cm</strong>
                                </div>

                                <div className="ai-result-size">
                                    <span>SIZE ĐỀ XUẤT</span>
                                    <strong>
                                        {recommendedSize.size}
                                    </strong>
                                </div>

                                <div className="ai-result-message">
                                    ✨ AI đề xuất size{" "}
                                    <b>{recommendedSize.size}</b> cho bạn.
                                </div>

                                <button
                                    type="button"
                                    className="ai-select-size"
                                    onClick={handleSelect}
                                >
                                    ✓ Chọn size {recommendedSize.size}
                                </button>
                            </div>
                        )}

                        {!lengthCm && (
                            <button
                                type="button"
                                className="ai-start-button"
                                disabled={measuring}
                                onClick={startMeasuring}
                            >
                                {measuring
                                    ? "Đang đo..."
                                    : "📏 Bắt đầu đo"}
                            </button>
                        )}

                        {lengthCm && (
                            <button
                                type="button"
                                className="ai-retry-button"
                                disabled={measuring}
                                onClick={startMeasuring}
                            >
                                ↻ Đo lại
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
