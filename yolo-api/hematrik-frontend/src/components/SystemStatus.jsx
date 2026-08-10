import { ShieldCheck, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { getStyle } from "../utils/helpers";
import { formatWaktu } from "../utils/helpers";

const ICONS = {
    NORMAL: CheckCircle,
    AMAN: CheckCircle,
    PEMBOROSAN: AlertCircle,
    PERINGATAN: AlertTriangle,
};

const LABELS = {
    NORMAL: "NORMAL",
    AMAN: "AMAN",
    PEMBOROSAN: "PEMBOROSAN",
    PERINGATAN: "PERINGATAN",
};

const ICON_BG = {
    NORMAL: "bg-green-100",
    AMAN: "bg-blue-100",
    PEMBOROSAN: "bg-red-100",
    PERINGATAN: "bg-amber-100",
};

export default function SystemStatus({ latest }) {
    const kondisi = latest?.kondisi ?? "AMAN";
    const style = getStyle(kondisi);
    const Icon = ICONS[kondisi] ?? AlertTriangle;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Kondisi Sistem Saat Ini
            </p>

            <div className="flex flex-col items-center text-center py-2">
                {/* Icon circle */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${ICON_BG[kondisi]}`}>
                    <Icon size={28} strokeWidth={1.5} className={style.text} />
                </div>

                {/* Kondisi label */}
                <p className={`text-lg font-bold tracking-wide ${style.text}`}>
                    {LABELS[kondisi]}
                </p>

                {/* Notifikasi */}
                <p className="text-xs text-slate-500 mt-1.5 leading-snug max-w-[160px]">
                    {latest?.notifikasi ?? "—"}
                </p>

                {/* Waktu */}
                <p className="text-[11px] text-slate-400 mt-3">
                    {formatWaktu(latest?.waktu)}
                </p>
            </div>
        </div>
    );
}