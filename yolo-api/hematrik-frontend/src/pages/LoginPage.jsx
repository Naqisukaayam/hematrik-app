import { useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function LoginPage({ onLogin, onBack }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [regName,     setRegName]     = useState("");
  const [regEmail,    setRegEmail]    = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLoading,  setRegLoading]  = useState(false);
  const [regError,    setRegError]    = useState("");
  const [regMessage,  setRegMessage]  = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Email dan password wajib diisi."); return; }
    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/auth/login`,
        { email: email.trim().toLowerCase(), password: password.trim() },
        { timeout: 10000 }
      );
      if (res.data.success) {
        localStorage.setItem("hematrix_token", res.data.token);
        localStorage.setItem("hematrix_user",  JSON.stringify(res.data.user));
        onLogin({ ...res.data.user, name: res.data.user.nama, token: res.data.token });
      } else {
        setError(res.data.message || "Login gagal.");
      }
    } catch (err) {
      if (err.response?.data?.message) setError(err.response.data.message);
      else if (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED") setError("Server tidak bisa dijangkau. Pastikan FastAPI berjalan di port 8000.");
      else setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode((v) => !v);
    setError("");
    setRegError("");
    setRegMessage("");
  };

  const handleRegister = async () => {
    setRegError("");
    setRegMessage("");
    if (!regName || !regEmail || !regPassword) {
      setRegError("Nama, email, dan password wajib diisi.");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Password minimal 6 karakter.");
      return;
    }
    setRegLoading(true);
    try {
      const res = await axios.post(
        `${API}/auth/public-register`,
        {
          nama: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword.trim(),
        },
        { timeout: 10000 }
      );
      if (res.data.success) {
        setRegMessage(res.data.message || "Akun berhasil dibuat. Silakan login.");
        setRegName("");
        setRegEmail("");
        setRegPassword("");
      } else {
        setRegError(res.data.message || "Registrasi gagal.");
      }
    } catch (err) {
      if (err.response?.data?.message) setRegError(err.response.data.message);
      else if (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED") setRegError("Server tidak bisa dijangkau. Pastikan FastAPI berjalan di port 8000.");
      else setRegError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setRegLoading(false);
    }
  };

  const inp = {
    width: "100%", fontSize: 13, color: "#111", fontFamily: "inherit",
    outline: "none", background: "#fff", boxSizing: "border-box",
    border: "1px solid #e5e7eb", borderRadius: 12,
    transition: "border-color .15s, box-shadow .15s",
  };

  const panelCardStyle = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
    padding: "28px 24px",
  };

  const linkButtonStyle = {
    background: "none",
    border: "none",
    padding: 0,
    color: "#2563eb",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100vw",
      background: "linear-gradient(135deg, #f8fff9 0%, #f4f8f7 100%)",
      display: "flex", fontFamily: "'Plus Jakarta Sans',sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* subtle bg radial */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(60% 50% at 50% 0%, rgba(22,163,74,.05) 0%, transparent 100%)", pointerEvents:"none" }} />

      {/* Left panel — branding */}
      <div style={{
        flex: 1.05, display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "48px 56px", background: "linear-gradient(145deg, #f8faf8 0%, #f0fdf4 100%)",
        borderRight: "1px solid #e7efe9", position: "relative", overflow: "hidden",
      }}>
        {/* dot grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle, #d1d5db 1px, transparent 1px)", backgroundSize:"32px 32px", opacity:.35, pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-10%", left:"-10%", width:500, height:500, background:"radial-gradient(circle, rgba(22,163,74,.07) 0%, transparent 70%)", pointerEvents:"none", borderRadius:"50%" }} />

        {/* Logo */}
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:32, height:32, background:"#16a34a", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span style={{ fontSize:14, fontWeight:800, letterSpacing:".4px", color:"#111" }}>HEMATRIX</span>
          </div>
        </div>

        {/* Center text */}
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"#f0fdf4", border:"1px solid #d1fae5", borderRadius:99, padding:"5px 14px", fontSize:11, color:"#16a34a", fontWeight:600, marginBottom:28 }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:"#16a34a", display:"inline-block" }} />
            Smart Energy Monitoring System
          </div>
          <h1 style={{ fontSize:"clamp(32px,3.5vw,52px)", fontWeight:900, lineHeight:1.06, letterSpacing:"-2px", color:"#111", marginBottom:20 }}>
            Pantau energi.<br />
            <span style={{ color:"#16a34a" }}>Hemat lebih banyak.</span>
          </h1>
          <p style={{ fontSize:14, color:"#6b7280", lineHeight:1.8, maxWidth:380 }}>
            Platform monitoring energi berbasis IoT & AI untuk kampus — real-time, akurat, dan mudah digunakan.
          </p>

          {/* stats row */}
          <div style={{ display:"flex", gap:32, marginTop:40 }}>
            {[["24/7","Pemantauan"],["≤5s","Update data"],["AI","Deteksi otomatis"]].map(([n,l]) => (
              <div key={n}>
                <div style={{ fontSize:22, fontWeight:900, color:"#16a34a", letterSpacing:"-1px" }}>{n}</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:3, fontWeight:500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize:11, color:"#d1d5db", position:"relative", zIndex:1 }}>© 2026 Universitas Mandiri</p>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 0.95, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 32px", position:"relative", zIndex:1 }}>

        {/* Back */}
        {onBack && (
          <button onClick={onBack} style={{ position:"absolute", top:32, left:32, display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"#9ca3af", fontSize:12, cursor:"pointer", fontFamily:"inherit", padding:0, transition:"color .15s" }}
            onMouseEnter={e=>e.currentTarget.style.color="#111"}
            onMouseLeave={e=>e.currentTarget.style.color="#9ca3af"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Kembali
          </button>
        )}

        <div style={{ width:"100%", maxWidth:380, ...panelCardStyle }}>
          {/* Heading */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:999, background:"#f0fdf4", color:"#16a34a", fontSize:11, fontWeight:800, marginBottom:12 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#16a34a" }} />
              {isRegisterMode ? "Pendaftaran akun" : "Akses dashboard"}
            </div>
            <h2 style={{ fontSize:24, fontWeight:900, color:"#111", letterSpacing:"-1px", marginBottom:6 }}>
              {isRegisterMode ? "Buat Akun Baru" : "Masuk ke Dashboard"}
            </h2>
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:10, lineHeight:1.6 }}>
              {isRegisterMode ? "Isi data di bawah untuk membuat akun Anda." : "Gunakan email dan password akun Anda untuk masuk."}
            </p>
          </div>

          {isRegisterMode ? (
            <div style={{ display:"grid", gap:12 }}>
              <div>
                <label style={{ display:"block", fontSize:11, color:"#475569", fontWeight:700, marginBottom:6 }}>Nama Lengkap</label>
                <input value={regName} onChange={e=>{ setRegName(e.target.value); setRegError(""); setRegMessage(""); }} placeholder="Nama lengkap" style={{ ...inp, padding:"11px 12px" }} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:11, color:"#475569", fontWeight:700, marginBottom:6 }}>Email</label>
                <input type="email" value={regEmail} onChange={e=>{ setRegEmail(e.target.value); setRegError(""); setRegMessage(""); }} placeholder="email@domain.com" style={{ ...inp, padding:"11px 12px" }} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:11, color:"#475569", fontWeight:700, marginBottom:6 }}>Password</label>
                <input type="password" value={regPassword} onChange={e=>{ setRegPassword(e.target.value); setRegError(""); setRegMessage(""); }} placeholder="Minimal 6 karakter" style={{ ...inp, padding:"11px 12px" }} />
              </div>

              {regError && (
                <div style={{ padding:"10px 12px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, color:"#991b1b", fontSize:12 }}>
                  {regError}
                </div>
              )}
              {regMessage && (
                <div style={{ padding:"10px 12px", background:"#ecfdf5", border:"1px solid #a7f3d0", borderRadius:10, color:"#065f46", fontSize:12 }}>
                  {regMessage}
                </div>
              )}

              <button type="button" onClick={handleRegister} disabled={regLoading} style={{ width:"100%", padding:"12px 0", borderRadius:12, border:"none", background: regLoading ? "#2563eb" : "#3b82f6", color:"#fff", fontSize:13, fontWeight:700, cursor: regLoading ? "not-allowed" : "pointer", fontFamily:"inherit", transition:"background .15s", boxShadow:"0 8px 20px rgba(37, 99, 235, 0.18)" }}>
                {regLoading ? "Membuat akun..." : "Buat Akun Baru"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Email */}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:7 }}>Email</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#d1d5db", pointerEvents:"none" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError("");}}
                  placeholder="email@hematrix.com" autoComplete="email"
                  style={{ ...inp, padding:"11px 12px 11px 38px" }}
                  onFocus={e=>{ e.target.style.borderColor="#16a34a"; e.target.style.boxShadow="0 0 0 3px rgba(22,163,74,.1)"; }}
                  onBlur={e=>{ e.target.style.borderColor="#e5e7eb"; e.target.style.boxShadow="none"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:7 }}>Password</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#d1d5db", pointerEvents:"none" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </span>
                <input type={showPass?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setError("");}}
                  placeholder="Masukkan password" autoComplete="current-password"
                  style={{ ...inp, padding:"11px 40px 11px 38px" }}
                  onFocus={e=>{ e.target.style.borderColor="#16a34a"; e.target.style.boxShadow="0 0 0 3px rgba(22,163,74,.1)"; }}
                  onBlur={e=>{ e.target.style.borderColor="#e5e7eb"; e.target.style.boxShadow="none"; }}
                />
                <button type="button" onClick={()=>setShowPass(v=>!v)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#d1d5db", padding:2, transition:"color .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.color="#9ca3af"}
                  onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}
                >
                  {showPass
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"10px 12px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:9, fontSize:12, color:"#dc2626" }}>
                <svg style={{ flexShrink:0, marginTop:1 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width:"100%", padding:"13px 0", borderRadius:12, border:"none",
              background: loading ? "#15803d" : "#16a34a",
              color:"#fff", fontSize:14, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
              fontFamily:"inherit", boxShadow:"0 8px 20px rgba(22,163,74,.18)",
              transition:"all .15s", display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:4,
            }}
              onMouseEnter={e=>{ if(!loading){ e.currentTarget.style.background="#15803d"; e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(22,163,74,.25), 0 0 0 4px rgba(22,163,74,.12)"; } }}
              onMouseLeave={e=>{ e.currentTarget.style.background=loading?"#15803d":"#16a34a"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 0 0 4px rgba(22,163,74,.12)"; }}
            >
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation:"spin 1s linear infinite" }}><polyline points="23 4 23 10 17 10"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/></svg>
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk ke Dashboard
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </>
              )}
            </button>
          </form>
          )}

          <div style={{ marginTop:20, textAlign:"center" }}>
            <button type="button" onClick={toggleMode} style={{ ...linkButtonStyle, fontSize:13 }}>
              {isRegisterMode ? "Sudah punya akun? Masuk di sini" : "Belum punya akun? Daftar sekarang"}
            </button>
          </div>

          {/* Info akun */}
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}