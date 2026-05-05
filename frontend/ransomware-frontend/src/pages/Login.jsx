import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function Login() {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await fetch("http://localhost:8000/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ username, password }),
            });

            if (!res.ok) {
                setError("Invalid username or password");
                return;
            }

           const data = await res.json();

           if (res.ok) {
           login(data.access_token, data.username);
           localStorage.setItem("role", data.role);

         // Redirect to change password if forced reset
        if (data.force_password_reset) {
          navigate("/change-password");
        } else {
          navigate("/");
        }
        } else {
          setError(data.detail || "Invalid username or password");
        }
        } catch (err) {
          console.error("[Login] Error:", err);
          setError("Server error, please try again");
        }    
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "blue" }}>
            <div style={{ padding: "2rem", border: "1px solid #ccc", borderRadius: "8px", background: "#f9f9f9" }}>
                <h1>Login</h1>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ display: "block", width: "100%", marginTop: "0.25rem" }}
                        />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ display: "block", width: "100%", marginTop: "0.25rem" }}
                        />
                    </div>
                    <button type="submit">Login</button>
                </form>
                <p style={{ textAlign: "center", marginTop: "1rem", color: "#888", fontSize: "0.9rem" }}>
                    New company? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
}