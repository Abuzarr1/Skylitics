"use client";
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/marketing/Navbar";
import { getLivePredictions } from "@/lib/api";
import {
    Activity,
    ShieldCheck,
    RefreshCw,
    Wifi,
    WifiOff,
    AlertTriangle,
} from "lucide-react";

import * as Mocks from "@/lib/mocks";

export default function DecisionLedgerPage() {
    const [flights, setFlights] = useState<any[]>(Mocks.MOCK_FLIGHTS);
    const [isLive, setIsLive] = useState(false);
    const [loading, setLoading] = useState(false); // No skeletal loading if we have mocks!
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSync, setLastSync] = useState<string>("");

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const live = await getLivePredictions();
            if (live && live.length > 0) {
                setFlights(live);
                setLastSync(new Date().toLocaleTimeString());
                
                // Detect if we are in fallback simulation mode
                const isSimulated = live.some((f: any) => f.id?.includes("FALLBACK") || f.engine === "fallback_node");
                if (isSimulated) {
                    setError("OPENSKY LINK UNSTABLE — OPERATING IN ARCHIVE SIMULATION MODE");
                    setIsLive(false);
                } else {
                    setError(null);
                    setIsLive(true);
                }
            }
        } catch (err: any) {
            console.warn("Ledger Sync Failed, keeping archive view.");
            setError("CENTRAL TELEMETRY NODE UNREACHABLE — ARCHIVE MODE");
            setIsLive(false);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(() => load(true), 60_000);
        return () => clearInterval(interval);
    }, [load]);

    const onTime   = flights.filter(f => f.status === "on_time").length;
    const atRisk   = flights.filter(f => f.status === "at_risk").length;
    const delayed  = flights.filter(f => f.status === "delayed").length;

    return (
        <div className="min-h-screen bg-[var(--ch-brand-900)] flex flex-col relative overflow-hidden selection:bg-accent-neon selection:text-black">
            <Navbar />

            {/* Background grid */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

            <main className="flex-1 max-w-[1700px] w-full mx-auto px-6 md:px-16 py-12 relative z-10 flex flex-col pt-32 pb-24">

                {/* Header */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-white/5 pb-10 mb-12">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-ui)]">
                            <ShieldCheck className="w-3.5 h-3.5 text-accent-neon" />
                            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-brand-400">
                                Live Telemetry — OpenSky Network + XGBoost Engine
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse ml-1" />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-end gap-6">
                            <h1 className="text-6xl md:text-8xl font-heading font-black text-white uppercase tracking-tighter leading-[0.85]">
                                Decision <span className="text-accent-neon">Ledger.</span>
                            </h1>
                            <div className={`px-4 py-2 border font-mono text-[10px] uppercase tracking-widest mb-2 flex items-center gap-3 ${isLive ? 'text-accent-neon border-accent-neon/30 bg-accent-neon/10 animate-pulse' : 'text-brand-500 border-white/5 bg-white/5'}`}>
                                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-accent-neon shadow-[0_0_10px_var(--accent-neon)]' : 'bg-brand-600'}`} />
                                {isLive ? 'Operational Sync: Live' : 'Operational Status: Archive'}
                            </div>
                        </div>
                        <p className="text-brand-500 font-mono text-xs uppercase tracking-[0.2em] max-w-xl leading-relaxed pl-2 border-l-2 border-accent-neon/30">
                            Real-time flight vectors with XGBoost delay probability output.
                            Data sourced live from OpenSky Network transponders.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 w-full xl:w-auto">
                        <div className="bg-[var(--bg-card)]/40 p-5 border border-white/5 backdrop-blur-xl">
                            <div className="text-brand-600 font-mono text-[9px] uppercase tracking-widest mb-2">On Time</div>
                            <div className="text-3xl font-heading font-bold text-accent-neon">{onTime}</div>
                        </div>
                        <div className="bg-[var(--bg-card)]/40 p-5 border border-white/5 backdrop-blur-xl">
                            <div className="text-brand-600 font-mono text-[9px] uppercase tracking-widest mb-2">At Risk</div>
                            <div className="text-3xl font-heading font-bold text-yellow-400">{atRisk}</div>
                        </div>
                        <div className="bg-[var(--bg-card)]/40 p-5 border border-white/5 backdrop-blur-xl">
                            <div className="text-brand-600 font-mono text-[9px] uppercase tracking-widest mb-2">Delayed</div>
                            <div className="text-3xl font-heading font-bold text-accent-alert">{delayed}</div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex items-center gap-3 font-mono text-[10px] text-brand-500 uppercase tracking-widest">
                        {error ? (
                            <>
                                <WifiOff className={`w-3 h-3 ${error.includes("SIMULATION") ? "text-yellow-400" : "text-accent-alert"}`} />
                                <span className={error.includes("SIMULATION") ? "text-yellow-400" : "text-accent-alert"}>{error}</span>
                            </>
                        ) : (
                            <>
                                <Wifi className="w-3 h-3 text-accent-neon" />
                                <span>{flights.length} flights tracked</span>
                                {lastSync && <span className="text-brand-700">· synced {lastSync}</span>}
                            </>
                        )}
                    </div>
                    <button
                        onClick={() => load(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 border border-[var(--border-ui)] text-brand-300 font-mono text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-40"
                    >
                        <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {/* Main Table */}
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-1 bg-[var(--bg-card)] relative overflow-hidden">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-accent-neon w-1/3"
                                animate={{ x: ["-100%", "300%"] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            />
                        </div>
                        <span className="font-mono text-[10px] text-accent-neon uppercase tracking-[0.5em] animate-pulse">
                            Establishing Telemetry Link...
                        </span>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 bg-[var(--bg-card)]/20 border border-white/5 overflow-hidden flex flex-col relative"
                    >
                        {/* Scanline overlay */}
                        <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.025] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,2px_100%]" />

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left font-mono border-collapse">
                                <thead>
                                    <tr className="border-b border-[var(--border-ui)] bg-[var(--bg-card)] text-[10px] uppercase tracking-[0.25em] text-brand-500">
                                        <th className="px-6 py-5 font-normal border-r border-white/5">Callsign</th>
                                        <th className="px-6 py-5 font-normal border-r border-white/5">Route Vector</th>
                                        <th className="px-6 py-5 font-normal text-right border-r border-white/5">Altitude</th>
                                        <th className="px-6 py-5 font-normal text-right border-r border-white/5">Speed</th>
                                        <th className="px-6 py-5 font-normal text-right border-r border-white/5">Delay Risk</th>
                                        <th className="px-6 py-5 font-normal text-right border-r border-white/5">Pred. Delay</th>
                                        <th className="px-6 py-5 font-normal text-center border-r border-white/5">Engine</th>
                                        <th className="px-6 py-5 font-normal text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <AnimatePresence mode="popLayout">
                                        {flights.map((f, idx) => (
                                            <motion.tr
                                                key={f.id ?? f.callsign}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="group hover:bg-accent-neon/5 transition-all relative"
                                            >
                                                <td className="px-6 py-4 border-r border-white/5 relative">
                                                    <div className="absolute inset-y-0 left-0 w-0.5 bg-accent-neon scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-200" />
                                                    <span className="font-bold text-white tracking-wider">{f.callsign}</span>
                                                </td>
                                                <td className="px-6 py-4 border-r border-white/5">
                                                    <span className="text-brand-400 text-xs">
                                                        {f.origin} <span className="text-brand-600">▸</span> {f.dest}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-brand-400 text-xs border-r border-white/5 tabular-nums">
                                                    {f.altitude_ft.toLocaleString()} ft
                                                </td>
                                                <td className="px-6 py-4 text-right text-brand-400 text-xs border-r border-white/5 tabular-nums">
                                                    {f.speed_kts} kts
                                                </td>
                                                <td className="px-6 py-4 text-right border-r border-white/5 tabular-nums">
                                                    <span className={`font-bold text-sm ${
                                                        f.delay_probability >= 70 ? "text-accent-alert" :
                                                        f.delay_probability >= 45 ? "text-yellow-400" :
                                                        "text-accent-neon"
                                                    }`}>
                                                        {f.delay_probability}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right border-r border-white/5 tabular-nums">
                                                    <span className="font-bold text-accent-neon text-sm">
                                                        {f.pred_delay_min > 0 ? `+${f.pred_delay_min}m` : "—"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center border-r border-white/5">
                                                    <span className="font-mono text-[9px] uppercase text-brand-600 tracking-widest">
                                                        {f.engine ?? "xgboost"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-block px-3 py-0.5 border text-[9px] uppercase tracking-widest font-bold ${
                                                        f.status === "delayed"  ? "border-accent-alert/40 text-accent-alert bg-accent-alert/5" :
                                                        f.status === "at_risk"  ? "border-yellow-400/40 text-yellow-400 bg-yellow-400/5" :
                                                                                   "border-accent-neon/40 text-accent-neon bg-accent-neon/5"
                                                    }`}>
                                                        {f.status.replace("_", " ")}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>

                                    {flights.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={8} className="px-8 py-24 text-center">
                                                <div className="inline-flex flex-col items-center gap-4 text-brand-700">
                                                    <Activity className="w-8 h-8 opacity-20" />
                                                    <span className="font-mono text-xs uppercase tracking-[0.4em]">
                                                        No live flights — OpenSky may be rate-limited
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Footer */}
                <div className="mt-6 flex items-center justify-between px-1">
                    <div className="font-mono text-[8px] text-brand-700 uppercase tracking-widest flex items-center gap-6">
                        <span>Engine: XGBoost v4</span>
                        <span>Source: OpenSky Network</span>
                        <span>Refresh: 60s</span>
                    </div>
                    {lastSync && (
                        <span className="font-mono text-[8px] text-brand-700 uppercase tracking-widest">
                            Last sync: {lastSync}
                        </span>
                    )}
                </div>
            </main>
        </div>
    );
}
