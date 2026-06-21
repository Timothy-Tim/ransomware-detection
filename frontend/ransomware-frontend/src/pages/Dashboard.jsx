import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWebSocket } from "../context/useWebSocket";
import ThemeToggle from "../components/ThemeToggle";

const SIDEBAR_WIDTH = 220;

const navIcons = {
    "/":          "⬡",
    "/monitor":   "◉",
    "/alerts":    "△",
    "/backup":    "▦",
    "/recovery":  "↺",
    "/settings":  "⚙",
    "/users":     "◎",
};

const navItems = [
    { to: "/",         label: "Dashboard" },
    { to: "/monitor",  label: "Monitor" },
    { to: "/alerts",   label: "Alerts" },
    { to: "/backup",   label: "Backup" },
    { to: "/recovery", label: "Recovery" },
    { to: "/settings", label: "Settings" },
    { to: "/users",    label: "Users" },
];

export default function Dashboard() {
    const { logout, user } = useAuth();
    const { connected, agentConnected } = useWebSocket();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div style={{ display: "flex", width: "100vw", minHeight: "100vh", background: "var(--bg)" }}>

            {/* ── SIDEBAR ── */}
            <aside style={{
                width: `${SIDEBAR_WIDTH}px`,
                minHeight: "100vh",
                background: "var(--bg-sidebar)",
                borderRight: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                position: "fixed",
                top: 0, left: 0, bottom: 0,
                zIndex: 100,
                overflowY: "auto",
            }}>

                {/* Logo */}
                <div style={{
                    padding: "1.4rem 1.25rem",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                }}>
                    <div style={{
                        width: 30, height: 30,
                        background: "var(--accent-dim)",
                        border: "1px solid var(--accent-border)",
                        borderRadius: 6,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--accent)", fontSize: "1rem",
                    }}>🛡</div>
                    <div>
                        <div style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            Ransomware
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                            Detection System
                        </div>
                    </div>
                </div>

                {/* Status pills */}
                <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <StatusPill label="System" active={connected} activeText="Online" inactiveText="Offline" />
                    <StatusPill label="Agent" active={agentConnected} activeText="Connected" inactiveText="Disconnected" />
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "0.75rem 0" }}>
                    {navItems.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/"}
                            style={({ isActive }) => ({
                                display: "flex",
                                alignItems: "center",
                                gap: "0.65rem",
                                padding: "0.65rem 1.25rem",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                textDecoration: "none",
                                borderLeft: "2px solid transparent",
                                transition: "all 0.18s",
                                color:           isActive ? "var(--accent)" : "var(--text-muted)",
                                background:      isActive ? "var(--accent-dim)" : "transparent",
                                borderLeftColor: isActive ? "var(--accent)" : "transparent",
                            })}
                        >
                            <span style={{ fontSize: "0.9rem", opacity: 0.8 }}>{navIcons[to]}</span>
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* User / Logout */}
                <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border)" }}>
                    <div style={{
                        background: "var(--accent-dim)",
                        border: "1px solid var(--accent-border)",
                        borderRadius: 8,
                        padding: "0.75rem",
                        marginBottom: "0.75rem",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: "50%",
                                background: "var(--accent-dim)",
                                border: "1px solid var(--accent-border)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "var(--accent)", fontSize: "0.75rem", fontWeight: 700,
                            }}>
                                {user?.username?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div>
                                <div style={{ color: "var(--text-h)", fontSize: "0.75rem", fontWeight: 600 }}>
                                    {user?.username || "Admin"}
                                </div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    {user?.role || "admin"}
                                </div>
                            </div>
                        </div>
                        <div style={{ color: "var(--accent)", fontSize: "0.6rem", textAlign: "center", marginTop: "0.25rem", letterSpacing: "0.1em" }}>
                            🛡 PROTECTED
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.55rem", textAlign: "center" }}>
                            All systems secure
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: "100%",
                            padding: "0.5rem",
                            background: "var(--danger-dim)",
                            border: "1px solid var(--danger)",
                            color: "var(--danger)",
                            borderRadius: 6,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "all 0.18s",
                            fontFamily: "inherit",
                        }}
                    >
                        ⏻ Logout
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <div style={{
                marginLeft: `${SIDEBAR_WIDTH}px`,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                width: `calc(100vw - ${SIDEBAR_WIDTH}px)`,
                background: "var(--bg)",
            }}>

                {/* Topbar */}
                <header style={{
                    height: 56,
                    background: "var(--bg-secondary)",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 1.75rem",
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                    flexShrink: 0,
                }}>
                    {/* Left — status */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            {connected
                                ? <><span style={{ color: "#22c55e" }}>●</span>&nbsp; System Online</>
                                : <><span style={{ color: "#ef4444" }}>●</span>&nbsp; System Offline</>}
                        </span>
                        <span style={{ color: "var(--border)" }}>|</span>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            {agentConnected
                                ? <><span style={{ color: "#22c55e" }}>●</span>&nbsp; Agent Connected</>
                                : <><span style={{ color: "#f59e0b" }}>●</span>&nbsp; No Agent</>}
                        </span>
                    </div>

                    {/* Right — theme toggle + date + user */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <ThemeToggle />
                        <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontFamily: "monospace" }}>
                            {new Date().toLocaleString()}
                        </span>
                        <div style={{
                            display: "flex", alignItems: "center", gap: "0.5rem",
                            background: "var(--accent-dim)",
                            border: "1px solid var(--accent-border)",
                            borderRadius: 6,
                            padding: "0.3rem 0.75rem",
                        }}>
                            <div style={{
                                width: 24, height: 24, borderRadius: "50%",
                                background: "var(--accent-dim)",
                                border: "1px solid var(--accent-border)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "var(--accent)", fontSize: "0.7rem", fontWeight: 700,
                            }}>
                                {user?.username?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div>
                                <div style={{ color: "var(--text-h)", fontSize: "0.72rem", fontWeight: 600 }}>{user?.username || "Admin"}</div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.58rem", textTransform: "uppercase" }}>{user?.role || "admin"}</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, padding: "1.75rem", overflowX: "hidden", background: "var(--bg)" }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

function StatusPill({ label, active, activeText, inactiveText }) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {label}
            </span>
            <span style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                fontSize: "0.62rem", fontWeight: 700,
                color: active ? "#22c55e" : "#f59e0b",
            }}>
                <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: active ? "#22c55e" : "#f59e0b",
                    boxShadow: `0 0 5px ${active ? "#22c55e" : "#f59e0b"}`,
                    display: "inline-block",
                }} />
                {active ? activeText : inactiveText}
            </span>
        </div>
    );
}