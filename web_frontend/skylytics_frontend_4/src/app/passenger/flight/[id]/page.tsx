"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plane, AlertTriangle, ChevronLeft, CalendarClock, Activity, ThumbsUp, ThumbsDown, MessageSquare, Send, Zap, MapPin, Shield } from "lucide-react";
import {
    motion,
    AnimatePresence,
} from "framer-motion";
import { getFlightInfo, saveFlightToWatchlist, getSavedFlights, removeSavedFlight, submitPredictionFeedback } from "@/lib/api";

interface FlightData {
    callsign: string;
    origin: string;
    destination: string;
    status: string;
    original_departure: string;
    updated_departure: string;
    delay_minutes: number;
    factors: { description: string; impact: string }[];
    altitude_ft: number;
    speed_kts: number;
    progress: number;
    system_stats?: {
        active_tracks: number;
        monitored_nodes: number;
        neural_health: string;
        last_training: string;
    };
}

const IMPACT_PCT: Record<string, number> = {
    high: 82, severe: 95, critical: 95,
    medium: 54, moderate: 54,
    low: 28, minimal: 18,
};

function impactPct(impact: string) {
    return IMPACT_PCT[impact.toLowerCase()] ?? 50;
}

function impactColor(impact: string) {
    const s = impact.toLowerCase();
    if (["high","severe","critical"].includes(s)) return { bar: "#f87171", text: "text-accent-alert" };
    if (["medium","moderate"].includes(s))        return { bar: "#fbbf24", text: "text-yellow-400"  };
    return { bar: "#DFFF00", text: "text-accent-neon" };
}

// ── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 18, startDelay = 400) {
    const [displayed, setDisplayed] = useState("");
    useEffect(() => {
        setDisplayed("");
        const t = setTimeout(() => {
            let i = 0;
            const tick = setInterval(() => {
                i++;
                setDisplayed(text.slice(0, i));
                if (i >= text.length) clearInterval(tick);
            }, speed);
            return () => clearInterval(tick);
        }, startDelay);
        return () => clearTimeout(t);
    }, [text, speed, startDelay]);
    return displayed;
}

// ── Counter hook ─────────────────────────────────────────────────────────────
function useCounter(target: number, duration = 1600, delay = 700) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!target) return;
        const t = setTimeout(() => {
            const steps = 50;
            const step = target / steps;
            const interval = duration / steps;
            let current = 0;
            const id = setInterval(() => {
                current += step;
                if (current >= target) { setVal(target); clearInterval(id); }
                else setVal(Math.round(current));
            }, interval);
            return () => clearInterval(id);
        }, delay);
        return () => clearTimeout(t);
    }, [target, duration, delay]);
    return val;
}


// ── Scan line ─────────────────────────────────────────────────────────────────
function ScanLine({ trigger }: { trigger: boolean }) {
    return (
        <AnimatePresence>
            {trigger && (
                <motion.div
                    className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-neon to-transparent pointer-events-none z-10"
                    style={{ boxShadow: "0 0 12px 2px rgba(223,255,0,0.5)" }}
                    initial={{ top: 0, opacity: 1 }}
                    animate={{ top: "100%", opacity: [1, 1, 0] }}
                    exit={{}}
                    transition={{ duration: 1.4, ease: "linear", times: [0, 0.8, 1] }}
                />
            )}
        </AnimatePresence>
    );
}

