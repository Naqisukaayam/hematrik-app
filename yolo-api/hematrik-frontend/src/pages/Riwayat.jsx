import { useState } from "react";
import KondisiBadge from "../components/KondisiBadge";
import { Ico, P } from "../utils/icons";
import { exportHistoryPdf } from "../utils/exportPdf";

const PER_PAGE = 10;

function ImgModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
        <img
          src={src}
          alt="Deteksi"
          style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 10, boxShadow: "0 8px 40px rgba(0,0,0,.6)", display: "block" }}
        />
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: -14, right: -14,
            width: 32, height: 32, borderRadius: "50%",
            background: "#fff", border: "none", cursor: "pointer",
            fontSize: 16, fontWeight: 700, color: "#374151",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,.3)",
          }}
        >✕</button>
      </div>
    </div>
  );
}

function fmtTgl(str) {
  if (!str) return "–";
  try {
    const d = new Date(str);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return str.slice(0, 10); }
}
function fmtJam(str) {
  if (!str) return "–";
  return str.slice(11, 16) || "–";
}

function DevBadge({ val }) {
  const on  = val === "ON";
  const off = val === "OFF";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 9px",
      borderRadius: 6, fontSize: 10, fontWeight: 700,
      background: on ? "#dcfce7" : off ? "#fee2e2" : "#f3f4f6",
      color:      on ? "#15803d" : off ? "#b91c1c" : "#6b7280",
    }}>
      {val || "–"}
    </span>
  );
}

function PgBtn({ onClick, disabled, active, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 30, height: 30, borderRadius: 7,
      border: active ? "none" : "1px solid #e5e7eb",
      background: active ? "#16a34a" : "#fff",
      color: active ? "#fff" : disabled ? "#d1d5db" : "#374151",
      fontSize: 12, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {children}
    </button>
  );
}

