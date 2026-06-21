import { useWebSocket } from "../context/useWebSocket";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

function StatCard({ icon, label, value, sub, subColor, topColor }) {
    return (
        <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderTop: `3px solid ${topColor || "var(--accent)"}`,
            borderRadius: 12,
            padding: "1.2rem",
            flex: 1,
            minWidth: 160,
            transition: "border-color 0.2s",
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.4rem" }}>
                        {label}
                    </div>
                    <div style={{ color: "var(--text-h)", fontSize: "2rem", fontWeight: "bold", lineHeight: 1 }}>{value}</div>
                    {sub && (
                        <div style={{ color: subColor || "var(--text-muted)", fontSize: "0.65rem", marginTop: "0.3rem" }}>{sub}</div>
                    )}
                </div>
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "var(--accent-dim)",
                    border: "1px solid var(--accent-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20,
                }}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

export default function DashboardHome() {
    const { connected, events, agentConnected } = useWebSocket();
    const { token } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [recoveryTasks, setRecoveryTasks] = useState([]);

    useEffect(() => {
        const headers = { Authorization: `Bearer ${token}` };

        fetch("http://localhost:8000/api/v1/alerts", { headers })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setAlerts(data); })
            .catch(() => {});

        fetch("http://localhost:8000/api/v1/recovery/tasks", { headers })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setRecoveryTasks(data); })
            .catch(() => {});

        const interval = setInterval(() => {
            fetch("http://localhost:8000/api/v1/alerts", { headers })
                .then(r => r.json())
                .then(data => { if (Array.isArray(data)) setAlerts(data); })
                .catch(() => {});
            fetch("http://localhost:8000/api/v1/recovery/tasks", { headers })
                .then(r => r.json())
                .then(data => { if (Array.isArray(data)) setRecoveryTasks(data); })
                .catch(() => {});
        }, 10000);
        return () => clearInterval(interval);
    }, [token]);

    const recentAlerts    = alerts.slice(0, 5);
    const activeAlerts    = alerts.filter(a => a.status === "active").length;
    const totalAlerts     = alerts.length;
    const recoveringCount = recoveryTasks.filter(t => t.status === "recovering").length;
    const activeRecovery  = recoveryTasks.find(t => t.status === "recovering");

    const severityColor = (reason) => {
        if (!reason) return { bg: "var(--success-dim)", color: "var(--success)", label: "LOW" };
        if (reason.includes("extension")) return { bg: "var(--danger-dim)", color: "var(--danger)", label: "CRITICAL" };
        if (reason.includes("entropy"))   return { bg: "var(--warning-dim)", color: "var(--warning)", label: "HIGH" };
        return { bg: "var(--info-dim)", color: "var(--info)", label: "MEDIUM" };
    };

    const systemHealthItems = [
        { label: "File System Monitor", active: true },
        { label: "Entropy Analysis",    active: true },
        { label: "Extension Detection", active: true },
        { label: "WebSocket Agent",     active: agentConnected },
        { label: "S3 Backup Service",   active: true },
    ];

    const card = {
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "1.2rem",
    };

    return (
        <div style={{ color: "var(--text)", fontFamily: "'Courier New', monospace" }}>

            {/* Page Header */}
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "bold", color: "var(--text-h)" }}>
                    Detection & Monitoring Dashboard
                </h1>
                <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    Real-time overview of your system security and threat detection
                </p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <StatCard
                    label="System Status"
                    value={<span style={{ color: connected ? "var(--success)" : "var(--danger)", fontSize: "1.4rem" }}>{connected ? "Online" : "Offline"}</span>}
                    sub={connected ? "All systems operational" : "Check connection"}
                    subColor={connected ? "var(--success)" : "var(--danger)"}
                    icon="✓"
                    topColor={connected ? "var(--success)" : "var(--danger)"}
                />
                <StatCard
                    label="Agent Status"
                    value={<span style={{ color: agentConnected ? "var(--success)" : "var(--warning)", fontSize: "1.4rem" }}>{agentConnected ? "Connected" : "Disconnected"}</span>}
                    sub={agentConnected ? "1/1 agents connected" : "No agents connected"}
                    subColor={agentConnected ? "var(--success)" : "var(--warning)"}
                    icon="📡"
                    topColor={agentConnected ? "var(--success)" : "var(--warning)"}
                />
                <StatCard
                    label="Total Alerts"
                    value={<span style={{ color: "var(--danger)" }}>{totalAlerts}</span>}
                    sub={`+${activeAlerts} active`}
                    subColor="var(--warning)"
                    icon="🛡"
                    topColor="var(--danger)"
                />
                <StatCard
                    label="Active Alerts"
                    value={<span style={{ color: "var(--warning)" }}>{activeAlerts}</span>}
                    sub="Requires attention"
                    subColor="var(--warning)"
                    icon="🔔"
                    topColor="var(--warning)"
                />
                <StatCard
                    label="Recovering"
                    value={<span style={{ color: "var(--info)" }}>{recoveringCount}</span>}
                    sub="In recovery process"
                    subColor="var(--info)"
                    icon="↺"
                    topColor="var(--info)"
                />
            </div>

            {/* Middle Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>

                {/* Recent Events */}
                <div style={card}>
                    <h3 style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--text-h)", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Recent Events
                    </h3>
                    {events.length === 0 ? (
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "2rem 0" }}>
                            Monitoring active — waiting for agent activity...
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {events.slice(-5).reverse().map((e, i) => {
                                const sev = severityColor(e.reason);
                                return (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "center", gap: "0.75rem",
                                        padding: "0.5rem 0", borderBottom: "1px solid var(--border)"
                                    }}>
                                        <span style={{
                                            padding: "2px 8px", borderRadius: 4,
                                            background: sev.bg, color: sev.color,
                                            fontSize: "0.6rem", fontWeight: "bold",
                                            minWidth: 60, textAlign: "center"
                                        }}>{sev.label}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: "var(--text-h)", fontSize: "0.75rem" }}>{e.type || e.status}</div>
                                            <div style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>{e.file || e.reason || ""}</div>
                                        </div>
                                        <span style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>
                                            {e.timestamp ? new Date(e.timestamp * 1000).toLocaleTimeString() : new Date().toLocaleTimeString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* System Health */}
                <div style={card}>
                    <h3 style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--text-h)", textTransform: "uppercase", letterSpacing: "1px" }}>
                        System Health
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {systemHealthItems.map((item, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "0.5rem 0.75rem",
                                background: "var(--bg-secondary)",
                                borderRadius: 8,
                                border: "1px solid var(--border)"
                            }}>
                                <span style={{ color: "var(--text)", fontSize: "0.75rem" }}>{item.label}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <div style={{
                                        width: 6, height: 6, borderRadius: "50%",
                                        background: item.active ? "var(--success)" : "var(--danger)",
                                        boxShadow: item.active ? "0 0 6px var(--success)" : "0 0 6px var(--danger)"
                                    }} />
                                    <span style={{ color: item.active ? "var(--success)" : "var(--danger)", fontSize: "0.65rem" }}>
                                        {item.active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Alerts Table */}
            <div style={{ ...card, marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-h)", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Recent Alerts
                    </h3>
                    <a href="/alerts" style={{ color: "var(--accent)", fontSize: "0.75rem" }}>
                        View All Alerts →
                    </a>
                </div>

                {recentAlerts.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "1.5rem 0" }}>
                        No alerts yet
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                {["TIME", "SEVERITY", "EVENT", "HOST", "STATUS"].map(h => (
                                    <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontSize: "0.65rem", letterSpacing: "1px" }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {recentAlerts.map((a, i) => {
                                const sev = severityColor(a.reason);
                                return (
                                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                                        <td style={{ padding: "0.75rem", color: "var(--text-muted)", fontSize: "0.72rem" }}>
                                            {new Date(a.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: "0.75rem" }}>
                                            <span style={{
                                                padding: "2px 8px", borderRadius: 4,
                                                background: sev.bg, color: sev.color,
                                                fontSize: "0.62rem", fontWeight: "bold"
                                            }}>{sev.label}</span>
                                        </td>
                                        <td style={{ padding: "0.75rem" }}>
                                            <div style={{ color: "var(--text-h)", fontSize: "0.75rem" }}>Ransomware Detected</div>
                                            <div style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>{a.reason}</div>
                                        </td>
                                        <td style={{ padding: "0.75rem", color: "var(--text)", fontSize: "0.72rem" }}>{a.host}</td>
                                        <td style={{ padding: "0.75rem" }}>
                                            <span style={{
                                                padding: "2px 10px", borderRadius: 12,
                                                background: a.status === "active" ? "var(--danger-dim)" : "var(--success-dim)",
                                                color: a.status === "active" ? "var(--danger)" : "var(--success)",
                                                fontSize: "0.65rem",
                                                border: `1px solid ${a.status === "active" ? "var(--danger)" : "var(--success)"}`,
                                            }}>
                                                {a.status === "active" ? "Active" : "Resolved"}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Active Recovery */}
            {activeRecovery && (
                <div style={card}>
                    <h3 style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--text-h)", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Active Recovery
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{ fontSize: "1.5rem" }}>📦</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "var(--text-h)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                                Restoring encrypted files — {activeRecovery.host}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "0.5rem" }}>
                                {activeRecovery.files?.length || 0} file(s) affected
                            </div>
                            <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{
                                    height: "100%", width: "60%",
                                    background: "linear-gradient(90deg, var(--accent), var(--info))",
                                    borderRadius: 3,
                                }} />
                            </div>
                        </div>
                        <span style={{ color: "var(--accent)", fontWeight: "bold", fontSize: "0.9rem" }}>In Progress</span>
                    </div>
                </div>
            )}
        </div>
    );
}