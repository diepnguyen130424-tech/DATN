import { useEffect, useState } from "react";

function App() {
    const [message, setMessage] = useState("Đang kết nối Backend...");
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("http://localhost:8080/api/test")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Backend trả về lỗi");
                }
                return response.text();
            })
            .then((data) => {
                setMessage(data);
            })
            .catch((err) => {
                setError(err.message);
                setMessage("");
            });
    }, []);

    return (
        <div style={{ padding: "40px", fontFamily: "Arial" }}>
            <h1>Bán giày - Frontend</h1>

            <h2>Kiểm tra kết nối Backend</h2>

            {message && <p>{message}</p>}

            {error && (
                <p style={{ color: "red" }}>
                    Lỗi: {error}
                </p>
            )}
        </div>
    );
}

export default App;