import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

const severityConfig = {
    high:     { color: "#ff4560", bg: "rgba(255,69,96,0.1)",   border: "#ff4560", label: "HIGH" },
    medium:   { color: "#ffb830", bg: "rgba(255,184,48,0.1)",  border: "#ffb830", label: "MEDIUM" },
    low:      { color: "#00e396", bg: "rgba(0,227,150,0.1)",   border: "#00e396", label: "LOW" },
    critical: { color: "#ff4560", bg: "rgba(255,69,96,0.15)",  border: "#ff4560", label: "CRITICAL" },
};

function getSeverity(a) {
    return severityConfig[a.severity?.toLowerCase()] || severityConfig.medium;
}

export default function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        const fetchAlerts = () => {
            fetch("http://localhost:8000/api/v1/alerts", {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setAlerts(data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000);
        return () => clearInterval(interval);
    }, [token]);

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#5a6a85", padding: "2rem", fontFamily: "monospace" }}>
            <div style={{
                width: 16, height: 16, border: "2px solid #1e2d40",
                borderTopColor: "#00d4ff", borderRadius: "50%",
                animation: "spin 0.7s linear infinite"
            }} />
            Loading alerts...
        </div>
    );

    return (
        <div style={{ color: "#e2e8f0", fontFamily: "'Courier New', monospace" }}>

            {/* Header */}
            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "bold", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        🛡 Alerts
                    </h1>
                    <p style={{ margin: "0.25rem 0 0", color: "#5a6a85", fontSize: "0.8rem" }}>
                        {alerts.length} alert{alerts.length !== 1 ? "s" : ""} total
                        &nbsp;·&nbsp;
                        {alerts.filter(a => a.status === "active").length} active
                    </p>
                </div>
                <div style={{
                    padding: "0.4rem 1rem",
                    background: "rgba(0,212,255,0.08)",
                    border: "1px solid rgba(0,212,255,0.2)",
                    borderRadius: 6,
                    color: "#00d4ff",
                    fontSize: "0.7rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase"
                }}>
                    ● Live
                </div>
            </div>

            {/* Empty state */}
            {alerts.length === 0 ? (
                <div style={{
                    background: "#111722",
                    border: "1px solid #1e2d40",
                    borderRadius: 12,
                    padding: "3rem",
                    textAlign: "center",
                    color: "#5a6a85"
                }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🛡</div>
                    <div style={{ fontSize: "0.9rem", marginBottom: "0.25rem", color: "#00e396" }}>No alerts detected</div>
                    <div style={{ fontSize: "0.75rem" }}>System is monitoring — no threats found yet</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {alerts.map(a => {
                        const sev = getSeverity(a);
                        return (
                            <div key={a.id} style={{
                                background: "#111722",
                                border: "1px solid #1e2d40",
                                borderLeft: `4px solid ${sev.border}`,
                                borderRadius: 10,
                                padding: "1rem 1.25rem",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "1rem",
                                transition: "background 0.2s",
                            }}>
                                {/* Severity badge */}
                                <div style={{
                                    padding: "3px 10px",
                                    background: sev.bg,
                                    color: sev.color,
                                    border: `1px solid ${sev.border}`,
                                    borderRadius: 4,
                                    fontSize: "0.65rem",
                                    fontWeight: "bold",
                                    letterSpacing: "0.1em",
                                    whiteSpace: "nowrap",
                                    marginTop: "2px",
                                    minWidth: 65,
                                    textAlign: "center"
                                }}>
                                    {sev.label}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                                        <span style={{ color: "#fff", fontWeight: "bold", fontSize: "0.85rem" }}>
                                            {a.host}
                                        </span>
                                        {a.reason && (
                                            <span style={{ color: "#5a6a85", fontSize: "0.75rem" }}>— {a.reason}</span>
                                        )}
                                    </div>

                                    {a.file && (
                                        <div style={{
                                            fontSize: "0.75rem",
                                            color: "#00d4ff",
                                            background: "rgba(0,212,255,0.06)",
                                            border: "1px solid rgba(0,212,255,0.15)",
                                            borderRadius: 4,
                                            padding: "2px 8px",
                                            display: "inline-block",
                                            marginBottom: "0.35rem",
                                            wordBreak: "break-all"
                                        }}>
                                            📄 {a.file}
                                        </div>
                                    )}

                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                                        <span style={{
                                            display: "flex", alignItems: "center", gap: "0.35rem",
                                            color: a.status === "active" ? "#ff4560" : "#00e396",
                                            fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em"
                                        }}>
                                            <span style={{
                                                width: 6, height: 6, borderRadius: "50%",
                                                background: a.status === "active" ? "#ff4560" : "#00e396",
                                                display: "inline-block"
                                            }} />
                                            {a.status}
                                        </span>
                                        <span style={{ color: "#3d4f68", fontSize: "0.7rem" }}>
                                            {a.timestamp ? new Date(a.timestamp).toLocaleString() : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}