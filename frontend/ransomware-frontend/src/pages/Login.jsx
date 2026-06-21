import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.access_token, data.username);
        localStorage.setItem("role", data.role);
        navigate(data.force_password_reset ? "/change-password" : "/");
      } else {
        setError(data.detail || "Invalid username or password");
      }
    } catch {
      setError("Server error, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display:"flex", minHeight:"100vh", fontFamily:"'DM Sans','Segoe UI',sans-serif",
      background:"#f4f7f5"
    }}>
      {/* Left panel */}
      <div style={{
        flex:1, background:"#1a1a2e", display:"flex", flexDirection:"column",
        justifyContent:"center", padding:"60px", position:"relative", overflow:"hidden"
      }}>
        <div style={{
          position:"absolute", top:-80, left:-80, width:300, height:300,
          borderRadius:"50%", background:"rgba(62,207,170,0.08)"
        }}/>
        <div style={{
          position:"absolute", bottom:-60, right:-60, width:200, height:200,
          borderRadius:"50%", background:"rgba(62,207,170,0.05)"
        }}/>
        <div style={{
          width:48, height:48, borderRadius:16, background:"#3ecfaa",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, color:"#fff", fontWeight:700, marginBottom:32
        }}>R</div>
        <h1 style={{ margin:0, fontSize:32, fontWeight:700, color:"#fff", lineHeight:1.2 }}>
          Ransomware<br/>Detection System
        </h1>
        <p style={{ margin:"16px 0 0", fontSize:14, color:"#6a8a7e", lineHeight:1.7, maxWidth:340 }}>
          Real-time threat monitoring, automated recovery, and complete visibility into your organization's security posture.
        </p>
        <div style={{ display:"flex", gap:24, marginTop:40 }}>
          {[["◬","Active Alerts"],["↺","Auto Recovery"],["◎","Live Monitor"]].map(([ic,lab]) => (
            <div key={lab} style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{
                width:40, height:40, borderRadius:12, background:"rgba(62,207,170,0.15)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:"#3ecfaa"
              }}>{ic}</div>
              <span style={{ fontSize:11, color:"#6a8a7e" }}>{lab}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        width:480, display:"flex", alignItems:"center", justifyContent:"center",
        padding:"40px"
      }}>
        <div style={{ width:"100%" }}>
          <h2 style={{ margin:"0 0 6px", fontSize:26, fontWeight:700, color:"#0f1e1a" }}>Welcome back</h2>
          <p style={{ margin:"0 0 32px", fontSize:14, color:"#8fa899" }}>Sign in to your account</p>

          {error && (
            <div style={{
              background:"#fff0f0", border:"1px solid #ffd0d0", borderRadius:12,
              padding:"12px 16px", marginBottom:20, fontSize:13, color:"#c0392b"
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#4a6b5f", display:"block", marginBottom:6 }}>Username</label>
              <input
                type="text" value={username}
                onChange={e => setUsername(e.target.value)}
                required placeholder="your_username"
                style={{
                  display:"block", width:"100%", padding:"12px 16px",
                  borderRadius:12, border:"1.5px solid #d5e4de",
                  background:"#fff", fontSize:14, color:"#0f1e1a",
                  outline:"none", boxSizing:"border-box",
                  fontFamily:"inherit", transition:"border 0.15s"
                }}
                onFocus={e => e.target.style.borderColor="#3ecfaa"}
                onBlur={e => e.target.style.borderColor="#d5e4de"}
              />
            </div>
            <div style={{ marginBottom:28 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#4a6b5f", display:"block", marginBottom:6 }}>Password</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••"
                style={{
                  display:"block", width:"100%", padding:"12px 16px",
                  borderRadius:12, border:"1.5px solid #d5e4de",
                  background:"#fff", fontSize:14, color:"#0f1e1a",
                  outline:"none", boxSizing:"border-box",
                  fontFamily:"inherit", transition:"border 0.15s"
                }}
                onFocus={e => e.target.style.borderColor="#3ecfaa"}
                onBlur={e => e.target.style.borderColor="#d5e4de"}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width:"100%", padding:"13px", borderRadius:12, border:"none",
              background: loading ? "#a0cfc0" : "#1a1a2e",
              color:"#fff", fontSize:14, fontWeight:600, cursor: loading ? "not-allowed" : "pointer",
              fontFamily:"inherit", transition:"background 0.15s"
            }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#8fa899" }}>
            New company?{" "}
            <Link to="/register" style={{ color:"#3ecfaa", fontWeight:600, textDecoration:"none" }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}