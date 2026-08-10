import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export default function AlertBar({ latest }) {
    const [dismissed, setDismissed] = useState(false);

    const show = !dismissed &&
        latest &&
        (latest.kondisi === "PEMBOROSAN" || latest.kondisi === "PERINGATAN");

    if (!show) return null;

    const isPemborosan = latest.kondisi === "PEMBOROSAN";

    return (
        <div className={`flex items-center justify-between px-5 py-3.5 rounded-xl border animate-fadeIn
      ${isPemborosan
                ? "bg-amber-50 border-amber-200"
                : "bg-orange-50 border-orange-200"}`}>

            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          ${isPemborosan ? "bg-amber-100" : "bg-orange-100"}`}>
                    <AlertTriangle
                        size={16}
                        strokeWidth={2}
                        className={isPemborosan ? "text-amber-600" : "text-orange-600"}
                    />
                </div>
                <div>
                    <p className={`text-sm font-semibold ${isPemborosan ? "text-amber-800" : "text-orange-800"}`}>
                        {isPemborosan
                            ? "Peringatan! Pemborosan energi terdeteksi"
                            : "Peringatan! Listrik aktif di luar jam kerja"}
                    </p>
                    <p className={`text-xs mt-0.5 ${isPemborosan ? "text-amber-600" : "text-orange-600"}`}>
                        {latest.notifikasi}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs ${isPemborosan ? "text-amber-500" : "text-orange-500"}`}>
                    {latest.waktu
                        ? new Date(latest.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                        : ""}
                </span>
                <button
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors
            ${isPemborosan
                            ? "border-amber-400 text-amber-700 hover:bg-amber-100"
                            : "border-orange-400 text-orange-700 hover:bg-orange-100"}`}
                >
                    Lihat Detail
                </button>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}