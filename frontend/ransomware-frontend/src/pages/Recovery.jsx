import { useEffect, useState, useCallback, useRef } from "react";
import { getRecoveryTasks, startRecovery } from "../api/recovery";
import { useWebSocket } from "../context/useWebSocket";
import { useAuth } from "../hooks/useAuth";

export default function Recovery() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [countdown, setCountdown] = useState(null); // { taskId, seconds }
    const countdownRef = useRef(null);
    const tasksRef = useRef([]);
    const { lastMessage } = useWebSocket();
    const { token } = useAuth();

    // ── Fetch tasks ──────────────────────────────────────────────────────────
    const fetchTasks = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            const data = await getRecoveryTasks();
            const safe = Array.isArray(data) ? data : [];
            setTasks(safe);
            tasksRef.current = safe;
        } catch (err) {
            console.error(err);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    useEffect(() => {
    fetchTasks(true);
}, [fetchTasks]);

    // ── Listen to WebSocket for auto-recovery events ─────────────────────────
    useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
        case "auto_recovery_pending":
            setCountdown({
                taskId: lastMessage.task_id,
                seconds: lastMessage.countdown
            });
            break;

        case "auto_recovery_started":
        case "auto_recovery_cancelled":
        case "auto_recovery_error":
        case "recovery_created":
        case "recovery_completed":
        case "recovery_updated":
            fetchTasks();
            break;

        default:
            break;
    }
}, [lastMessage, fetchTasks]);

    // Cleanup countdown interval on unmount
    useEffect(() => () => clearInterval(countdownRef.current), []);

    // ── Manual recover ───────────────────────────────────────────────────────
    const handleRecover = async (id) => {
        try {
            setActionLoading(id);
            await startRecovery(id);
            await fetchTasks();
        } catch (err) {
            console.error(err);
            alert("Failed to start recovery");
        } finally {
            setActionLoading(null);
        }
    };

    // ── Cancel auto-recovery ─────────────────────────────────────────────────
    const handleCancelAuto = async (taskId) => {
        try {
            await fetch(`http://localhost:8000/api/v1/recovery/${taskId}/cancel-auto`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            clearInterval(countdownRef.current);
            setCountdown(null);
        } catch (err) {
            console.error("Cancel failed:", err);
        }
    };

    // ── Loading state ────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#5a6a85", padding: "2rem", fontFamily: "monospace" }}>
            <div style={{
                width: 16, height: 16,
                border: "2px solid #1e2d40",
                borderTopColor: "#00d4ff",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite"
            }} />
            Loading recovery tasks...
        </div>
    );

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{ color: "#e2e8f0", fontFamily: "'Courier New', monospace" }}>

            {/* Page Header */}
            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "bold", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        ↺ Recovery Tasks
                    </h1>
                    <p style={{ margin: "0.25rem 0 0", color: "#5a6a85", fontSize: "0.8rem" }}>
                        Last updated: {new Date().toLocaleTimeString()}
                        &nbsp;·&nbsp;
                        {tasks.filter(t => t.status === "pending").length} pending
                        &nbsp;·&nbsp;
                        {tasks.filter(t => t.status === "completed").length} completed
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
                    ● Auto-Recovery {countdown ? "Armed" : "Standby"}
                </div>
            </div>

            {/* ── Auto-recovery countdown banner ── */}
            {countdown && (
                <div style={{
                    background: "rgba(255,184,48,0.08)",
                    border: "1px solid #ffb830",
                    borderRadius: 10,
                    padding: "1rem 1.25rem",
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {/* Countdown ring */}
                        <div style={{
                            width: 44, height: 44, borderRadius: "50%",
                            background: "rgba(255,184,48,0.15)",
                            border: "2px solid #ffb830",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#ffb830", fontWeight: "bold", fontSize: "1rem",
                            flexShrink: 0
                        }}>
                            {countdown.seconds}
                        </div>
                        <div>
                            <div style={{ color: "#ffb830", fontWeight: "bold", fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                                ⚠ Auto-Recovery Armed — Task #{countdown.taskId}
                            </div>
                            <div style={{ color: "#5a6a85", fontSize: "0.75rem" }}>
                                Recovery will start automatically in // Replace the seconds display with this
                                {countdown.seconds >= 60
                                ? `${Math.floor(countdown.seconds / 60)}m ${countdown.seconds % 60}s`
                                : `${countdown.seconds}s`
                                }. Click Cancel to stop.
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => handleCancelAuto(countdown.taskId)}
                        style={{
                            padding: "0.5rem 1.25rem",
                            background: "rgba(255,69,96,0.1)",
                            border: "1px solid #ff4560",
                            color: "#ff4560",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            fontFamily: "inherit",
                            transition: "background 0.2s",
                            flexShrink: 0
                        }}
                        onMouseEnter={e => e.target.style.background = "rgba(255,69,96,0.2)"}
                        onMouseLeave={e => e.target.style.background = "rgba(255,69,96,0.1)"}
                    >
                        ✕ Cancel
                    </button>
                </div>
            )}

            {/* ── Empty state ── */}
            {tasks.length === 0 ? (
                <div style={{
                    background: "#111722",
                    border: "1px solid #1e2d40",
                    borderRadius: 12,
                    padding: "3rem",
                    textAlign: "center",
                    color: "#5a6a85"
                }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>↺</div>
                    <div style={{ fontSize: "0.9rem", color: "#00e396", marginBottom: "0.25rem" }}>No recovery tasks</div>
                    <div style={{ fontSize: "0.75rem" }}>Tasks appear here when ransomware is detected</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {tasks.map(task => {
                        const isPending    = task.status === "pending";
                        const isRecovering = task.status === "recovering";
                        const isDone       = task.status === "completed";
                        const isThisCountdown = countdown?.taskId === task.id;

                        const statusColor  = isPending ? "#ffb830" : isRecovering ? "#00d4ff" : "#00e396";
                        const borderColor  = isThisCountdown ? "#ffb830" : isPending ? "#1e2d40" : isRecovering ? "#00d4ff" : "#00e39655";

                        return (
                            <div key={task.id} style={{
                                background: "#111722",
                                border: `1px solid ${borderColor}`,
                                borderRadius: 10,
                                padding: "1.1rem 1.25rem",
                                transition: "border-color 0.3s",
                            }}>
                                {/* Task header */}
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                                    <div style={{ flex: 1 }}>
                                        {/* Host + status */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                                            <span style={{ color: "#00d4ff", fontWeight: "bold", fontSize: "0.9rem" }}>
                                                {task.host}
                                            </span>
                                            <span style={{
                                                display: "flex", alignItems: "center", gap: "0.35rem",
                                                padding: "2px 10px",
                                                background: `${statusColor}15`,
                                                border: `1px solid ${statusColor}`,
                                                borderRadius: 4,
                                                color: statusColor,
                                                fontSize: "0.65rem",
                                                fontWeight: "bold",
                                                letterSpacing: "0.1em",
                                                textTransform: "uppercase"
                                            }}>
                                                <span style={{
                                                    width: 5, height: 5, borderRadius: "50%",
                                                    background: statusColor,
                                                    display: "inline-block",
                                                    animation: isRecovering ? "pulse 1.5s infinite" : "none"
                                                }} />
                                                {task.status}
                                            </span>
                                            {task.malware && (
                                                <span style={{ color: "#5a6a85", fontSize: "0.72rem" }}>
                                                    — {task.malware}
                                                </span>
                                            )}
                                        </div>

                                        {/* Files */}
                                        <div style={{ marginBottom: "0.5rem" }}>
                                            <span style={{ color: "#5a6a85", fontSize: "0.72rem", marginBottom: "0.35rem", display: "block" }}>
                                                {task.files?.length || 0} file(s) affected
                                            </span>
                                            {task.files?.length > 0 && (
                                                <div style={{
                                                    background: "#0a0e17",
                                                    border: "1px solid #1e2d40",
                                                    borderRadius: 6,
                                                    padding: "0.5rem 0.75rem",
                                                    maxHeight: 100,
                                                    overflowY: "auto"
                                                }}>
                                                    {task.files.map((f, i) => (
                                                        <div key={i} style={{
                                                            color: "#00d4ff",
                                                            fontSize: "0.72rem",
                                                            padding: "1px 0",
                                                            wordBreak: "break-all"
                                                        }}>
                                                            📄 {f}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                                        {isPending && (
                                            <button
                                                onClick={() => handleRecover(task.id)}
                                                disabled={actionLoading === task.id}
                                                style={{
                                                    padding: "0.5rem 1.25rem",
                                                    background: "rgba(0,212,255,0.08)",
                                                    border: "1px solid rgba(0,212,255,0.35)",
                                                    color: "#00d4ff",
                                                    borderRadius: 6,
                                                    cursor: actionLoading === task.id ? "not-allowed" : "pointer",
                                                    fontSize: "0.8rem",
                                                    fontWeight: "bold",
                                                    letterSpacing: "0.08em",
                                                    textTransform: "uppercase",
                                                    fontFamily: "inherit",
                                                    opacity: actionLoading === task.id ? 0.5 : 1,
                                                    transition: "all 0.2s"
                                                }}
                                                onMouseEnter={e => { if (actionLoading !== task.id) e.target.style.background = "rgba(0,212,255,0.18)"; }}
                                                onMouseLeave={e => e.target.style.background = "rgba(0,212,255,0.08)"}
                                            >
                                                {actionLoading === task.id ? "Starting..." : `↺ Recover ${task.files?.length || 0} file(s)`}
                                            </button>
                                        )}
                                        {isRecovering && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#00d4ff", fontSize: "0.8rem" }}>
                                                <div style={{
                                                    width: 14, height: 14,
                                                    border: "2px solid #1e2d40",
                                                    borderTopColor: "#00d4ff",
                                                    borderRadius: "50%",
                                                    animation: "spin 0.7s linear infinite"
                                                }} />
                                                In Progress...
                                            </div>
                                        )}
                                        {isDone && (
                                            <span style={{
                                                color: "#00e396",
                                                fontSize: "0.85rem",
                                                fontWeight: "bold",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.35rem"
                                            }}>
                                                ✓ Recovered
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Spinner keyframe */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}