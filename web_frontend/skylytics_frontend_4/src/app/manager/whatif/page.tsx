"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity, RotateCcw, Terminal, Send,
    AlertTriangle, Plane, Users,
    CloudSnow, Eye, ChevronDown, WifiOff, Lock, RefreshCw,
} from "lucide-react";
import { getUserInfo, getWhatIfAirlines, getWhatIfFlights, runWhatIfSimulate } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

// ─── Visual Components ────────────────────────────────────────────────────────

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
            <div className="flex justify-between font-mono text-[8px] text-brand-700 uppercase tracking-widest">
                <span>0% — Critical</span><span>100% — Nominal</span>
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

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Client-side mock fallback (used when backend is offline) ─────────────────

function mockSimulate(form: typeof DEFAULT_FORM, ov: Overrides): SimResult {
    let delay = ov.weather_severity * 4 * 10; // weather_severity is 0-10 here
    if (ov.gate_status === "CLOSED") delay += 20;
    delay += ov.incoming_flight_delay_min * 0.4;
    if (ov.crew_availability === "SHORT") delay += 15;
    if (ov.origin_traffic === "HIGH") delay += 10;
    else if (ov.origin_traffic === "MEDIUM") delay += 5;
    delay = Math.min(Math.round(delay), 180);
    const onTime = Math.max(0, Math.round(100 - delay * 1.8));

    const WEATHER_BONUS: Record<string, number> = { Clear: 0, Rain: 5, Snow: 12, Thunderstorm: 15, Fog: 8, Ice: 10 };
    const wScore = ov.weather_severity * 3.5 + (WEATHER_BONUS[ov.weather_type] ?? 0) + (10 - ov.visibility_miles);
    const iScore = ov.incoming_flight_delay_min / 180 * 35;
    const gScore = ov.gate_status === "CLOSED" ? 20 : 0;
    const cScore = ov.crew_availability === "SHORT" ? 18 : 0;
    const tScore = ({ LOW: 0, MEDIUM: 8, HIGH: 15 }[ov.origin_traffic] ?? 0) + ({ LOW: 0, MEDIUM: 5, HIGH: 10 }[ov.dest_traffic] ?? 0);
    const total  = wScore + iScore + gScore + cScore + tScore || 1;
    const bd = (s: number) => Math.max(0, Math.round(s / total * 100));

    return {
        predicted_delay_minutes: delay,
        on_time_probability: onTime,
        delay_category: delay < 15 ? "MINOR" : delay < 45 ? "MODERATE" : delay < 90 ? "SEVERE" : "CRITICAL",
        cascade_risk: delay >= 45 ? "HIGH" : delay >= 15 ? "MEDIUM" : "LOW",
        shap_breakdown: { weather: bd(wScore), inbound_delay: bd(iScore), gate: bd(gScore), crew: bd(cScore), traffic: bd(tScore) },
        confidence_score: 72,
        recommendation: delay < 10
            ? "All parameters nominal. No intervention required."
            : ov.gate_status === "CLOSED"
            ? "Prioritise gate reassignment. Brief ground crew on expedited turnaround."
            : ov.incoming_flight_delay_min > 30
            ? "Track inbound ETA. Notify connecting passengers immediately."
            : "Review operational parameters and consult supervisor.",
        engine: "offline-mock",
    };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_LABELS = ["CLEAR","CLEAR","LOW","LOW","MODERATE","MODERATE","HIGH","HIGH","SEVERE","SEVERE","EXTREME"];

const DEFAULT_FORM = {
    flightNumber: "",
    airline:      "",
    origin:       "ATL",   // locked to manager's airport
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WhatIfSimulator() {
    const auth = useAuth();
    const [form, setForm]           = useState(DEFAULT_FORM);
    const [overrides, setOverrides] = useState<Overrides>(DEFAULT_OVERRIDES);
    const [result, setResult]       = useState<SimResult | null>(null);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const [offline, setOffline]     = useState(false);

    // Dropdown data from API
    const [airlines, setAirlines]       = useState<string[]>([]);
    const [flightList, setFlightList]   = useState<any[]>([]);
    const [loadingAirlines, setLoadingAirlines] = useState(true);
    const [loadingFlights, setLoadingFlights]   = useState(false);

    // Gate display
    const [currentGate, setCurrentGate] = useState<string>("");

    // Copilot
    const [mounted, setMounted] = useState(false);
    const [user, setUser]       = useState<any>(null);
    const [messages, setMessages] = useState<{ role: "sys" | "user"; content: string }[]>([
        { role: "sys", content: "Skylytics Core NLP Copilot Online." },
        { role: "sys", content: "What-If Simulator linked. Awaiting scenario queries..." },
    ]);
    const [input, setInput] = useState("");
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        const u = getUserInfo();
        setUser(u);
        // Manager's airport — prefer JWT-derived hook, fall back to stored profile, then default
        const airport = auth?.airportCode ?? (u as any)?.airport_code ?? DEFAULT_FORM.origin;
        setForm(f => ({ ...f, origin: airport }));
        loadAirlines(airport);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth?.airportCode]);

    useEffect(() => {
        if (mounted) endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, mounted]);

    const loadAirlines = async (airport: string) => {
        setLoadingAirlines(true);
        try {
            const data = await getWhatIfAirlines(airport);
            setAirlines(data.airlines);
            if (data.airlines.length > 0) {
                const first = data.airlines[0];
                setForm(f => ({ ...f, airline: first }));
                loadFlights(first, airport);
            }
        } catch {
            setOffline(true);
            // Fallback airlines for ATL demo
            const demo = ["DL", "AA", "UA", "WN", "NK"];
            setAirlines(demo);
            setForm(f => ({ ...f, airline: "DL" }));
            loadFlights("DL", airport, true);
        } finally {
            setLoadingAirlines(false);
        }
    };

    const loadFlights = async (airline: string, airport: string, useMock = false) => {
        setLoadingFlights(true);
        setFlightList([]);
        setResult(null);
        try {
            if (useMock) throw new Error("offline");
            const data = await getWhatIfFlights(airline, airport);
            setFlightList(data.flights);
            if (data.flights.length > 0) autoFillFlight(data.flights[0]);
        } catch {
            setOffline(true);
            // Client-side demo flights
            const demos = generateDemoFlights(airline, airport);
            setFlightList(demos);
            if (demos.length > 0) autoFillFlight(demos[0]);
        } finally {
            setLoadingFlights(false);
        }
    };

    const autoFillFlight = (f: any) => {
        setForm(prev => ({
            ...prev,
            flightNumber: f.flight_number,
            destination:  f.destination,
            time:         f.departure_time || prev.time,
            distance:     f.distance_miles || prev.distance,
            aircraftType: f.aircraft_type  || prev.aircraftType,
        }));
        if (f.passenger_load_pct) {
            setOverrides(o => ({ ...o, passenger_load_pct: f.passenger_load_pct }));
        }
        setCurrentGate(f.gate || "");
    };

    const handleAirlineChange = (airline: string) => {
        setForm(f => ({ ...f, airline, flightNumber: "", destination: "" }));
        loadFlights(airline, form.origin);
    };

    const handleFlightChange = (flightNum: string) => {
        const f = flightList.find(x => x.flight_number === flightNum);
        if (f) autoFillFlight(f);
    };

    const handleRun = useCallback(async (ov?: Overrides) => {
        const activeOv = ov ?? overrides;
        setLoading(true);
        setError(null);

        // --- OPTIMISTIC UPDATE ---
        // Calculate a result locally FIRST so the user sees something INSTANTLY
        const optimisticResult = mockSimulate(form, activeOv);
        setResult(optimisticResult);
        triggerAILogic(optimisticResult);
        
        // We set loading false immediately for the "Matrix" overlay, 
        // but can keep a small indicator if we want.
        // For "instant" feel, we remove the blocking overlay almost immediately.
        const startTime = Date.now();

        try {
            // Hard 10-second timeout — Render cold starts can stall indefinitely
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out")), 10_000)
            );
            const data = await Promise.race([
                runWhatIfSimulate({
                    flight_number:  form.flightNumber || "DEMO001",
                    airline:        form.airline,
                    origin:         form.origin,
                    destination:    form.destination || "JFK",
                    date:           form.date,
                    departure_time: form.time,
                    distance_miles: form.distance,
                    aircraft_type:  form.aircraftType,
                    overrides: {
                        weather_severity:          activeOv.weather_severity / 10,
                        incoming_flight_delay_min: activeOv.incoming_flight_delay_min,
                        gate_status:               activeOv.gate_status,
                        weather_type:              activeOv.weather_type,
                        visibility_miles:          activeOv.visibility_miles,
                        crew_availability:         activeOv.crew_availability,
                        passenger_load_pct:        activeOv.passenger_load_pct,
                        origin_traffic:            activeOv.origin_traffic,
                        dest_traffic:              activeOv.dest_traffic,
                    },
                }),
                timeoutPromise,
            ]);

            // Minimum 500ms so result doesn't flicker
            const elapsed = Date.now() - startTime;
            if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));

            setResult(data);
            setOffline(false);
        } catch {
            setOffline(true);
            setError("Simulation timed out — showing local estimate. Try again.");
        } finally {
            setLoading(false);
        }
    }, [form, overrides]);

    const triggerAILogic = (data: SimResult) => {
        setMessages(prev => [
            ...prev,
            { role: "sys", content: `> [INFERENCE_COMPLETE]: ${data.delay_category} | Cascade: ${data.cascade_risk} | Delay: +${data.predicted_delay_minutes}min | Engine: ${data.engine}` },
            { role: "sys", content: `[REC]: ${data.recommendation}` },
        ]);
    };

    const applyPreset = (params: Partial<Overrides>, label: string) => {
        const next = { ...overrides, ...params };
        setOverrides(next);
        setMessages(prev => [...prev, { role: "sys", content: `[PRESET_LOADED]: ${label} parameters synchronized. Running simulation...` }]);
        handleRun(next);
    };

    const handleReset = () => {
        setForm(f => ({ ...DEFAULT_FORM, origin: f.origin, airline: f.airline }));
        setOverrides(DEFAULT_OVERRIDES);
        setResult(null);
        setError(null);
    };

    // Resets only overrides — keeps flight selection intact
    const handleNewScenario = () => {
        setOverrides(DEFAULT_OVERRIDES);
        setResult(null);
    };

    const handleCopilotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setMessages(prev => [...prev, { role: "sys", content: "> [PROCESSING]: Analyzing..." }]);
        try {
            const { queryAssistant } = await import("@/lib/api");
            const ctx = `Route ${form.origin}→${form.destination}, flight ${form.flightNumber}, weather ${overrides.weather_type} severity ${overrides.weather_severity}/10: ${userMsg}`;
            const data = await queryAssistant(ctx);
            setMessages(prev => [...prev.filter(m => !m.content.includes("PROCESSING")), { role: "sys", content: data.response }]);
        } catch {
            setMessages(prev => [...prev.filter(m => !m.content.includes("PROCESSING")), { role: "sys", content: "Error: Neural Link Interrupted. Backend unavailable." }]);
        }
    };

    const handle      = user?.full_name?.split(" ")[0]?.toLowerCase() ?? user?.email?.split("@")[0] ?? "operator";
    const cascadeRisk = result?.cascade_risk ?? "LOW";
    const cascadeColor= cascadeRisk === "HIGH" ? "text-accent-alert border-accent-alert/40 bg-accent-alert/10" : cascadeRisk === "MEDIUM" ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/10" : "text-accent-neon border-accent-neon/40 bg-accent-neon/10";

    const selectCls = "w-full bg-[var(--ch-brand-900)] border border-[var(--border-ui)] text-white px-3 py-2 font-mono text-xs uppercase focus:outline-none focus:border-accent-neon transition-colors appearance-none cursor-pointer";

    const statusColor: Record<string, string> = {
        "BOARDING": "text-accent-neon", "DELAYED": "text-accent-alert", "ON TIME": "text-brand-300",
        "TAXIING": "text-yellow-400", "DEPARTED": "text-brand-500",
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-[1600px] mx-auto px-4 md:px-12 py-10">

            {/* Header */}
            <div className="flex justify-between items-end border-b border-[var(--border-ui)] pb-6">
                <div>
                    <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">What-If Simulator</h1>
                    <p className="text-brand-500 font-mono text-xs uppercase tracking-widest mt-2">Modify operational parameters and simulate cascading delay impact</p>
                </div>
                <div className="flex items-center gap-3">
                    {offline && (
                        <div className="flex items-center gap-2 font-mono text-[10px] text-yellow-400 uppercase tracking-widest px-3 py-1.5 border border-yellow-400/30 bg-yellow-400/10">
                            <WifiOff className="w-3 h-3" /> Simulation Mode
                        </div>
                    )}
                    <div className="font-mono text-[10px] text-accent-neon uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 border border-accent-neon/30 bg-accent-neon/10">
                        <Activity className="w-3 h-3" /> Live Sandbox
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* ── Left Panel ─────────────────────────────────────────── */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-8 flex flex-col gap-6 relative">
                    <div className="absolute top-0 right-0 p-3 flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent-neon/20 animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-brand-700" />
                    </div>

                    {/* MISSION PARAMETERS */}
                    <div>
                        <p className="font-mono text-[10px] uppercase text-brand-500 tracking-widest mb-4">Mission Parameters</p>

                        {/* Row 1: Origin (locked) + Airline dropdown */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest flex items-center gap-1.5">
                                    <Lock className="w-2.5 h-2.5" /> Origin (Your Airport)
                                </label>
                                <div className="w-full bg-[var(--ch-brand-900)] border border-accent-neon/20 text-accent-neon px-3 py-2 font-mono text-sm uppercase font-bold select-none">
                                    {form.origin}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">Airline</label>
                                <div className="relative">
                                    {loadingAirlines ? (
                                        <div className="w-full bg-[var(--ch-brand-900)] border border-[var(--border-ui)] px-3 py-2 font-mono text-xs text-brand-600 uppercase animate-pulse">Loading...</div>
                                    ) : (
                                        <>
                                            <select
                                                value={form.airline}
                                                onChange={e => handleAirlineChange(e.target.value)}
                                                className={selectCls}
                                            >
                                                {airlines.map(a => <option key={a} value={a}>{a}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-600 pointer-events-none" />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Flight Number dropdown + Dest (auto-filled) */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="space-y-1.5">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">Flight Number</label>
                                <div className="relative">
                                    {loadingFlights ? (
                                        <div className="w-full bg-[var(--ch-brand-900)] border border-[var(--border-ui)] px-3 py-2 font-mono text-xs text-brand-600 uppercase animate-pulse">Loading...</div>
                                    ) : (
                                        <>
                                            <select
                                                value={form.flightNumber}
                                                onChange={e => handleFlightChange(e.target.value)}
                                                className={selectCls}
                                            >
                                                {flightList.map(f => (
                                                    <option key={f.flight_number} value={f.flight_number}>
                                                        {f.flight_number}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-600 pointer-events-none" />
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">Destination</label>
                                <div className="w-full bg-[var(--ch-brand-900)] border border-[var(--border-ui)] text-white px-3 py-2 font-mono text-sm uppercase text-brand-300 select-none">
                                    {form.destination || "—"}
                                </div>
                            </div>
                        </div>

                        {/* Status strip for selected flight */}
                        {form.flightNumber && (() => {
                            const sel = flightList.find(f => f.flight_number === form.flightNumber);
                            if (!sel) return null;
                            return (
                                <div className="mt-3 flex items-center gap-4 px-3 py-2 bg-[var(--ch-brand-900)] border border-white/5 font-mono text-[10px]">
                                    <span className="text-brand-600 uppercase tracking-widest">Status:</span>
                                    <span className={`font-bold uppercase tracking-widest ${statusColor[sel.status] ?? "text-brand-300"}`}>{sel.status}</span>
                                    {currentGate && (
                                        <>
                                            <span className="text-brand-700">·</span>
                                            <span className="text-brand-600 uppercase tracking-widest">Gate:</span>
                                            <span className="text-white font-bold">{currentGate}</span>
                                        </>
                                    )}
                                    <span className="text-brand-700 ml-auto">{sel.departure_time}</span>
                                </div>
                            );
                        })()}

                        {/* Row 3: Date / Departure Time */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="space-y-1.5">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">Date</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                    className="w-full bg-[var(--ch-brand-900)] border border-[var(--border-ui)] text-white px-3 py-2 font-mono text-xs focus:outline-none focus:border-accent-neon transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">Departure Time</label>
                                <input
                                    type="time"
                                    value={form.time}
                                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                                    className="w-full bg-[var(--ch-brand-900)] border border-[var(--border-ui)] text-white px-3 py-2 font-mono text-xs focus:outline-none focus:border-accent-neon transition-colors"
                                />
                            </div>
                        </div>

                        {/* Row 4: Aircraft Type (auto-filled) + Distance */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="space-y-1.5">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">Aircraft Type</label>
                                <div className="w-full bg-[var(--ch-brand-900)] border border-[var(--border-ui)] text-brand-300 px-3 py-2 font-mono text-xs uppercase select-none truncate">
                                    {form.aircraftType}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">Distance — {form.distance} mi</label>
                                <input
                                    type="range" min="100" max="5000" step="50"
                                    value={form.distance}
                                    onChange={e => setForm(f => ({ ...f, distance: +e.target.value }))}
                                    className="w-full h-1 bg-brand-800 appearance-none accent-white cursor-pointer mt-3"
                                />
                            </div>
                        </div>
                    </div>

                    {/* OVERRIDE PARAMETERS */}
                    <div className="border-t border-white/5 pt-5 space-y-4">
                        <p className="font-mono text-[10px] uppercase text-brand-500 tracking-widest">Override Parameters</p>

                        {/* Weather Severity */}
                        <div className="space-y-2">
                            <div className="flex justify-between font-mono text-xs uppercase tracking-widest text-brand-400">
                                <span>Weather Severity</span>
                                <span className={`font-bold ${overrides.weather_severity >= 7 ? "text-accent-alert" : overrides.weather_severity >= 4 ? "text-yellow-400" : "text-accent-neon"}`}>
                                    {SEVERITY_LABELS[overrides.weather_severity]} ({overrides.weather_severity}/10)
                                </span>
                            </div>
                            <input type="range" min="0" max="10"
                                value={overrides.weather_severity}
                                onChange={e => setOverrides(o => ({ ...o, weather_severity: +e.target.value }))}
                                className="w-full h-1 bg-brand-800 appearance-none accent-white cursor-pointer"
                            />
                            <div className="flex justify-between font-mono text-[9px] text-brand-600"><span>Clear</span><span>Extreme</span></div>
                        </div>

                        {/* Incoming Delay */}
                        <div className="space-y-2">
                            <div className="flex justify-between font-mono text-xs uppercase tracking-widest text-brand-400">
                                <span>Incoming Flight Delay</span>
                                <span className={`font-bold ${overrides.incoming_flight_delay_min === 0 ? "text-accent-neon" : overrides.incoming_flight_delay_min > 60 ? "text-accent-alert" : "text-yellow-400"}`}>
                                    {overrides.incoming_flight_delay_min === 0 ? "ON TIME" : `+${overrides.incoming_flight_delay_min} MIN`}
                                </span>
                            </div>
                            <input type="range" min="0" max="180" step="5"
                                value={overrides.incoming_flight_delay_min}
                                onChange={e => setOverrides(o => ({ ...o, incoming_flight_delay_min: +e.target.value }))}
                                className="w-full h-1 bg-brand-800 appearance-none accent-white cursor-pointer"
                            />
                            <div className="flex justify-between font-mono text-[9px] text-brand-600"><span>On Time</span><span>+180 min</span></div>
                        </div>

                        {/* Visibility */}
                        <div className="space-y-2">
                            <div className="flex justify-between font-mono text-xs uppercase tracking-widest text-brand-400">
                                <span><Eye className="w-3 h-3 inline mr-1 mb-0.5" />Visibility</span>
                                <span className={`font-bold ${overrides.visibility_miles < 3 ? "text-accent-alert" : overrides.visibility_miles < 6 ? "text-yellow-400" : "text-accent-neon"}`}>
                                    {overrides.visibility_miles} mi
                                </span>
                            </div>
                            <input type="range" min="0" max="10" step="0.5"
                                value={overrides.visibility_miles}
                                onChange={e => setOverrides(o => ({ ...o, visibility_miles: +e.target.value }))}
                                className="w-full h-1 bg-brand-800 appearance-none accent-white cursor-pointer"
                            />
                            <div className="flex justify-between font-mono text-[9px] text-brand-600"><span>0 mi</span><span>10 mi</span></div>
                        </div>

                        {/* Passenger Load */}
                        <div className="space-y-2">
                            <div className="flex justify-between font-mono text-xs uppercase tracking-widest text-brand-400">
                                <span>Passenger Load</span>
                                <span className={`font-bold ${overrides.passenger_load_pct >= 95 ? "text-accent-alert" : overrides.passenger_load_pct >= 85 ? "text-yellow-400" : "text-accent-neon"}`}>
                                    {overrides.passenger_load_pct}%
                                </span>
                            </div>
                            <input type="range" min="50" max="100"
                                value={overrides.passenger_load_pct}
                                onChange={e => setOverrides(o => ({ ...o, passenger_load_pct: +e.target.value }))}
                                className="w-full h-1 bg-brand-800 appearance-none accent-white cursor-pointer"
                            />
                            <div className="flex justify-between font-mono text-[9px] text-brand-600"><span>50%</span><span>100%</span></div>
                        </div>

                        {/* Weather Type + Gate Status */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">Weather Type</label>
                                <div className="relative">
                                    <select value={overrides.weather_type} onChange={e => setOverrides(o => ({ ...o, weather_type: e.target.value }))} className={selectCls}>
                                        {["Clear","Rain","Snow","Thunderstorm","Fog","Ice"].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-600 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">Gate Status</label>
                                <div className="flex h-[34px]">
                                    {(["OPEN","CLOSED"] as const).map(v => (
                                        <button key={v} onClick={() => setOverrides(o => ({ ...o, gate_status: v }))}
                                            className={`flex-1 font-mono text-[9px] uppercase tracking-widest border transition-colors ${overrides.gate_status === v ? (v === "OPEN" ? "bg-accent-neon/10 border-accent-neon text-accent-neon" : "bg-accent-alert/10 border-accent-alert text-accent-alert") : "bg-[var(--ch-brand-900)] border-[var(--border-ui)] text-brand-600 hover:text-brand-300"}`}>
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Crew Availability */}
                        <div className="space-y-1.5">
                            <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">
                                <Users className="w-3 h-3 inline mr-1 mb-0.5" />Crew Availability
                            </label>
                            <div className="flex h-[34px]">
                                {(["AVAILABLE","SHORT"] as const).map(v => (
                                    <button key={v} onClick={() => setOverrides(o => ({ ...o, crew_availability: v }))}
                                        className={`flex-1 font-mono text-[9px] uppercase tracking-widest border transition-colors ${overrides.crew_availability === v ? (v === "AVAILABLE" ? "bg-accent-neon/10 border-accent-neon text-accent-neon" : "bg-accent-alert/10 border-accent-alert text-accent-alert") : "bg-[var(--ch-brand-900)] border-[var(--border-ui)] text-brand-600 hover:text-brand-300"}`}>
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Airport Traffic */}
                        <div className="grid grid-cols-2 gap-3">
                            {([
                                { label: "Traffic — Origin", key: "origin_traffic" },
                                { label: "Traffic — Dest",   key: "dest_traffic" },
                            ] as const).map(({ label, key }) => (
                                <div key={key} className="space-y-1.5">
                                    <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest block">{label}</label>
                                    <div className="flex h-[34px]">
                                        {(["LOW","MED","HIGH"] as const).map(v => {
                                            const actual = v === "MED" ? "MEDIUM" : v;
                                            const active = (overrides as any)[key] === actual;
                                            return (
                                                <button key={v} onClick={() => setOverrides(o => ({ ...o, [key]: actual }))}
                                                    className={`flex-1 font-mono text-[9px] uppercase tracking-widest border transition-colors ${active ? (actual === "HIGH" ? "bg-accent-alert/10 border-accent-alert text-accent-alert" : actual === "MEDIUM" ? "bg-yellow-400/10 border-yellow-400 text-yellow-400" : "bg-accent-neon/10 border-accent-neon text-accent-neon") : "bg-[var(--ch-brand-900)] border-[var(--border-ui)] text-brand-600 hover:text-brand-300"}`}>
                                                    {v}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="border-t border-white/5 pt-4 space-y-3">
                        <p className="font-mono text-[10px] uppercase text-brand-500 tracking-widest">Quick Presets</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: "WINTER STORM", icon: CloudSnow, params: { weather_type: "Snow", weather_severity: 8, visibility_miles: 2, incoming_flight_delay_min: 30 } as Partial<Overrides> },
                                { label: "GATE CRUNCH",  icon: AlertTriangle, params: { gate_status: "CLOSED" as const, origin_traffic: "HIGH" as const, passenger_load_pct: 98 } as Partial<Overrides> },
                                { label: "LATE INBOUND", icon: Plane, params: { incoming_flight_delay_min: 60, crew_availability: "SHORT" as const, passenger_load_pct: 92 } as Partial<Overrides> },
                            ].map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => applyPreset(p.params, p.label)}
                                    className="group flex flex-col items-center gap-1.5 border border-[var(--border-ui)] bg-[var(--ch-brand-900)] px-2 py-3 hover:border-accent-neon/50 hover:bg-accent-neon/5 transition-all"
                                >
                                    <p.icon className="w-3.5 h-3.5 text-brand-500 group-hover:text-accent-neon transition-colors" />
                                    <span className="font-mono text-[8px] uppercase tracking-widest text-brand-500 group-hover:text-accent-neon transition-colors text-center leading-tight">{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Run / Reset */}
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={() => handleRun()}
                            className="flex-1 bg-yellow-400 text-black font-black font-mono tracking-widest uppercase py-4 hover:bg-yellow-300 active:bg-yellow-500 transition-colors flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <Spinner />
                                    ANALYZING...
                                </>
                            ) : "RUN SIMULATION"}
                        </button>
                        <button onClick={handleReset} className="border border-[var(--border-ui)] text-brand-400 p-4 hover:text-white transition-colors">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>

                    {error && (
                        <p className="font-mono text-xs text-accent-alert border border-accent-alert/30 bg-accent-alert/10 px-4 py-3 uppercase tracking-widest">{error}</p>
                    )}
                </div>

                {/* ── Right Panel ────────────────────────────────────────── */}
                <div className="bg-[var(--ch-brand-900)] border border-[var(--border-ui)] p-8 flex flex-col relative overflow-hidden min-h-[600px]">
                    <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

                    {/* Loading state */}
                    <AnimatePresence>
                        {loading && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-[var(--ch-brand-900)]/95"
                            >
                                <div className="space-y-3 text-center">
                                    <p className="font-mono text-sm text-yellow-400 uppercase tracking-[0.4em] animate-pulse">
                                        RUNNING SIMULATION MATRIX...
                                    </p>
                                    <div className="w-56 h-0.5 mx-auto bg-brand-800 relative overflow-hidden">
                                        <motion.div
                                            className="absolute inset-y-0 left-0 h-full w-1/3 bg-yellow-400"
                                            style={{ boxShadow: "0 0 12px rgba(250,204,21,0.6)" }}
                                            animate={{ x: ["-100%", "400%"] }}
                                            transition={{ repeat: Infinity, duration: 1.0, ease: "linear" }}
                                        />
                                    </div>
                                    <p className="font-mono text-[10px] text-brand-600 uppercase tracking-widest">
                                        Analyzing {form.origin} → {form.destination || "destination"} · XGBoost inference
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Empty state */}
                    {!result && !loading && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 relative z-10">
                            <div className="w-12 h-12 border border-[var(--border-ui)] flex items-center justify-center">
                                <Activity className="w-5 h-5 text-brand-700" />
                            </div>
                            <p className="font-mono text-[11px] uppercase text-brand-600 tracking-[0.2em] leading-relaxed text-center max-w-[220px]">
                                Select a flight and configure overrides, then run the simulation.
                            </p>
                        </div>
                    )}

                    {/* Results */}
                    {result && !loading && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="relative z-10 flex flex-col gap-6 w-full"
                        >
                            {/* Panel header */}
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="font-mono text-[9px] text-brand-500 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-accent-neon" />
                                    {form.flightNumber || "DEMO"} · {form.origin} → {form.destination}
                                </span>
                                <div className="flex items-center gap-2">
                                    {offline && (
                                        <span className="font-mono text-[8px] text-yellow-400 uppercase tracking-widest border border-yellow-400/20 px-1.5 py-0.5">OFFLINE</span>
                                    )}
                                    <span className="font-mono text-[8px] text-brand-600 uppercase tracking-widest bg-brand-800 px-2 py-1">
                                        {result.engine.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* 1 — Predicted Delay */}
                            <div className="flex items-end gap-4 pb-5 border-b border-white/5">
                                <div>
                                    <p className="font-mono text-[9px] text-brand-600 uppercase tracking-widest mb-1">Predicted Delay</p>
                                    <motion.div
                                        className="flex items-baseline gap-2"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 280, damping: 22 }}
                                    >
                                        <span className="text-8xl font-black font-heading text-yellow-400 leading-none tabular-nums"
                                              style={{ textShadow: "0 0 40px rgba(250,204,21,0.3)" }}>
                                            {result.predicted_delay_minutes}
                                        </span>
                                        <span className="text-2xl font-black font-heading text-yellow-400/70 uppercase tracking-tight mb-2">MIN</span>
                                    </motion.div>
                                    <p className="font-mono text-[9px] text-brand-500 uppercase tracking-widest mt-1">
                                        DELAY CATEGORY: <span className="text-white">{result.delay_category}</span>
                                    </p>
                                </div>

                                {/* Cascade Risk — beside the number */}
                                <div className="ml-auto flex flex-col items-end gap-2">
                                    <p className="font-mono text-[9px] text-brand-600 uppercase tracking-widest">Cascade Risk</p>
                                    <div className={`flex items-center gap-2 px-4 py-2.5 border font-mono text-xs uppercase tracking-widest font-black ${cascadeColor}`}>
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        {cascadeRisk}
                                    </div>
                                    <p className="font-mono text-[8px] text-brand-700 uppercase tracking-widest">
                                        MODEL CONFIDENCE: {result.confidence_score}%
                                    </p>
                                </div>
                            </div>

                            {/* 2 — On-Time Probability bar */}
                            <OnTimeBar value={result.on_time_probability} />

                            {/* 3 — Delay Cause Breakdown */}
                            <div className="space-y-3">
                                <p className="font-mono text-[9px] text-brand-600 uppercase tracking-[0.25em]">Delay Cause Breakdown</p>
                                {Object.entries(result.shap_breakdown)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([key, pct], i) => (
                                        <CauseBar
                                            key={key}
                                            label={CAUSE_LABELS[key] ?? key}
                                            pct={pct}
                                            delay={i * 0.07}
                                        />
                                    ))}
                            </div>

                            {/* 4 — Recommendation */}
                            <div className="border-l-2 border-accent-neon/40 pl-4 py-1">
                                <p className="font-mono text-[9px] text-accent-neon/50 uppercase tracking-widest mb-1.5">Recommendation</p>
                                <p className="font-mono text-xs text-accent-neon leading-relaxed">{result.recommendation}</p>
                            </div>

                            {/* 5 — Run New Scenario */}
                            <button
                                onClick={handleNewScenario}
                                className="w-full flex items-center justify-center gap-2 border border-[var(--border-ui)] text-brand-400 font-mono text-[10px] uppercase tracking-widest py-3 hover:border-accent-neon/40 hover:text-accent-neon hover:bg-accent-neon/5 transition-all"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Run New Scenario
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* AI Copilot */}
            <div className="w-full bg-[var(--bg-card)] border border-[var(--border-ui)] shadow-2xl relative overflow-hidden flex flex-col h-[380px]">
                <div className="bg-[var(--ch-brand-900)] border-b border-brand-800 px-4 py-3 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-accent-neon" />
                        <span className="font-mono text-xs uppercase tracking-widest text-white">AI Copilot Analysis</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-700" />
                        <div className="w-2 h-2 rounded-full bg-brand-700" />
                        <div className="w-2 h-2 rounded-full bg-accent-neon" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-4">
                    <AnimatePresence>
                        {messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className={`leading-relaxed ${msg.role === "sys" ? "text-brand-400" : "text-accent-neon"}`}>
                                <span className="mr-4 select-none opacity-50">{msg.role === "sys" ? "[SYS] " : `{${handle}@skylytics:~$}`}</span>
                                <span className={msg.role === "sys" && msg.content.includes("[") ? "text-white font-bold" : ""}>{msg.content}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={endRef} />
                </div>
                <div className="border-t border-brand-800 bg-[var(--ch-brand-900)] p-4 shrink-0 flex items-center z-10">
                    <span className="text-accent-neon font-mono text-sm mr-4 select-none hidden md:inline">{handle}@skylytics:~$</span>
                    <form onSubmit={handleCopilotSubmit} className="flex-1 flex items-center">
                        <input type="text" value={input} onChange={e => setInput(e.target.value)}
                            placeholder="Query simulator results or ask strategic decisions..."
                            className="w-full bg-transparent outline-none text-white font-mono text-sm placeholder:text-brand-600"
                        />
                        <button type="submit" className="text-brand-500 hover:text-white transition-colors ml-4">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─── Client-side demo flight generator ───────────────────────────────────────

function generateDemoFlights(airline: string, airport: string): any[] {
    const destinations: Record<string, Array<[string, string, number]>> = {
        DL: [["JFK","Boeing 737",865],["LAX","Boeing 757",2475],["LHR","Boeing 767",4662],["BOS","Boeing 737",1103],["SFO","Boeing 737",2139]],
        AA: [["ORD","Boeing 737",716],["LAX","Airbus A321",2475],["MIA","Boeing 737",662],["DFW","Airbus A321",732],["PHX","Boeing 737",1587]],
        UA: [["EWR","Boeing 737",746],["LAX","Boeing 757",2126],["ORD","Boeing 737",716],["IAH","Airbus A320",710],["DEN","Boeing 737",1199]],
        WN: [["HOU","Boeing 737",696],["MDW","Boeing 737",716],["BWI","Boeing 737",946],["LAS","Boeing 737",1747],["DAL","Boeing 737",731]],
        NK: [["FLL","Airbus A320",665],["MCO","Airbus A320",404],["LAS","Airbus A320",1747],["DFW","Airbus A320",732],["DEN","Airbus A320",1199]],
    };
    const routes = destinations[airline] ?? [["JFK","Boeing 737",865],["LAX","Boeing 737",2475]];
    const statuses = ["BOARDING","BOARDING","ON TIME","ON TIME","DELAYED","TAXIING"];
    return routes.map(([dest, aircraft, dist], idx) => {
        const fn = `${airline}${100 + idx * 37 + airport.charCodeAt(0)}`;
        const h  = parseInt(Array.from(fn).reduce((acc, c) => acc + c.charCodeAt(0).toString(16), ""), 16) || 0;
        const hr = 6 + (h % 14);
        const mn = (h >> 4) % 4 * 15;
        return {
            flight_number:      fn,
            airline,
            origin:             airport,
            destination:        dest,
            departure_time:     `${hr.toString().padStart(2,"0")}:${mn.toString().padStart(2,"0")}`,
            distance_miles:     dist,
            aircraft_type:      aircraft,
            status:             statuses[h % statuses.length],
            passenger_load_pct: 70 + (h % 31),
            gate:               `${String.fromCharCode(65 + (h % 5))}${1 + (h % 30)}`,
        };
    });
}
