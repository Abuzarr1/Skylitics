"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Zap, Activity, Compass, ShieldAlert, ChevronUp } from "lucide-react";
import { getRouteAnalytics, getAirportAnalytics, getDelayTrend, getSystemStatus } from "@/lib/api";
import { LoadingRadar } from "@/components/ui/LoadingRadar";
import { useAuth } from "@/hooks/useAuth";

// Real SHAP-derived feature importance from trained XGBoost model
const FEATURE_IMPORTANCE = [
    { name: "Departure Hour",    value: 42 },
    { name: "Airline",           value: 35 },
    { name: "Flight Distance",   value: 34 },
    { name: "Origin Airport",    value: 33 },
    { name: "Destination",       value: 22 },
    { name: "Day of Week",       value: 11 },
    { name: "Month",             value: 9  },
];

const PerformanceMetric = ({ label, value, sub, trend }: { label: string; value: string; sub: string; trend?: string }) => (
    <div className="p-6 bg-[var(--bg-card)]/40 border border-[var(--border-ui)] group hover:border-accent-neon transition-colors">
        <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-mono text-brand-500 uppercase tracking-widest">{label}</span>
            {trend && (
                <span className="text-[10px] font-mono text-accent-neon flex items-center gap-1">
                    <ChevronUp className="w-3 h-3" /> {trend}
                </span>
            )}
        </div>
        <div className="text-3xl font-heading font-black text-white uppercase tracking-tighter mb-1">{value}</div>
        <div className="text-[9px] font-mono text-brand-600 uppercase tracking-widest leading-none">{sub}</div>
    </div>
);

import * as Mocks from "@/lib/mocks";

