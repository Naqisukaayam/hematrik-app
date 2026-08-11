import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../hooks/useMonitoring";
import { resolveImgUrl } from "../utils/helpers";

const inputStyle = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  padding: "10px 12px",
  fontSize: 12,
  color: "#111827",
  background: "#fff",
};

export default function Pengujian({ loadHistory }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState("0.12");
  const [minWidth, setMinWidth] = useState("12");
  const [minHeight, setMinHeight] = useState("18");
  const [manualPeople, setManualPeople] = useState("");
  const [lampuVisual, setLampuVisual] = useState("auto");
  const [acVisual, setAcVisual] = useState("auto");

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Silakan pilih foto sebelum melakukan deteksi.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("confidence", confidence);
    formData.append("min_width", minWidth);
    formData.append("min_height", minHeight);
    formData.append("manual_people", manualPeople);
    formData.append("lampu_visual", lampuVisual);
    formData.append("ac_visual", acVisual);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await axios.post(`${API}/detect/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      setResult(res.data);
      // Refresh global history so Riwayat page shows the new log
      try { if (typeof loadHistory === "function") await loadHistory(); } catch (e) { /* ignore */ }
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Gagal mengirim file ke backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setConfidence("0.12");
    setMinWidth("12");
    setMinHeight("18");
    setManualPeople("");
    setLampuVisual("auto");
    setAcVisual("auto");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 22, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Pusat Deteksi & Analisis Energi</div>
          <div style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.7 }}>
            Unggah foto ruangan untuk mendeteksi jumlah orang, analisis kondisi, dan evaluasi akurasi YOLO. Gunakan kontrol kalibrasi jika perlu agar deteksi lebih sensitif.
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 12 }}>
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Upload Foto</div>
          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginBottom: 16 }}>
            Pilih foto JPG/PNG dari perangkat dan jalankan deteksi. Hasil akan menunjukkan jumlah orang, kondisi, rekomendasi, dan detail analisis penuh.
          </div>

          <label style={{ display: "block", cursor: "pointer" }}>
            <input type="file" accept="image/jpeg,image/png" onChange={handleFileChange} style={{ display: "none" }} />
            <div style={{ border: "2px dashed #d1d5db", borderRadius: 16, padding: 22, textAlign: "center", color: "#6b7280", background: "#f8fafc" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Seret atau klik untuk memilih foto</div>
              <div style={{ fontSize: 12 }}>Ukuran maksimal 8MB. JPG/PNG saja.</div>
            </div>
          </label>

          {preview && (
            <div style={{ marginTop: 18, borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb" }}>
              <img src={preview} alt="Preview upload" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 320 }} />
            </div>
          )}

          <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Kalibrasi YOLO</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1"
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                  placeholder="Confidence"
                />
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  value={minWidth}
                  onChange={(e) => setMinWidth(e.target.value)}
                  placeholder="Min width"
                />
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  value={minHeight}
                  onChange={(e) => setMinHeight(e.target.value)}
                  placeholder="Min height"
                />
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                Ubah nilai agar YOLO lebih sensitif terhadap objek kecil atau besar.
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Manual Override</div>
              <input
                style={inputStyle}
                type="number"
                min="0"
                value={manualPeople}
                onChange={(e) => setManualPeople(e.target.value)}
                placeholder="Jumlah orang jika ingin koreksi manual"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Lampu visual</div>
                <select value={lampuVisual} onChange={(e) => setLampuVisual(e.target.value)} style={inputStyle}>
                  <option value="auto">Auto</option>
                  <option value="ON">ON</option>
                  <option value="OFF">OFF</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>AC visual</div>
                <select value={acVisual} onChange={(e) => setAcVisual(e.target.value)} style={inputStyle}>
                  <option value="auto">Auto</option>
                  <option value="ON">ON</option>
                  <option value="OFF">OFF</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
            <button
              onClick={handleUpload}
              disabled={loading}
              style={{ padding: "12px 18px", borderRadius: 12, background: "#16a34a", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12 }}
            >
              {loading ? "Mendeteksi..." : "Deteksi Foto"}
            </button>
            <button
              onClick={handleReset}
              style={{ padding: "12px 18px", borderRadius: 12, background: "#f3f4f6", color: "#111827", border: "1px solid #d1d5db", cursor: "pointer", fontWeight: 700, fontSize: 12 }}
            >
              Reset Semua
            </button>
          </div>

          {error && (
            <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 12 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Ringkasan Hasil</div>

            {!result && (
              <div style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.7 }}>
                Hasil deteksi akan muncul di sini setelah backend memproses foto.
              </div>
            )}

            {result && (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  <div style={{ background: "#ecfdf5", borderRadius: 12, padding: 14, color: "#166534" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Jumlah Orang</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{result.orang ?? "–"}</div>
                    <div style={{ marginTop: 8, fontSize: 11, color: "#4b5563" }}>Prediksi awal YOLO: {result.detected_orang ?? "–"}</div>
                  </div>
                  <div style={{ background: "#eff6ff", borderRadius: 12, padding: 14, color: "#1d4ed8" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Kondisi Ruangan</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{result.kondisi || "–"}</div>
                    <div style={{ marginTop: 8, fontSize: 11, color: "#475569" }}>{result.notifikasi || "–"}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                  <div style={{ background: "#fef2f2", borderRadius: 12, padding: 14, color: "#991b1b" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Risk Score</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{result.risk_score ?? "–"}</div>
                    <div style={{ marginTop: 8, fontSize: 11, color: "#991b1b" }}>{result.risk_level || "–"}</div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, color: "#0f172a" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Perangkat Aktif</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{Array.isArray(result.perangkat_aktif) ? result.perangkat_aktif.join(", ") : result.perangkat_aktif || "–"}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>Daya: {result.total_power_w ?? 0} W</div>
                  </div>
                  <div style={{ background: "#f0f9ff", borderRadius: 12, padding: 14, color: "#0c4a6e" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Deteksi</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{result.metode_deteksi || "–"}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>Confidence: {result.confidence_avg?.toFixed?.(2) ?? "–"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Gambar Hasil Deteksi</div>
            {result?.gambar_url || result?.gambar_b64 ? (
              <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                <img
                  src={resolveImgUrl(result.gambar_url) || result.gambar_b64}
                  alt="Hasil Deteksi"
                  style={{ width: "100%", display: "block", objectFit: "contain", maxHeight: 360, background: "#000" }}
                />
              </div>
            ) : (
              <div style={{ padding: 18, borderRadius: 12, background: "#f8fafc", color: "#475569", fontSize: 12 }}>
                Tidak ada gambar deteksi dari backend.
              </div>
            )}
          </div>

          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Detail Tambahan</div>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
                <strong>Pesan Kamera/Sistem:</strong> {result?.camera_message || "–"}
              </div>
              {result?.manual_override && (
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
                  <strong>Koreksi Manual:</strong> {result.manual_override}
                </div>
              )}
              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
                <strong>Kalibrasi Saat Ini:</strong> confidence {result?.kalibrasi?.confidence ?? confidence}, min_width {result?.kalibrasi?.min_width ?? minWidth}, min_height {result?.kalibrasi?.min_height ?? minHeight}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
