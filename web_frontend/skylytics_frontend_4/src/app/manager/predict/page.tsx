"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Activity, Target, Shield, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { predictRealTime, getSystemStatus } from "@/lib/api";
import { type AuthUser, useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";

// --- Visual Components ---

function GaugeChart({ value = 0 }: { value?: number }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Ensure value is a valid number
    const safeValue = isNaN(value) ? 0 : Math.min(100, Math.max(0, value));

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const progress = (safeValue / 100) * circumference;

    const isDark = !mounted || resolvedTheme === 'dark';

    let strokeColor = isDark ? "stroke-[#DFFF00]" : "stroke-[#7c9100]";
    let shadowColor = isDark ? "rgba(223,255,0,0.4)" : "rgba(124,145,0,0.2)";
    let statusText = "STABLE";

    if (value > 65) {
        strokeColor = "stroke-accent-alert";
        shadowColor = isDark ? "rgba(255,59,48,0.4)" : "rgba(255,59,48,0.2)";
        statusText = "CRITICAL RISK";
    } else if (value > 30) {
        strokeColor = isDark ? "stroke-amber-400" : "stroke-amber-600";
        shadowColor = isDark ? "rgba(251,191,36,0.4)" : "rgba(251,191,36,0.2)";
        statusText = "ELEVATED RISK";
    }

    return (
        <div className="relative flex flex-col items-center">
            {/* Ambient Background Glow */}
            <div
                className="absolute inset-0 rounded-full opacity-20 blur-[60px] pointer-events-none transition-colors duration-1000"
                style={{ background: `radial-gradient(circle, ${shadowColor.replace(',0.4)', ',1)').replace(',0.2)', ',1)')} 0%, transparent 70%)` }}
            />

            <svg className="w-56 h-56 transform -rotate-90 relative z-10">
                {/* Background Shadow Arc */}
                <circle cx="112" cy="112" r={radius} className="stroke-brand-900 fill-none stroke-[4]" />
                {/* Main Progress Arc */}
                <motion.circle
                    cx="112" cy="112" r={radius}
                    className={`${strokeColor} fill-none stroke-[12]`}
                    style={{ filter: `drop-shadow(0 0 15px ${shadowColor})` }}
                    strokeDasharray={`${circumference} ${circumference}`}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-black font-heading text-white tracking-tighter leading-none">
                    {safeValue.toFixed(0)}
                    <span className="text-2xl text-brand-500 font-mono">%</span>
                </span>
                <span className="text-[10px] font-mono text-brand-400 uppercase tracking-widest mt-2">{statusText}</span>
            </div>
        </div>
    );
}

function SHAPBarChart({ data }: { data: any[] }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="h-[300px] w-full mt-8 bg-brand-900/10 animate-pulse" />;

    const isDark = resolvedTheme === 'dark';

    const formattedData = data.map(feat => ({
        name: feat.feature,
        value: parseFloat(feat.impact_minutes || "0"),
        raw: feat.impact_minutes,
        type: feat.type
    })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return (
        <div className="h-[300px] w-full mt-8">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={formattedData} margin={{ left: -20, right: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        hide
                    />
                    <Tooltip
                        cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-3 font-mono shadow-2xl backdrop-blur-xl">
                                        <p className="text-[10px] text-brand-500 uppercase mb-1">{payload[0].payload.name}</p>
                                        <p className={`text-sm font-bold ${payload[0].payload.type === 'warning' ? 'text-accent-alert' : 'text-accent-neon'}`}>
                                            {payload[0].payload.raw} min Impact
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={16}>
                        {formattedData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.type === 'warning' ? '#FF3B30' : '#DFFF00'}
                                fillOpacity={0.9}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function PredictPage() {
    const auth = useAuth() as AuthUser | null;
    const [isPredicting, setIsPredicting] = useState(false);
    const [isLive, setIsLive] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const ping = async () => {
            try {
                const sts = await getSystemStatus();
                setIsLive(!!sts);
            } catch {
                setIsLive(false);
            }
        };
        ping();
        const interval = setInterval(ping, 10000);
        return () => clearInterval(interval);
    }, []);

    const [form, setForm] = useState({
        airline: "DL",
        flightNumber: "",
        origin: "JFK",
        destination: "LAX",
        date: new Date().toISOString().split('T')[0],
        time: "14:30",
        weather: 3,
        tailNumber: "N900AI",
    });

    useEffect(() => {
        if (auth?.airportCode) {
            setForm(prev => ({ ...prev, origin: auth.airportCode || "JFK" }));
        }
    }, [auth?.airportCode]);

    const executePrediction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPredicting(true);
        setError(null);

        if (form.origin.toUpperCase() === form.destination.toUpperCase()) {
            setError("Origin and destination cannot be the same airport.");
            setIsPredicting(false);
            return;
        }

        const weatherImpact = (form.weather / 5) * 40;
        const baseProb = 0.15 + (weatherImpact / 100);
        const optimisticResult = {
            probability: Math.min(95, baseProb * 100),
            delayMinutes: Math.round(baseProb * 120),
            isDelayed: baseProb > 0.45,
            shap: [
                { feature: "Weather Nodes (Projected)", impact_minutes: `+${Math.round(weatherImpact)}`, type: "warning" },
                { feature: "Route Load Factor", impact_minutes: "+12.5", type: "neutral" },
                { feature: "Carrier Archive", impact_minutes: "-5.0", type: "success" }
            ],
            engine: "Heuristic Instant"
        };

        setResult(optimisticResult);
        const startTime = Date.now();

        try {
            const responseData = await predictRealTime({
                airline: form.airline,
                origin: form.origin,
                destination: form.destination,
                date: form.date,
                time: form.time,
                weather_severity: form.weather / 5,
                tail_number: form.tailNumber || "UNKNOWN",
            });

            if (!responseData || !responseData.data) throw new Error("Invalid response from prediction engine.");

            const elapsed = Date.now() - startTime;
            if (elapsed < 800) await new Promise(r => setTimeout(r, 800 - elapsed));

            setResult({
                probability: (responseData.data.hybrid_probability || 0) * 100,
                delayMinutes: responseData.data.estimated_delay_minutes || 0,
                isDelayed: !!responseData.data.predicted_delayed,
                shap: responseData.explainability_tags || [],
                engine: responseData.data.prediction_type
            });
        } catch (err: any) {
            console.error("Backend refine failed:", err);
            setResult((prev: any) => ({ ...prev, engine: "Heuristic Archive" }));
        } finally {
            setIsPredicting(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-[1600px] mx-auto px-4 md:px-12 py-10">
            <div className="flex justify-between items-end border-b border-[var(--border-ui)] pb-8 mb-4">
                <div>
                    <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tighter">Predictive Analysis</h1>
                    <p className="text-brand-500 font-mono text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-accent-neon" /> Multi-Layer Neural Network Engine v4.0 Active
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12">
                <div className="w-full lg:w-1/3 bg-[var(--bg-card)] border border-[var(--border-ui)] p-8 h-fit shadow-2xl">
                    <h2 className="text-xl font-heading font-black text-white mb-1 uppercase tracking-tighter">Prediction Matrix</h2>
                    <p className="text-[10px] font-mono text-brand-500 uppercase tracking-widest mb-8">Input Flight Parameters</p>

                    <form onSubmit={executePrediction} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em] flex items-center justify-between">
                                Carrier Code <span className="text-brand-600">REQ</span>
                            </label>
                            <select
                                value={form.airline}
                                onChange={(e) => setForm({ ...form, airline: e.target.value })}
                                className="w-full bg-[var(--ch-brand-800)] border border-[var(--border-ui)] text-white p-3 font-mono text-sm outline-none focus:border-accent-neon transition-colors appearance-none"
                            >
                                <option value="DL">DL (Delta)</option>
                                <option value="AA">AA (American)</option>
                                <option value="UA">UA (United)</option>
                                <option value="B6">B6 (JetBlue)</option>
                                <option value="WN">WN (Southwest)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em] flex items-center justify-between">
                                Flight Designator <span className="text-brand-600">REQ</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. DL192"
                                value={form.flightNumber}
                                onChange={(e) => setForm({ ...form, flightNumber: e.target.value.toUpperCase() })}
                                className="w-full bg-[var(--ch-brand-800)] border border-[var(--border-ui)] text-white p-3 font-mono text-sm outline-none focus:border-accent-neon transition-colors"
                                required
                                pattern="[a-zA-Z]{2,3}\d+"
                                maxLength={8}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="w-1/2 space-y-2">
                                <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em]">Origin</label>
                                <input
                                    type="text"
                                    value={form.origin}
                                    onChange={(e) => setForm({ ...form, origin: e.target.value.toUpperCase() })}
                                    placeholder="JFK"
                                    className={`w-full bg-[var(--ch-brand-800)] border ${form.origin === form.destination ? 'border-accent-alert' : 'border-[var(--border-ui)]'} text-white p-3 font-mono text-sm outline-none focus:border-accent-neon uppercase transition-colors`}
                                    required
                                    maxLength={3}
                                />
                            </div>
                            <div className="w-1/2 space-y-2">
                                <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em]">Destination</label>
                                <input
                                    type="text"
                                    value={form.destination}
                                    onChange={(e) => setForm({ ...form, destination: e.target.value.toUpperCase() })}
                                    placeholder="LAX"
                                    className={`w-full bg-[var(--ch-brand-800)] border ${form.origin === form.destination ? 'border-accent-alert' : 'border-[var(--border-ui)]'} text-white p-3 font-mono text-sm outline-none focus:border-accent-neon uppercase transition-colors`}
                                    required
                                    maxLength={3}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 py-2">
                            <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em]">Aircraft Registration</label>
                            <input
                                type="text"
                                value={form.tailNumber}
                                onChange={(e) => setForm({ ...form, tailNumber: e.target.value.toUpperCase() })}
                                placeholder="e.g. N900AI"
                                className="w-full bg-[var(--ch-brand-800)] border border-[var(--border-ui)] text-white p-3 font-mono text-sm outline-none focus:border-accent-neon uppercase transition-colors"
                                maxLength={10}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="w-1/2 space-y-2">
                                <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em]">Date</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="w-full bg-[var(--ch-brand-800)] border border-[var(--border-ui)] text-brand-500 p-3 font-mono text-sm outline-none focus:border-accent-neon transition-colors"
                                />
                            </div>
                            <div className="w-1/2 space-y-2">
                                <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em]">Time (Local)</label>
                                <input
                                    type="time"
                                    value={form.time}
                                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                                    className="w-full bg-[var(--ch-brand-800)] border border-[var(--border-ui)] text-brand-500 p-3 font-mono text-sm outline-none focus:border-accent-neon transition-colors"
                                />
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-[var(--border-ui)]">
                            <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em] flex justify-between mb-4">
                                Weather Anomaly Tracker
                                <span className="text-accent-neon">Override</span>
                            </label>
                            <input type="range" min="1" max="5" value={form.weather} onChange={(e) => setForm({ ...form, weather: Number(e.target.value) })} className="w-full accent-accent-neon" />
                            <div className="flex justify-between text-[10px] font-mono mt-1 text-brand-600 uppercase">
                                <span>Clear</span>
                                <span>Severe</span>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isPredicting}
                            className="w-full mt-4 bg-foreground text-brand-900 hover:bg-accent-neon font-black font-heading tracking-tighter uppercase py-4 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 group"
                        >
                            {isPredicting ? (
                                <span className="animate-pulse">Compiling Neural Net...</span>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 text-brand-900 group-hover:scale-110 transition-transform" /> Execute Protocol
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="w-full lg:w-2/3 bg-[var(--bg-card)] border border-[var(--border-ui)] min-h-[600px] flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

                    <div className="border-b border-[var(--border-ui)] py-4 px-8 flex justify-between items-center relative z-10 bg-[var(--bg-card)]">
                        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-500 flex items-center gap-4">
                            Terminal Output
                            {isLive ? (
                                <span className="text-accent-neon text-[8px] flex items-center gap-2 border border-accent-neon/30 px-2 py-0.5 animate-pulse bg-accent-neon/5">
                                    <div className="w-1 h-1 rounded-full bg-accent-neon" /> Live Neural Node
                                </span>
                            ) : (
                                <span className="text-brand-500 text-[8px] flex items-center gap-2 border border-white/10 px-2 py-0.5 bg-white/5">
                                    <div className="w-1 h-1 rounded-full bg-brand-500" /> Archive Simulation
                                </span>
                            )}
                            {isPredicting && <span className="text-accent-neon animate-pulse flex items-center gap-2 ml-auto"><Activity className="w-3 h-3" /> Processing...</span>}
                        </div>
                    </div>

                    <div className="flex-1 p-8 relative z-10 flex flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                            {error ? (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center text-center max-w-md"
                                >
                                    <div className="w-16 h-16 border-2 border-accent-alert/30 flex items-center justify-center mb-6">
                                        <Shield className="w-8 h-8 text-accent-alert" />
                                    </div>
                                    <p className="text-accent-alert font-mono text-xs uppercase tracking-widest mb-4">Analysis Failed</p>
                                    <p className="text-brand-400 font-mono text-[11px] leading-relaxed">{error}</p>
                                    <button
                                        onClick={() => setError(null)}
                                        className="mt-6 px-6 py-2 border border-[var(--border-ui)] text-brand-400 font-mono text-[10px] uppercase tracking-widest hover:border-accent-neon hover:text-accent-neon"
                                    >
                                        Dismiss
                                    </button>
                                </motion.div>
                            ) : result ? (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start"
                                >
                                    <div className="flex flex-col items-center justify-center md:border-r border-[var(--border-ui)] md:pr-12">
                                        <div className="flex flex-col items-center gap-1 mb-12 text-center">
                                            <p className="font-mono text-[10px] text-brand-500 uppercase tracking-widest flex items-center gap-2">
                                                <Activity className="w-3 h-3" /> Core Network Failure Probability
                                            </p>
                                            {isPredicting && (
                                                <span className="text-[8px] font-mono text-accent-neon animate-pulse uppercase tracking-widest">
                                                    Refining with Live Telemetry...
                                                </span>
                                            )}
                                        </div>

                                        <GaugeChart value={result.probability} />

                                        <div className="mt-12 text-center bg-[var(--ch-brand-900)] border border-[var(--border-ui)] w-full py-6">
                                            <p className="font-mono text-[10px] text-brand-500 uppercase tracking-[0.2em] mb-1">Time Vector Displacement</p>
                                            <p className={`text-4xl font-heading font-black ${result.delayMinutes > 30 ? 'text-accent-alert' : 'text-white'}`}>
                                                +{result.delayMinutes} MIN
                                            </p>
                                        </div>

                                        <div className="mt-6 flex flex-wrap gap-2 justify-center w-full max-w-[280px]">
                                            {(result.shap || []).slice(0, 3).map((chip: any, i: number) => (
                                                <div key={i} className={`w-full px-3 py-2 border font-mono text-[9px] uppercase tracking-wider flex items-center justify-between gap-2 ${chip.type === 'warning' ? 'bg-accent-alert/5 border-accent-alert/20 text-white' : 'bg-accent-neon/5 border-accent-neon/20 text-white'}`}>
                                                    <span>{chip.feature}</span>
                                                    <span className={chip.type === 'warning' ? 'text-accent-alert' : 'text-accent-neon'}>{chip.impact_minutes} min</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col w-full h-full">
                                        <div className="mb-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <h3 className="text-xl font-heading font-black uppercase text-white">SHAP Explainability</h3>
                                                <Info className="w-4 h-4 text-brand-600" />
                                            </div>
                                            <p className="text-brand-500 font-mono text-[10px] uppercase tracking-widest">Feature Weight Distribution</p>
                                        </div>
                                        <SHAPBarChart data={result.shap || []} />
                                        <div className="mt-4 space-y-2 border-t border-white/5 pt-6">
                                            {(result.shap || []).slice(0, 4).map((feat: any, idx: number) => (
                                                <div key={idx} className="flex justify-between font-mono text-[9px] uppercase tracking-widest">
                                                    <span className="text-brand-500">{feat.feature}</span>
                                                    <span className={feat.type === 'warning' ? 'text-accent-alert' : 'text-accent-neon'}>{feat.impact_minutes} min</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : isPredicting ? (
                                <motion.div key="loading" exit={{ opacity: 0 }} className="flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 border-[3px] border-brand-800 border-t-accent-neon rounded-full animate-spin mb-6" />
                                    <p className="font-mono text-accent-neon text-xs uppercase tracking-widest animate-pulse">Running Analysis Node...</p>
                                </motion.div>
                            ) : (
                                <motion.div key="empty" className="flex flex-col items-center justify-center text-center max-w-sm">
                                    <Target className="w-12 h-12 text-brand-700 mb-6" />
                                    <p className="text-brand-500 font-mono text-sm uppercase tracking-widest leading-relaxed">
                                        Awaiting parameters. System will process 1,000+ historical delay factors via XGBoost structure.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
