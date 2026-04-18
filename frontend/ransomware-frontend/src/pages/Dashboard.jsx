import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
    const location = useLocation();
    const { logout } = useAuth();  // ✅ single useAuth call, no username
    const navigate = useNavigate();

    const links = [
        { to: "/", label: "🏠 Dashboard" },
        { to: "/monitor", label: "🖥️ Monitor" },
        { to: "/alerts", label: "🚨 Alerts" },
        { to: "/backup", label: "💾 Backup" },
        { to: "/recovery", label: "🔄 Recovery" },
        ...(localStorage.getItem("role") === "admin" ? [{ to: "/users", label: "👥 Users" }] : [])
    ];

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif" }}>
            <aside style={{
                width: "220px",
                background: "#1e1e2e",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                padding: "1.5rem 1rem",
            }}>
                <h2 style={{ fontSize: "0.85rem", color: "#aaa", marginBottom: "2rem", textTransform: "uppercase" }}>
                    Ransomware Detection
                </h2>
                <nav style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
                    {links.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            style={{
                                padding: "0.6rem 1rem",
                                borderRadius: "6px",
                                textDecoration: "none",
                                color: location.pathname === link.to ? "#fff" : "#aaa",
                                background: location.pathname === link.to ? "#3b3b5c" : "transparent",
                                fontWeight: location.pathname === link.to ? "bold" : "normal",
                                fontSize: "0.9rem"
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
                <button
                    onClick={handleLogout}
                    style={{
                        marginTop: "auto",
                        padding: "0.6rem 1rem",
                        background: "#e74c3c",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.9rem"
                    }}
                >
                    🚪 Logout
                </button>
            </aside>
            <main style={{ flex: 1, padding: "2rem", overflowY: "auto", background: "#f5f5f5" }}>
                <Outlet />
            </main>
        </div>
    );
}