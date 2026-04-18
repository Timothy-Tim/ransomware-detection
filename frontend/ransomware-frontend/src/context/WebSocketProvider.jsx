import { useEffect, useRef, useState } from "react";
import { WebSocketContext } from "./WebSocketContext";

export function WebSocketProvider({ children }) {
    const [connected, setConnected] = useState(false);
    const [events, setEvents] = useState([]);
    const [agentConnected, setAgentConnected] = useState(false);
    const wsRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const connect = async () => {
            // ✅ Get token from storage — no need to fetch agent_identity
            const token = localStorage.getItem("access_token");
            if (!token) {
                console.log("[WS] No token, retrying in 3s...");
                if (!cancelled) setTimeout(connect, 3000);
                return;
            }

            // ✅ Use a fixed host label for the dashboard listener
            // This can be the logged-in username or any identifier
            // const host = localStorage.getItem("username") || "dashboard";

            const host = "all";

            console.log(`[WS] Connecting as: ${host}`);

            const ws = new WebSocket(
                `ws://localhost:8000/api/v1/monitor/ws/frontend/all?token=${token}`);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                console.log("[WS] Connected to backend");
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("[WS] Message received:", data);
                if (data.type === "agent_status") {
                    setAgentConnected(data.connected);
                    return;
                }
                setEvents((prev) => [...prev.slice(-99), data]);
            };

            ws.onclose = () => {
                setConnected(false);
                setAgentConnected(false);
                if (!cancelled) setTimeout(connect, 3000);
            };

            ws.onerror = () => ws.close();
        };

        connect();

        return () => {
            cancelled = true;
            wsRef.current?.close();
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ connected, events, agentConnected }}>
            {children}
        </WebSocketContext.Provider>
    );
}