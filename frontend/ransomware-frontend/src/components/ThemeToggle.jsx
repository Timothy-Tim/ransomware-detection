import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(
        () => localStorage.getItem("theme") !== "light"
    );

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }, [isDark]);

    return (
        <button
            onClick={() => setIsDark(prev => !prev)}
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.85rem",
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                border: isDark ? "1px solid #1e2d40" : "1px solid #cbd5e1",
                borderRadius: 20,
                cursor: "pointer",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: isDark ? "#94a3b8" : "#475569",
                fontFamily: "inherit",
                transition: "all 0.2s",
            }}
        >
            <span style={{ fontSize: "0.9rem" }}>{isDark ? "☀" : "🌙"}</span>
            {isDark ? "Light" : "Dark"}
        </button>
    );
}