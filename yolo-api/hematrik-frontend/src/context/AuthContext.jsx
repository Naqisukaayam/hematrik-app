import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // cek token saat app load

  // ── Saat app pertama load, cek token lama di localStorage ──
  useEffect(() => {
    const savedToken = localStorage.getItem("hematrix_token");
    if (savedToken) {
      // Verifikasi token ke backend
      fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
          setUser({ ...data.user, token: savedToken });
        })
        .catch(() => {
          // Token tidak valid / expired → hapus
          localStorage.removeItem("hematrix_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Login ke API ──────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Kembalikan pesan error dari backend
        return { success: false, message: data.detail || "Login gagal" };
      }

      // Simpan token ke localStorage agar tidak logout saat refresh
      localStorage.setItem("hematrix_token", data.token);

      setUser({ ...data.user, token: data.token });

      return { success: true, message: data.message };

    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: "Tidak dapat terhubung ke server. Pastikan backend berjalan." };
    }
  };

  // ── Logout ────────────────────────────────────────────────
  const logout = async () => {
    const token = localStorage.getItem("hematrix_token");
    if (token) {
      try {
        await fetch(`${API}/auth/logout`, {
          method : "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_) {}
      localStorage.removeItem("hematrix_token");
    }
    setUser(null);
  };

  // ── Helper ambil token untuk request lain ─────────────────
  const getToken = () => localStorage.getItem("hematrix_token");

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}