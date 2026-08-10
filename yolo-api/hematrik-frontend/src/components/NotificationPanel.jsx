import { useState } from "react";
import { fmtShort } from "../utils/helpers";

function getTypeConfig(type) {
  if (type === "warn") return {
    iconBg: "#fef3c7", iconColor: "#d97706",
    badgeBg: "#fef3c7", badgeColor: "#92400e", badgeLabel: "PERINGATAN",
    rowBg: "#fffbeb", borderColor: "#fde68a",
  };
  if (type === "ok") return {
    iconBg: "#dcfce7", iconColor: "#16a34a",
    badgeBg: "#dcfce7", badgeColor: "#14532d", badgeLabel: "NORMAL",
    rowBg: "#f0fdf4", borderColor: "#bbf7d0",
  };
  return {
    iconBg: "#dbeafe", iconColor: "#2563eb",
    badgeBg: "#dbeafe", badgeColor: "#1e40af", badgeLabel: "INFO",
    rowBg: "#eff6ff", borderColor: "#bfdbfe",
  };
}

const WarnIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const OkIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const InfoIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

export default function Notifikasi({ notifList, handleCek, loading, lastCek }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("SEMUA");

  const totalWarn = notifList.filter(n => n.type === "warn").length;
  const totalOk   = notifList.filter(n => n.type === "ok").length;
  const totalInfo = notifList.filter(n => n.type === "info").length;

  const filtered = notifList.filter(n => {
    const matchFilter =
      filter === "SEMUA"     ? true :
      filter === "PERINGATAN" ? n.type === "warn" :
      filter === "NORMAL"     ? n.type === "ok"   :
      filter === "INFO"       ? n.type === "info"  : true;
    const matchSearch = search === "" ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.desc.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total Notifikasi", value: notifList.length, iconBg: "#f3f4f6", iconColor: "#6b7280", Icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
          { label: "Peringatan",       value: totalWarn,        iconBg: "#fef3c7", iconColor: "#d97706", Icon: WarnIcon },
          { label: "Normal",           value: totalOk,          iconBg: "#dcfce7", iconColor: "#16a34a", Icon: OkIcon   },
          { label: "Informasi",        value: totalInfo,        iconBg: "#dbeafe", iconColor: "#2563eb", Icon: InfoIcon },
        ].map(({ label, value, iconBg, iconColor, Icon }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 11, border: "1px solid #e5e7eb", padding: "13px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.05)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1.2, marginTop: 2 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ background: "#fff", borderRadius: 11, border: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
        <div style={{ position: "relative", flex: "1 1 180px" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari notifikasi..." style={{ width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7, border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12, fontFamily: "inherit", outline: "none", color: "#374151", background: "#f9fafb" }} />
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {["SEMUA", "PERINGATAN", "NORMAL", "INFO"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: "1px solid", borderColor: filter === f ? "#16a34a" : "#e5e7eb", background: filter === f ? "#f0fdf4" : "#fff", color: filter === f ? "#15803d" : "#6b7280", cursor: "pointer", fontFamily: "inherit", transition: "all .12s" }}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => setFilter("SEMUA")} style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginLeft: "auto", whiteSpace: "nowrap" }}>
          Tandai Semua Dibaca
        </button>
      </div>

      {/* Notifikasi list */}
      <div style={{ background: "#fff", borderRadius: 11, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,.04)", overflow: "hidden" }}>
        <div style={{ padding: "13px 18px", borderBottom: "1px solid #f3f4f6" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
            Semua Notifikasi
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400, marginLeft: 8 }}>({filtered.length} tampil)</span>
          </h3>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>
            Tidak ada notifikasi ditemukan
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map((n, i) => {
              const cfg = getTypeConfig(n.type);
              const Icon = n.type === "warn" ? WarnIcon : n.type === "ok" ? OkIcon : InfoIcon;
              return (
                <div key={i} style={{ display: "flex", gap: 14, padding: "14px 18px", borderBottom: i < filtered.length - 1 ? "1px solid #f9fafb" : "none", background: i < 2 ? cfg.rowBg : "#fff", transition: "background .12s", cursor: "pointer", position: "relative" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = i < 2 ? cfg.rowBg : "#fff"}
                >
                  {/* Icon */}
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: cfg.iconBg, color: cfg.iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon />
                  </div>
                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, lineHeight: 1.4 }}>{n.desc}</div>
                    <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: "#9ca3af" }}>Location:</span>
                        <span style={{ fontWeight: 700, color: "#111827" }}>Ruang Dosen - Gedung 4</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: "#9ca3af" }}>Devices:</span>
                        <span style={{ fontWeight: 700, color: "#111827" }}>Lampu: ON, AC: ON</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: "#9ca3af" }}>People:</span>
                        <span style={{ fontWeight: 700, color: "#111827" }}>{n.orang ?? 0}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{fmtShort(n.waktu)}</span>
                      <button style={{ background: "none", border: "none", color: "#16a34a", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                  {/* Type badge */}
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 9, fontWeight: 800, background: cfg.badgeBg, color: cfg.badgeColor, textTransform: "uppercase", letterSpacing: ".4px" }}>
                      {cfg.badgeLabel}
                    </span>
                  </div>
                  {/* Unread dot */}
                  {i < 3 && (
                    <div style={{ position: "absolute", top: 16, right: 16, width: 8, height: 8, borderRadius: "50%", background: n.type === "warn" ? "#ef4444" : "#16a34a" }} />
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