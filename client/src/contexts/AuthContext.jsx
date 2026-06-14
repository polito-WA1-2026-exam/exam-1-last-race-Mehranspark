// Authentication context: holds the logged-in user and exposes login/logout.
//
// Using a Context (React L17a) lets any component read the current user without
// passing it down through every level as props. The provider also restores the
// session on first load by asking the server "who am I" (/sessions/current).

import { createContext, useContext, useState, useEffect } from "react";
import API from "../API.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // the logged-in user, or null
  const [loading, setLoading] = useState(true); // true until the first session check

  // On mount, check whether a session cookie already identifies a user.
  // A thrown 401 simply means "anonymous". Empty dependency array => run once.
  useEffect(() => {
    API.getCurrentUser()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const u = await API.login(username, password);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await API.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Small hook so components can do: const { user, login } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
