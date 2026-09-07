const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- AUTHENTICATION ---

export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "Login failed");
  }
  return response.json();
}

export async function register(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "Registration failed");
  }
  return response.json();
}

// --- SECURED ENDPOINTS ---
// Notice how we now require a 'token' parameter and pass it in the Headers

export async function generateSession(requestData: any, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/generate-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` // Passing the JWT to the backend
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const detail = errorData?.detail;
    const errorMessage = typeof detail === 'string' ? detail : JSON.stringify(detail);
    throw new Error(errorMessage || `Server error: ${response.status}`);
  }
  return response.json();
}

export async function fetchSessions(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/sessions`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error("Failed to fetch sessions");
  return response.json();
}