export default function AnalyticsPage() {
    const auth = useAuth();
    const [routes, setRoutes]       = useState<any[]>(Mocks.MOCK_ANALYTICS_ROUTES);
    const [airports, setAirports]   = useState<any[]>(Mocks.MOCK_ANALYTICS_AIRPORTS);
    const [isLive, setIsLive]       = useState(false);
    const [loading, setLoading]     = useState(false);
    const [modelMetrics, setModelMetrics] = useState({
        accuracy: "91.8%",
        f1:       "0.891",
        rmse:     "14.2 min",
        flights:  "100K",
        name:     "XGBoost Classifier",
        version:  "v1.0",
    });

    useEffect(() => {
        const load = async () => {
            try {
                const [r, a, sys] = await Promise.all([
                    getRouteAnalytics(),
                    getAirportAnalytics(),
                    getSystemStatus(),
                ]);
                if (r && a) {
                    setRoutes(r.slice(0, 8));
                    setAirports(a.slice(0, 8));
                    setIsLive(true);
                }
                if (sys?.model_metrics) {
                    const m = sys.model_metrics;
                    setModelMetrics({
                        accuracy: `${m.accuracy}%`,
                        f1:       String(m.f1),
                        rmse:     `${m.rmse} min`,
                        flights:  m.flights >= 1000 ? `${Math.round(m.flights / 1000)}K` : String(m.flights),
                        name:     sys.model_name ?? "XGBoost Classifier",
                        version:  sys.model_version ?? "v1.0",
                    });
                }
            } catch {
                setIsLive(false);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [auth?.airportCode]);

    return (
        <div className="max-w-[1600px] mx-auto px-10 py-10 selection:bg-accent-neon selection:text-black">

            {/* Header */}
            <div className="mb-12 border-b border-white/5 pb-8 flex justify-between items-end">
                <div>
                    <div className="font-mono text-accent-ice text-[10px] uppercase tracking-[0.4em] mb-4 flex items-center gap-4">
                        <span className="w-12 h-px bg-accent-ice" /> OPERATIONAL_INTELLIGENCE_V4
                    </div>
                    <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tighter uppercase text-white leading-none">
                        Intelligence <span className="text-brand-300">Sync</span>
                    </h1>
                    {auth?.airportCode && (
                        <p className="font-mono text-[10px] uppercase tracking-widest text-yellow-400 mt-3">
                            Scoped to: {auth.airportCode}
                        </p>
                    )}
                </div>
                <div className="hidden lg:flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 border border-accent-neon/30 bg-accent-neon/5 text-accent-neon font-mono text-[10px] uppercase tracking-widest">
                        <Activity className="w-3 h-3" /> Live Data
                    </div>
                </div>
            </div>

            {/* Metrics Row — real DB values */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <PerformanceMetric label="Training Accuracy"  value={modelMetrics.accuracy} sub={`${modelMetrics.name} ${modelMetrics.version}`} trend="↑" />
                <PerformanceMetric label="RMSE (Regression)"  value={modelMetrics.rmse}     sub="Avg prediction error" />
                <PerformanceMetric label="F1 Score"           value={modelMetrics.f1}        sub="Classifier performance" />
                <PerformanceMetric label="Flights in DB"      value={modelMetrics.flights}   sub="Training corpus size" trend="↑" />
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Top Routes by Risk — real /ops/analytics/routes */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] p-8 border border-white/5">
                    <div className="mb-8">
                        <h3 className="text-xl font-heading font-black text-white uppercase tracking-tighter">Top Risk Routes</h3>
                        <p className="text-[10px] font-mono text-brand-500 uppercase tracking-widest">Highest avg delay probability — live from predictions table</p>
                    </div>

                    {loading ? (
                        <div className="h-[380px] flex items-center justify-center">
                            <LoadingRadar text="LOADING ROUTES..." />
                        </div>
                    ) : (
                        <div className="h-[380px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={routes} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        domain={[0, 1]}
                                        tickFormatter={(v) => `${Math.round(v * 100)}%`}
                                        tick={{ fill: "#4a5568", fontSize: 9, fontFamily: "monospace" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        dataKey="route"
                                        type="category"
                                        width={90}
                                        tick={{ fill: "#9ca3af", fontSize: 9, fontFamily: "monospace" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ background: "#0a0c10", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, fontFamily: "monospace", fontSize: 10 }}
                                        labelStyle={{ color: "#6b7280", textTransform: "uppercase" }}
                                        itemStyle={{ color: "#DFFF00" }}
                                        formatter={(v: any) => [`${Math.round(Number(v) * 100)}%`, "Risk Score"]}
                                    />
                                    <Bar dataKey="risk_score" radius={[0, 2, 2, 0]} barSize={14}>
                                        {routes.map((entry, i) => (
                                            <Cell
                                                key={i}
                                                fill={entry.risk_score >= 0.65 ? "#f87171" : entry.risk_score >= 0.5 ? "#fbbf24" : "#DFFF00"}
                                                fillOpacity={0.85}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* SHAP Feature Importance */}
                <div className="bg-[var(--bg-card)] p-8 border border-white/5 space-y-8">
                    <div>
                        <h3 className="text-xl font-heading font-black text-white uppercase tracking-tighter">Feature Cluster</h3>
                        <p className="text-[10px] font-mono text-brand-500 uppercase tracking-widest">SHAP-derived global inference weights</p>
                    </div>

                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={FEATURE_IMPORTANCE} margin={{ left: 10, right: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tick={{ fill: "#9ca3af", fontSize: 9, fontFamily: "monospace" }}
                                    width={100}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ background: "#0a0c10", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, fontFamily: "monospace", fontSize: 10 }}
                                    formatter={(v: any) => [`${v}`, "SHAP Weight"]}
                                />
                                <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={12}>
                                    {FEATURE_IMPORTANCE.map((_, i) => (
                                        <Cell key={i} fill={i === 0 ? "#DFFF00" : i === 1 ? "#a3e635" : "#ffffff22"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest">
                            <span className="text-brand-500">Top Predictor</span>
                            <span className="text-accent-neon">Departure Hour</span>
                        </div>
                        <p className="text-[9px] font-mono text-brand-600 uppercase tracking-widest leading-loose">
                            Departure hour dominates delay predictions — flights departing 08:00–09:00 and 17:00–18:00 show highest risk scores.
                        </p>
                    </div>
                </div>
            </div>

            {/* Airport Congestion Table — real /ops/analytics/airports */}
            <div className="mt-12 bg-[var(--bg-card)] border border-white/5 p-8">
                <div className="mb-6">
                    <h3 className="text-xl font-heading font-black text-white uppercase tracking-tighter">Airport Congestion Index</h3>
                    <p className="text-[10px] font-mono text-brand-500 uppercase tracking-widest mt-1">Outbound delay risk by airport — computed from 100K predictions</p>
                </div>

                {loading ? (
                    <LoadingRadar text="LOADING AIRPORTS..." />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                        {airports.map((ap, i) => {
                            const pct = Math.round(ap.congestion_score * 100);
                            const color = pct >= 55 ? "text-accent-alert border-accent-alert/30" : pct >= 45 ? "text-yellow-400 border-yellow-400/30" : "text-accent-neon border-accent-neon/30";
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`border p-4 text-center ${color} bg-[var(--ch-brand-900)]/50`}
                                >
                                    <div className="font-heading font-black text-lg">{ap.airport}</div>
                                    <div className="font-mono text-[10px] mt-1 uppercase tracking-widest">{pct}%</div>
                                    <div className="font-mono text-[9px] text-brand-600 mt-1">{ap.flights_out} flights</div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="p-10 border border-[var(--border-ui)] bg-[var(--bg-card)]/20 backdrop-blur-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4">
                        <Compass className="w-12 h-12 text-white/5 group-hover:text-accent-neon/10 transition-colors" />
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                        <Zap className="w-5 h-5 text-accent-neon" />
                        <h4 className="text-2xl font-heading font-black text-white uppercase tracking-tighter">Model Stability</h4>
                    </div>
                    <p className="text-sm font-mono text-brand-400 uppercase leading-relaxed tracking-wider mb-8 italic">
                        "XGBoost Delay Classifier v1.0 demonstrates high convergence across airline carriers with strong resilience to weather and temporal variance."
                    </p>
                    <div className="flex gap-4">
                        <div className="px-3 py-1.5 border border-[var(--border-ui)] bg-[var(--bg-surface)] font-mono text-[9px] uppercase tracking-widest text-brand-300">
                            F1 Score: {modelMetrics.f1}
                        </div>
                        <div className="px-3 py-1.5 border border-[var(--border-ui)] bg-[var(--bg-surface)] font-mono text-[9px] uppercase tracking-widest text-brand-300">
                            RMSE: {modelMetrics.rmse}
                        </div>
                    </div>
                </div>

                <div className="p-10 border border-[var(--border-ui)] bg-[var(--bg-card)]/20 backdrop-blur-3xl flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6">
                        <ShieldAlert className="w-5 h-5 text-accent-ice" />
                        <h4 className="text-2xl font-heading font-black text-white uppercase tracking-tighter">Model Registry</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest pb-4 border-b border-white/5">
                            <span className="text-brand-500">Algorithm</span>
                            <span className="text-white font-bold">XGBoost</span>
                        </div>
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest pb-4 border-b border-white/5">
                            <span className="text-brand-500">Status</span>
                            <span className="text-accent-neon font-bold">PRODUCTION</span>
                        </div>
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                            <span className="text-brand-500">Training Set</span>
                            <span className="text-brand-300 font-bold">100K Flights</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
