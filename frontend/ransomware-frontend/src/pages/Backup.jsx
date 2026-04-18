import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function BackupPage() {
    const { token } = useAuth();
    const [paths, setPaths] = useState("");
    const [agentId, setAgentId] = useState(null);
    const [agentConnected, setAgentConnected] = useState(false);

    useEffect(() => {
        // ✅ Check agent status via HTTP, not WebSocket
        fetch("http://localhost:8000/api/v1/monitor/agents", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                // data is a list of connected agent hostnames
                if (data.length > 0) {
                    setAgentConnected(true);
                    setAgentId(data[0]); // use first connected agent
                }
            })
            .catch(() => setAgentConnected(false));
    }, [token]);

    const status = agentConnected
        ? `Agent connected: ${agentId}`
        : "Agent not loaded. Start the agent to enable backup.";

    const handleBackup = async () => {
        if (!paths.trim()) { alert("Enter at least one path"); return; }
        if (!agentConnected) { alert("Agent not connected."); return; }

        const pathArray = paths.split(",").map(p => p.trim());
        try {
            const res = await fetch("http://localhost:8000/api/v1/backup/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ agent_id: agentId, paths: pathArray }),
            });
            const data = await res.json().catch(() => ({}));
            alert(data.status || "Backup request sent");
        } catch (err) {
            alert("Error sending backup request: " + err.message);
        }
    };

    return (
        <div style={{
            padding: "20px",
            maxWidth: "500px",
            margin: "40px auto",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontFamily: "Arial, sans-serif"
        }}>
            <h1>Trigger Backup</h1>
            <input
                type="text"
                placeholder="/home/user/documents, /var/www/html"
                value={paths}
                onChange={(e) => setPaths(e.target.value)}
                style={{ width: "100%", marginBottom: "10px", padding: "8px", fontSize: "14px" }}
            />
            <button
                onClick={handleBackup}
                disabled={!agentConnected}
                style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "16px",
                    cursor: agentConnected ? "pointer" : "not-allowed",
                    backgroundColor: agentConnected ? "#4CAF50" : "#ccc",
                    color: agentConnected ? "#fff" : "#666",
                    border: "none",
                    borderRadius: "4px"
                }}
            >
                Start Backup
            </button>
            <p style={{ marginTop: "15px", color: agentConnected ? "green" : "orange" }}>
                {status}
            </p>
        </div>
    );
}