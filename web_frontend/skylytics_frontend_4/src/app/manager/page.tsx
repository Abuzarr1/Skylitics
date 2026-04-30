"use client";
import React, { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getDashboardStats, getAtRiskFlights, getDelayTrend } from "@/lib/api";
import { SkeletonMetric, SkeletonChart } from "@/components/ui/Skeleton";
import { LoadingRadar } from "@/components/ui/LoadingRadar";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";

import * as Mocks from "@/lib/mocks";

export default function ManagerDashboard() {
    const auth = useAuth();
    const [stats, setStats] = useState<any>(Mocks.MOCK_DASHBOARD_STATS);
    const [flights, setFlights] = useState<any[]>(Mocks.MOCK_AT_RISK_FLIGHTS);
    const [trend, setTrend] = useState<any[]>(Mocks.MOCK_DELAY_TREND);
    const [isLoading, setIsLoading] = useState(false); // No skeleton if we have mocks!
    const [isLive, setIsLive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const isDark = !mounted || theme === "dark";

    useEffect(() => {
        setMounted(true);
        async function loadData() {
            try {
                const [dashboardData, flightsData, trendData] = await Promise.all([
                    getDashboardStats(),
                    getAtRiskFlights(5),
                    getDelayTrend().catch(() => []),
                ]);

                console.log("[Dashboard] Raw API response:", { dashboardData, flightsData, trendData });

                const hasRealData = dashboardData && Number(dashboardData.total_tracked) > 0;
                if (hasRealData) {
                    setStats(dashboardData);
                    setFlights(flightsData && flightsData.length > 0 ? flightsData : Mocks.MOCK_AT_RISK_FLIGHTS);
                    setTrend(trendData && trendData.length > 0 ? trendData : Mocks.MOCK_DELAY_TREND);
                    setIsLive(true);
                    setError(null);
                } else {
                    console.warn("[Dashboard] API returned empty data — using demo fallback.");
                    setStats(Mocks.MOCK_DASHBOARD_STATS);
                    setFlights(Mocks.MOCK_AT_RISK_FLIGHTS);
                    setTrend(Mocks.MOCK_DELAY_TREND);
                    setIsLive(false);
                }
            } catch (err) {
                console.warn("[Dashboard] Live sync failed, keeping archive view.", err);
                setIsLive(false);
            }
        }
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [auth?.airportCode]);

    return (
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-10">
            {/* Airport-scoped header */}
            <div className="mb-8 flex items-center gap-4">
                <h1 className="font-mono font-black text-2xl uppercase tracking-widest text-white">
                    {auth?.airportCode ? `${auth.airportCode} AIRPORT DASHBOARD` : "OPERATIONS DASHBOARD"}
                </h1>
                {isLive ? (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-accent-neon animate-pulse flex items-center gap-2 px-3 py-1 bg-accent-neon/5 border border-accent-neon/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-neon shadow-[0_0_8px_var(--accent-neon)]" /> 
                        Live Sync Active
                    </span>
                ) : (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-yellow-400 flex items-center gap-2 px-3 py-1 bg-yellow-400/5 border border-yellow-400/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        Demo Mode
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left/Middle Column - Data Visualization Area */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Monolithic Metric Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 border border-[var(--border-ui)] bg-[var(--bg-card)]">
                        {isLoading || !stats ? (
                            <>
                                <SkeletonMetric />
                                <SkeletonMetric />
                                <SkeletonMetric />
                                <SkeletonMetric />
                            </>
                        ) : (
                            [
                                { label: "Active Nodes", val: stats.total_tracked?.toString() || "0", sub: "+12.4%", glow: "text-white" },
                                { label: "High Risk", val: stats.at_risk_count?.toString() || "0", sub: "Critical", glow: "text-accent-alert" },
                                { label: "Est. Impact", val: `${stats.avg_delay_min || 0}m`, sub: "Average", glow: "text-accent-neon" },
                                { label: "Net Sync", val: `${stats.on_time_pct || 0}%`, sub: "Optimal", glow: "text-white" }
                            ].map((metric, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
                                    className="p-6 border-b md:border-b-0 md:border-r border-[var(--border-ui)] last:border-0 relative overflow-hidden group"
                                >
                                    <div className="font-mono text-[10px] text-brand-500 uppercase tracking-widest mb-4">{metric.label}</div>
                                    <div className={`text-4xl font-heading font-black tracking-tighter ${metric.glow} group-hover:scale-105 transition-transform origin-left`}>{metric.val}</div>
                                    <div className="text-xs font-mono text-brand-400 mt-2 uppercase">{metric.sub}</div>
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Recharts Chart */}
                    {isLoading || !mounted ? (
                        <SkeletonChart />
                    ) : (
                        <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-8 h-[400px] flex flex-col relative group hover:border-[var(--border-ui)]/50 transition-colors">
                            <div className="flex justify-between items-start mb-6 border-b border-[var(--border-ui)] pb-4">
                                <div>
                                    <h2 className="text-xl font-heading font-black text-white uppercase tracking-tighter">Delay Probability Distribution</h2>
                                    <p className="text-brand-500 font-mono text-[10px] uppercase tracking-widest mt-1">Avg delay (min) by hour of day</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-sm bg-accent-neon animate-pulse" />
                                    <span className="text-xs font-mono text-brand-400 uppercase tracking-widest">Live Sync</span>
                                </div>
                            </div>

                            <div className="flex-1 w-full h-full min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradNeon" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#DFFF00" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#DFFF00" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.08)"} />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fill: isDark ? "#4a5568" : "#717171", fontSize: 9, fontFamily: "monospace" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            domain={[0, 60]}
                                            tick={{ fill: isDark ? "#4a5568" : "#717171", fontSize: 9, fontFamily: "monospace" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ background: isDark ? "#0a0c10" : "#ffffff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, borderRadius: 0, fontFamily: "monospace", fontSize: 11 }}
                                            labelStyle={{ color: isDark ? "#6b7280" : "#444", textTransform: "uppercase", letterSpacing: "0.1em" }}
                                            itemStyle={{ color: isDark ? "#DFFF00" : "#7c9100" }}
                                            formatter={(val: any) => [`${val} min`, "Avg Delay"]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="probability"
                                            stroke={isDark ? "#DFFF00" : "#7c9100"}
                                            strokeWidth={2}
                                            fill="url(#gradNeon)"
                                            dot={false}
                                            activeDot={{ r: 4, fill: "#DFFF00", strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="flex gap-4">
                        <Link href="/manager/predict" className="bg-foreground text-background hover:bg-accent-neon font-heading font-black uppercase text-sm px-8 py-4 flex-1 text-center transition-colors">
                            Execute Predictive Model
                        </Link>
                        <button
                            onClick={() => {
                                const csv = ["Hour,Avg Delay (min)", ...trend.map((r) => `${r.label},${r.probability}`)].join("\n");
                                const blob = new Blob([csv], { type: "text/csv" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `skylytics_trend_${new Date().toISOString().split("T")[0]}.csv`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            className="border border-[var(--border-ui)] text-white font-heading font-black uppercase text-sm px-8 py-4 hover:bg-[var(--bg-surface)] transition-colors"
                        >
                            Download Raw Report
                        </button>
                    </div>
                </div>

                {/* Right Sidebar Column - Flight Matrix */}
                <div className="space-y-4">
                    <div className="font-mono text-xs text-brand-400 uppercase tracking-[0.2em] border-b border-[var(--border-ui)] pb-2 mb-6">
                        Live Route Anomalies
                    </div>

                    {isLoading ? (
                        <LoadingRadar text="SCANNING ROUTES..." />
                    ) : flights.length === 0 ? (
                        <div className="p-5 text-center text-brand-500 font-mono text-xs">No active anomalies detected.</div>
                    ) : (
                        flights.map((flight, idx) => {
                            // Derive visual status from risk score (delay_probability) since
                            // the DB status field is "SCHEDULED"/"DELAYED" not "at_risk"
                            const riskScore = flight.risk ?? flight.delay_probability ?? 0;
                            const visualStatus = (flight.status === "delayed" || riskScore > 0.7)
                                ? "delayed"
                                : riskScore > 0.4
                                    ? "at_risk"
                                    : "on_time";
                            const isAlert = visualStatus === "delayed";
                            const isRisk  = visualStatus === "at_risk";
                            const colorClass = isAlert
                                ? "text-accent-alert border-accent-alert"
                                : isRisk
                                    ? (isDark ? "text-accent-neon border-accent-neon" : "text-[#7c9100] border-[#7c9100]")
                                    : "text-white border-[var(--border-ui)]";
                            // Threat level by predicted delay minutes (user requirement)
                            const delayMin = flight.predicted_delay ?? 0;
                            const threat = delayMin > 30 ? "Critical" : delayMin >= 15 ? "Elevated" : "At Risk";
                            const badgeLabel = isAlert ? "DELAYED" : isRisk ? "AT RISK" : "ON TIME";

                            return (
                                <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-5 group hover:border-[var(--border-ui)]/60 transition-all hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div className="flex justify-between items-start mb-4 border-b border-[var(--border-ui)]/30 pb-3">
                                        <h4 className="font-heading font-black text-white text-lg tracking-tight uppercase group-hover:text-accent-neon transition-colors">{flight.callsign}</h4>
                                        <div className={`text-[10px] uppercase font-mono tracking-widest px-2 py-1 border ${colorClass}`}>
                                            {badgeLabel}
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-brand-500 font-mono text-xs mb-4">
                                        <span>{flight.route}</span>
                                        <span>Est. Delay: {flight.predicted_delay} min</span>
                                    </div>

                                    <div className="flex justify-between items-center mt-6">
                                        <span className="text-[10px] font-mono text-brand-500 uppercase tracking-widest">Threat Index: <span className="text-white">{threat}</span></span>
                                        <Link href={`/manager/predict?flight=${flight.callsign}`} className="text-white font-mono text-[10px] uppercase tracking-[0.2em] hover:text-accent-neon transition-colors flex items-center gap-2">
                                            Open Predictor <Activity className="w-3 h-3 group-hover:animate-pulse" />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
}
