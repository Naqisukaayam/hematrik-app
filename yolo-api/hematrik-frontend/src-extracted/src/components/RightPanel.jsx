import { fmtShort, fmtTime, fmtCountdown } from "../utils/helpers.js";
import { AUTO_CEK_INTERVAL } from "../hooks/useMonitoring.js";

export default function RightPanel({ notifList, status, autoMode, setAutoMode, countdown, error, setPage }) {
  const pct    = Math.max(0, Math.min(100, (countdown / AUTO_CEK_INTERVAL) * 100));
  const wattAC = status?.power_ac_w    ?? 0;
  const wattLp = status?.power_lampu_w ?? 0;
  const dispAC = status?.ac    || "–";
  const dispLp = status?.lampu || "–";
  const r      = 28;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - (100 - pct) / 100);

  return (
    <aside style={{
      background: "#fff",
      borderLeft: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid #f3f4f6",
        flexShrink: 0,
        background: "#fff",
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>Panel Monitor</div>
        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>Realtime · update tiap 5 detik</div>
      </div>

      {/* Scrollable */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* ── Notifikasi Terbaru ── */}
        <RPSection
          title="Notifikasi Terbaru"
          action="Lihat Semua"
          onAction={() => setPage("notifikasi")}
        >
          {notifList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "18px 0", color: "#9ca3af", fontSize: 11 }}>
              Belum ada notifikasi
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {notifList.slice(0, 5).map((n, i) => (
                <div
                  key={i}
                  onClick={() => setPage("notifikasi")}
                  style={{
                    display: "flex", gap: 8, padding: "8px 10px",
                    borderRadius: 8, cursor: "pointer",
                    background: i === 0
                      ? (n.type === "warn" ? "#fffbeb" : "#f0fdf4")
                      : "#f9fafb",
                    border: `1px solid ${i === 0
                      ? (n.type === "warn" ? "#fde68a" : "#bbf7d0")
                      : "#f3f4f6"}`,
                    transition: "opacity .15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  {/* Icon */}
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: n.type === "warn" ? "#fef3c7" : "#dcfce7",
                    color: n.type === "warn" ? "#d97706" : "#16a34a",
                  }}>
                    {n.type === "warn" ? <WarnSvg /> : <OkSvg />}
                  </div>
                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#111827", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 10, color: "#6b7280", marginTop: 1, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.desc}
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                      {fmtShort(n.waktu)}
                    </div>
                  </div>
                  {/* Unread dot */}
                  {i < 2 && (
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%", flexShrink: 0, marginTop: 3,
                      background: n.type === "warn" ? "#ef4444" : "#16a34a",
                    }} />
                  )}
                </div>
              ))}
            </div>
          )}
          {notifList.length > 0 && (
            <button
              onClick={() => setPage("notifikasi")}
              style={{
                width: "100%", marginTop: 8, padding: "7px 0",
                borderRadius: 7, border: "1px solid #e5e7eb",
                background: "#f9fafb", color: "#16a34a",
                fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#dcfce7"}
              onMouseLeave={e => e.currentTarget.style.background = "#f9fafb"}
            >
              Lihat Semua ({notifList.length})
            </button>
          )}
        </RPSection>

        {/* ── Daya Listrik Realtime ── */}
        <RPSection title="Daya Listrik Realtime">
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { label: "AC (4B8A13)",    state: dispAC, watt: wattAC, bg: "#e0f2fe", color: "#0284c7" },
              { label: "Lampu (75AA3A)", state: dispLp, watt: wattLp, bg: "#fef9c3", color: "#d97706" },
            ].map(({ label, state, watt, bg, color }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 11px", borderRadius: 8,
                background: "#f9fafb", border: "1px solid #f3f4f6",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                    background: bg, color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <BoltSvg />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{label}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>
                      Status:&nbsp;
                      <span style={{ fontWeight: 700, color: state === "ON" ? "#16a34a" : "#6b7280" }}>
                        {state}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: state === "ON" ? "#16a34a" : "#9ca3af", lineHeight: 1 }}>
                    {watt}
                  </div>
                  <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 500 }}>Watt</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 8 }}>
            Update otomatis · {status?.waktu ? fmtTime(status.waktu) : "–"}
          </div>
        </RPSection>

        {/* ── Status Auto Deteksi ── */}
        <RPSection title="Status Auto Deteksi">
          {/* Countdown ring */}
          {autoMode && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 4px", gap: 6 }}>
              <div style={{ position: "relative", width: 68, height: 68 }}>
                <svg width="68" height="68" viewBox="0 0 68 68">
                  <circle cx="34" cy="34" r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
                  <circle
                    cx="34" cy="34" r={r} fill="none"
                    stroke="#16a34a" strokeWidth="5"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 34 34)"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>
                    {fmtCountdown(countdown)}
                  </div>
                  <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>berikutnya</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>Auto Realtime Aktif</div>
            </div>
          )}

          {/* Info rows */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              ["Mode",          autoMode ? "Auto Realtime" : "Manual",        autoMode ? "#16a34a" : "#6b7280"],
              ["Interval",      "2 menit",                                    "#374151"],
              ["Cek berikutnya",autoMode ? fmtCountdown(countdown) : "–",     autoMode ? "#16a34a" : "#9ca3af"],
            ].map(([k, v, vc], i, arr) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 0",
                borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
              }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{k}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: vc }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Toggle */}
          <button
            onClick={() => setAutoMode(v => !v)}
            style={{
              width: "100%", marginTop: 10, padding: "8px 0",
              borderRadius: 8, border: "none",
              background: autoMode ? "#fef2f2" : "#f0fdf4",
              color: autoMode ? "#dc2626" : "#16a34a",
              fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            {autoMode ? "⏹ Matikan Auto Cek" : "▶ Aktifkan Auto Cek"}
          </button>
        </RPSection>

        {/* ── Informasi Sistem ── */}
        <RPSection title="Informasi Sistem">
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              ["Status",     error ? "Offline" : "Online",      error ? "#dc2626" : "#16a34a", true ],
              ["Deteksi",    autoMode ? "Auto 2 menit" : "Manual", "#374151",                  false],
              ["Model AI",   "YOLOv11n",                        "#374151",                     false],
              ["Sensor IoT", "3 Perangkat",                     "#374151",                     false],
              ["Database",   "MySQL",                           "#374151",                     false],
              ["Versi",      "v1.2.0",                          "#374151",                     false],
            ].map(([k, v, vc, dot], i, arr) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 0",
                borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
              }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{k}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: vc }}>
                  {dot && (
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: vc, display: "inline-block",
                      animation: !error ? "pulse-glow 2s infinite" : "none",
                    }} />
                  )}
                  {v}
                </span>
              </div>
            ))}
          </div>
        </RPSection>

        {/* ── Navigasi Cepat ── */}
        <RPSection title="Navigasi Cepat">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { label: "Perangkat",  page: "perangkat",  bg: "#e0f2fe", color: "#0284c7" },
              { label: "Riwayat",    page: "riwayat",    bg: "#dcfce7", color: "#16a34a" },
              { label: "Grafik",     page: "grafik",     bg: "#dbeafe", color: "#2563eb" },
              { label: "Pengaturan", page: "pengaturan", bg: "#fef3c7", color: "#d97706" },
            ].map(({ label, page, bg, color }) => (
              <button
                key={page}
                onClick={() => setPage(page)}
                style={{
                  padding: "9px 6px", borderRadius: 8, border: "none",
                  background: bg, color,
                  fontSize: 11, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "opacity .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".75"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                {label}
              </button>
            ))}
          </div>
        </RPSection>

      </div>
    </aside>
  );
}

/* ── Section wrapper ── */
function RPSection({ title, action, onAction, children }) {
  return (
    <div style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: ".5px" }}>
          {title}
        </div>
        {action && (
          <button
            onClick={onAction}
            style={{ fontSize: 10, color: "#16a34a", fontWeight: 600, cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}
          >
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Inline SVG icons ── */
const WarnSvg = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const OkSvg = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const BoltSvg = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);