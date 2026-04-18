import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div style={{ width: "200px", background: "#111", color: "#fff" }}>
      <h3>Security Panel</h3>
      <Link to="/">Dashboard</Link><br/>
      <Link to="/monitor">Monitor</Link><br/>
      <Link to="/recovery">Recovery</Link><br/>
      <Link to="/alerts">Alerts</Link>
    </div>
  );
}