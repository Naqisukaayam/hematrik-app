import { Ico } from "../utils/icons";

export default function DevCard({ icon, label, state, watt }) {
  const on = state === "ON";
  return (
    <div className="dev-item">
      <div className={`dev-icon ${on ? (label === "AC" ? "ac" : "lampu") : "off"}`}>
        <Ico d={icon} size={22} />
      </div>
      <div className="dev-name">{label}</div>
      <div className={`dev-state ${on ? "on" : "off"}`}>{state || "–"}</div>
      <span className={`dev-badge ${on ? "on" : "off"}`}>{on ? "Aktif" : "Mati"}</span>
      {watt !== undefined && (
        <div className="dev-watt">{watt > 0 ? `${watt} W` : "0 W"}</div>
      )}
    </div>
  );
}