// ── Flight Arc ────────────────────────────────────────────────────────────────
function FlightArc({ origin, destination, progress }: { origin: string; destination: string, progress: number }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const arcD = "M 44 108 Q 250 16 456 108";

    return (
        <div className="bg-[var(--bg-card)]/50 border border-white/5 px-6 py-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
            <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-brand-700 mb-3 flex items-center gap-2">
                <motion.span className="w-1 h-1 rounded-full bg-accent-neon" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                Live Route Vector
            </div>
            <svg viewBox="0 0 500 130" className="w-full" style={{ height: 116 }}>
                <defs>
                    <path id="skyArcPath" d={arcD} />
                </defs>

                {/* Background dashed track */}
                <path d={arcD} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="5 5" />

                {/* Neon completed trail */}
                {mounted && (
                    <motion.path
                        d={arcD}
                        fill="none"
                        stroke="#DFFF00"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: progress }}
                        transition={{ duration: 2, ease: [0.4, 0, 0.2, 1], delay: 0.5 }}
                        style={{ filter: "drop-shadow(0 0 5px rgba(223,255,0,0.65))", opacity: 0.75 }}
                    />
                )}

                {/* Remaining dim dashed */}
                {mounted && (
                    <motion.path
                        d={arcD}
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                        strokeDasharray="3 5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                    />
                )}

                {/* Origin pulse rings */}
                <circle cx="44" cy="108" r="3.5" fill="#DFFF00" opacity={0.9} />
                {mounted && (<>
                    <motion.circle cx="44" cy="108" fill="none" stroke="#DFFF00" strokeWidth="1" initial={{ r: 3.5, opacity: 0.7 }} animate={{ r: 14, opacity: 0 }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />
                    <motion.circle cx="44" cy="108" fill="none" stroke="#DFFF00" strokeWidth="0.7" initial={{ r: 3.5, opacity: 0.3 }} animate={{ r: 22, opacity: 0 }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.7 }} />
                </>)}

                {/* Destination dot */}
                <circle cx="456" cy="108" r="3" fill="rgba(255,255,255,0.2)" />
                {mounted && (
                    <motion.circle cx="456" cy="108" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" initial={{ r: 3, opacity: 0.4 }} animate={{ r: 11, opacity: 0 }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 1.1 }} />
                )}

                {/* Plane following arc */}
                <g>
                    <animateMotion dur="2.2s" begin="0.5s" fill="freeze" rotate="auto"
                        calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1" keyPoints={`0;${progress}`}>
                        <mpath href="#skyArcPath" />
                    </animateMotion>
                    <text fontSize="13" fill="#DFFF00" textAnchor="middle" dominantBaseline="middle"
                        style={{ filter: "drop-shadow(0 0 6px rgba(223,255,0,0.9))" }}>✈</text>
                </g>

                {/* Airport codes */}
                <text x="44" y="126" textAnchor="middle" fill="#4a5568" fontSize="8" fontFamily="monospace" letterSpacing="1.5">{origin}</text>
                <text x="456" y="126" textAnchor="middle" fill="#4a5568" fontSize="8" fontFamily="monospace" letterSpacing="1.5">{destination}</text>

                {/* Altitude label at peak */}
                <text x="250" y="11" textAnchor="middle" fill="#2d3748" fontSize="7" fontFamily="monospace" letterSpacing="1">FL350</text>
                <line x1="250" y1="14" x2="250" y2="24" stroke="#2d3748" strokeWidth="0.5" strokeDasharray="2 2" />
            </svg>
        </div>
    );
}

