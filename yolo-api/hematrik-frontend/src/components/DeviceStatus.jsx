import { Lightbulb, Wind, Droplets, Power } from "lucide-react";

const DEVICES = [
  { key: "lampu", label: "Lampu", icon: Lightbulb },
  { key: "ac", label: "AC", icon: Wind },
  { key: "dispenser", label: "Dispenser", icon: Droplets },
];

function DeviceRow({ label, icon: Icon, active }) {
  return (
    <div className={`
      flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-300
      ${active
        ? "bg-accent-green/5 border-accent-green/25"
        : "bg-surface-700/40 border-surface-600/40"}
    `}>
      <div className="flex items-center gap-3">
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center
          ${active ? "bg-accent-green/15" : "bg-surface-700"}
        `}>
          <Icon size={15} className={active ? "text-accent-green" : "text-surface-500"} strokeWidth={1.5} />
        </div>
        <span className="text-sm font-mono text-white">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-accent-green animate-pulse_dot" : "bg-surface-600"}`} />
        <span className={`text-xs font-mono ${active ? "text-accent-green" : "text-surface-500"}`}>
          {active ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}

export default function DeviceStatus({ devices }) {
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Power size={14} className="text-accent-green" strokeWidth={2} />
        <h3 className="text-xs font-mono text-surface-400 uppercase tracking-wider">Status Perangkat</h3>
      </div>

      <div className="space-y-2">
        {DEVICES.map(({ key, label, icon }) => (
          <DeviceRow key={key} label={label} icon={icon} active={devices?.[key] ?? false} />
        ))}
      </div>
    </div>
  );
}
