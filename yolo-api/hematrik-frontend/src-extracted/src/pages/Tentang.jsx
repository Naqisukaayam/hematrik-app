export default function Tentang() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,#16a34a 0%,#15803d 100%)", borderRadius:12, padding:"24px 26px", color:"#fff", boxShadow:"0 4px 16px rgba(22,163,74,.25)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
          <div style={{ width:52, height:52, borderRadius:12, background:"rgba(255,255,255,.18)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:800, letterSpacing:.3 }}>HEMATRIX</div>
            <div style={{ fontSize:12, opacity:.8, marginTop:2 }}>Smart Energy Monitoring System</div>
          </div>
          <span style={{ padding:"3px 12px", borderRadius:20, background:"rgba(255,255,255,.2)", fontSize:11, fontWeight:700 }}>v1.2.0</span>
        </div>
        <p style={{ fontSize:13, lineHeight:1.7, opacity:.9, maxWidth:680 }}>
          HEMATRIX adalah sistem monitoring energi berbasis web yang dirancang untuk mengawasi penggunaan listrik ruangan dosen secara real-time, menggabungkan deteksi keberadaan manusia melalui AI (YOLOv11) dan data status perangkat listrik IoT.
        </p>
      </div>

      {/* Specs + Kondisi */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ background:"#fff", borderRadius:11, border:"1px solid #e5e7eb", padding:"14px 18px", boxShadow:"0 1px 3px rgba(0,0,0,.05)" }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:12 }}>Spesifikasi Teknis</h3>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {[
              ["Model AI","YOLOv11n"],["Backend","FastAPI + Python"],["Frontend","React + Vite"],
              ["Database","MySQL (hematrik)"],["Sensor IoT","4B8A13 (AC), 75AA3A (Lampu)"],
              ["Interval Deteksi","Setiap 2 Menit (auto)"],["Jam Kerja","08:00 – 16:30 WIB"],
              ["Confidence AI","0.35 (35%)"],["Versi","v1.2.0 — 2026"],
            ].map(([k,v],i,arr) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<arr.length-1?"1px solid #f3f4f6":"none" }}>
                <span style={{ fontSize:12, color:"#6b7280" }}>{k}</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#111827" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:"#fff", borderRadius:11, border:"1px solid #e5e7eb", padding:"14px 18px", boxShadow:"0 1px 3px rgba(0,0,0,.05)" }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:12 }}>Kondisi Sistem</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[
              { kondisi:"NORMAL",     color:"#16a34a", bg:"#dcfce7", desc:"Ada orang + listrik ON + jam kerja aktif" },
              { kondisi:"PEMBOROSAN", color:"#dc2626", bg:"#fee2e2", desc:"Tidak ada orang tetapi listrik masih menyala" },
              { kondisi:"PERINGATAN", color:"#d97706", bg:"#fef3c7", desc:"Listrik aktif di luar jam kerja" },
              { kondisi:"AMAN",       color:"#2563eb", bg:"#dbeafe", desc:"Tidak ada orang dan listrik sudah mati" },
            ].map(({ kondisi, color, bg, desc }) => (
              <div key={kondisi} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"9px 12px", borderRadius:8, background:bg+"55", border:`1px solid ${bg}` }}>
                <span style={{ padding:"1px 9px", borderRadius:20, fontSize:9, fontWeight:800, background:bg, color, whiteSpace:"nowrap", marginTop:1, flexShrink:0 }}>{kondisi}</span>
                <span style={{ fontSize:12, color:"#374151", lineHeight:1.5 }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Institusi */}
      <div style={{ background:"#fff", borderRadius:11, border:"1px solid #e5e7eb", padding:"14px 18px", boxShadow:"0 1px 3px rgba(0,0,0,.05)" }}>
        <h3 style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:12 }}>Informasi Institusi</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {[
            { label:"Institusi", value:"Universitas Mandiri",                  emoji:"🏛️" },
            { label:"Lokasi",   value:"Ruang Dosen — Gedung 4 Sesi A & Dosen", emoji:"📍" },
            { label:"Tahun",    value:"2026",                                  emoji:"📅" },
          ].map(({ label, value, emoji }) => (
            <div key={label} style={{ background:"#f9fafb", borderRadius:9, padding:"13px 14px", border:"1px solid #f3f4f6" }}>
              <div style={{ fontSize:20, marginBottom:7 }}>{emoji}</div>
              <div style={{ fontSize:10, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:12, fontWeight:700, color:"#111827" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}