const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function loginRequest(username, password) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);

  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    body: form, // OAuth2 form expects URLSearchParams, not JSON
  });

  if (!res.ok) throw new Error("Invalid credentials");
  return res.json(); // { access_token, token_type }
}