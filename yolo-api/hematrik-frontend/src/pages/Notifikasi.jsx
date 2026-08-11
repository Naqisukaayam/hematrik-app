import { useState, useEffect, useCallback } from "react";
import { fmtShort, resolveImgUrl } from "../utils/helpers";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ── Mapping kondisi backend → tipe notifikasi ──────────────
function kondisiToType(kondisi = "") {
  const k = kondisi.toUpperCase();
  if (k === "PEMBOROSAN" || k === "PERINGATAN") return "warn";
  if (k === "NORMAL")  return "ok";
  if (k === "AMAN")    return "info";
  return "info";
}

function kondisiToTitle(kondisi = "") {
  const k = kondisi.toUpperCase();
  if (k === "PEMBOROSAN") return "Pemborosan energi terdeteksi";
  if (k === "PERINGATAN") return "Peringatan: Listrik di luar jam kerja";
  if (k === "NORMAL")     return "Kondisi ruangan normal";
  if (k === "AMAN")       return "Ruangan aman";
  return "Notifikasi sistem";
}

function kondisiToDesc(item) {
  const k     = (item.kondisi || "").toUpperCase();
  const ac    = item.ac    || "–";
  const lampu = item.lampu || "–";
  const orang = item.orang ?? 0;

  if (k === "PEMBOROSAN")
    return `Tidak ada orang di ruangan, namun ada perangkat listrik yang menyala (Lampu: ${lampu}, AC: ${ac}).`;
  if (k === "PERINGATAN")
    return "Listrik menyala di luar jam kerja. Segera periksa ruangan.";
  if (k === "NORMAL")
    return `${orang} orang terdeteksi di ruangan, kondisi listrik sesuai kebutuhan.`;
  if (k === "AMAN")
    return "Ruangan kosong dan seluruh perangkat listrik dalam keadaan mati.";
  return item.kondisi || "";
}

// ── Warna & badge per tipe ─────────────────────────────────
function getTypeConfig(type) {
  if (type === "warn") return {
    iconBg: "#fef3c7", iconColor: "#d97706",
    badgeBg: "#fef3c7", badgeColor: "#92400e", badgeLabel: "PERINGATAN",
    rowBg: "#fffbeb", dotColor: "#ef4444",
  };
  if (type === "ok") return {
    iconBg: "#dcfce7", iconColor: "#16a34a",
    badgeBg: "#dcfce7", badgeColor: "#14532d", badgeLabel: "NORMAL",
    rowBg: "#f0fdf4", dotColor: "#16a34a",
  };
  return {
    iconBg: "#dbeafe", iconColor: "#2563eb",
    badgeBg: "#dbeafe", badgeColor: "#1e40af", badgeLabel: "INFO",
    rowBg: "#eff6ff", dotColor: "#2563eb",
  };
}

// ── Icons ──────────────────────────────────────────────────
const WarnIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const OkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const RefreshIcon = ({ spin }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round"
    style={spin ? { animation: "spin 1s linear infinite", display: "block" } : { display: "block" }}>
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);

// ── Konversi history → notifList ───────────────────────────
function historyToNotifList(history = []) {
  return history.map(item => ({
    id:         item.id,
    type:       kondisiToType(item.kondisi),
    title:      kondisiToTitle(item.kondisi),
    desc:       kondisiToDesc(item),
    waktu:      item.waktu,
    orang:      item.orang ?? 0,
    ac:         item.ac,
    lampu:      item.lampu,
    kondisi:    item.kondisi,
    gambar_url: resolveImgUrl(item.gambar_url || (item.gambar ? `/api/captures/${item.gambar}` : null)),
  }));
}

