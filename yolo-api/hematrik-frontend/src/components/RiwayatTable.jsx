import { useState } from "react";
import KondisiBadge from "./KondisiBadge";
import { Ico, P } from "../utils/icons";
import { resolveImgUrl } from "../utils/helpers";

function ImgModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
        <img
          src={src}
          alt="Deteksi"
          style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 10, boxShadow: "0 8px 40px rgba(0,0,0,.6)", display: "block" }}
        />
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: -14, right: -14,
            width: 32, height: 32, borderRadius: "50%",
            background: "#fff", border: "none", cursor: "pointer",
            fontSize: 16, fontWeight: 700, color: "#374151",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,.3)",
          }}
        >✕</button>
      </div>
    </div>
  );
}

export default function RiwayatTable({ data, onImg }) {
  const [modalSrc, setModalSrc] = useState(null);

  const openImg = (url) => {
    if (onImg) onImg(url);       // tetap pakai modal global (Dashboard)
    setModalSrc(url);            // + modal lokal untuk Riwayat
  };

  if (!data || data.length === 0) {
    return (
      <div className="no-data-row">
        Belum ada data — sistem sedang menginisialisasi auto cek...
      </div>
    );
  }

  return (
    <>
      <ImgModal src={modalSrc} onClose={() => setModalSrc(null)} />

      <div className="table-wrap">
        <table className="riwayat-table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Orang</th>
              <th>Lampu</th>
              <th>AC</th>
              <th>Dispenser</th>
              <th>Kondisi</th>
              <th>Notifikasi</th>
              <th>Foto</th>
            </tr>
          </thead>
          <tbody>
            {data.map((h, i) => (
              <tr key={h.id || i}>
                <td className="td-waktu">{h.waktu?.slice(0, 19) || "–"}</td>
                <td style={{ fontWeight: 600 }}>{h.orang ?? 0} org</td>
                <td className={h.lampu === "ON" ? "td-on" : h.lampu === "OFF" ? "td-off" : ""}>{h.lampu || "–"}</td>
                <td className={h.ac    === "ON" ? "td-on" : h.ac    === "OFF" ? "td-off" : ""}>{h.ac    || "–"}</td>
                <td className={h.dispenser === "ON" ? "td-on" : h.dispenser === "OFF" ? "td-off" : ""}>{h.dispenser || "–"}</td>
                <td><KondisiBadge kondisi={h.kondisi} /></td>
                <td className="td-notif">
                  {h.kondisi === "PEMBOROSAN" ? "Tidak ada orang tapi listrik nyala"
                    : h.kondisi === "PERINGATAN" ? "Listrik aktif di luar jam kerja"
                    : h.kondisi === "NORMAL"     ? "Aktivitas normal terdeteksi"
                    : "Ruangan kosong & aman"}
                </td>
                <td>
                  {(() => {
                    const imgUrl = resolveImgUrl(h.gambar_url || (h.gambar ? `/api/captures/${h.gambar}` : null));
                    if (!imgUrl) {
                      return (
                        <div style={{
                          width: 48, height: 36, borderRadius: 6,
                          background: "#f3f4f6", border: "1px dashed #d1d5db",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Ico d={P.img} size={13} />
                        </div>
                      );
                    }
                    return (
                      <div
                        onClick={() => openImg(imgUrl)}
                        title="Klik untuk zoom"
                        style={{
                          width: 48, height: 36, borderRadius: 6, overflow: "hidden",
                          cursor: "pointer", border: "2px solid #e5e7eb",
                          transition: "border-color .15s",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "#f3f4f6",
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#16a34a"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
                      >
                        <img
                          src={imgUrl}
                          alt="capture"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={e => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement.innerHTML =
                              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                          }}
                        />
                      </div>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}