function ImgThumb({ url, onOpen }) {
  if (!url) {
    return (
      <div style={{
        width: 48, height: 36, borderRadius: 6,
        background: "#f3f4f6", border: "1px dashed #d1d5db",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Ico d={P.img} size={13} />
      </div>
    );
  }
  return (
    <div
      onClick={() => onOpen(url)}
      title="Klik untuk zoom"
      style={{
        width: 48, height: 36, borderRadius: 6, overflow: "hidden",
        cursor: "pointer", border: "2px solid #e5e7eb",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#f3f4f6", transition: "border-color .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#16a34a"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
    >
      <img
        src={url}
        alt="capture"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={e => { e.currentTarget.style.display = "none"; }}
      />
    </div>
  );
}

export default function Riwayat({ history, setModalImg }) {
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("SEMUA");
  const [modalSrc,    setModalSrc]    = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const openImg = (url) => {
    if (setModalImg) setModalImg(url);
    setModalSrc(url);
  };

  // Hitung summary konsisten dengan useMonitoring
  const total      = history.length;
  const normal     = history.filter(h => h.kondisi === "NORMAL").length;
  const peringatan = history.filter(h => h.kondisi === "PERINGATAN").length;
  const pemborosan = history.filter(h => h.kondisi === "PEMBOROSAN").length;
  const aman       = history.filter(h => h.kondisi === "AMAN").length;

  const filtered = history.filter(h => {
    const matchFilter = filter === "SEMUA" || h.kondisi === filter;
    const matchSearch = search === "" ||
      (h.waktu || "").includes(search) ||
      (h.kondisi || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleFilter = (f) => { setFilter(f); setPage(1); };
  const handleSearch = (v) => { setSearch(v); setPage(1); };

  const handleExportPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportHistoryPdf(filtered, { normal, aman, peringatan, pemborosan }, filter);
    } catch (err) {
      console.error("Gagal export PDF:", err);
      alert("Gagal mengekspor PDF: " + (err.message || "terjadi kesalahan"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <ImgModal src={modalSrc} onClose={() => setModalSrc(null)} />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
          {[
            { label: "Total Pengecekan", value: total,      valColor: "#111827", sub: "Semua data",                                                subColor: "#6b7280" },
            { label: "Kondisi Normal",   value: normal,     valColor: "#16a34a", sub: `${total ? Math.round(normal/total*100) : 0}% dari total`,   subColor: "#6b7280" },
            { label: "Aman",             value: aman,       valColor: "#2563eb", sub: `${total ? Math.round(aman/total*100) : 0}% dari total`,     subColor: "#6b7280" },
            { label: "Peringatan",       value: peringatan, valColor: "#d97706", sub: `${total ? Math.round(peringatan/total*100) : 0}% dari total`, subColor: "#6b7280" },
            { label: "Pemborosan",       value: pemborosan, valColor: "#dc2626", sub: `${total ? Math.round(pemborosan/total*100) : 0}% dari total`, subColor: "#6b7280" },
          ].map(({ label, value, valColor, sub, subColor }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 11, border: "1px solid #e5e7eb", padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: valColor, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: subColor, marginTop: 5, fontWeight: 500 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ background: "#fff", borderRadius: 11, border: "1px solid #e5e7eb", padding: "11px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
          <div style={{ position: "relative", flex: "1 1 160px" }}>
            <svg style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Cari waktu atau kondisi..." style={{ width: "100%", paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6, border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 11, fontFamily: "inherit", outline: "none", color: "#374151", background: "#f9fafb" }} />
          </div>
          <select value={filter} onChange={e => handleFilter(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 11, fontFamily: "inherit", color: "#374151", outline: "none", background: "#fff", cursor: "pointer" }}>
            {["SEMUA","NORMAL","AMAN","PEMBOROSAN","PERINGATAN"].map(f => <option key={f} value={f}>{f === "SEMUA" ? "Filter Kondisi" : f}</option>)}
          </select>
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
              border: "none", borderRadius: 7, background: isExporting ? "#15803d" : "#16a34a",
              fontSize: 11, fontWeight: 700, color: "#fff", cursor: isExporting ? "not-allowed" : "pointer",
              fontFamily: "inherit", opacity: isExporting ? 0.8 : 1, transition: "all .15s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {isExporting ? "Membuat PDF..." : "Export PDF"}
          </button>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 11, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,.04)", overflow: "hidden" }}>
          <div style={{ padding: "13px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
              Riwayat Lengkap Pengecekan
              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400, marginLeft: 8 }}>({filtered.length} data)</span>
            </h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 780 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["No","Waktu","Jumlah Orang","Lampu","AC","Dispenser","Kondisi","Foto"].map(th => (
                    <th key={th} style={{ textAlign: "left", padding: "9px 12px", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".5px", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 12 }}>Belum ada data riwayat</td></tr>
                ) : paginated.map((h, i) => (
                  <tr key={h.id || i}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    style={{ borderBottom: "1px solid #f3f4f6", transition: "background .1s" }}
                  >
                    <td style={{ padding: "10px 12px", color: "#9ca3af", fontSize: 11 }}>{(page-1)*PER_PAGE+i+1}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600, color: "#111827", fontSize: 12 }}>{fmtTgl(h.waktu)}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{fmtJam(h.waktu)}</div>
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#111827", textAlign: "center" }}>{h.orang ?? 0}</td>
                    <td style={{ padding: "10px 12px" }}><DevBadge val={h.lampu} /></td>
                    <td style={{ padding: "10px 12px" }}><DevBadge val={h.ac} /></td>
                    <td style={{ padding: "10px 12px" }}><DevBadge val={h.dispenser} /></td>
                    <td style={{ padding: "10px 12px" }}><KondisiBadge kondisi={h.kondisi} /></td>
                    <td style={{ padding: "8px 12px" }}>
                      <ImgThumb url={h.gambar_url} onOpen={openImg} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "12px 18px", borderTop: "1px solid #f3f4f6" }}>
              <PgBtn onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>‹</PgBtn>
              {Array.from({ length: Math.min(5,totalPages) }, (_,i) => {
                let p = i+1;
                if (totalPages>5) {
                  if (page<=3) p=i+1;
                  else if (page>=totalPages-2) p=totalPages-4+i;
                  else p=page-2+i;
                }
                return <PgBtn key={p} onClick={() => setPage(p)} active={page===p}>{p}</PgBtn>;
              })}
              <PgBtn onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>›</PgBtn>
            </div>
          )}
        </div>

      </div>
    </>
  );
}