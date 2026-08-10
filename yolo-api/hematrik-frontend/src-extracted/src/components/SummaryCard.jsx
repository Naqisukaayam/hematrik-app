import { getMonthlySummary } from "../utils/helpers";

function MetricCard({ label, value, textColor, bgColor }) {
    return (
        <div className={`rounded-xl p-4 ${bgColor}`}>
            <p className="text-xs font-medium text-slate-500 mb-2 leading-tight">{label}</p>
            <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-1">kali</p>
        </div>
    );
}

export default function SummaryCard({ data }) {
    const s = getMonthlySummary(data);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-700">Ringkasan Bulanan</p>
                <span className="text-[11px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                    {s.monthName}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <MetricCard
                    label="Kejadian Pemborosan"
                    value={s.pemborosan}
                    textColor="text-red-600"
                    bgColor="bg-red-50"
                />
                <MetricCard
                    label="Kondisi Normal"
                    value={s.normal}
                    textColor="text-green-600"
                    bgColor="bg-green-50"
                />
                <MetricCard
                    label="Peringatan"
                    value={s.peringatan}
                    textColor="text-amber-600"
                    bgColor="bg-amber-50"
                />
                <MetricCard
                    label="Total Pengecekan"
                    value={s.total}
                    textColor="text-blue-600"
                    bgColor="bg-blue-50"
                />
            </div>
        </div>
    );
}