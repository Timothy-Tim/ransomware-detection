const BASE_URL = "http://localhost:8000/api/v1";

export async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("access_token");

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        throw new Error("API request failed");
    }

    return res.json();
}