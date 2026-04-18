export async function triggerBackup(agentId, paths) {
  const res = await fetch("http://localhost:8000/backup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id: agentId, paths }),
  });
  if (!res.ok) {
    throw new Error("Failed to trigger backup");
  }
  return res.json();
}