
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Activity, Target, Shield, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from "@/hooks/useAuth";
import { getAirportStats, getRiskLevel, REGISTERED_AIRPORTS, getFeedItems } from "@/lib/csvUtils";
import { useMockData } from "@/lib/useMockData";
import { LoadingRadar } from "@/components/ui/LoadingRadar";

function GaugeChart({ value = 0 }: { value?: number }) {
    const safeValue = isNaN(value) ? 0 : Math.min(100, Math.max(0, value));
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const progress = (safeValue / 100) * circumference;
    const statusText = value > 65 ? "CRITICAL RISK" : value > 30 ? "ELEVATED RISK" : "STABLE";
    const strokeColor = value > 65 ? "stroke-accent-alert" : value > 30 ? "stroke-amber-400" : "stroke-[#DFFF00]";

    return (
        <div className="relative flex flex-col items-center">
            <svg className="w-56 h-56 transform -rotate-90 relative z-10">
                <circle cx="112" cy="112" r={radius} className="stroke-brand-900 fill-none stroke-[4]" />
                <motion.circle
                    cx="112" cy="112" r={radius}
                    className={`${strokeColor} fill-none stroke-[12]`}
                    strokeDasharray={`${circumference} ${circumference}`}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-black font-heading text-white tracking-tighter leading-none">
                    {safeValue.toFixed(0)}<span className="text-2xl text-brand-500 font-mono">%</span>
                </span>
                <span className="text-[10px] font-mono text-brand-400 uppercase tracking-widest mt-2">{statusText}</span>
            </div>
        </div>
    );
}

export default function PredictPage() {
    const auth = useAuth();
    const { rows, loading } = useMockData();
    const [isPredicting, setIsPredicting] = useState(false);
    const [result, setResult] = useState<any>(null);

    const airportRiskScores = useMemo(() => {
        return REGISTERED_AIRPORTS.map(code => ({
            code,
            score: Math.round(getAirportStats(code, rows).delayRate * 100)
        }));
    }, [rows]);

    const executePrediction = (e: React.FormEvent) => {
        e.preventDefault();
        setIsPredicting(true);
        
        // Use historical data from CSV as basis
        const airportStats = getAirportStats(auth?.airportCode || "ATL", rows);
        const probability = Math.round(airportStats.delayRate * 100);
        
        setTimeout(() => {
            setResult({
                probability,
                delayMinutes: Math.round(airportStats.avgDelayMinutes),
                engine: "Historical Archive (CSV-Sync)"
            });
            setIsPredicting(false);
        }, 1500);
    };

    if (loading) return <LoadingRadar text="SYNCHRONIZING PREDICTIVE ENGINE..." />;

    return (
        <div className="flex flex-col gap-8 w-full max-w-[1600px] mx-auto px-4 md:px-12 py-10">
            <div className="flex justify-between items-end border-b border-[var(--border-ui)] pb-8 mb-4">
                <div>
                    <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tighter">Predictive Analysis</h1>
                    <p className="text-brand-500 font-mono text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-accent-neon" /> Based on historical network intelligence
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12">
                <div className="w-full lg:w-1/3 bg-[var(--bg-card)] border border-[var(--border-ui)] p-8">
                    <h2 className="text-xl font-heading font-black text-white mb-8 uppercase tracking-tighter text-center">Network Risk Index</h2>
                    <div className="space-y-4">
                        {airportRiskScores.map(ap => (
                            <div key={ap.code} className="flex justify-between items-center p-3 bg-brand-950 border border-white/5">
                                <span className="font-mono text-xs text-white font-bold">{ap.code}</span>
                                <span className={`font-mono text-xs ${ap.score > 50 ? 'text-accent-alert' : 'text-accent-neon'}`}>{ap.score}% RISK</span>
                            </div>
                        ))}
                    </div>

                    <h2 className="text-xl font-heading font-black text-white mt-12 mb-6 uppercase tracking-tighter text-center">Delayed Sequence</h2>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {getFeedItems(rows)
                            .filter(f => f.status === 'delayed')
                            .sort((a, b) => b.delayMinutes - a.delayMinutes)
                            .slice(0, 10)
                            .map((f, i) => (
                                <div key={i} className="p-3 bg-brand-950 border border-white/5 font-mono text-[9px] uppercase">
                                    <div className="flex justify-between text-white font-bold mb-1">
                                        <span>{f.flightNumber}</span>
                                        <span className="text-accent-alert">+{f.delayMinutes}m</span>
                                    </div>
                                    <div className="text-brand-500">{f.origin} → {f.destination}</div>
                                </div>
                            ))
                        }
                    </div>

                    <button onClick={executePrediction} className="w-full mt-8 bg-white text-black font-black font-heading py-4 uppercase tracking-tighter hover:bg-accent-neon transition-colors">
                        Refresh Engine
                    </button>
                </div>

                <div className="w-full lg:w-2/3 bg-[var(--bg-card)] border border-[var(--border-ui)] min-h-[600px] flex flex-col items-center justify-center">
                    {result ? (
                        <div className="w-full flex flex-col items-center">
                            <GaugeChart value={result.probability} />
                            <div className="mt-12 text-center bg-brand-950 border border-white/5 p-8 w-full max-w-md">
                                <p className="font-mono text-[10px] text-brand-500 uppercase tracking-widest mb-2">Historical Avg Delay</p>
                                <p className="text-5xl font-heading font-black text-white">+{result.delayMinutes} MIN</p>
                                <p className="mt-4 font-mono text-[8px] text-brand-600 uppercase tracking-widest">Engine: {result.engine}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <Target className="w-12 h-12 text-brand-700 mx-auto" />
                            <p className="font-mono text-xs text-brand-500 uppercase tracking-widest">Awaiting Command Node Sync</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
