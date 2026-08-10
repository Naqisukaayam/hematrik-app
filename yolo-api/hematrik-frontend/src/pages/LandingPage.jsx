import { useEffect, useRef, useState } from "react";

export default function LandingPage({ onLogin, onMasuk }) {
  const [scrolled, setScrolled] = useState(false);
  const [vis, setVis] = useState({});
  const refs = useRef({});

  useEffect(() => {
    const els = ["html","body","#root"];
    els.forEach(sel => {
      const el = sel === "#root" ? document.getElementById("root") : document.querySelector(sel);
      if (el) { el.style.overflow = "auto"; el.style.height = "auto"; }
    });
    return () => {
      els.forEach(sel => {
        const el = sel === "#root" ? document.getElementById("root") : document.querySelector(sel);
        if (el) { el.style.overflow = ""; el.style.height = ""; }
      });
    };
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) setVis(v => ({ ...v, [e.target.dataset.k]: true })); }),
      { threshold: 0.1 }
    );
    Object.values(refs.current).forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const r = k => el => { if (el) { el.dataset.k = k; refs.current[k] = el; } };
  const anim = (k, d = 0) => ({
    opacity: vis[k] ? 1 : 0,
    transform: vis[k] ? "none" : "translateY(20px)",
    transition: `opacity .6s ease ${d}s, transform .6s ease ${d}s`,
  });

  const features = [
    { label: "01", title: "Monitoring Real-time", body: "Pantau daya listrik dan kondisi ruangan langsung tanpa jeda — diperbarui setiap 5 detik." },
    { label: "02", title: "Grafik & Statistik", body: "Visualisasi historis konsumsi harian, mingguan, dan bulanan dalam tampilan interaktif." },
    { label: "03", title: "Notifikasi Cerdas", body: "Alert otomatis saat terdeteksi pemborosan energi atau aktivitas tidak wajar di ruangan." },
    { label: "04", title: "Deteksi IoT", body: "Kamera dan sensor mendeteksi kehadiran orang secara otomatis untuk analisis ruangan." },
    { label: "05", title: "Manajemen Pengguna", body: "Kelola akses admin dan operator dengan autentikasi berbasis peran yang aman." },
    { label: "06", title: "Analisis AI", body: "Sistem AI mendeteksi pemborosan dan memberikan rekomendasi efisiensi secara otomatis." },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "#fff", color: "#111", minHeight: "100vh", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", inset: "0 0 auto", zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 56px", height: 60,
        background: scrolled ? "rgba(255,255,255,.94)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid #f0f0f0" : "none",
        transition: "all .25s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 28, height: 28, background: "#16a34a", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".4px", color: "#111" }}>HEMATRIX</span>
        </div>
        <button onClick={onLogin} style={{ background: "#111", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >Masuk →</button>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 56px 80px", textAlign: "center", position: "relative" }}>
        {/* subtle bg */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 60% at 50% 40%, rgba(22,163,74,.05) 0%, transparent 100%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 720 }}>
          {/* pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#f0fdf4", border: "1px solid #d1fae5", borderRadius: 99, padding: "5px 14px", fontSize: 11, color: "#16a34a", fontWeight: 600, marginBottom: 40, animation: "up .5s ease both" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16a34a", animation: "blink 2s infinite" }} />
            Smart Energy Monitoring — Universitas Mandiri
          </div>

          <h1 style={{ fontSize: "clamp(44px,6.5vw,82px)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-3px", marginBottom: 28, animation: "up .6s .08s ease both" }}>
            Pantau energi.<br />
            <em style={{ fontStyle: "normal", color: "#16a34a" }}>Hemat lebih banyak.</em>
          </h1>

          <p style={{ fontSize: "clamp(15px,1.8vw,18px)", color: "#6b7280", lineHeight: 1.8, maxWidth: 500, margin: "0 auto 48px", animation: "up .6s .16s ease both" }}>
            Platform monitoring energi berbasis IoT & AI untuk kampus — real-time, akurat, dan mudah digunakan.
          </p>

          <div style={{ animation: "up .6s .22s ease both" }}>
            <button onClick={onLogin} style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#16a34a", color: "#fff", border: "none", padding: "15px 34px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 0 0 4px rgba(22,163,74,.12)", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#15803d"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(22,163,74,.28), 0 0 0 4px rgba(22,163,74,.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(22,163,74,.12)"; }}
            >
              Buka Dashboard
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>

        {/* scroll cue */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", animation: "bob 2s infinite", opacity: .25 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: "0 56px 100px" }}>
        <div ref={r("stats")} style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderRadius: 18, border: "1px solid #f0f0f0", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,.04)", ...anim("stats") }}>
          {[
            { n: "24/7", l: "Pemantauan aktif" },
            { n: "≤5s",  l: "Kecepatan update" },
            { n: "AI",   l: "Deteksi otomatis" },
            { n: "IoT",  l: "Sensor terintegrasi" },
          ].map(({ n, l }, i) => (
            <div key={i} style={{ padding: "44px 20px", textAlign: "center", borderRight: i < 3 ? "1px solid #f0f0f0" : "none", background: "#fff" }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#16a34a", letterSpacing: "-1.5px", lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 10, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER label */}
      <div style={{ padding: "0 56px 48px", maxWidth: 1040, margin: "0 auto" }}>
        <div ref={r("fl")} style={{ display: "flex", alignItems: "center", gap: 16, ...anim("fl") }}>
          <div style={{ height: 1, flex: 1, background: "#f0f0f0" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#d1d5db", letterSpacing: "2px", textTransform: "uppercase" }}>Fitur Sistem</span>
          <div style={{ height: 1, flex: 1, background: "#f0f0f0" }} />
        </div>
      </div>

      {/* FEATURES */}
      <section style={{ padding: "0 56px 120px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, border: "1px solid #f0f0f0", borderRadius: 18, overflow: "hidden" }}>
            {features.map((f, i) => (
              <div key={i} ref={r(`f${i}`)}
                style={{
                  padding: "36px 32px",
                  borderRight: i % 3 < 2 ? "1px solid #f0f0f0" : "none",
                  borderBottom: i < 3 ? "1px solid #f0f0f0" : "none",
                  background: "#fff", transition: "background .2s",
                  ...anim(`f${i}`, (i % 3) * 0.06 + Math.floor(i / 3) * 0.1),
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafaf8"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#d1d5db", letterSpacing: "1px", marginBottom: 20 }}>{f.label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 10, lineHeight: 1.3 }}>{f.title}</div>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section style={{ padding: "100px 56px", background: "#fafaf8", borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: "5fr 4fr", gap: 80, alignItems: "start" }}>
          {/* left */}
          <div ref={r("abl")} style={anim("abl")}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 20 }}>Tentang</div>
            <h2 style={{ fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1.12, marginBottom: 24 }}>
              Dibangun untuk<br />kampus yang efisien.
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.85, marginBottom: 14 }}>
              HEMATRIX menggabungkan teknologi IoT, computer vision, dan machine learning untuk memantau dan mengoptimalkan penggunaan energi listrik di seluruh gedung kampus secara real-time.
            </p>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.85, marginBottom: 36 }}>
              Dikembangkan oleh tim Universitas Mandiri sebagai solusi nyata untuk efisiensi energi kampus modern.
            </p>
            <button onClick={onLogin} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#111", border: "1px solid #e5e7eb", padding: "11px 22px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#16a34a"; e.currentTarget.style.color = "#16a34a"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#111"; }}
            >Mulai Gunakan →</button>
          </div>

          {/* right — info card */}
          <div ref={r("abr")} style={{ ...anim("abr", 0.12) }}>
            <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.05)" }}>
              {/* card header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, background: "#16a34a", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>HEMATRIX</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>v1.2.0</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block", animation: "blink 2s infinite" }} />
                  <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Online</span>
                </div>
              </div>
              {/* rows */}
              {[
                ["Ruangan Dipantau", "Gedung A – C"],
                ["Sensor Aktif",     "12 Unit IoT"],
                ["Konsumsi Hari Ini","847 kWh"],
                ["Efisiensi Energi", "92%"],
                ["Uptime Sistem",    "99.9%"],
              ].map(([k, v], i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderBottom: i < arr.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "24px 56px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, background: "#16a34a", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>© 2026 Universitas Mandiri — HEMATRIX v1.2.0</span>
        </div>
        <button onClick={onLogin} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "color .15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#16a34a"}
          onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}
        >Masuk ke Dashboard →</button>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes up   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes blink{ 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes bob  { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(5px)} }
      `}</style>
    </div>
  );
}