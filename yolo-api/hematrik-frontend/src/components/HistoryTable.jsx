import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { getStyle, formatWaktu, resolveImgUrl } from "../utils/helpers";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const PER_PAGE = 5;

function Badge({ kondisi }) {
  const s = getStyle(kondisi);
  return (
    <span className={`inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${s.badge}`}>
      {kondisi}
    </span>
  );
}

function StatusPill({ active }) {
  return (
    <span className={`text-xs font-semibold ${active ? "text-green-600" : "text-red-500"}`}>
      {active ? "ON" : "OFF"}
    </span>
  );
}

export default function HistoryTable({ data }) {
  const [page, setPage] = useState(1);
  const total = Math.ceil(data.length / PER_PAGE);
  const rows = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-700">Riwayat Pengecekan Terakhir</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["Waktu", "Jumlah Orang", "Lampu", "AC", "Dispenser", "Kondisi", "Notifikasi", "Gambar"].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id ?? i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors duration-100">
                <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{formatWaktu(row.waktu)}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-700">{row.jumlah_orang} orang</td>
                <td className="px-4 py-3"><StatusPill active={row.status_listrik === "ON"} /></td>
                <td className="px-4 py-3"><StatusPill active={row.status_listrik === "ON" && row.kondisi === "NORMAL"} /></td>
                <td className="px-4 py-3"><StatusPill active={true} /></td>
                <td className="px-4 py-3"><Badge kondisi={row.kondisi} /></td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate">{row.notifikasi}</td>
                <td className="px-4 py-3">
                  {row.gambar_url || row.gambar ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-7 bg-slate-200 rounded overflow-hidden flex items-center justify-center">
                        <img
                          src={resolveImgUrl(row.gambar_url || `/api/captures/${row.gambar}`)}
                          alt="cap"
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = "none"; }}
                        />
                      </div>
                      <a href={resolveImgUrl(row.gambar_url || `/api/captures/${row.gambar}`)} target="_blank" rel="noreferrer"
                        className="text-slate-400 hover:text-blue-500 transition-colors">
                        <ZoomIn size={13} />
                      </a>
                    </div>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                  Belum ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 1 && (
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Halaman {page} dari {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200
                         text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: total }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium border transition-colors
                  ${p === page
                    ? "bg-green-600 text-white border-green-600"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(total, p + 1))}
              disabled={page === total}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200
                         text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}