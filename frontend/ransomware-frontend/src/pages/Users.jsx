import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Users() {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({
        username: "", full_name: "", email: "", role: "analyst"
    });
    const [resetPasswords, setResetPasswords] = useState({});
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const fetchUsers = useCallback(() => {
        fetch("http://localhost:8000/api/v1/auth/users", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setUsers)
            .catch(() => {});
    }, [token]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const apiAction = async (url, method = "PATCH", body = null) => {
        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: body ? JSON.stringify(body) : null
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setError("");
            } else {
                setError(data.detail || "Action failed");
                setMessage("");
            }
            fetchUsers();
        } catch (err) {
            console.error(err);
            setError("Server error");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        await apiAction(
            "http://localhost:8000/api/v1/auth/register",
            "POST",
            form
        );
        setForm({ username: "", full_name: "", email: "", password: "", role: "analyst" });
    };

    return (
        <div>
            <h1>User Management</h1>

            {message && <p style={{ color: "green" }}>{message}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* ── Create User Form ── */}
            <div style={{
                background: "#fff", padding: "1.5rem", borderRadius: "8px",
                marginBottom: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}>
                <h3 style={{ marginTop: 0 }}>Create New User</h3>
                <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {[
                        { label: "Username", key: "username", type: "text" },
                        { label: "Full Name", key: "full_name", type: "text" },
                        { label: "Email", key: "email", type: "email" },
                    ].map(f => (
                        <div key={f.key}>
                            <label>{f.label}</label>
                            <input
                                type={f.type}
                                value={form[f.key]}
                                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                required={f.key !== "full_name" && f.key !== "email"}
                                style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
                            />
                        </div>
                    ))}
                    <div>
                        <label>Role</label>
                        <select
                            value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}
                            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                        >
                            <option value="analyst">Analyst</option>
                        </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <button type="submit" style={{
                            padding: "0.6rem 1.5rem", background: "#3498db",
                            color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer"
                        }}>
                            Create User
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Users Table ── */}
            <div style={{
                background: "#fff", padding: "1.5rem", borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflowX: "auto"
            }}>
                <h3 style={{ marginTop: 0 }}>Existing Users</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                        <tr style={{ borderBottom: "2px solid #eee" }}>
                            {["Username", "Full Name", "Email", "Role", "Status",
                              "Last Login", "Logins", "Failed", "Actions"].map(h => (
                                <th key={h} style={{ textAlign: "left", padding: "0.5rem" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{
                                borderBottom: "1px solid #eee",
                                background: !u.active ? "#fff5f5" : "inherit"
                            }}>
                                <td style={{ padding: "0.5rem" }}>
                                    {u.username}
                                    {u.force_password_reset && (
                                        <span style={{ marginLeft: "6px", fontSize: "0.75rem", color: "orange" }}>
                                            ⚠ reset required
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: "0.5rem" }}>{u.full_name || "—"}</td>
                                <td style={{ padding: "0.5rem" }}>{u.email || "—"}</td>
                                <td style={{ padding: "0.5rem" }}>
                                    <span style={{
                                        padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem",
                                        background: u.role === "admin" ? "#e74c3c" : "#3498db",
                                        color: "#fff"
                                    }}>
                                        {u.role}
                                    </span>
                                </td>
                                <td style={{ padding: "0.5rem" }}>
                                    <span style={{ color: u.active ? "green" : "red" }}>
                                        {u.active ? "Active" : "Suspended"}
                                    </span>
                                    {u.failed_attempts >= 5 && (
                                        <span style={{ marginLeft: "6px", fontSize: "0.75rem", color: "red" }}>
                                            🔒 Locked
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: "0.5rem", fontSize: "0.8rem", color: "#666" }}>
                                    {u.last_login
                                        ? new Date(u.last_login).toLocaleString()
                                        : "Never"
                                    }
                                </td>
                                <td style={{ padding: "0.5rem", textAlign: "center" }}>{u.login_count}</td>
                                <td style={{ padding: "0.5rem", textAlign: "center", color: u.failed_attempts > 0 ? "red" : "inherit" }}>
                                    {u.failed_attempts}
                                </td>
                                <td style={{ padding: "0.5rem" }}>
                                    {u.role !== "admin" && u.username !== localStorage.getItem("username") && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>

                                            {/* Suspend / Unsuspend */}
                                            <button onClick={() =>
                                                apiAction(`http://localhost:8000/api/v1/auth/users/${u.id}/suspend`)
                                            } style={{
                                                padding: "3px 8px", fontSize: "0.8rem", cursor: "pointer",
                                                background: u.active ? "#f39c12" : "#2ecc71",
                                                color: "#fff", border: "none", borderRadius: "4px"
                                            }}>
                                                {u.active ? "Suspend" : "Unsuspend"}
                                            </button>

                                            {/* Unlock */}
                                            {u.failed_attempts >= 5 && (
                                                <button onClick={() =>
                                                    apiAction(`http://localhost:8000/api/v1/auth/users/${u.id}/unlock`)
                                                } style={{
                                                    padding: "3px 8px", fontSize: "0.8rem", cursor: "pointer",
                                                    background: "#9b59b6", color: "#fff",
                                                    border: "none", borderRadius: "4px"
                                                }}>
                                                    Unlock
                                                </button>
                                            )}

                                            {/* Reset Password */}
                                            <div style={{ display: "flex", gap: "4px" }}>
                                                <input
                                                    type="password"
                                                    placeholder="New password"
                                                    value={resetPasswords[u.id] || ""}
                                                    onChange={e => setResetPasswords({
                                                        ...resetPasswords, [u.id]: e.target.value
                                                    })}
                                                    style={{ padding: "3px 6px", fontSize: "0.8rem", width: "110px" }}
                                                />
                                                <button onClick={() => {
                                                    if (!resetPasswords[u.id]) return;
                                                    apiAction(
                                                        `http://localhost:8000/api/v1/auth/users/${u.id}/reset-password`,
                                                        "PATCH",
                                                        { new_password: resetPasswords[u.id] }
                                                    );
                                                    setResetPasswords({ ...resetPasswords, [u.id]: "" });
                                                }} style={{
                                                    padding: "3px 8px", fontSize: "0.8rem", cursor: "pointer",
                                                    background: "#3498db", color: "#fff",
                                                    border: "none", borderRadius: "4px"
                                                }}>
                                                    Reset
                                                </button>
                                            </div>

                                            {/* Delete */}
                                            <button onClick={() =>
                                                apiAction(
                                                    `http://localhost:8000/api/v1/auth/users/${u.id}`,
                                                    "DELETE"
                                                )
                                            } style={{
                                                padding: "3px 8px", fontSize: "0.8rem", cursor: "pointer",
                                                background: "#e74c3c", color: "#fff",
                                                border: "none", borderRadius: "4px"
                                            }}>
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}