
"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity, RotateCcw, Terminal, Send,
    AlertTriangle, Plane, Users,
    CloudSnow, Eye, ChevronDown, WifiOff, Lock, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAirportStats, getRiskLevel } from "@/lib/csvUtils";
import { useData } from "@/lib/useData";
import { LoadingRadar } from "@/components/ui/LoadingRadar";

function OnTimeBar({ value }: { value: number }) {
    const clamped = Math.max(0, Math.min(100, value));
    const isGood   = clamped > 70;
    const isMedium = clamped >= 40 && clamped <= 70;
    const barColor = isGood ? "#DFFF00" : isMedium ? "#facc15" : "#FF3B30";
    const textColor = isGood ? "text-accent-neon" : isMedium ? "text-yellow-400" : "text-accent-alert";

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between items-baseline font-mono">
                <span className="text-[9px] uppercase tracking-widest text-brand-500">On-Time Probability</span>
                <span className={`text-2xl font-black font-heading ${textColor} tabular-nums`}>
                    {clamped.toFixed(0)}<span className="text-sm font-mono text-brand-500">%</span>
                </span>
            </div>
            <div className="w-full h-3 bg-brand-800 relative overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 h-full"
                    style={{ backgroundColor: barColor, boxShadow: `0 0 12px ${barColor}55` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${clamped}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                />
            </div>
        </div>
    );
}

function CauseBar({ label, pct, delay }: { label: string; pct: number; delay: number }) {
    return (
        <div>
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest mb-1.5">
                <span className="text-brand-400">{label}</span>
                <span className="text-yellow-400 font-bold tabular-nums">{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-brand-800 relative overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 h-full bg-yellow-400"
                    style={{ boxShadow: "0 0 8px rgba(250,204,21,0.4)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, delay, ease: "easeOut" }}
                />
            </div>
        </div>
    );
}

function Spinner() {
    return (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

type Overrides = {
    weather_severity: number;
    incoming_flight_delay_min: number;
    gate_status: "OPEN" | "CLOSED";
    weather_type: string;
    visibility_miles: number;
    crew_availability: "AVAILABLE" | "SHORT";
    passenger_load_pct: number;
    origin_traffic: "LOW" | "MEDIUM" | "HIGH";
    dest_traffic: "LOW" | "MEDIUM" | "HIGH";
};

type SimResult = {
    predicted_delay_minutes: number;
    on_time_probability: number;
    delay_category: string;
    cascade_risk: string;
    shap_breakdown: Record<string, number>;
    confidence_score: number;
    recommendation: string;
    engine: string;
};

const SEVERITY_LABELS = ["CLEAR","CLEAR","LOW","LOW","MODERATE","MODERATE","HIGH","HIGH","SEVERE","SEVERE","EXTREME"];

const DEFAULT_FORM = {
    flightNumber: "",
    airline:      "",
    origin:       "ATL",
    destination:  "",
    date:         new Date().toISOString().split("T")[0],
    time:         "08:00",
    distance:     865,
    aircraftType: "Boeing 737",
};

const DEFAULT_OVERRIDES: Overrides = {
    weather_severity:          0,
    incoming_flight_delay_min: 0,
    gate_status:               "OPEN",
    weather_type:              "Clear",
    visibility_miles:          10,
    crew_availability:         "AVAILABLE",
    passenger_load_pct:        85,
    origin_traffic:            "LOW",
    dest_traffic:              "LOW",
};

const CAUSE_LABELS: Record<string, string> = {
    weather:       "Weather",
    inbound_delay: "Inbound",
    gate:          "Gate",
    crew:          "Crew",
    traffic:       "Traffic",
};

export default function WhatIfSimulator() {
    const auth = useAuth();
    const airportCode = auth?.airportCode || 'ATL';
    const { rows, loading: loadingData } = useData();
    const [form, setForm] = useState(DEFAULT_FORM);
    const [overrides, setOverrides] = useState<Overrides>(DEFAULT_OVERRIDES);
    const [result, setResult] = useState<SimResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<{ role: "sys" | "user"; content: string }[]>([
        { role: "sys", content: "Skylytics Core NLP Copilot Online." },
        { role: "sys", content: "What-If Simulator linked. Awaiting scenario queries..." },
    ]);
    const [input, setInput] = useState("");
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (airportCode) setForm(f => ({ ...f, origin: airportCode }));
    }, [airportCode]);

    const airlines = useMemo(() => {
        const set = new Set(rows.map(r => r.carrier));
        return Array.from(set).sort();
    }, [rows]);

    const flightList = useMemo(() => {
        if (!form.airline) return [];
        return rows.filter(r => r.carrier === form.airline && r.origin === form.origin);
    }, [rows, form.airline, form.origin]);

    const handleFlightChange = (flightNum: string) => {
        const f = flightList.find(x => x.flightNumber === flightNum);
        if (f) {
            setForm(prev => ({
                ...prev,
                flightNumber: f.flightNumber,
                destination: f.destination,
                time: f.scheduledTime,
                distance: 800,
                aircraftType: "Boeing 737",
            }));
        }
    };

    const handleRun = useCallback(async (ov?: Overrides) => {
        const activeOv = ov ?? overrides;
        setLoading(true);
        
        // Simulation logic based on CSV context
        const airportStats = getAirportStats(form.origin, rows);
        const risk = getRiskLevel(form.origin, rows);
        
        let delay = activeOv.weather_severity * 5;
        if (activeOv.gate_status === "CLOSED") delay += 25;
        if (risk === 'high') delay += 15;
        
        const res: SimResult = {
            predicted_delay_minutes: delay,
            on_time_probability: Math.max(0, 100 - (delay * 1.5)),
            delay_category: delay > 60 ? "CRITICAL" : delay > 30 ? "SEVERE" : "MINOR",
            cascade_risk: delay > 45 ? "HIGH" : "LOW",
            shap_breakdown: { weather: 40, inbound_delay: 30, gate: 20, crew: 10, traffic: 0 },
            confidence_score: 88,
            recommendation: delay > 30 ? "Divert resources to node turnaround." : "Maintain nominal operations.",
            engine: "Operational Archive Sync"
        };

        setTimeout(() => {
            setResult(res);
            setLoading(false);
            setMessages(prev => [
                ...prev,
                { role: "sys", content: `> [SIMULATION_COMPLETE]: ${res.delay_category} | Delay: +${res.predicted_delay_minutes}min` }
            ]);
        }, 1000);
    }, [form, overrides, rows]);

    if (loadingData) return <LoadingRadar text="SYNCHRONIZING OPERATIONAL DATA..." />;

    return (
        <div className="flex flex-col gap-8 w-full max-w-[1600px] mx-auto px-4 md:px-12 py-10">
            <div className="flex justify-between items-end border-b border-[var(--border-ui)] pb-6">
                <div>
                    <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">What-If Simulator</h1>
                    <p className="text-brand-500 font-mono text-xs uppercase tracking-widest mt-2">Modify operational parameters and simulate cascading delay impact</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="font-mono text-[10px] text-accent-neon uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 border border-accent-neon/30 bg-accent-neon/10">
                        <Activity className="w-3 h-3" /> Live Sandbox
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-8 flex flex-col gap-6 relative">
                    <div>
                        <p className="font-mono text-[10px] uppercase text-brand-500 tracking-widest mb-4">Mission Parameters</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">Airline</label>
                                <select value={form.airline} onChange={e => setForm(f => ({ ...f, airline: e.target.value }))} className="w-full bg-[var(--ch-brand-900)] border border-[var(--border-ui)] text-white px-3 py-2 font-mono text-xs uppercase focus:outline-none">
                                    <option value="">Select Airline</option>
                                    {airlines.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">Flight Number</label>
                                <select value={form.flightNumber} onChange={e => handleFlightChange(e.target.value)} className="w-full bg-[var(--ch-brand-900)] border border-[var(--border-ui)] text-white px-3 py-2 font-mono text-xs uppercase focus:outline-none">
                                    <option value="">Select Flight</option>
                                    {flightList.map(f => <option key={f.flightNumber} value={f.flightNumber}>{f.flightNumber}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/5 pt-5 space-y-4">
                        <p className="font-mono text-[10px] uppercase text-brand-500 tracking-widest">Override Parameters</p>
                        <div className="space-y-2">
                            <div className="flex justify-between font-mono text-xs uppercase tracking-widest text-brand-400">
                                <span>Weather Severity</span>
                                <span className="text-accent-neon">{overrides.weather_severity}/10</span>
                            </div>
                            <input type="range" min="0" max="10" value={overrides.weather_severity} onChange={e => setOverrides(o => ({ ...o, weather_severity: +e.target.value }))} className="w-full h-1 bg-brand-800 appearance-none accent-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">Gate Status</label>
                                <div className="flex h-[34px]">
                                    {["OPEN", "CLOSED"].map(v => (
                                        <button key={v} onClick={() => setOverrides(o => ({ ...o, gate_status: v as any }))} className={`flex-1 font-mono text-[9px] uppercase tracking-widest border ${overrides.gate_status === v ? 'bg-accent-neon/10 border-accent-neon text-accent-neon' : 'bg-brand-950 border-white/5 text-brand-600'}`}>
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => handleRun()} className="w-full bg-yellow-400 text-black font-black font-mono tracking-widest uppercase py-4 hover:bg-yellow-300 transition-colors">
                        {loading ? "ANALYZING..." : "RUN SIMULATION"}
                    </button>
                </div>

                <div className="bg-[var(--ch-brand-900)] border border-[var(--border-ui)] p-8 flex flex-col relative overflow-hidden min-h-[600px]">
                    {result ? (
                        <div className="relative z-10 flex flex-col gap-6 w-full">
                            <div className="flex items-end gap-4 pb-5 border-b border-white/5">
                                <div>
                                    <p className="font-mono text-[9px] text-brand-600 uppercase tracking-widest mb-1">Predicted Delay</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-8xl font-black font-heading text-yellow-400 leading-none">{result.predicted_delay_minutes}</span>
                                        <span className="text-2xl font-black font-heading text-yellow-400/70 uppercase tracking-tight mb-2">MIN</span>
                                    </div>
                                </div>
                            </div>
                            <OnTimeBar value={result.on_time_probability} />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4">
                            <p className="font-mono text-[11px] uppercase text-brand-600 tracking-[0.2em] text-center">Awaiting Simulation Parameters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
