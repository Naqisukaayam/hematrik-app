import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, CategoryScale,
  LinearScale, PointElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Ico, P } from "../utils/icons";
import { fmtShort } from "../utils/helpers";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

const API = "http://127.0.0.1:8000";

const lineOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1f2937" } },
  scales: {
    x: { ticks: { font: { size: 9 }, color: "#9ca3af", maxRotation: 35, maxTicksLimit: 10 }, grid: { color: "#f0f2f5" } },
    y: { ticks: { font: { size: 10 }, color: "#9ca3af" }, grid: { color: "#f0f2f5" }, beginAtZero: true },
  },
};

export default function Perangkat({ status, data, listrikH }) {
  const dispAC    = status.ac        || data.ac    || "–";
  const dispLampu = status.lampu     || data.lampu || "–";
  const dispDisp  = status.dispenser || data.dispenser || "–";
  const wattAC    = status.power_ac_w    ?? data.power_ac_w    ?? 0;
  const wattLampu = status.power_lampu_w ?? data.power_lampu_w ?? 0;

  // State tombol kontrol — sinkron dari status backend
  const [kontrol, setKontrol] = useState({ ac: null, lampu: null, dispenser: null });
  const [loading, setLoading] = useState({ ac: false, lampu: false, dispenser: false });
  const [modeOtomatis, setModeOtomatis]   = useState(true);

  // Ambil status kontrol saat pertama load
  useEffect(() => {
    fetch(`${API}/kontrol`)
      .then(r => r.json())
      .then(d => {
        setKontrol({ ac: d.ac, lampu: d.lampu, dispenser: d.dispenser });
        setModeOtomatis(d.mode === "otomatis");
      })
      .catch(() => {});
  }, []);

  // Tombol toggle ON/OFF satu perangkat
  const togglePerangkat = async (perangkat) => {
    setLoading(l => ({ ...l, [perangkat]: true }));
    const nilaiSekarang = kontrol[perangkat];
    const nilaiBaru = nilaiSekarang === true ? false : true;
    try {
      const res = await fetch(`${API}/kontrol`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perangkat, nilai: nilaiBaru }),
      });
      const d = await res.json();
      if (d.success) {
        setKontrol(k => ({ ...k, [perangkat]: nilaiBaru }));
      }
    } catch (e) {
      console.error("Gagal kontrol:", e);
    }
    setLoading(l => ({ ...l, [perangkat]: false }));
  };

  // Toggle mode otomatis/manual
  const toggleMode = async () => {
    const modeBaru = modeOtomatis ? "manual" : "otomatis";
    try {
      await fetch(`${API}/kontrol/mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: modeBaru }),
      });
      setModeOtomatis(!modeOtomatis);
      // Kalau balik ke otomatis, reset semua kontrol ke null
      if (modeBaru === "otomatis") {
        setKontrol({ ac: null, lampu: null, dispenser: null });
      }
    } catch (e) {
      console.error("Gagal ganti mode:", e);
    }
  };

  const acData    = listrikH.filter(r => r.device_id === "4B8A13").reverse().slice(-30);
 const lampuData = listrikH.filter(r => r.device_id === "939788").reverse().slice(-30);
  const kwChartAC = {
    labels: acData.map(r => r.time_recorded?.slice(11, 16) || ""),
    datasets: [{ label: "AC (W)", data: acData.map(r => r.power_w), borderColor: "#0284c7", backgroundColor: "rgba(2,132,199,.1)", tension: .3, fill: true, pointRadius: 2 }],
  };
  const kwChartLampu = {
    labels: lampuData.map(r => r.time_recorded?.slice(11, 16) || ""),
    datasets: [{ label: "Lampu (W)", data: lampuData.map(r => r.power_w), borderColor: "#d97706", backgroundColor: "rgba(217,119,6,.1)", tension: .3, fill: true, pointRadius: 2 }],
  };

  // Tampilan status aktual (dari sensor) vs kontrol (dari tombol)
  const statusAC   = modeOtomatis ? dispAC   : (kontrol.ac   === true ? "ON" : kontrol.ac   === false ? "OFF" : dispAC);
  const statusLampu= modeOtomatis ? dispLampu: (kontrol.lampu=== true ? "ON" : kontrol.lampu=== false ? "OFF" : dispLampu);
  const statusDisp = modeOtomatis ? dispDisp : (kontrol.dispenser === true ? "ON" : kontrol.dispenser === false ? "OFF" : dispDisp);

  return (
    <>
      {/* Banner mode kontrol */}
      <div className="kontrol-mode-bar" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: modeOtomatis ? "#f0fdf4" : "#fff7ed",
        border: `1px solid ${modeOtomatis ? "#86efac" : "#fed7aa"}`,
        borderRadius: 10, padding: "10px 16px", marginBottom: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{modeOtomatis ? "🤖" : "🕹️"}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: modeOtomatis ? "#15803d" : "#c2410c" }}>
              Mode {modeOtomatis ? "Otomatis" : "Manual"}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {modeOtomatis
                ? "Perangkat dikontrol otomatis oleh sistem (jam kerja + deteksi orang)"
                : "Kamu mengontrol perangkat secara manual"}
            </div>
          </div>
        </div>
        <button
          onClick={toggleMode}
          style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            fontWeight: 600, fontSize: 12,
            background: modeOtomatis ? "#16a34a" : "#ea580c",
            color: "#fff",
          }}
        >
          {modeOtomatis ? "Ganti ke Manual" : "Ganti ke Otomatis"}
        </button>
      </div>

      <div className="status-grid">
        {/* AC */}
        <div className="s-card">
          <div className="s-card-title">AC — Device 4B8A13 <span className="realtime-dot" /></div>
          <div className="device-detail">
            <div className={`dev-big-icon ${dispAC === "ON" ? "ac" : "off"}`}><Ico d={P.ac} size={40} /></div>
            <div className={`dev-big-state ${dispAC === "ON" ? "on" : "off"}`}>{dispAC}</div>
            <div className="device-stats">
              <div className="dstat"><span>Daya</span><strong>{wattAC} W</strong></div>
              <div className="dstat"><span>Tegangan</span><strong>{status.voltage_ac || 0} V</strong></div>
              <div className="dstat"><span>Arus</span><strong>{status.current_ac || 0} A</strong></div>
              <div className="dstat"><span>kWh Hari Ini</span><strong>{status.today_kwh_ac || 0}</strong></div>
            </div>
            <div className="dstat-time">Update: {fmtShort(status.time_ac)}</div>

            {/* Tombol kontrol */}
            <ToggleBtn
              isOn={kontrol.ac === true || (kontrol.ac === null && dispAC === "ON")}
              loading={loading.ac}
              disabled={modeOtomatis}
              onClick={() => togglePerangkat("ac")}
            />
          </div>
        </div>

        {/* Lampu */}
        <div className="s-card">
          <div className="s-card-title">Lampu — Device 939788 <span className="realtime-dot" /></div>
          <div className="device-detail">
            <div className={`dev-big-icon ${dispLampu === "ON" ? "lampu" : "off"}`}><Ico d={P.bulb} size={40} /></div>
            <div className={`dev-big-state ${dispLampu === "ON" ? "on" : "off"}`}>{dispLampu}</div>
            <div className="device-stats">
              <div className="dstat"><span>Daya</span><strong>{wattLampu} W</strong></div>
              <div className="dstat"><span>Tegangan</span><strong>{status.voltage_lampu || 0} V</strong></div>
              <div className="dstat"><span>Arus</span><strong>{status.current_lampu || 0} A</strong></div>
              <div className="dstat"><span>kWh Hari Ini</span><strong>{status.today_kwh_lampu || 0}</strong></div>
            </div>
            <div className="dstat-time">Update: {fmtShort(status.time_lampu)}</div>

            <ToggleBtn
              isOn={kontrol.lampu === true || (kontrol.lampu === null && dispLampu === "ON")}
              loading={loading.lampu}
              disabled={modeOtomatis}
              onClick={() => togglePerangkat("lampu")}
            />
          </div>
        </div>

        {/* Dispenser */}
        <div className="s-card">
          <div className="s-card-title">Dispenser — Device 75AA3A <span className="realtime-dot" /></div>
          <div className="device-detail">
            <div className={`dev-big-icon ${dispDisp === "ON" ? "lampu" : "off"}`}><Ico d={P.disp} size={40} /></div>
            <div className={`dev-big-state ${dispDisp === "ON" ? "on" : "off"}`}>{dispDisp}</div>
            <div className="device-stats">
              <div className="dstat"><span>Sensor</span><strong>Shared 75AA3A</strong></div>
              <div className="dstat"><span>Status</span><strong>{dispDisp === "ON" ? "Aktif" : "Mati"}</strong></div>
            </div>
            <div className="dstat-time">Update: {fmtShort(status.time_lampu)}</div>

            <ToggleBtn
              isOn={kontrol.dispenser === true || (kontrol.dispenser === null && dispDisp === "ON")}
              loading={loading.dispenser}
              disabled={modeOtomatis}
              onClick={() => togglePerangkat("dispenser")}
            />
          </div>
        </div>
      </div>

      {/* Grafik daya */}
      <div className="mid-grid">
        <div className="card">
          <div className="card-head"><h3>Riwayat Daya AC <span className="card-sub">(Watt)</span></h3></div>
          <div className="chart-wrap" style={{ height: 160 }}>
            {acData.length > 0
              ? <Line data={kwChartAC} options={lineOpts} />
              : <div className="no-data">Belum ada data</div>}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Riwayat Daya Lampu <span className="card-sub">(Watt)</span></h3></div>
          <div className="chart-wrap" style={{ height: 160 }}>
            {lampuData.length > 0
              ? <Line data={kwChartLampu} options={lineOpts} />
              : <div className="no-data">Belum ada data</div>}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Komponen Tombol Toggle ───────────────────────────────────
function ToggleBtn({ isOn, loading, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={disabled ? "Aktifkan mode manual untuk kontrol manual" : (isOn ? "Klik untuk matikan" : "Klik untuk nyalakan")}
      style={{
        marginTop: 10,
        width: "100%",
        padding: "8px 0",
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 700,
        fontSize: 13,
        transition: "all 0.2s",
        background: disabled
          ? "#e5e7eb"
          : isOn
            ? "#dcfce7"
            : "#fee2e2",
        color: disabled
          ? "#9ca3af"
          : isOn
            ? "#15803d"
            : "#b91c1c",
        border: disabled
          ? "1.5px solid #d1d5db"
          : isOn
            ? "1.5px solid #86efac"
            : "1.5px solid #fca5a5",
      }}
    >
      {loading ? "⏳ Loading..." : disabled ? "🔒 Otomatis" : isOn ? "🟢 ON — Klik Matikan" : "🔴 OFF — Klik Nyalakan"}
    </button>
  );
}