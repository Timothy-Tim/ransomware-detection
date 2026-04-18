export default function MainLayout({ children }) {
  return (
    <div>
      <header style={{ padding: "1rem", background: "#eee" }}>
        <h2>Trees Enterprise Software</h2>
        <nav>
          <a href="/login" style={{ margin: "0 1rem" }}>Login</a>
          <a href="/" style={{ margin: "0 1rem" }}>Dashboard</a>
          <a href="/backup" style={{ margin: "0 1rem" }}>Backup</a>
          <a href="/monitor" style={{ margin: "0 1rem" }}>Monitor</a>
          <a href="/recovery" style={{ margin: "0 1rem" }}>Recovery</a>
          <a href="/alerts" style={{ margin: "0 1rem" }}>Alerts</a>
        </nav>
      </header>
      <main style={{ padding: "1rem" }}>
        {children} {}
      </main>
    </div>
  );
}