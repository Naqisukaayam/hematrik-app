import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, BarElement, ArcElement,
  CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Ico, P } from "../utils/icons";

ChartJS.register(LineElement, BarElement, ArcElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);
// Override global default DPR
ChartJS.defaults.devicePixelRatio = window.devicePixelRatio || 2;
// ── Fix blur: set devicePixelRatio ke DPR layar ──────────────────────────────
const DPR = typeof window !== "undefined" ? Math.max(window.devicePixelRatio, 2) : 2;

const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: DPR,                          // ← FIX UTAMA
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: "#1f2937", titleFont: { size: 11 }, bodyFont: { size: 11 }, padding: 8 },
  },
  scales: {
    x: { ticks: { font: { size: 9 }, color: "#9ca3af", maxRotation: 30, maxTicksLimit: 10 }, grid: { color: "#f3f4f6" } },
    y: { ticks: { font: { size: 10 }, color: "#9ca3af" }, grid: { color: "#f3f4f6" }, beginAtZero: true },
  },
};

const stackedOpts = {
  ...baseOpts,
  devicePixelRatio: DPR,                          // ← FIX UTAMA
  scales: {
    x: { ...baseOpts.scales.x, stacked: true },
    y: { ...baseOpts.scales.y, stacked: true },
  },
};

const pieOpts = {
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: DPR,                          // ← FIX UTAMA
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: "#1f2937" },
  },
};

// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor, iconBg, iconColor, icon }) {
  return (
    <div style={{ background: "#fff", borderRadius: 11, border: "1px solid #e5e7eb", padding: "13px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.05)", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 9, background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Ico d={icon} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", lineHeight: 1.2, marginTop: 2 }}>{value}</div>
        <div style={{ fontSize: 10, color: subColor || "#6b7280", marginTop: 3, fontWeight: 500 }}>{sub}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, legend }) {
  return (
    <div style={{ background: "#fff", borderRadius: 11, border: "1px solid #e5e7eb", padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: legend ? 8 : 12 }}>{title}</div>
      {legend && (
        <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
          {legend.map(({ label, color, dashed }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#6b7280" }}>
              <span style={{ width: 18, height: 3, background: dashed ? "transparent" : color, borderTop: dashed ? `2px dashed ${color}` : "none", borderRadius: 2, display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

export default function Grafik({ history, listrikH, summary }) {
  const total      = history.length;
  const normal     = history.filter(h => h.kondisi === "NORMAL").length;
  const peringatan = history.filter(h => h.kondisi === "PERINGATAN").length;
  const pemborosan = history.filter(h => h.kondisi === "PEMBOROSAN").length;
  const avgOrang   = total > 0 ? (history.reduce((s,h) => s+(h.orang||0), 0)/total).toFixed(1) : "0";
  const efficiency = total > 0 ? Math.round((normal/total)*100) : 0;

  // Weekly per-day map
  const dayMap = {};
  history.forEach(h => {
    const day = h.waktu?.slice(0,10);
    if (!day) return;
    if (!dayMap[day]) dayMap[day] = { orang:[], normal:0, peringatan:0, pemborosan:0, aman:0 };
    dayMap[day].orang.push(h.orang||0);
    if (h.kondisi==="NORMAL")     dayMap[day].normal++;
    if (h.kondisi==="PERINGATAN") dayMap[day].peringatan++;
    if (h.kondisi==="PEMBOROSAN") dayMap[day].pemborosan++;
    if (h.kondisi==="AMAN")       dayMap[day].aman++;
  });
  const last7 = Object.keys(dayMap).sort().slice(-7);
  const dayLabels = last7.map(d => new Date(d).toLocaleDateString("id-ID",{weekday:"short"}));

  const weeklyChart = {
    labels: dayLabels,
    datasets: [
      { label:"Rata-rata Orang", data: last7.map(d => { const a=dayMap[d].orang; return a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1):0; }), borderColor:"#2563eb", backgroundColor:"rgba(37,99,235,.07)", tension:.4, pointRadius:4, fill:true, borderWidth:2 },
      { label:"Pemborosan",      data: last7.map(d => dayMap[d].pemborosan), borderColor:"#ef4444", backgroundColor:"rgba(239,68,68,.05)", tension:.4, borderDash:[5,3], pointRadius:3, fill:true, borderWidth:1.5 },
    ],
  };

  const devBar = {
    labels: dayLabels,
    datasets: [
      { label:"Normal",     data:last7.map(d=>dayMap[d].normal),     backgroundColor:"#10b981", stack:"s" },
      { label:"Peringatan", data:last7.map(d=>dayMap[d].peringatan), backgroundColor:"#f59e0b", stack:"s" },
      { label:"Pemborosan", data:last7.map(d=>dayMap[d].pemborosan), backgroundColor:"#ef4444", stack:"s" },
      { label:"Aman",       data:last7.map(d=>dayMap[d].aman),       backgroundColor:"#8b5cf6", stack:"s" },
    ],
  };

  // Monthly map
  const monMap = {};
  history.forEach(h => {
    const m = h.waktu?.slice(0,7); if (!m) return;
    if (!monMap[m]) monMap[m] = { normal:0, peringatan:0, pemborosan:0 };
    if (h.kondisi==="NORMAL")     monMap[m].normal++;
    if (h.kondisi==="PERINGATAN") monMap[m].peringatan++;
    if (h.kondisi==="PEMBOROSAN") monMap[m].pemborosan++;
  });
  const last5m = Object.keys(monMap).sort().slice(-5);
  const monNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const monthlyBar = {
    labels: last5m.map(m => monNames[parseInt(m.slice(5,7))-1]),
    datasets: [
      { label:"Normal",     data:last5m.map(m=>monMap[m].normal),     backgroundColor:"#10b981", stack:"s" },
      { label:"Peringatan", data:last5m.map(m=>monMap[m].peringatan), backgroundColor:"#f59e0b", stack:"s" },
      { label:"Pemborosan", data:last5m.map(m=>monMap[m].pemborosan), backgroundColor:"#ef4444", stack:"s" },
    ],
  };

  // Pie
  const pie = {
    labels: ["Normal","Peringatan","Pemborosan","Aman"],
    datasets: [{ data:[normal,peringatan,pemborosan,summary.aman||0], backgroundColor:["#10b981","#f59e0b","#ef4444","#3b82f6"], borderWidth:0 }],
  };

  // Hourly
  const hourMap = {};
  for (let h=6;h<=17;h++) hourMap[h]=0;
  history.forEach(h => { const hr=parseInt(h.waktu?.slice(11,13)); if(hr>=6&&hr<=17) hourMap[hr]=(hourMap[hr]||0)+1; });
  const hourlyBar = {
    labels: Object.keys(hourMap).map(h=>`${String(h).padStart(2,"0")}:00`),
    datasets: [{ label:"Jumlah Cek", data:Object.values(hourMap), backgroundColor:"#10b981", borderRadius:5 }],
  };

  const empty = <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#9ca3af",fontSize:12}}>Belum ada data</div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <StatCard label="Rata-rata Orang/Hari" value={avgOrang}        sub="↗ +8% minggu ini"          subColor="#16a34a" iconBg="#dcfce7" iconColor="#16a34a" icon={P.person} />
        <StatCard label="Total Pemborosan"     value={pemborosan}      sub="Bulan ini"                  subColor="#dc2626" iconBg="#fee2e2" iconColor="#dc2626" icon={P.warn}   />
        <StatCard label="Efisiensi Energi"     value={`${efficiency}%`} sub="↗ +5.2% improvement"     subColor="#16a34a" iconBg="#dcfce7" iconColor="#16a34a" icon={P.chart}  />
        <StatCard label="Jam Kerja Aktif"      value="8.5 jam"         sub="08:00 - 16:30 (rata-rata)" subColor="#6b7280" iconBg="#dbeafe" iconColor="#2563eb" icon={P.clock}  />
      </div>

      {/* Weekly + Device bar */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <ChartCard title="Aktivitas Mingguan" legend={[{label:"Rata-rata Orang",color:"#2563eb"},{label:"Pemborosan",color:"#ef4444",dashed:true}]}>
          <div style={{ height:160 }}>
            {history.length>0 ? <Line data={weeklyChart} options={baseOpts} /> : empty}
          </div>
        </ChartCard>
        <ChartCard title="Penggunaan Perangkat (7 Hari)" legend={[{label:"Normal",color:"#10b981"},{label:"Peringatan",color:"#f59e0b"},{label:"Pemborosan",color:"#ef4444"},{label:"Aman",color:"#8b5cf6"}]}>
          <div style={{ height:160 }}>
            {history.length>0 ? <Bar data={devBar} options={stackedOpts} /> : empty}
          </div>
        </ChartCard>
      </div>

      {/* Monthly + Pie */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <ChartCard title="Tren Bulanan (5 Bulan Terakhir)" legend={[{label:"Normal",color:"#10b981"},{label:"Peringatan",color:"#f59e0b"},{label:"Pemborosan",color:"#ef4444"}]}>
          <div style={{ height:180 }}>
            {history.length>0 ? <Bar data={monthlyBar} options={stackedOpts} /> : empty}
          </div>
        </ChartCard>
        <ChartCard title="Distribusi Kondisi (Bulan Ini)">
          <div style={{ display:"flex", gap:14, alignItems:"center" }}>
            <div style={{ height:180, flex:1 }}>
              {total>0 ? <Pie data={pie} options={pieOpts} /> : empty}
            </div>
            {total>0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:8, minWidth:100 }}>
                {[
                  {label:"Normal",     pct:Math.round(normal/total*100),     color:"#10b981"},
                  {label:"Peringatan", pct:Math.round(peringatan/total*100), color:"#f59e0b"},
                  {label:"Pemborosan", pct:Math.round(pemborosan/total*100), color:"#ef4444"},
                ].map(({label,pct,color}) => (
                  <div key={label}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontSize:10, color:"#6b7280" }}>{label}</span>
                      <span style={{ fontSize:10, fontWeight:700, color }}>{pct}%</span>
                    </div>
                    <div style={{ height:5, background:"#f3f4f6", borderRadius:3 }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:3 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Hourly */}
      <ChartCard title="Distribusi Aktivitas per Jam">
        <div style={{ height:170 }}>
          {history.length>0 ? <Bar data={hourlyBar} options={baseOpts} /> : empty}
        </div>
        <div style={{ marginTop:12, padding:"10px 14px", background:"#eff6ff", borderRadius:8, border:"1px solid #bfdbfe" }}>
          <span style={{ fontSize:12, color:"#1d4ed8", fontWeight:700 }}>Insight: </span>
          <span style={{ fontSize:12, color:"#1e40af" }}>Peak activity terjadi pada jam 09:00–10:00 dan 14:00–15:00. Pertimbangkan untuk mengoptimalkan monitoring pada jam-jam tersebut.</span>
        </div>
      </ChartCard>
    </div>
  );
}