import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const inputStyle = {
  display:"block", width:"100%", padding:"12px 16px",
  borderRadius:12, border:"1.5px solid #d5e4de",
  background:"#fff", fontSize:14, color:"#0f1e1a",
  outline:"none", boxSizing:"border-box", fontFamily:"inherit",
  transition:"border 0.15s"
};

function Field({ label, name, type="text", value, onChange, placeholder, required=true }) {
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ fontSize:13, fontWeight:600, color:"#4a6b5f", display:"block", marginBottom:6 }}>{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        required={required} placeholder={placeholder}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor="#3ecfaa"}
        onBlur={e => e.target.style.borderColor="#d5e4de"}
      />
    </div>
  );
}


export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name:"", email:"", admin_username:"", admin_password:"", confirm_password:""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (form.admin_password !== form.confirm_password) { setError("Passwords do not match"); return; }
    if (form.admin_password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/company/register", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          company_name: form.company_name, email: form.email,
          admin_username: form.admin_username, admin_password: form.admin_password
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message + " Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.detail || "Registration failed");
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
      background:"#f4f7f5", alignItems:"center", justifyContent:"center", padding:24
    }}>
      <div style={{
        background:"#fff", borderRadius:24, padding:"40px 48px",
        width:"100%", maxWidth:520, boxSizing:"border-box"
      }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
          <div style={{
            width:44, height:44, borderRadius:14, background:"#1a1a2e",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:20, color:"#3ecfaa", fontWeight:700
          }}>R</div>
          <div>
            <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:"#0f1e1a" }}>Register Company</h2>
            <p style={{ margin:0, fontSize:12, color:"#8fa899" }}>Create an admin account to protect your company</p>
          </div>
        </div>

        {error && (
          <div style={{ background:"#fff0f0", border:"1px solid #ffd0d0", borderRadius:12, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#c0392b" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background:"#f0fff8", border:"1px solid #b0e8d0", borderRadius:12, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#1a7a5a" }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="Company Name" name="company_name" value={form.company_name} onChange={handleChange} placeholder="Acme Corp" />
          <Field label="Company Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="admin@acmecorp.com" />
          <Field label="Admin Username" name="admin_username" value={form.admin_username} onChange={handleChange} placeholder="john_admin" />
          <Field label="Password" name="admin_password" type="password" value={form.admin_password} onChange={handleChange} placeholder="••••••••" />
          <Field label="Confirm Password" name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} placeholder="••••••••" />

          <button type="submit" disabled={loading} style={{
            width:"100%", padding:"13px", borderRadius:12, border:"none",
            background: loading ? "#a0cfc0" : "#1a1a2e",
            color:"#fff", fontSize:14, fontWeight:600,
            cursor: loading ? "not-allowed" : "pointer", fontFamily:"inherit"
          }}>
            {loading ? "Creating account..." : "Register Company"}
          </button>
        </form>

        <p style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#8fa899" }}>
          Already registered?{" "}
          <Link to="/login" style={{ color:"#3ecfaa", fontWeight:600, textDecoration:"none" }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}