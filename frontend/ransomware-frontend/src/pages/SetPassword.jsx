import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [tokenValid, setTokenValid] = useState(null);

    // Verify token on page load
    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            return;
        }
        fetch(`http://localhost:8000/api/v1/auth/verify-token/${token}`)
            .then(r => r.json())
            .then(data => {
                if (data.valid) {
                    setTokenValid(true);
                    setUsername(data.username);
                } else {
                    setTokenValid(false);
                }
            })
            .catch(() => setTokenValid(false));
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            const res = await fetch("http://localhost:8000/api/v1/auth/set-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    password,
                    confirm_password: confirm
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(data.message + " Redirecting to login...");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setError(data.detail || "Failed to set password");
            }
        } catch (err) {
            console.error("[SetPassword] Error:", err);
            setError("Server error, please try again");
        }
    };

    // Loading state
    if (tokenValid === null) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <p>Verifying your link...</p>
            </div>
        );
    }

    // Invalid token
    if (tokenValid === false) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <div style={{ textAlign: "center" }}>
                    <h2 style={{ color: "red" }}>Invalid or Expired Link</h2>
                    <p>This setup link is invalid or has already been used.</p>
                    <p>Please contact your admin to get a new link.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: "flex", justifyContent: "center",
            alignItems: "center", minHeight: "100vh",
            background: "#f5f5f5", fontFamily: "Arial, sans-serif"
        }}>
            <div style={{
                padding: "2rem", background: "#fff",
                borderRadius: "8px", width: "100%", maxWidth: "400px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.1)"
            }}>
                <h1 style={{ marginBottom: "0.25rem" }}>Set Your Password</h1>
                <p style={{ color: "#888", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                    Welcome <strong>{username}</strong>. Set a password to activate your account.
                </p>

                {error && <p style={{ color: "red" }}>{error}</p>}
                {success && <p style={{ color: "green" }}>{success}</p>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
                        />
                    </div>
                    <div style={{ marginBottom: "1.5rem" }}>
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
                        />
                    </div>
                    <button type="submit" style={{
                        width: "100%", padding: "0.75rem",
                        background: "#3498db", color: "#fff",
                        border: "none", borderRadius: "6px",
                        fontSize: "1rem", cursor: "pointer"
                    }}>
                        Activate Account
                    </button>
                </form>
            </div>
        </div>
    );
}