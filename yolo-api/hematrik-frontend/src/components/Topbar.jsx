import { Ico, P } from "../utils/icons";
import { fmtFull, fmtCountdown } from "../utils/helpers";
import { AUTO_CEK_INTERVAL } from "../hooks/useMonitoring";

export default function Topbar({ title, lastCek, loading, error, autoMode, setAutoMode, countdown, handleCek, user }) {
  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  return (
    <div className="topbar">
      {/* Left */}
      <div className="topbar-left">
        <h1>{title}</h1>
      </div>

      {/* Right */}
      <div className="topbar-right">

        {/* Error */}
        {error && (
          <div className="error-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Tidak bisa terhubung ke backend
          </div>
        )}

        {/* Last check */}
        <div className="last-check-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>
            Terakhir:&nbsp;
            <strong style={{ color:"#374151" }}>
              {lastCek ? fmtFull(lastCek) : "Menunggu..."}
            </strong>
          </span>
        </div>

        {/* Auto toggle */}
        <button
          className={`btn-auto-toggle ${autoMode ? "active" : ""}`}
          onClick={() => setAutoMode(v => !v)}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          {autoMode ? "Auto ON" : "Auto OFF"}
        </button>

        {/* CEK SEKARANG */}
        <button className="btn-cek" onClick={handleCek} disabled={loading}>
          {loading ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation:"spin 1s linear infinite" }}>
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
              Mengecek...
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
              CEK SEKARANG
            </>
          )}
        </button>

        {/* User pill */}
        <div className="user-pill">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || "Admin"}</div>
            <div className="user-role">{user?.role || "Administrator"}</div>
          </div>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft:2 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

      </div>
    </div>
  );
}