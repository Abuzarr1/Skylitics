"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plane, CheckCircle2 } from "lucide-react";
import { setSelectedAirport } from "@/hooks/useAuth";

const AIRPORTS = [
    { code: "ATL", name: "Hartsfield-Jackson", city: "Atlanta, GA",       region: "US-SE" },
    { code: "JFK", name: "John F. Kennedy",    city: "New York, NY",      region: "US-NE" },
    { code: "ORD", name: "O'Hare International", city: "Chicago, IL",     region: "US-MW" },
    { code: "LAX", name: "Los Angeles Intl",   city: "Los Angeles, CA",   region: "US-W"  },
    { code: "DFW", name: "Dallas/Fort Worth",  city: "Dallas, TX",        region: "US-S"  },
    { code: "MIA", name: "Miami International", city: "Miami, FL",        region: "US-SE" },
    { code: "SFO", name: "San Francisco Intl", city: "San Francisco, CA", region: "US-W"  },
    { code: "DEN", name: "Denver International", city: "Denver, CO",      region: "US-MW" },
    { code: "SEA", name: "Seattle-Tacoma",     city: "Seattle, WA",       region: "US-NW" },
];

export default function SelectAirportPage() {
    const router = useRouter();
    const [selected, setSelected] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);

    function handleSelect(code: string) {
        setSelected(code);
    }

    function handleConfirm() {
        if (!selected) return;
        setConfirming(true);
        setSelectedAirport(selected);
        router.push("/manager");
    }

    return (
        <div className="min-h-screen bg-[var(--bg-card)] flex flex-col items-center justify-center px-6 py-16">

            {/* Header */}
            <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-10 h-10 border-2 border-yellow-400 rounded flex items-center justify-center">
                        <Plane className="w-5 h-5 text-yellow-400" />
                    </div>
                    <span className="text-2xl font-mono font-black tracking-tighter uppercase text-white">
                        Skylytics
                    </span>
                </div>
                <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-white mb-3">
                    SELECT YOUR AIRPORT
                </h1>
                <p className="font-mono text-xs uppercase tracking-widest text-brand-500">
                    You will only see flights and data for your selected airport
                </p>
            </div>

            {/* Airport Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full max-w-4xl mb-10">
                {AIRPORTS.map((ap, i) => {
                    const isSelected = selected === ap.code;
                    return (
                        <motion.button
                            key={ap.code}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.04 }}
                            onClick={() => handleSelect(ap.code)}
                            className={`relative text-left p-4 border transition-all duration-150 group ${
                                isSelected
                                    ? "border-yellow-400 bg-yellow-400/10"
                                    : "border-[var(--border-ui)] bg-[var(--ch-brand-900)] hover:border-white/30 hover:bg-brand-800"
                            }`}
                        >
                            {isSelected && (
                                <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-yellow-400" />
                            )}
                            <div className={`font-mono font-black text-2xl tracking-tighter mb-1 ${
                                isSelected ? "text-yellow-400" : "text-white group-hover:text-yellow-400 transition-colors"
                            }`}>
                                {ap.code}
                            </div>
                            <div className="font-mono text-[10px] uppercase tracking-widest text-brand-400 leading-tight">
                                {ap.name}
                            </div>
                            <div className="font-mono text-[9px] uppercase tracking-widest text-brand-600 mt-1">
                                {ap.city}
                            </div>
                            <div className={`absolute bottom-2 right-3 font-mono text-[8px] uppercase tracking-widest ${
                                isSelected ? "text-yellow-400/60" : "text-brand-700"
                            }`}>
                                {ap.region}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Confirm Button */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: selected ? 1 : 0.4 }}
                transition={{ duration: 0.2 }}
                onClick={handleConfirm}
                disabled={!selected || confirming}
                className="bg-yellow-400 text-black font-mono font-black uppercase tracking-widest px-16 py-4 text-sm hover:bg-yellow-300 active:bg-yellow-500 transition-colors disabled:cursor-not-allowed"
            >
                {confirming
                    ? "LOADING..."
                    : selected
                        ? `MANAGE ${selected} →`
                        : "SELECT AN AIRPORT"}
            </motion.button>

            {selected && !confirming && (
                <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-brand-500">
                    You can switch airports anytime from the sidebar
                </p>
            )}
        </div>
    );
}
