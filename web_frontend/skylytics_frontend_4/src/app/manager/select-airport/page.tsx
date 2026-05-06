
"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plane, CheckCircle2, Activity } from "lucide-react";
import { setSelectedAirport } from "@/hooks/useAuth";
import { getAirportStats, getRiskLevel } from "@/lib/csvUtils";
import { useMockData } from "@/lib/useMockData";
import { LoadingRadar } from "@/components/ui/LoadingRadar";

export default function SelectAirportPage() {
    const [selected, setSelected] = useState<string | null>(null);
    const { rows, loading } = useMockData();

    function handleSelect(code: string) {
        setSelected(code);
        try {
            setSelectedAirport(code);
        } catch { }
        window.location.href = "/manager";
    }

    const AIRPORTS = [
        { code: "ATL", name: "Hartsfield-Jackson",   city: "Atlanta, GA",        region: "US-SE" },
        { code: "JFK", name: "John F. Kennedy",       city: "New York, NY",       region: "US-NE" },
        { code: "ORD", name: "O'Hare International",  city: "Chicago, IL",        region: "US-MW" },
        { code: "LAX", name: "Los Angeles Intl",      city: "Los Angeles, CA",    region: "US-W"  },
        { code: "DFW", name: "Dallas/Fort Worth",     city: "Dallas, TX",         region: "US-S"  },
        { code: "MIA", name: "Miami International",   city: "Miami, FL",          region: "US-SE" },
        { code: "SFO", name: "San Francisco Intl",    city: "San Francisco, CA",  region: "US-W"  },
        { code: "DEN", name: "Denver International",  city: "Denver, CO",         region: "US-MW" },
        { code: "SEA", name: "Seattle-Tacoma",        city: "Seattle, WA",        region: "US-NW" },
    ];

    if (loading) return <LoadingRadar text="INITIALIZING NODE DIRECTORY..." />;

    return (
        <div className="min-h-screen bg-[var(--bg-card)] flex flex-col items-center justify-center px-6 py-16">
            <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-10 h-10 border-2 border-yellow-400 rounded flex items-center justify-center">
                        <Plane className="w-5 h-5 text-yellow-400" />
                    </div>
                    <span className="text-2xl font-mono font-black tracking-tighter uppercase text-white">Skylytics</span>
                </div>
                <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-white mb-3">SELECT YOUR AIRPORT</h1>
                <p className="font-mono text-xs uppercase tracking-widest text-brand-500">Node selection will filter all downstream telemetry</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full max-w-4xl mb-10">
                {AIRPORTS.map((ap, i) => {
                    const isSelected = selected === ap.code;
                    const stats = getAirportStats(ap.code, rows);
                    const risk = getRiskLevel(ap.code, rows);
                    const riskColor = risk === 'high' ? 'text-accent-alert' : risk === 'medium' ? 'text-yellow-400' : 'text-accent-neon';

                    return (
                        <motion.button
                            key={ap.code}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.04 }}
                            onClick={() => handleSelect(ap.code)}
                            className={`relative text-left p-4 border transition-all duration-150 group ${
                                isSelected ? "border-yellow-400 bg-yellow-400/10" : "border-[var(--border-ui)] bg-[var(--ch-brand-900)] hover:border-white/30 hover:bg-brand-800"
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className={`font-mono font-black text-2xl tracking-tighter ${isSelected ? "text-yellow-400" : "text-white group-hover:text-yellow-400"}`}>
                                    {ap.code}
                                </div>
                                <div className={`font-mono text-[8px] font-bold uppercase ${riskColor}`}>
                                    {risk} risk
                                </div>
                            </div>
                            <div className="font-mono text-[10px] uppercase tracking-widest text-brand-400 leading-tight mb-4">{ap.name}</div>
                            
                            <div className="flex justify-between items-end mt-auto">
                                <div className="font-mono text-[8px] uppercase tracking-widest text-brand-600">{ap.city}</div>
                                <div className="text-right">
                                    <div className="font-mono text-[9px] text-white font-bold">{stats.totalFlights}</div>
                                    <div className="font-mono text-[7px] text-brand-500 uppercase">Flights</div>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
