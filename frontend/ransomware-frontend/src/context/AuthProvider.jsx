import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("access_token") || null);
    const [username, setUsername] = useState(localStorage.getItem("username") || null);

    const login = (newToken, newUsername) => {
        localStorage.setItem("access_token", newToken);
        localStorage.setItem("username", newUsername);
        setToken(newToken);
        setUsername(newUsername);
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("username");
        setToken(null);
        setUsername(null);
    };

    // ✅ Auto refresh token every 50 minutes (before 60 min expiry)
    useEffect(() => {
        if (!token) return;

        const refresh = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/v1/auth/refresh", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem("access_token", data.access_token);
                    setToken(data.access_token);
                    console.log("[Auth] Token refreshed");
                } else {
                    logout(); // token invalid, force re-login
                }
            } catch (err) {
                console.error("[Auth] Token refresh failed:", err);
            }
        };

        // ✅ Refresh every 50 minutes
        const interval = setInterval(refresh, 50 * 60 * 1000);
        return () => clearInterval(interval);
    }, [token]);

    return (
        <AuthContext.Provider value={{ token, username, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}