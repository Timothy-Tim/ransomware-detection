import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

useEffect(() => {
    const fetchAlerts = () => {
        fetch("http://localhost:8000/api/v1/alerts/", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setAlerts(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
}, [token]);
    if (loading) return <p>Loading alerts...</p>;

    return (
        <div>
            <h1>Alerts</h1>
            {alerts.length === 0 ? (
                <p>No alerts yet</p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {alerts.map(a => (
                        <li key={a.id} style={{
                            padding: "1rem",
                            marginBottom: "0.5rem",
                            border: "1px solid #eee",
                            borderRadius: "6px",
                            borderLeft: `4px solid ${a.severity === "high" ? "red" : "orange"}`
                        }}>
                            <strong>[{a.severity.toUpperCase()}]</strong> {a.host}
                            {a.reason && <span> — {a.reason}</span>}
                            {a.file && <div style={{ fontSize: "0.85rem", color: "#666" }}>File: {a.file}</div>}
                            <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                                <span style={{ color: a.status === "active" ? "red" : "green" }}>
                                    {a.status}
                                </span>
                                <span style={{ color: "#aaa", marginLeft: "1rem" }}>
                                    {a.timestamp}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}