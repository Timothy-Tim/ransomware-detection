import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Users() {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("analyst");
    const [message, setMessage] = useState("");

    const fetchUsers = useCallback(() => {
        fetch("http://localhost:8000/api/v1/auth/users", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setUsers)
            .catch(() => {});
    }, [token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:8000/api/v1/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ username, password, role })
            });
            const data = await res.json();
            setMessage(data.message || data.detail);
            setUsername("");
            setPassword("");
            fetchUsers();
        } catch (err) {
            console.error("[Users] Create error:", err);
            setMessage("Error creating user");
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete user ${name}?`)) return;
        try {
            const res = await fetch(`http://localhost:8000/api/v1/auth/users/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setMessage(data.message || data.detail);
            fetchUsers();
        } catch (err) {
            console.error("[Users] Delete error:", err);
            setMessage("Error deleting user");
        }
    };

    return (
        <div>
            <h1>User Management</h1>

            {message && (
                <p style={{ color: "green", marginBottom: "1rem" }}>{message}</p>
            )}

            <div style={{
                background: "#fff", padding: "1.5rem",
                borderRadius: "8px", marginBottom: "2rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}>
                <h3 style={{ marginTop: 0 }}>Create New User</h3>
                <form onSubmit={handleCreate}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                        />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                        />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <label>Role</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                        >
                            <option value="analyst">Analyst</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button type="submit" style={{
                        padding: "0.6rem 1.5rem",
                        background: "#3498db",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                    }}>
                        Create User
                    </button>
                </form>
            </div>

            <div style={{
                background: "#fff", padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}>
                <h3 style={{ marginTop: 0 }}>Existing Users</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "2px solid #eee" }}>Username</th>
                            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "2px solid #eee" }}>Role</th>
                            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "2px solid #eee" }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "0.5rem" }}>{u.username}</td>
                                <td style={{ padding: "0.5rem" }}>
                                    <span style={{
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        background: u.role === "admin" ? "#e74c3c" : "#3498db",
                                        color: "#fff",
                                        fontSize: "0.8rem"
                                    }}>
                                        {u.role}
                                    </span>
                                </td>
                                <td style={{ padding: "0.5rem" }}>
                                    <button
                                        onClick={() => handleDelete(u.id, u.username)}
                                        style={{
                                            padding: "4px 12px",
                                            background: "#e74c3c",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}