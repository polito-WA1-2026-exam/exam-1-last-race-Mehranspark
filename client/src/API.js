// Central place for every call to the server.
// Keeping all fetch() calls here (instead of scattering them across components)
// means the base URL, credentials, and error handling are defined once.

const SERVER_URL = "http://localhost:3001/api";

// credentials:'include' makes the browser send/receive the session cookie on
// cross-origin requests — required for the "two servers" + Passport login to work.
async function apiCall(path, method = "GET", body = undefined) {
  const response = await fetch(SERVER_URL + path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    // Try to surface the server's { error } message; fall back to status text.
    let message = response.statusText;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      /* response had no JSON body */
    }
    throw new Error(message);
  }

  // Some endpoints (e.g. logout) return no content.
  if (response.status === 204) return null;
  return response.json();
}

// --- Phase 0 smoke test ---
const testConnection = () => apiCall("/test");

const API = { testConnection };
export default API;
