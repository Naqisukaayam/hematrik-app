import { Lightbulb, Wind, Droplets } from "lucide-react";

function Device({ label, icon: Icon, active, iconColor }) {
    return (
        <div className="flex flex-col items-center gap-2">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center
        ${active ? "bg-amber-50" : "bg-slate-100"}`}>
                <Icon
                    size={22}
                    strokeWidth={1.5}
                    className={active ? iconColor : "text-slate-400"}
                />
            </div>

            {/* Label */}
            <p className="text-xs font-semibold text-slate-600">{label}</p>

            {/* Value */}
            <p className={`text-sm font-bold ${active ? "text-green-600" : "text-red-500"}`}>
                {active ? "ON" : "OFF"}
            </p>

            {/* Badge */}
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full
        ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {active ? "Aktif" : "Mati"}
            </span>
        </div>
    );
}

export default function DeviceCard({ devices }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Status Perangkat (IoT)
            </p>

            <div className="flex justify-around items-start py-2">
                <Device label="Lampu" icon={Lightbulb} active={devices?.lampu} iconColor="text-amber-500" />
                <Device label="AC" icon={Wind} active={devices?.ac} iconColor="text-blue-500" />
                <Device label="Dispenser" icon={Droplets} active={devices?.dispenser} iconColor="text-cyan-500" />
            </div>
        </div>
    );
}