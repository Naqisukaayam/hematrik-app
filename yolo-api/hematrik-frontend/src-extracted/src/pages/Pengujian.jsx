import { useState } from "react";
import axios from "axios";
import { API } from "../hooks/useMonitoring";

const ENDPOINTS = [
  { ep:"/",                label:"Health Check",    desc:"Cek API aktif dan berjalan",              color:"#16a34a", bg:"#dcfce7" },
  { ep:"/status",          label:"Status IoT",      desc:"Data listrik realtime (tiap 5 detik)",    color:"#2563eb", bg:"#dbeafe" },
  { ep:"/check",           label:"Deteksi Penuh",   desc:"Kamera + YOLO + simpan ke database",     color:"#7c3aed", bg:"#f3e8ff" },
  { ep:"/history",         label:"Riwayat Log",     desc:"Riwayat semua log dari MySQL",            color:"#d97706", bg:"#fef3c7" },
  { ep:"/summary",         label:"Ringkasan",       desc:"Statistik kondisi keseluruhan",           color:"#0284c7", bg:"#e0f2fe" },
  { ep:"/listrik/history", label:"Riwayat Listrik", desc:"Data sensor IoT untuk AC & Lampu",        color:"#dc2626", bg:"#fee2e2" },
];

export default function Pengujian() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const testOne = async (ep) => {
    setLoading(l => ({ ...l, [ep]: true }));
    setResults(r => ({ ...r, [ep]: null }));
    try {
      const res = await axios.get(API + ep, { timeout: 30000 });
      setResults(r => ({ ...r, [ep]: { ok: true, data: JSON.stringify(res.data).slice(0, 250) } }));
    } catch (e) {
      setResults(r => ({ ...r, [ep]: { ok: false, data: e.message } }));
    } finally {
      setLoading(l => ({ ...l, [ep]: false }));
    }
  };

  const testAll = async () => {
    for (const { ep } of ENDPOINTS) await testOne(ep);
  };

  const allDone  = ENDPOINTS.every(({ ep }) => results[ep] !== undefined && results[ep] !== null);
  const allOk    = allDone && ENDPOINTS.every(({ ep }) => results[ep]?.ok);
  const anyFail  = allDone && ENDPOINTS.some(({ ep }) => !results[ep]?.ok);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Header */}
      <div style={{ background:"#fff", borderRadius:11, border:"1px solid #e5e7eb", padding:"14px 18px", boxShadow:"0 1px 3px rgba(0,0,0,.05)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h3 style={{ fontSize:14, fontWeight:700, color:"#111827" }}>Pengujian Koneksi Endpoint</h3>
          <p style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>Pastikan backend FastAPI berjalan di port 8000 sebelum menguji.</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {allDone && (
            <span style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700, background:allOk?"#dcfce7":"#fee2e2", color:allOk?"#15803d":"#b91c1c" }}>
              {allOk ? "✓ Semua endpoint OK" : "✗ Ada endpoint gagal"}
            </span>
          )}
          <button onClick={testAll} style={{ padding:"8px 18px", borderRadius:8, border:"none", background:"#16a34a", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(22,163,74,.2)" }}>
            Test Semua Endpoint
          </button>
        </div>
      </div>

      {/* Endpoint cards grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
        {ENDPOINTS.map(({ ep, label, desc, color, bg }) => {
          const res = results[ep];
          const isLoading = loading[ep];
          return (
            <div key={ep} style={{ background:"#fff", borderRadius:11, border:"1px solid #e5e7eb", padding:"14px 16px", boxShadow:"0 1px 3px rgba(0,0,0,.05)" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:bg, color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{label}</div>
                    <div style={{ fontFamily:"monospace", fontSize:10, color, marginTop:2, fontWeight:700 }}>GET {ep}</div>
                  </div>
                </div>
                <button onClick={() => testOne(ep)} disabled={isLoading} style={{ padding:"6px 12px", borderRadius:7, border:"1px solid #e5e7eb", background:isLoading?"#f3f4f6":"#fff", color:isLoading?"#9ca3af":"#374151", fontSize:11, fontWeight:600, cursor:isLoading?"not-allowed":"pointer", fontFamily:"inherit", flexShrink:0, transition:"all .12s" }}>
                  {isLoading ? "Testing..." : "Test"}
                </button>
              </div>
              <div style={{ fontSize:11, color:"#6b7280", marginBottom: res ? 10 : 0 }}>{desc}</div>
              {res && (
                <div style={{ padding:"9px 12px", borderRadius:8, background:res.ok?"#f0fdf4":"#fef2f2", border:`1px solid ${res.ok?"#bbf7d0":"#fca5a5"}` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:res.ok?"#15803d":"#b91c1c", marginBottom:4 }}>
                    {res.ok ? "✓ Berhasil terhubung" : "✗ Koneksi gagal"}
                  </div>
                  <div style={{ fontSize:10, color:res.ok?"#166534":"#991b1b", fontFamily:"monospace", wordBreak:"break-all", lineHeight:1.5 }}>
                    {res.data}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Endpoint docs */}
      <div style={{ background:"#fff", borderRadius:11, border:"1px solid #e5e7eb", padding:"14px 18px", boxShadow:"0 1px 3px rgba(0,0,0,.05)" }}>
        <h3 style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:12 }}>Dokumentasi Endpoint</h3>
        <div style={{ display:"flex", flexDirection:"column" }}>
          {ENDPOINTS.map(({ ep, label, desc }, i, arr) => (
            <div key={ep} style={{ display:"flex", gap:14, padding:"9px 0", borderBottom:i<arr.length-1?"1px solid #f3f4f6":"none" }}>
              <span style={{ fontFamily:"monospace", fontSize:11, color:"#7c3aed", fontWeight:700, minWidth:160, flexShrink:0 }}>GET {ep}</span>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{label}</div>
                <div style={{ fontSize:11, color:"#6b7280", marginTop:1 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}