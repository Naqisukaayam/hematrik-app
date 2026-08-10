import { useState } from "react";

function Section({ iconBg, iconColor, icon, title, subtitle, children }) {
  return (
    <div style={{ background:"#fff", borderRadius:11, border:"1px solid #e5e7eb", boxShadow:"0 1px 3px rgba(0,0,0,.05)", overflow:"hidden" }}>
      <div style={{ padding:"14px 18px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:9, background:iconBg, color:iconColor, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{icon}</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{title}</div>
          <div style={{ fontSize:11, color:"#9ca3af", marginTop:1 }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:14 }}>{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize:10, color:"#9ca3af", marginTop:5 }}>{hint}</div>}
    </div>
  );
}

const inp = { width:"100%", padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, fontFamily:"inherit", color:"#111827", outline:"none", background:"#fff" };

export default function Pengaturan({ autoMode, setAutoMode }) {
  const [namaLokasi, setNamaLokasi] = useState("Ruang Dosen - Gedung 4 Sesi A & Dosen");
  const [jamMulai,   setJamMulai]   = useState("08:00");
  const [jamSelesai, setJamSelesai] = useState("16:30");
  const [zona,       setZona]       = useState("WIB");
  const [interval,   setInterval]   = useState("120");
  const [confidence, setConfidence] = useState("0.35");
  const [saved,      setSaved]      = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Pengaturan Umum */}
      <Section iconBg="#dcfce7" iconColor="#16a34a" title="Pengaturan Umum" subtitle="Konfigurasi dasar sistem monitoring" icon={<GearIcon />}>
        <Field label="Nama Lokasi">
          <input value={namaLokasi} onChange={e => setNamaLokasi(e.target.value)} style={inp} />
        </Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Field label="Jam Kerja Mulai">
            <input type="time" value={jamMulai} onChange={e => setJamMulai(e.target.value)} style={inp} />
          </Field>
          <Field label="Jam Kerja Selesai">
            <input type="time" value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} style={inp} />
          </Field>
        </div>
        <Field label="Zona Waktu">
          <select value={zona} onChange={e => setZona(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
            <option value="WIB">WIB (GMT+7)</option>
            <option value="WITA">WITA (GMT+8)</option>
            <option value="WIT">WIT (GMT+9)</option>
          </select>
        </Field>
      </Section>

      {/* Pengaturan Monitoring */}
      <Section iconBg="#dbeafe" iconColor="#2563eb" title="Pengaturan Monitoring" subtitle="Konfigurasi deteksi dan interval pengecekan" icon={<MonitorIcon />}>
        <Field label="Mode Deteksi">
          <div style={{ display:"flex", gap:8 }}>
            {["Auto Realtime","Manual"].map(m => (
              <button key={m} onClick={() => setAutoMode(m==="Auto Realtime")}
                style={{ flex:1, padding:"9px 0", borderRadius:8, fontSize:12, fontWeight:600, fontFamily:"inherit", cursor:"pointer", border:"1px solid", transition:"all .12s",
                  borderColor:(m==="Auto Realtime")===autoMode?"#16a34a":"#e5e7eb",
                  background:(m==="Auto Realtime")===autoMode?"#f0fdf4":"#fff",
                  color:(m==="Auto Realtime")===autoMode?"#15803d":"#6b7280",
                }}>
                {m}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Interval Auto Cek (detik)" hint="Minimum 30 detik, maksimum 600 detik (10 menit)">
          <input type="number" value={interval} onChange={e => setInterval(e.target.value)} style={inp} min="30" max="600" />
        </Field>
        <Field label="Confidence Threshold AI" hint="Nilai 0.0–1.0. Default: 0.35 (35%)">
          <input type="number" value={confidence} onChange={e => setConfidence(e.target.value)} style={inp} min="0.1" max="0.9" step="0.05" />
        </Field>
      </Section>

      {/* Threshold */}
      <Section iconBg="#fef3c7" iconColor="#d97706" title="Threshold Perangkat" subtitle="Batas daya minimum agar perangkat dianggap ON" icon={<BoltIcon />}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Field label="Threshold AC" hint="mW (5 Watt)">
            <input defaultValue="5000" style={inp} />
          </Field>
          <Field label="Threshold Lampu" hint="mW (0.2 Watt)">
            <input defaultValue="200" style={inp} />
          </Field>
        </div>
      </Section>

      {/* Informasi Sistem */}
      <Section iconBg="#f3e8ff" iconColor="#9333ea" title="Informasi Sistem" subtitle="Data teknis sistem HEMATRIX" icon={<InfoIcon />}>
        <div style={{ display:"flex", flexDirection:"column" }}>
          {[
            ["Model AI","YOLOv11n"],["Versi Sistem","v1.2.0"],["Database","MySQL (hematrik)"],
            ["Backend","FastAPI + Python"],["Frontend","React.js + Vite"],["Sensor IoT","3 Perangkat (4B8A13, 75AA3A)"],
          ].map(([k,v],i,arr) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:i<arr.length-1?"1px solid #f3f4f6":"none" }}>
              <span style={{ fontSize:12, color:"#6b7280" }}>{k}</span>
              <span style={{ fontSize:12, fontWeight:700, color:"#111827" }}>{v}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Save */}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button style={{ padding:"9px 22px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", color:"#374151", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          Reset Default
        </button>
        <button onClick={handleSave} style={{ padding:"9px 26px", borderRadius:8, border:"none", background:saved?"#15803d":"#16a34a", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(22,163,74,.2)", transition:"background .2s" }}>
          {saved ? "✓ Tersimpan!" : "Simpan Pengaturan"}
        </button>
      </div>
    </div>
  );
}

const GearIcon    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
const MonitorIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const BoltIcon    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const InfoIcon    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;