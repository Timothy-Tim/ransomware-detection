import { useEffect, useState, useCallback, useRef } from "react";
import { getRecoveryTasks, startRecovery } from "../api/recovery";

export default function Recovery() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const tasksRef = useRef([]);

    const fetchTasks = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            const data = await getRecoveryTasks();
            setTasks(data);
            tasksRef.current = data;
        } catch (err) {
            console.error(err);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks(true);
        const interval = setInterval(() => {
            const hasActive = tasksRef.current.some(
                t => t.status === "pending" || t.status === "recovering"
            );
            if (hasActive) fetchTasks();
            else clearInterval(interval);
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchTasks]);

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

    if (loading) return <p>Loading recovery tasks...</p>;

    return (
        <div>
            <h1>Recovery Tasks</h1>
            <p>Last updated: {new Date().toLocaleTimeString()}</p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>Host</th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>Files Affected</th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>Reason</th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.length === 0 ? (
                        <tr>
                            <td colSpan={5} style={{ textAlign: "center", padding: "1em" }}>
                                No recovery tasks found.
                            </td>
                        </tr>
                    ) : (
                        tasks.map(task => (
                            <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "0.5rem" }}>{task.host}</td>
                                <td style={{ padding: "0.5rem" }}>
                                    {/* ✅ Show file count and list */}
                                    <strong>{task.files?.length || 0} file(s)</strong>
                                    <ul style={{ margin: "0.25rem 0 0 0", padding: "0 0 0 1rem", fontSize: "0.8rem", color: "#666" }}>
                                        {task.files?.map((f, i) => (
                                            <li key={i}>{f}</li>
                                        ))}
                                    </ul>
                                </td>
                                <td style={{ padding: "0.5rem" }}>{task.malware}</td>
                                <td style={{ padding: "0.5rem" }}>
                                    <span style={{
                                        color: task.status === "pending" ? "orange"
                                            : task.status === "recovering" ? "blue"
                                            : "green"
                                    }}>
                                        {task.status}
                                    </span>
                                </td>
                                <td style={{ padding: "0.5rem" }}>
                                    {task.status === "pending" && (
                                        <button
                                            onClick={() => handleRecover(task.id)}
                                            disabled={actionLoading === task.id}
                                        >
                                            {actionLoading === task.id ? "Starting..." : `Recover ${task.files?.length || 0} file(s)`}
                                        </button>
                                    )}
                                    {task.status === "recovering" && <span>In Progress...</span>}
                                    {task.status === "completed" && <span style={{ color: "green" }}>✅ Done</span>}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}