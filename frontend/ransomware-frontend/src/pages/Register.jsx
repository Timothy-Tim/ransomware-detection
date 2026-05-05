import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        company_name: "",
        email: "",
        admin_username: "",
        admin_password: "",
        confirm_password: ""
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (form.admin_password !== form.confirm_password) {
            setError("Passwords do not match");
            return;
        }

        if (form.admin_password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            const res = await fetch("http://localhost:8000/api/v1/auth/company/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company_name: form.company_name,
                    email: form.email,
                    admin_username: form.admin_username,
                    admin_password: form.admin_password
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(data.message + " Redirecting to login...");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setError(data.detail || "Registration failed");
            }
        } catch (err) {
            console.error("[Register] Error:", err);
            setError("Server error, please try again");
        }
    };

    return (
        <div style={{
            display: "flex", justifyContent: "center",
            alignItems: "center", minHeight: "100vh",
            background: "#f5f5f5", fontFamily: "Arial, sans-serif"
        }}>
            <div style={{
                padding: "2rem", background: "#fff",
                borderRadius: "8px", width: "100%", maxWidth: "420px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.1)"
            }}>
                <h1 style={{ marginBottom: "0.25rem" }}>Register Your Company</h1>
                <p style={{ color: "#888", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                    Create an admin account to protect your company
                </p>

                {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}
                {success && <p style={{ color: "green", marginBottom: "1rem" }}>{success}</p>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label>Company Name</label>
                        <input
                            type="text"
                            name="company_name"
                            value={form.company_name}
                            onChange={handleChange}
                            required
                            placeholder="Acme Corp"
                            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
                        />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <label>Company Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="admin@acmecorp.com"
                            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
                        />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <label>Admin Username</label>
                        <input
                            type="text"
                            name="admin_username"
                            value={form.admin_username}
                            onChange={handleChange}
                            required
                            placeholder="john_admin"
                            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
                        />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <label>Password</label>
                        <input
                            type="password"
                            name="admin_password"
                            value={form.admin_password}
                            onChange={handleChange}
                            required
                            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
                        />
                    </div>
                    <div style={{ marginBottom: "1.5rem" }}>
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            name="confirm_password"
                            value={form.confirm_password}
                            onChange={handleChange}
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
                        Register Company
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "1rem", color: "#888", fontSize: "0.9rem" }}>
                    Already registered? <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
}