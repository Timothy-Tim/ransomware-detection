import { useWebSocket } from "../context/useWebSocket";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function DashboardHome() {
    const { connected, events } = useWebSocket();
    const { token } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [recoveryTasks, setRecoveryTasks] = useState([]);
    const [agentConnected, setAgentConnected] = useState(false);

    useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };

    fetch("http://localhost:8000/api/v1/monitor/agents", { headers })
        .then(r => r.json())
        .then(data => setAgentConnected(Array.isArray(data) && data.length > 0))
        .catch(() => setAgentConnected(false));

    fetch("http://localhost:8000/api/v1/alerts/", { headers })
        .then(r => r.json())
        .then(data => setAlerts(Array.isArray(data) ? data : []))  // ✅ guard
        .catch(() => setAlerts([]));

    fetch("http://localhost:8000/api/v1/recovery/tasks", { headers })
        .then(r => r.json())
        .then(data => setRecoveryTasks(Array.isArray(data) ? data : []))  // ✅ guard
        .catch(() => setRecoveryTasks([]));

}, [token]);;

    const recentEvents = events.slice(-5).reverse();

    const cardStyle = {
        background: "#fff",
        borderRadius: "8px",
        padding: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        minWidth: "150px",
        flex: 1,
    };

    return (
        <div>
            <h2 style={{ marginBottom: "1.5rem" }}>Detection & Monitoring Dashboard</h2>

            {/* Status Cards */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                <div style={{ ...cardStyle, borderLeft: "4px solid #3498db" }}>
                    <p style={{ color: "#888", fontSize: "0.8rem", margin: 0 }}>SYSTEM</p>
                    <p style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                        {connected ? "🟢 Online" : "🔴 Offline"}
                    </p>
                </div>

                <div style={{ ...cardStyle, borderLeft: "4px solid #2ecc71" }}>
                    <p style={{ color: "#888", fontSize: "0.8rem", margin: 0 }}>AGENT</p>
                    <p style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                        {agentConnected ? "🟢 Connected" : "🟡 Disconnected"}
                    </p>
                </div>

                <div style={{ ...cardStyle, borderLeft: "4px solid #e74c3c" }}>
                    <p style={{ color: "#888", fontSize: "0.8rem", margin: 0 }}>TOTAL ALERTS</p>
                    <p style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                        {alerts.length}
                    </p>
                </div>

                <div style={{ ...cardStyle, borderLeft: "4px solid #f39c12" }}>
                   <p style={{ color: "#888", fontSize: "0.8rem", margin: 0 }}>ACTIVE ALERTS</p>
                   <p style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                        {alerts.filter(a => a.resolved === false).length}  {/* ✅ use resolved field */}
                    </p>
                </div>

                <div style={{ ...cardStyle, borderLeft: "4px solid #9b59b6" }}>
                    <p style={{ color: "#888", fontSize: "0.8rem", margin: 0 }}>RECOVERING</p>
                    <p style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                        {recoveryTasks.filter(t => t.status === "recovering").length}
                    </p>
                </div>
            </div>

            {/* Recent Events */}
            <div style={{ background: "#fff", borderRadius: "8px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <h3 style={{ marginTop: 0 }}>Recent Events</h3>
                {recentEvents.length === 0 ? (
                    <p style={{ color: "#aaa" }}>No events yet — waiting for agent activity...</p>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {recentEvents.map((e, i) => (
                            <li key={i} style={{
                                padding: "0.75rem",
                                borderBottom: "1px solid #f0f0f0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <span>
                                    <strong>{e.host}</strong> — {e.type || e.status}
                                </span>
                                <span style={{ color: "#aaa", fontSize: "0.85rem" }}>
                                    {e.timestamp
                                        ? new Date(e.timestamp * 1000).toLocaleTimeString()
                                        : new Date().toLocaleTimeString()
                                    }
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}