import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, CategoryScale,
  LinearScale, PointElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Ico, P } from "../utils/icons";
import { fmtFull } from "../utils/helpers";
import DevCard from "../components/DevCard";
import RiwayatTable from "../components/RiwayatTable";
import { AUTO_CEK_INTERVAL } from "../hooks/useMonitoring";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

const lineOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1f2937",
      titleFont: { size: 11 },
      bodyFont:  { size: 11 },
      padding: 8,
    },
  },
  scales: {
    x: {
      ticks: { font: { size: 9 }, color: "#9ca3af", maxRotation: 30, maxTicksLimit: 12 },
      grid:  { color: "#f3f4f6" },
    },
    y: {
      ticks: { font: { size: 10 }, color: "#9ca3af" },
      grid:  { color: "#f3f4f6" },
      beginAtZero: true,
    },
  },
};

export default function Dashboard({
  data, status, history, summary, loading,
  lastCek, curImg, autoMode, countdown,
  setModalImg, setPage, error,
}) {
  const dispAC      = status.ac        || data.ac        || "–";
  const dispLampu   = status.lampu     || data.lampu     || "–";
  const dispDisp    = status.dispenser || data.dispenser || "–";
  const dispKondisi = data.kondisi   || "–";
  const dispOrang   = data.orang !== undefined ? data.orang : "–";
  const dispNotif   = data.notifikasi || "Auto cek berjalan, menunggu hasil...";
  const wattAC      = status.power_ac_w    ?? data.power_ac_w    ?? 0;
  const wattLampu   = status.power_lampu_w ?? data.power_lampu_w ?? 0;

  const isPemborosan = dispKondisi === "PEMBOROSAN";
  const isPeringatan = dispKondisi === "PERINGATAN";
  const isNormal     = dispKondisi === "NORMAL";

  const recentH   = [...history].reverse().slice(-20);
  const actChart  = {
    labels: recentH.map(h => h.waktu?.slice(11, 16) || ""),
    datasets: [
      {
        label: "Jumlah Orang",
        data: recentH.map(h => h.orang || 0),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,.07)",
        tension: .4, pointRadius: 3, pointHoverRadius: 5,
        fill: true, borderWidth: 2,
      },
      {
        label: "Pemborosan",
        data: recentH.map(h => h.kondisi === "PEMBOROSAN" ? 1 : 0),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,.05)",
        tension: .4, borderDash: [5, 3], pointRadius: 2,
        fill: true, borderWidth: 1.5,
      },
    ],
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Auto Banner ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px", borderRadius: 10,
        fontSize: 12, border: "1px solid",
        background: autoMode ? "#f0fdf4" : "#f9fafb",
        borderColor: autoMode ? "#bbf7d0" : "#e5e7eb",
        color: autoMode ? "#15803d" : "#6b7280",
      }}>
        <Ico d={P.auto} size={14} />
        <span>
          {autoMode
            ? <><strong>Auto Realtime</strong> aktif — deteksi setiap <strong>2 menit</strong>. Berikutnya: <strong>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}</strong></>
            : <>Mode <strong>Manual</strong> — klik <strong>CEK SEKARANG</strong> untuk memulai deteksi</>
          }
        </span>
        {loading && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto", fontWeight: 600, color: "#16a34a" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
            Sedang mendeteksi...
          </span>
        )}
      </div>

      {/* ── 3 Status Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>

        {/* Card 1: Orang */}
        <div className="s-card">
          <div className="s-card-title">Status Orang di Ruangan</div>
          <div className="orang-center">
            <div className={`orang-avatar ${dispOrang > 0 ? "has-orang" : "no-orang"}`}>
              <Ico d={P.person} size={26} />
            </div>
            <div className={`orang-label ${dispOrang === "–" ? "gray" : dispOrang > 0 ? "green" : "red"}`}>
              {dispOrang === "–" ? "MENGINISIALISASI" : dispOrang > 0 ? "ADA ORANG" : "TIDAK ADA"}
            </div>
            {dispOrang > 0 && (
              <span className="orang-count">{dispOrang} Orang</span>
            )}
            <div className="orang-updated">
              Diperbarui: {lastCek ? fmtFull(lastCek) : "–"}
            </div>
          </div>
        </div>

        {/* Card 2: Perangkat */}
        <div className="s-card">
          <div className="s-card-title">
            Status Perangkat (IoT)&nbsp;<span className="realtime-dot" title="Realtime" />
          </div>
          <div className="devices-row">
            <DevCard icon={P.bulb} label="Lampu"     state={dispLampu} watt={wattLampu} />
            <DevCard icon={P.ac}   label="AC"        state={dispAC}    watt={wattAC}    />
            <DevCard icon={P.disp} label="Dispenser" state={dispDisp}  watt={0}         />
          </div>
        </div>

        {/* Card 3: Kondisi */}
        <div className="s-card">
          <div className="s-card-title">Kondisi Sistem Saat Ini</div>
          <div className="kondisi-center">
            <div className={`kondisi-icon-wrap ${isPemborosan ? "danger" : isPeringatan ? "warning" : isNormal ? "normal" : "gray"}`}>
              <Ico d={isPemborosan || isPeringatan ? P.warn : isNormal ? P.ok : P.eye} size={24} />
            </div>
            <div className={`kondisi-text ${isPemborosan ? "danger" : isPeringatan ? "warning" : isNormal ? "normal" : "gray"}`}>
              {dispKondisi}
            </div>
            <div className="kondisi-desc">{dispNotif}</div>
            <div className="kondisi-time">{lastCek ? fmtFull(lastCek) : "–"}</div>
          </div>
        </div>
      </div>

      {/* ── Alert Banner ── */}
      {(isPeringatan || isPemborosan) && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 9, border: "1px solid",
          background: isPemborosan ? "#fef2f2" : "#fffbeb",
          borderColor: isPemborosan ? "#fca5a5" : "#fde68a",
        }}>
          <span style={{ color: isPemborosan ? "#dc2626" : "#d97706", display: "flex", flexShrink: 0 }}>
            <Ico d={P.warn} size={18} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isPemborosan ? "#991b1b" : "#92400e" }}>
              {isPemborosan ? "⚡ Pemborosan energi terdeteksi!" : "⚠️ Peringatan! Listrik aktif di luar jam kerja"}
            </div>
            <div style={{ fontSize: 11, color: isPemborosan ? "#b91c1c" : "#b45309", marginTop: 2 }}>
              {dispNotif}
            </div>
          </div>
          <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>
            {lastCek?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={() => setPage("notifikasi")}
            style={{
              padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: `1px solid ${isPemborosan ? "#fca5a5" : "#fde68a"}`,
              background: "#fff", color: isPemborosan ? "#dc2626" : "#d97706",
              cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
            }}
          >
            Lihat Detail
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>

        {/* ── Gambar Deteksi */}
        <div className="capture-card">
          <div className="capture-head">
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#374151" }}>
              <Ico d={P.eye} size={13} />
              <span>Gambar Hasil Deteksi</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {dispOrang !== "–" && (
                <span className="orang-badge-sm">{dispOrang} orang</span>
              )}
              <button
                onClick={() => setPage("perangkat")}
                className="btn-zoom"
              >
                Deteksi
              </button>
            </div>
          </div>
          <div style={{ padding: "0 14px 10px", color: "#6b7280", fontSize: 11 }}>
            Foto terakhir dari proses pengecekan
          </div>
          {curImg ? (
            <img src={curImg} alt="Hasil Deteksi" className="capture-img" onClick={() => setModalImg(curImg)} />
          ) : (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", background: "#f8fafc" }}>
              Tidak ada gambar deteksi saat ini
            </div>
          )}
        </div>

        {/* ── Status Perangkat */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>Status Perangkat</h3>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Ringkasan perangkat listrik ruangan</div>
            </div>
            <button
              onClick={() => setPage("perangkat")}
              style={{ padding: "5px 12px", borderRadius: 8, background: "#ecfdf5", color: "#166534", fontSize: 11, fontWeight: 700, border: "1px solid #bbf7d0", cursor: "pointer", fontFamily: "inherit" }}
            >
              Kelola
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            {[
              { id: "lampu", label: "Lampu", short: "L", state: dispLampu, watt: wattLampu, on: dispLampu === "ON", bg: "#fef2f2", color: "#dc2626" },
              { id: "ac", label: "AC", short: "A", state: dispAC, watt: wattAC, on: dispAC === "ON", bg: "#eff6ff", color: "#2563eb" },
              { id: "dispenser", label: "Dispenser", short: "D", state: dispDisp, watt: 0, on: dispDisp === "ON", bg: "#f8fafc", color: "#6b7280" },
            ].map(item => (
              <div key={item.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "18px 10px", borderRadius: 16, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, display: "grid", placeItems: "center", background: item.bg, color: item.color, fontSize: 16, fontWeight: 800 }}>
                  {item.short}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase" }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: item.on ? "#16a34a" : "#dc2626" }}>{item.state}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>{item.watt > 0 ? `${item.watt.toLocaleString()} W` : "0 W"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabel Riwayat Singkat ── */}
      <div className="card" style={{ paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>Riwayat Pengecekan Terakhir</h3>
          <button
            onClick={() => setPage("riwayat")}
            style={{
              padding: "5px 14px", borderRadius: 7, border: "1px solid #e5e7eb",
              background: "#f9fafb", color: "#16a34a", fontSize: 11, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Lihat Semua →
          </button>
        </div>
        <RiwayatTable data={history.slice(0, 5)} onImg={setModalImg} />
      </div>

    </div>
  );
}