import { Ico, P } from "../utils/icons";
import { fmtCountdown, fmtTime } from "../utils/helpers";

const SIDEBAR_PAGES = [
  { id: "dashboard",  label: "Dashboard",           icon: P.home     },
  { id: "riwayat",    label: "Riwayat",             icon: P.history  },
  { id: "grafik",     label: "Grafik & Statistik",  icon: P.chart    },
  { id: "notifikasi", label: "Notifikasi",          icon: P.bell     },
  { id: "perangkat",  label: "Perangkat (IoT)",     icon: P.device   },
  { id: "pengujian",  label: "Deteksi & Analisis",  icon: P.person   },
  { id: "tentang",    label: "Tentang Sistem",       icon: P.info },
];

const ADMIN_PAGES = [
  { id: "pengguna", label: "Pengguna Sistem", icon: P.person },
];

const ROLE_COLORS = {
  Administrator: { bg: "#fee2e2", color: "#dc2626" },
  "Pelaksana Umum": { bg: "#dbeafe", color: "#2563eb" },
  Operator:      { bg: "#dbeafe", color: "#2563eb" },
  Viewer:        { bg: "#f3f4f6", color: "#374151" },
};

const isAdminRole = (role) => {
  const value = (role || "").toString().trim().toLowerCase();
  return value === "admin" || value === "administrator";
};

const isOperatorRole = (role) => {
  const value = (role || "").toString().trim().toLowerCase();
  return value === "operator" || value === "pelaksana umum";
};

export default function Sidebar({ page, setPage, autoMode, countdown, status, error, user, onLogout }) {
  const roleStyle = ROLE_COLORS[user?.role] || ROLE_COLORS.Viewer;
  const pages = isAdminRole(user?.role) ? ADMIN_PAGES : SIDEBAR_PAGES;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-logo-icon">
          <Ico d={P.bolt} size={18} />
        </div>
        <div>
          <h2>HEMATRIX</h2>
          <p>Smart Energy Monitoring</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        <ul>
          {pages.map(pg => (
            <li key={pg.id}>
              <button
                className={`nav-btn ${page === pg.id ? "active" : ""}`}
                onClick={() => setPage(pg.id)}
              >
                <span className="nav-icon"><Ico d={pg.icon} size={15} /></span>
                {pg.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Lokasi */}
      <div className="sb-location">
        <div className="loc-label">Lokasi Monitoring</div>
        <div className="loc-building">
          <div className="loc-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div>
            <div className="loc-name">Ruang Dosen</div>
            <div className="loc-sub">Gedung 4 Sesi A &amp; Dosen</div>
          </div>
        </div>
        <div className="loc-time">Jam Kerja: 08.00 – 16.30</div>
      </div>

      {/* Auto pill */}
      <div className="sb-auto-status">
        <div className={`auto-pill ${autoMode ? "on" : "off"}`}>
          <span className={`auto-pill-dot ${autoMode ? "" : "off"}`} />
          {autoMode
            ? <><span>Auto Realtime&nbsp;</span><strong>{fmtCountdown(countdown)}</strong></>
            : "Mode Manual"
          }
        </div>
      </div>

      {/* Footer */}
      <div className="sb-footer">
        {/* User info */}
        {user && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"#f9fafb", borderRadius:8, border:"1px solid #f3f4f6", marginBottom:6 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"#e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Ico d={P.person} size={14} style={{ color: "#6b7280" }} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
              <span style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:20, background: roleStyle.bg, color: roleStyle.color }}>{user.role}</span>
            </div>
          </div>
        )}

        {/* Backend status */}
        <div className="sb-status">
          <span className="dot" style={error ? { background:"#dc2626", animation:"none" } : {}} />
          &nbsp;Backend {error ? "offline" : "online"}
          <span style={{ marginLeft:"auto", fontSize:9, color:"#9ca3af" }}>
            {status?.waktu ? fmtTime(status.waktu) : "–"}
          </span>
        </div>

        {/* Logout */}
        <button className="logout-btn" onClick={onLogout}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}