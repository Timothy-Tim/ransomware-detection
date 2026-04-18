import { useWebSocket } from "../context/useWebSocket";

function Monitor() {
    const { connected, events } = useWebSocket();

    return (
        <div style={{ padding: "20px" }}>
            <h2>Monitor</h2>
            <p>
                Status:{" "}
                <span style={{ color: connected ? "green" : "red" }}>
                    {connected ? "Connected ✅" : "Disconnected ❌"}
                </span>
            </p>

            <div style={{
                maxHeight: "400px",
                overflowY: "auto",
                border: "1px solid #ccc",
                padding: "10px",
                borderRadius: "5px",
            }}>
                {events.length === 0 ? (
                    <p style={{ color: "#aaa" }}>Monitoring active — events will appear here when agent detects activity.</p>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {events.map((e, i) => (
                            <li key={i} style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                                color: e.type === "ransomware_detected" ? "red" : "inherit"
                            }}>
                                <strong>{e.host || "agent"}</strong> — {e.type || e.status}
                                {e.file && <span style={{ color: "#666" }}> — {e.file}</span>}
                                {e.reason && <span style={{ color: "red" }}> ({e.reason})</span>}
                                <span style={{ color: "#aaa", marginLeft: "1rem", fontSize: "0.85rem" }}>
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

export default Monitor;