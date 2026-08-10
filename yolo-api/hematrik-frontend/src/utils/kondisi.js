export const KONDISI_CONFIG = {
  NORMAL:     { color: "text-accent-green",  bg: "bg-accent-dim",     border: "border-glow-green",  badge: "bg-accent-green/20 text-accent-green",   dot: "bg-accent-green"  },
  PEMBOROSAN: { color: "text-accent-red",    bg: "bg-red-900/20",     border: "border-glow-red",    badge: "bg-accent-red/20 text-accent-red",        dot: "bg-accent-red"    },
  PERINGATAN: { color: "text-accent-yellow", bg: "bg-yellow-900/20",  border: "border-glow-yellow", badge: "bg-accent-yellow/20 text-accent-yellow",  dot: "bg-accent-yellow" },
  AMAN:       { color: "text-accent-blue",   bg: "bg-blue-900/20",    border: "border-blue-500/40", badge: "bg-blue-500/20 text-accent-blue",          dot: "bg-accent-blue"   },
};

export function getKondisiConfig(kondisi) {
  return KONDISI_CONFIG[kondisi] ?? KONDISI_CONFIG["AMAN"];
}

export function formatWaktu(waktuStr) {
  if (!waktuStr) return "-";
  const d = new Date(waktuStr);
  return d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

export function formatTime(date) {
  if (!date) return "";
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function getStatusDevice(kondisi, listrik) {
  const on = listrik === "ON";
  return {
    lampu:     on,
    ac:        on && kondisi === "NORMAL",
    dispenser: true, // always on (simulasi)
  };
}