// ── Live Telemetry Strip ──────────────────────────────────────────────────────
function TelemetryStrip({ data }: { data: FlightData }) {
    const altitude = useCounter(data.altitude_ft, 1800, 800);
    const speed    = useCounter(data.speed_kts,   1500, 1000);
    const progress = useCounter(Math.round(data.progress * 100), 1200, 600);

    return (
        <motion.div
            className="grid grid-cols-3 border border-white/5 bg-[var(--bg-card)]/40"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
        >
            {[
                { label: "Altitude", value: altitude.toLocaleString(), unit: "FT",  color: "text-accent-neon" },
                { label: "Speed",    value: speed.toString(),           unit: "KTS", color: "text-white"       },
                { label: "Progress", value: progress.toString(),        unit: "%",   color: "text-brand-300"   },
            ].map((item, i) => (
                <div key={i} className={`p-4 text-center ${i < 2 ? "border-r border-white/5" : ""}`}>
                    <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-600 mb-1">{item.label}</div>
                    <div className={`font-heading font-black text-xl ${item.color}`}>
                        {item.value}
                        <span className="font-mono text-[8px] text-brand-600 ml-1">{item.unit}</span>
                    </div>
                </div>
            ))}
        </motion.div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FlightDetailPage() {
    const params   = useParams();
    const router   = useRouter();
    const flightId = (typeof params.id === "string" ? params.id : "").toUpperCase();

    const [flight,  setFlight]  = useState<FlightData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);
    const [saved,   setSaved]   = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);
    const [scanned, setScanned] = useState(false);
    const [submittingFB, setSubmittingFB] = useState(false);
    const [fbSubmitted, setFBSubmitted] = useState(false);
    const [fbError, setFBError] = useState<string | null>(null);
    const [fbRating, setFBRating] = useState<string | null>(null);
    const [fbComment, setFBComment] = useState("");

    useEffect(() => {
        getSavedFlights().then((list) => {
            const match = list.find((f: any) => f.callsign === flightId);
            if (match) { setSaved(true); setSavedId(match.id); }
        });
    }, [flightId]);

    useEffect(() => {
        async function load() {
            try {
                const data = await getFlightInfo(flightId);
                setFlight(data);
                // Trigger scan after data loads
                setTimeout(() => setScanned(true), 300);
                setTimeout(() => setScanned(false), 2000);
            } catch (err: any) {
                setError(err.message || "Flight not found.");
            } finally {
                setLoading(false);
            }
        }
        if (flightId) load();
    }, [flightId]);

    const INTRO = "Skylytics predictive models have established a high probability of delay for this route. Based on historic and live metrics, the following factors are contributing to this estimate:";
    const typed = useTypewriter(flight ? INTRO : "", 14, 600);

    return (
        <motion.div 
            className="min-h-screen bg-[var(--ch-brand-900)] p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >

            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-brand-500 hover:text-white font-mono text-xs uppercase tracking-widest transition-colors mb-12"
            >
                <ChevronLeft className="w-4 h-4" /> Back to Search
            </button>

            {loading && (
                <div className="max-w-3xl mx-auto flex items-center justify-center h-64">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 border-2 border-accent-neon/20 border-t-accent-neon rounded-full"
                    />
                </div>
            )}

            {error && (
                <div className="max-w-3xl mx-auto border border-accent-alert/30 bg-accent-alert/10 p-8 text-center">
                    <p className="font-mono text-sm text-accent-alert uppercase tracking-widest">{error}</p>
                </div>
            )}

            {!loading && !error && flight && (
                <motion.div
                    className="max-w-3xl mx-auto space-y-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* ── Header ── */}
                    <motion.div
                        className="flex justify-between items-end border-b border-[var(--border-ui)] pb-6"
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div>
                            <h1 className="text-5xl font-heading font-black text-white uppercase tracking-tight">
                                {flight.callsign}
                            </h1>
                            <div className="flex items-center gap-4 mt-2 font-mono text-xs uppercase tracking-widest text-brand-500">
                                <span>{flight.origin} <Plane className="inline w-3 h-3 mx-1" /> {flight.destination}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <div className="text-right">
                                <span className="block font-mono text-[10px] text-brand-500 uppercase tracking-widest mb-1">Status</span>
                                <span className={`font-heading font-black text-xl uppercase ${flight.status === "delayed" ? "text-accent-alert" : flight.status === "at_risk" ? "text-accent-neon" : "text-white"}`}>
                                    {flight.status.replace("_", " ")}
                                </span>
                            </div>
                            <button
                                onClick={async () => {
                                    if (saved && savedId) {
                                        await removeSavedFlight(savedId);
                                        setSaved(false); setSavedId(null);
                                    } else if (!saved && flight) {
                                        const res = await saveFlightToWatchlist(flightId, `${flight.origin}-${flight.destination}`);
                                        setSaved(true); setSavedId(res?.id ?? null);
                                    }
                                }}
                                className={`font-mono text-[10px] uppercase tracking-widest border px-3 py-1.5 transition-colors ${saved ? "border-accent-neon text-accent-neon hover:border-accent-alert hover:text-accent-alert" : "border-white/20 text-brand-400 hover:border-accent-neon hover:text-accent-neon"}`}
                            >
                                {saved ? "Saved — Click to Remove" : "+ Save to Watchlist"}
                            </button>
                        </div>
                    </motion.div>

                    {/* ── Flight Arc + Telemetry ── */}
                    <motion.div
                        className="space-y-0"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <FlightArc origin={flight.origin} destination={flight.destination} progress={flight.progress} />
                        <TelemetryStrip data={flight} />
                    </motion.div>

                    {/* ── Global Airspace Intel ── */}
                    {flight.system_stats && (
                        <motion.div 
                            className="grid grid-cols-2 md:grid-cols-4 gap-1 border border-white/5 bg-[var(--bg-card)]/20 px-1 py-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            {[
                                { label: "Active Tracks", value: flight.system_stats.active_tracks, icon: Activity },
                                { label: "Neural Health", value: flight.system_stats.neural_health, icon: Zap },
                                { label: "Monitored Nodes", value: flight.system_stats.monitored_nodes, icon: MapPin },
                                { label: "Sync Status", value: "Locked", icon: Shield },
                            ].map((stat, i) => (
                                <div key={i} className="bg-[var(--ch-brand-900)]/40 p-4 border border-white/5 flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-1">
                                        <stat.icon className="w-3 h-3 text-brand-600" />
                                        <span className="font-mono text-[8px] uppercase tracking-widest text-brand-500">{stat.label}</span>
                                    </div>
                                    <span className={`font-mono text-sm font-bold ${stat.label === 'Neural Health' ? 'text-accent-neon' : 'text-white'}`}>{stat.value}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* ── Departure tiles ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div
                            className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-8 text-center group hover:border-white/30 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <p className="font-mono text-[10px] text-brand-500 uppercase tracking-widest mb-6">Original Departure</p>
                            <div className={`text-4xl font-heading font-black text-white ${flight.delay_minutes > 0 ? "line-through opacity-40" : ""}`}>
                                {flight.original_departure}
                            </div>
                        </motion.div>

                        <motion.div
                            className={`bg-[var(--bg-card)] p-8 text-center relative overflow-hidden ${flight.delay_minutes > 0 ? "border border-accent-alert" : "border border-[var(--border-ui)]"}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {flight.delay_minutes > 0 && (
                                <motion.div
                                    className="absolute inset-x-0 bottom-0 h-1 bg-accent-alert"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                                    style={{ transformOrigin: "left" }}
                                />
                            )}
                            <p className="font-mono text-[10px] text-brand-500 uppercase tracking-widest mb-6 flex justify-center items-center gap-2">
                                {flight.delay_minutes > 0 && <AlertTriangle className="w-3 h-3 text-accent-alert" />}
                                Updated Departure
                            </p>
                            <motion.div
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                className={`text-5xl font-heading font-black ${flight.delay_minutes > 0 ? "text-accent-alert" : "text-white"}`}
                            >
                                {flight.updated_departure}
                            </motion.div>
                            {flight.delay_minutes > 0 && (
                                <motion.p
                                    className="text-brand-300 font-mono text-xs mt-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    +{flight.delay_minutes} Minutes
                                </motion.p>
                            )}
                        </motion.div>
                    </div>

                    {/* ── AI Delay Forecast ── */}
                    <motion.div
                        className="bg-[var(--ch-brand-900)] border border-[var(--border-ui)] p-8 relative overflow-hidden group"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Continuous Ambient Background Orb */}
                        <motion.div
                            className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
                            style={{
                                background: "radial-gradient(circle, rgba(223,255,0,0.03) 0%, transparent 70%)"
                            }}
                            animate={{
                                x: ["-50%", "100%", "50%", "-50%"],
                                y: ["-50%", "-20%", "50%", "-50%"],
                                scale: [1, 1.2, 0.8, 1]
                            }}
                            transition={{
                                duration: 15,
                                ease: "linear",
                                repeat: Infinity
                            }}
                        />

                        {/* Scan line on load */}
                        <ScanLine trigger={scanned} />

                        {/* Corner accent */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-accent-neon/60 group-hover:border-accent-neon transition-colors" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-accent-neon/20 group-hover:border-accent-neon/60 transition-colors" />

                        <h3 className="font-heading font-black text-xl text-white uppercase mb-6 flex items-center gap-3">
                            <motion.div
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <CalendarClock className="w-5 h-5 text-accent-neon" />
                            </motion.div>
                            AI Delay Forecast
                        </h3>

                        {/* Typewriter intro */}
                        <p className="font-mono text-sm text-brand-400 leading-relaxed mb-8 min-h-[3.5rem]">
                            {typed}
                            <motion.span
                                className="inline-block w-0.5 h-3.5 bg-accent-neon ml-0.5 align-middle"
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
                            />
                        </p>

                        {/* Factor bars */}
                        <div className="space-y-5">
                            {flight.factors.map((factor, i) => {
                                const pct   = impactPct(factor.impact);
                                const color = impactColor(factor.impact);
                                const isPrimary = i === 0; // The backend usually sorts by importance
                                
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.7 + i * 0.12, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                                        className="group"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-xs text-brand-300 uppercase tracking-wider">
                                                    {factor.description}
                                                </span>
                                                {isPrimary && (
                                                    <span className="bg-accent-neon/10 border border-accent-neon/30 text-accent-neon text-[7px] px-1.5 py-0.5 font-mono uppercase tracking-[0.2em] animate-pulse">
                                                        Primary Driver
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${color.text}`}>
                                                {factor.impact} Impact
                                            </span>
                                        </div>
                                        {/* Animated bar */}
                                        <div className="h-1 bg-brand-800 w-full relative overflow-hidden">
                                            <motion.div
                                                className="h-full absolute left-0 top-0"
                                                style={{ backgroundColor: color.bar, boxShadow: `0 0 8px ${color.bar}60` }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ delay: 0.9 + i * 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                            />
                                            {/* Shimmer sweep */}
                                            <motion.div
                                                className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                                initial={{ left: "-10%" }}
                                                animate={{ left: "110%" }}
                                                transition={{ delay: 1.7 + i * 0.12, duration: 0.6, ease: "easeOut" }}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Bottom status strip */}
                        <motion.div
                            className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.4 }}
                        >
                            <span className="font-mono text-[10px] uppercase tracking-widest text-brand-600">
                                Model: XGBoost v1.0
                            </span>
                            <div className="flex items-center gap-2">
                                <motion.span
                                    className="w-1.5 h-1.5 rounded-full bg-accent-neon"
                                    animate={{ opacity: [1, 0.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <span className="font-mono text-[10px] uppercase tracking-widest text-accent-neon">
                                    Live Inference Active
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* ── Prediction Feedback ── */}
                    <motion.div
                        className="bg-[var(--bg-card)] border border-white/5 p-8"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.6, duration: 0.6 }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-sm bg-accent-neon/10 flex items-center justify-center">
                                <MessageSquare className="w-4 h-4 text-accent-neon" />
                            </div>
                            <h3 className="font-heading font-black text-xl text-white uppercase tracking-tight">
                                Prediction Accuracy Report
                            </h3>
                        </div>

                        {!fbSubmitted ? (
                            <div className="space-y-8">
                                <p className="font-mono text-[10px] text-brand-500 uppercase tracking-[0.2em] leading-relaxed">
                                    Was this Skylytics forecast accurate? Your feedback helps refine our AI nodes for future operations.
                                </p>

                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: "ACCURATE", label: "Accurate", icon: ThumbsUp, color: "hover:border-accent-neon hover:text-accent-neon" },
                                        { id: "TOO_HIGH", label: "Too High", icon: AlertTriangle, color: "hover:border-yellow-500 hover:text-yellow-500" },
                                        { id: "TOO_LOW",  label: "Too Low",  icon: ThumbsDown, color: "hover:border-accent-alert hover:text-accent-alert" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setFBRating(opt.id)}
                                            className={`flex flex-col items-center gap-3 p-4 border font-mono text-[10px] uppercase tracking-widest transition-all ${fbRating === opt.id ? "border-accent-neon bg-accent-neon/10 text-accent-neon" : "border-[var(--border-ui)] text-brand-400 " + opt.color}`}
                                        >
                                            <opt.icon className="w-5 h-5" />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <textarea
                                        value={fbComment}
                                        onChange={(e) => setFBComment(e.target.value)}
                                        placeholder="ADDITIONAL INTEL (OPTIONAL)..."
                                        maxLength={500}
                                        className="w-full h-24 bg-[var(--ch-brand-900)] border border-[var(--border-ui)] p-4 font-mono text-[11px] text-white placeholder:text-brand-700 focus:border-accent-neon focus:outline-none transition-colors"
                                    />
                                    {fbError && (
                                        <p className="font-mono text-xs text-accent-alert uppercase tracking-widest border border-accent-alert/30 bg-accent-alert/10 px-4 py-3">
                                            ⚠ {fbError}
                                        </p>
                                    )}
                                    <button
                                        disabled={!fbRating || submittingFB}
                                        onClick={async () => {
                                            setSubmittingFB(true);
                                            setFBError(null);
                                            try {
                                                await submitPredictionFeedback({
                                                    prediction_id: flight.prediction_id ?? "00000000-0000-0000-0000-000000000000",
                                                    actual_delay: flight.delay_minutes,
                                                    rating: fbRating!,
                                                    comment: fbComment,
                                                });
                                                setFBSubmitted(true);
                                            } catch (err: any) {
                                                setFBError(err.message || "Failed to submit feedback.");
                                            } finally {
                                                setSubmittingFB(false);
                                            }
                                        }}
                                        className="w-full bg-white text-black font-heading font-black py-4 uppercase tracking-[0.2em] hover:bg-accent-neon transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                    >
                                        {submittingFB ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Transmit Feedback
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-10"
                            >
                                <div className="w-12 h-12 rounded-full border border-accent-neon flex items-center justify-center mx-auto mb-6">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
                                        <Plane className="w-6 h-6 text-accent-neon" />
                                    </motion.div>
                                </div>
                                <h4 className="font-heading font-black text-xl text-white uppercase mb-2">Transmission Received</h4>
                                <p className="font-mono text-xs text-brand-500 uppercase tracking-widest">Your report has been integrated into the central node.</p>
                            </motion.div>
                        )}
                    </motion.div>

                </motion.div>
            )}
        </motion.div>
    );
}
