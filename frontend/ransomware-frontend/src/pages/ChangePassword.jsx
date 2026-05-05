import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function ChangePassword() {
    const { token } = useAuth();
    const [current, setCurrent] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (newPass !== confirm) {
            setError("New passwords do not match");
            return;
        }

        if (newPass.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            const res = await fetch("http://localhost:8000/api/v1/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: current,
                    new_password: newPass
                })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setCurrent("");
                setNewPass("");
                setConfirm("");
            } else {
                setError(data.detail || "Failed to change password");
            }
        } catch (err) {
            console.error("[ChangePassword] Error:", err);
            setError("Server error, please try again");
        }
    };

    return (
        <div>
            <h1>Change Password</h1>
            <div style={{
                background: "#fff",
                padding: "1.5rem",
                borderRadius: "8px",
                maxWidth: "400px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}>
                {message && <p style={{ color: "green" }}>{message}</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label>Current Password</label>
                        <input
                            type="password"
                            value={current}
                            onChange={e => setCurrent(e.target.value)}
                            required
                            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
                        />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <label>New Password</label>
                        <input
                            type="password"
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            required
                            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
                        />
                    </div>
                    <div style={{ marginBottom: "1.5rem" }}>
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
                        />
                    </div>
                    <button type="submit" style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "#3498db",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "1rem",
                        cursor: "pointer"
                    }}>
                        Change Password
                    </button>
                </form>
            </div>
        </div>
    );
}