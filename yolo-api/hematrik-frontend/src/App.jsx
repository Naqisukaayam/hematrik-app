import { useState, useEffect } from "react";
import "./App.css";
import { useMonitoring } from "./hooks/useMonitoring";
import Sidebar        from "./components/Sidebar";
import Topbar         from "./components/Topbar";
import ImageModal     from "./components/ImageModal";
import LandingPage    from "./pages/LandingPage";
import LoginPage      from "./pages/LoginPage";
import Dashboard      from "./pages/Dashboard";
import Riwayat        from "./pages/Riwayat";
import Grafik         from "./pages/Grafik";
import Notifikasi     from "./pages/Notifikasi";
import Perangkat      from "./pages/Perangkat";
import Pengaturan     from "./pages/Pengaturan";
import Pengujian      from "./pages/Pengujian";
import PenggunaSystem from "./pages/PenggunaSystem";
import Tentang        from "./pages/Tentang";

const PAGE_TITLES = {
  dashboard:  "Dashboard",
  riwayat:    "Riwayat",
  grafik:     "Grafik & Statistik",
  notifikasi: "Notifikasi",
  perangkat:  "Perangkat (IoT)",
  pengujian:  "Deteksi & Analisis",
  pengaturan: "Pengaturan",
  pengguna:   "Pengguna Sistem",
  tentang:    "Tentang Sistem",
};

// App state flow: "landing" -> "login" -> "dashboard"
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("hematrix_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [appState, setAppState] = useState(() => {
    try {
      const savedUser = localStorage.getItem("hematrix_user");
      const savedToken = localStorage.getItem("hematrix_token");
      return (savedUser || savedToken) ? "app" : "landing";
    } catch {
      return "landing";
    }
  });

  const [page, setPage] = useState(() => {
    try {
      const savedPage = localStorage.getItem("hematrix_page");
      if (savedPage) return savedPage;
      const savedUser = localStorage.getItem("hematrix_user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const role = (u.role || "").toString().trim().toLowerCase();
        if (role === "admin" || role === "administrator") return "pengguna";
      }
    } catch {}
    return "dashboard";
  });
  const [modalImg, setModalImg] = useState(null);

  useEffect(() => {
    if (appState === "app" && page) {
      localStorage.setItem("hematrix_page", page);
    }
  }, [page, appState]);

  const {
    data, status, history, summary, listrikH,
    loading, lastCek, curImg, error,
    countdown, autoMode, setAutoMode, handleCek,
    loadHistory,
  } = useMonitoring();

  // Build notifList
  const notifList = history.slice(0, 50).map(h => ({
    type:
      h.kondisi === "NORMAL" || h.kondisi === "AMAN" ? "ok" :
      h.kondisi === "PEMBOROSAN" || h.kondisi === "PERINGATAN" ? "warn" : "info",
    title:
      h.kondisi === "PEMBOROSAN" ? "Pemborosan energi terdeteksi" :
      h.kondisi === "PERINGATAN" ? "Listrik aktif tanpa aktivitas" :
      h.kondisi === "NORMAL"     ? "Kondisi normal" : "Kondisi aman",
    desc:
      h.kondisi === "PEMBOROSAN" ? "Tidak ada orang di ruangan, namun ada perangkat yang masih menyala" :
      h.kondisi === "PERINGATAN" ? "Listrik menyala di luar jam kerja" :
      h.kondisi === "NORMAL"     ? "Semua perangkat sesuai kondisi, aktivitas terdeteksi" :
      "Semua perangkat mati, ruangan kosong",
    waktu: h.waktu,
    orang: h.orang ?? 0,
  }));

  const normalizeRole = (role) => {
    const value = (role || "").toString().trim().toLowerCase();
    if (value === "admin" || value === "administrator") return "Administrator";
    if (value === "operator" || value === "pelaksana umum") return "Pelaksana Umum";
    return "Viewer";
  };

  // Auth handlers
  const handleLogin = (userData) => {
    const normalizedRole = normalizeRole(userData.role);
    const userObj = { ...userData, role: normalizedRole, name: userData.nama || userData.name || "Admin" };
    setUser(userObj);
    localStorage.setItem("hematrix_user", JSON.stringify(userObj));
    if (userData.token) {
      localStorage.setItem("hematrix_token", userData.token);
    }
    setAppState("app");
    const targetPage = normalizedRole === "Administrator" ? "pengguna" : "dashboard";
    setPage(targetPage);
    localStorage.setItem("hematrix_page", targetPage);
  };

  const handleLogout = () => {
    localStorage.removeItem("hematrix_token");
    localStorage.removeItem("hematrix_user");
    localStorage.removeItem("hematrix_page");
    setUser(null);
    setAppState("landing");
    setPage("dashboard");
  };

  const handleGoToDashboard = () => {
    // Direct to dashboard without login (guest mode)
    const guestUser = { name: "Admin", role: "Administrator", username: "admin" };
    setUser(guestUser);
    localStorage.setItem("hematrix_user", JSON.stringify(guestUser));
    setAppState("app");
    setPage("pengguna");
    localStorage.setItem("hematrix_page", "pengguna");
  };

  // Render page content
  const renderPage = () => {
    switch (page) {
      case "dashboard":  return <Dashboard  data={data} status={status} history={history} summary={summary} loading={loading} lastCek={lastCek} curImg={curImg} autoMode={autoMode} countdown={countdown} setModalImg={setModalImg} setPage={setPage} error={error} />;
      case "riwayat":    return <Riwayat    history={history} setModalImg={setModalImg} />;
      case "grafik":     return <Grafik      history={history} listrikH={listrikH} summary={summary} />;
      case "notifikasi": return <Notifikasi  notifList={notifList} handleCek={handleCek} loading={loading} lastCek={lastCek} />;
      case "perangkat":  return <Perangkat   status={status} data={data} listrikH={listrikH} />;
      case "pengaturan": return <Pengaturan  autoMode={autoMode} setAutoMode={setAutoMode} />;
      case "pengujian":  return <Pengujian loadHistory={loadHistory} />;
      case "pengguna":   return <PenggunaSystem />;
      case "tentang":    return <Tentang />;
      default:           return <Dashboard  data={data} status={status} history={history} summary={summary} loading={loading} lastCek={lastCek} curImg={curImg} autoMode={autoMode} countdown={countdown} setModalImg={setModalImg} setPage={setPage} error={error} />;
    }
  };

  // ── Landing ──
  if (appState === "landing") {
    return (
      <LandingPage
        onMasuk={handleGoToDashboard}
        onLogin={() => setAppState("login")}
      />
    );
  }

  // ── Login ──
  if (appState === "login") {
    return <LoginPage onLogin={handleLogin} onBack={() => setAppState("landing")} />;
  }

  const showTopbar = page !== "pengguna";

  // ── Main App ──
  return (
    <div className="layout">
      {/* Sidebar */}
      <Sidebar
        page={page}
        setPage={setPage}
        autoMode={autoMode}
        countdown={countdown}
        status={status}
        error={error}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="main">
        {showTopbar && (
          <Topbar
            title={PAGE_TITLES[page] || "Dashboard"}
            lastCek={lastCek}
            loading={loading}
            error={error}
            autoMode={autoMode}
            setAutoMode={setAutoMode}
            countdown={countdown}
            handleCek={handleCek}
            user={user}
          />
        )}
        <div className="content-wrap">
          {renderPage()}
        </div>
      </main>

      <ImageModal src={modalImg} onClose={() => setModalImg(null)} />
    </div>
  );
}