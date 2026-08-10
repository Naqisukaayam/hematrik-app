import { History as HistoryIcon, RefreshCw } from "lucide-react";
import HistoryTable from "../components/HistoryTable";
import { getKondisiConfig } from "../utils/kondisi";

function SummaryBadge({ label, count, kondisi }) {
  const cfg = getKondisiConfig(kondisi);
  return (
    <div className={`rounded-lg border px-4 py-3 ${cfg.bg} ${cfg.border}`}>
      <p className="text-xs font-mono text-surface-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-mono font-bold mt-1 ${cfg.color}`}>{count}</p>
    </div>
  );
}

export default function History({ data, loading, refetch }) {
  const counts = {
    NORMAL:     data.filter(d => d.kondisi === "NORMAL").length,
    AMAN:       data.filter(d => d.kondisi === "AMAN").length,
    PEMBOROSAN: data.filter(d => d.kondisi === "PEMBOROSAN").length,
    PERINGATAN: data.filter(d => d.kondisi === "PERINGATAN").length,
  };

  return (
    <div className="space-y-6 animate-slide_in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-mono font-bold text-white flex items-center gap-2">
            <HistoryIcon size={18} className="text-accent-blue" strokeWidth={1.5} />
            Riwayat Data
          </h1>
          <p className="text-xs font-mono text-surface-500 mt-0.5">{data.length} record terbaru</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-800 border border-surface-700
                     hover:border-surface-600 text-xs font-mono text-surface-400 hover:text-white transition-all"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryBadge label="Normal"     count={counts.NORMAL}     kondisi="NORMAL"     />
        <SummaryBadge label="Aman"       count={counts.AMAN}       kondisi="AMAN"       />
        <SummaryBadge label="Pemborosan" count={counts.PEMBOROSAN} kondisi="PEMBOROSAN" />
        <SummaryBadge label="Peringatan" count={counts.PERINGATAN} kondisi="PERINGATAN" />
      </div>

      {/* Table */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
        <HistoryTable data={data} loading={loading} />
      </div>
    </div>
  );
}