// ══════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ══════════════════════════════════════════════════════════════
export default function Notifikasi({ handleCek, loading, lastCek }) {
  const [history,  setHistory]  = useState([]);
  const [fetching, setFetching] = useState(false);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("SEMUA");
  const [readIds,  setReadIds]  = useState(new Set());

  // ── Ambil /history dari backend ───────────────────────────
  const loadHistory = useCallback(async () => {
    setFetching(true);
    try {
      const res  = await fetch(`${API}/history`);
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : [];
      setHistory(rawList.map(item => ({
        ...item,
        gambar_url: resolveImgUrl(item.gambar_url || (item.gambar ? `/api/captures/${item.gambar}` : null)),
      })));
    } catch (e) {
      console.error("Gagal ambil history:", e);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Auto-refresh setiap 2 menit
  useEffect(() => {
    const t = setInterval(loadHistory, 120_000);
    return () => clearInterval(t);
  }, [loadHistory]);

  // ── Konversi ──────────────────────────────────────────────
  const notifList = historyToNotifList(history);
  const totalWarn = notifList.filter(n => n.type === "warn").length;
  const totalOk   = notifList.filter(n => n.type === "ok").length;
  const totalInfo = notifList.filter(n => n.type === "info").length;

  // ── Filter + search ───────────────────────────────────────
  const filtered = notifList.filter(n => {
    const matchFilter =
      filter === "SEMUA"      ? true :
      filter === "PERINGATAN" ? n.type === "warn" :
      filter === "NORMAL"     ? n.type === "ok"   :
      filter === "INFO"       ? n.type === "info"  : true;
    const matchSearch =
      search === "" ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.desc.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const markAllRead = () => setReadIds(new Set(notifList.map(n => n.id)));
  const isUnread    = (n, i) => i < 3 && !readIds.has(n.id);
  const isLoading   = loading || fetching;

  const handleCekNow = async () => {
    if (handleCek) await handleCek();
    setTimeout(loadHistory, 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }
        .notif-row:hover   { background: #f9fafb !important; }
        .filter-pill:hover { border-color: #16a34a !important; color: #15803d !important; }
      `}</style>

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total Notifikasi", value: notifList.length, iconBg: "#f3f4f6", iconColor: "#6b7280", Icon: BellIcon },
          { label: "Peringatan",       value: totalWarn,        iconBg: "#fef3c7", iconColor: "#d97706", Icon: WarnIcon },
          { label: "Normal",           value: totalOk,          iconBg: "#dcfce7", iconColor: "#16a34a", Icon: OkIcon   },
          { label: "Informasi",        value: totalInfo,        iconBg: "#dbeafe", iconColor: "#2563eb", Icon: InfoIcon },
        ].map(({ label, value, iconBg, iconColor, Icon }) => (
          <div key={label} style={{
            background: "#fff", borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "14px 18px",
            boxShadow: "0 1px 4px rgba(0,0,0,.06)",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: iconBg, color: iconColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1.2, marginTop: 2 }}>
                {isLoading ? "–" : value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + filter bar ── */}
      <div style={{
        background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
        padding: "11px 16px", display: "flex", alignItems: "center",
        gap: 10, flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,.04)",
      }}>
        {/* Search input */}
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span style={{
            position: "absolute", left: 11, top: "50%",
            transform: "translateY(-50%)", color: "#9ca3af",
            display: "flex", pointerEvents: "none",
          }}>
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari notifikasi..."
            style={{
              width: "100%", paddingLeft: 32, paddingRight: 12,
              paddingTop: 8, paddingBottom: 8,
              border: "1px solid #e5e7eb", borderRadius: 8,
              fontSize: 12.5, fontFamily: "inherit", outline: "none",
              color: "#374151", background: "#f9fafb", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Filter Tipe button (dropdown style dengan pill aktif) */}
        <div style={{
          display: "flex", alignItems: "center", gap: 3,
          background: "#f9fafb", borderRadius: 8, padding: "3px 6px",
          border: "1px solid #e5e7eb",
        }}>
          <span style={{ color: "#9ca3af", marginRight: 3, display: "flex" }}><FilterIcon /></span>
          {["SEMUA", "PERINGATAN", "NORMAL", "INFO"].map(f => (
            <button
              key={f}
              className="filter-pill"
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 11px", borderRadius: 6,
                fontSize: 11, fontWeight: 600,
                border: "none",
                background: filter === f ? "#16a34a" : "transparent",
                color: filter === f ? "#fff" : "#6b7280",
                cursor: "pointer", fontFamily: "inherit",
                transition: "all .12s",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={markAllRead}
          style={{
            fontSize: 12, fontWeight: 600, color: "#16a34a",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "inherit", marginLeft: "auto", whiteSpace: "nowrap",
          }}
        >
          Tandai Semua Dibaca
        </button>
      </div>

      {/* ── Notifikasi list ── */}
      <div style={{
        background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
            Semua Notifikasi
            <span style={{ fontSize: 11.5, color: "#9ca3af", fontWeight: 400, marginLeft: 8 }}>
              ({filtered.length} tampil)
            </span>
          </h3>
          <button
            onClick={handleCekNow}
            disabled={isLoading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "1px solid #e5e7eb", background: "#f9fafb",
              color: "#374151", cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit", opacity: isLoading ? .6 : 1,
            }}
          >
            <RefreshIcon spin={isLoading} />
            {isLoading ? "Memuat..." : "Refresh"}
          </button>
        </div>

        {/* List items */}
        {filtered.length === 0 ? (
          <div style={{ padding: "56px 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
            {isLoading ? "Memuat notifikasi..." : "Tidak ada notifikasi ditemukan"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map((n, i) => {
              const cfg    = getTypeConfig(n.type);
              const Icon   = n.type === "warn" ? WarnIcon : n.type === "ok" ? OkIcon : InfoIcon;
              const unread = isUnread(n, i);

              return (
                <div
                  key={n.id ?? i}
                  className="notif-row"
                  style={{
                    display: "flex", gap: 14, padding: "16px 20px",
                    borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                    background: unread ? cfg.rowBg : "#fff",
                    cursor: "pointer", position: "relative",
                    transition: "background .15s",
                    animation: `fadeIn .25s ease ${Math.min(i * 0.03, 0.35)}s both`,
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: cfg.iconBg, color: cfg.iconColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 2,
                  }}>
                    <Icon />
                  </div>

                  {/* Konten */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10, lineHeight: 1.5 }}>
                      {n.desc}
                    </div>

                    {/* Detail box */}
                    <div style={{
                      background: "#f9fafb", borderRadius: 8,
                      padding: "9px 13px", display: "flex",
                      flexDirection: "column", gap: 4,
                      border: "1px solid #f3f4f6",
                    }}>
                      {[
                        { label: "Location:", value: "Ruang Dosen - Gedung 4" },
                        { label: "Devices:",  value: `Lampu: ${n.lampu || "–"}, AC: ${n.ac || "–"}` },
                        { label: "People:",   value: String(n.orang ?? 0) },
                        { label: "Kondisi:",  value: n.kondisi || "–" },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                          <span style={{ color: "#9ca3af" }}>{label}</span>
                          <span style={{ fontWeight: 700, color: "#111827" }}>{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9 }}>
                      <span style={{ fontSize: 10.5, color: "#9ca3af" }}>{fmtShort(n.waktu)}</span>
                      {n.gambar_url && (
                        <a
                          href={n.gambar_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#16a34a", fontSize: 11.5, fontWeight: 700, textDecoration: "none" }}
                        >
                          Lihat Gambar
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Badge */}
                  <div style={{ flexShrink: 0 }}>
                    <span style={{
                      display: "inline-block", padding: "3px 9px", borderRadius: 20,
                      fontSize: 9.5, fontWeight: 800, background: cfg.badgeBg,
                      color: cfg.badgeColor, textTransform: "uppercase", letterSpacing: ".5px",
                    }}>
                      {cfg.badgeLabel}
                    </span>
                  </div>

                  {/* Unread dot */}
                  {unread && (
                    <div style={{
                      position: "absolute", top: 18, right: 18,
                      width: 9, height: 9, borderRadius: "50%",
                      background: cfg.dotColor,
                      boxShadow: `0 0 0 2px ${cfg.rowBg}`,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}