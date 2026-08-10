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

      {/* ── Gambar Deteksi ── */}
      {curImg && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb", fontSize: 11, fontWeight: 600, color: "#4b5563" }}>
            <Ico d={P.eye} size={13} />
            <span>Gambar Hasil Deteksi</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>
              {lastCek ? fmtFull(lastCek) : ""}
            </span>
            {dispOrang !== "–" && (
              <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>
                {dispOrang} orang terdeteksi
              </span>
            )}
            <button
              onClick={() => setModalImg(curImg)}
              style={{ marginLeft: 4, padding: "2px 8px", background: "#dbeafe", color: "#1d4ed8", borderRadius: 5, fontSize: 10, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", border: "none" }}
            >
              🔍 Zoom
            </button>
          </div>
          <img src={curImg} alt="Hasil Deteksi" style={{ width: "100%", maxHeight: 280, objectFit: "cover", cursor: "zoom-in", display: "block" }} onClick={() => setModalImg(curImg)} />
        </div>
      )}

      {/* ── Grafik + Ringkasan ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>

        {/* Grafik */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>
              Grafik Aktivitas Ruangan&nbsp;
              <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>(20 data terakhir)</span>
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8, fontSize: 11, color: "#6b7280" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 16, height: 3, background: "#2563eb", borderRadius: 2, display: "inline-block" }} />
              Jumlah Orang
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 16, height: 3, background: "#ef4444", borderRadius: 2, display: "inline-block" }} />
              Pemborosan
            </span>
          </div>
          <div style={{ height: 150, position: "relative" }}>
            {history.length > 0
              ? <Line data={actChart} options={lineOpts} />
              : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", fontSize: 12 }}>
                  Menunggu data auto cek pertama...
                </div>
            }
          </div>
        </div>

        {/* Ringkasan */}
        <div className="card">
          <div style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>
              Ringkasan&nbsp;
              <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>(Semua Data)</span>
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { val: summary.pemborosan || 0, lbl: "Pemborosan", bg: "#fef2f2", color: "#dc2626" },
              { val: summary.normal     || 0, lbl: "Normal",     bg: "#f0fdf4", color: "#16a34a" },
              { val: summary.peringatan || 0, lbl: "Peringatan", bg: "#fffbeb", color: "#d97706" },
              { val: summary.aman       || 0, lbl: "Aman",       bg: "#eff6ff", color: "#2563eb" },
              { val: summary.total      || 0, lbl: "Total",      bg: "#f3f4f6", color: "#374151" },
            ].map(({ val, lbl, bg, color }) => (
              <div key={lbl} style={{ background: bg, borderRadius: 9, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color, opacity: .8, marginTop: 5 }}>{lbl}</div>
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