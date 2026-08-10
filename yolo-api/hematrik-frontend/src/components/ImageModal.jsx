import { useEffect } from "react";
import { Ico, P } from "../utils/icons";

export default function ImageModal({ src, onClose }) {
  // Close on Escape key
  useEffect(() => {
    if (!src) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <Ico d={P.close} size={18} />
        </button>
        <img
          src={src}
          alt="Gambar deteksi"
          className="modal-img"
        />
      </div>
    </div>
  );
}