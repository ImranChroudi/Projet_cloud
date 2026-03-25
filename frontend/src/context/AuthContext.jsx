import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axiosauth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        logout();
      }
    }

    setLoading(false);
  }, []);

const login = async (email, password) => {
  const res = await API.post("/auth/login", { email, password }); 

  const { token: newToken, user: userData } = res.data;

  localStorage.setItem("token", newToken);
  setToken(newToken);

  // Decode JWT safely
  let payload = {};
  try {
    payload = JSON.parse(atob(newToken.split(".")[1]));
  } catch {}

  const userInfo = userData || {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  };

  localStorage.setItem("user", JSON.stringify(userInfo));
  setUser(userInfo);

  return userInfo;
};

  //  REGISTER (fix name)
  const register = async (name, email, password) => {
await API.post("/auth/register", { name, email, password });  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => user?.role === "admin";
  const isManager = () =>
    user?.role === "manager" || user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, isAdmin, isManager }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}