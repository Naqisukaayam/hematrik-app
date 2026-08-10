import { Users, RefreshCw } from "lucide-react";
import { formatWaktu } from "../utils/helpers";

export default function StatusCard({ latest }) {
  const adaOrang = (latest?.jumlah_orang ?? 0) > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Status Orang di Ruangan
      </p>

      <div className="flex flex-col items-center text-center py-2">
        {/* Icon circle */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3
          ${adaOrang ? "bg-green-100" : "bg-slate-100"}`}>
          <Users
            size={28}
            strokeWidth={1.5}
            className={adaOrang ? "text-green-600" : "text-slate-400"}
          />
        </div>

        {/* Status text */}
        <p className={`text-lg font-bold tracking-wide ${adaOrang ? "text-green-600" : "text-slate-500"}`}>
          {adaOrang ? "ADA ORANG" : "KOSONG"}
        </p>

        {/* Count badge */}
        <span className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full
          ${adaOrang ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          Jumlah Terdeteksi: {latest?.jumlah_orang ?? 0} Orang
        </span>

        {/* Last updated */}
        <div className="flex items-center gap-1 mt-3 text-[11px] text-slate-400">
          <RefreshCw size={10} />
          Terakhir diperbarui: {formatWaktu(latest?.waktu)}
        </div>
      </div>
    </div>
  );
}