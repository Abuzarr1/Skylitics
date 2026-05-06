
"use client";
import React, { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { LoadingRadar } from "@/components/ui/LoadingRadar";
import { getAllAirportStats, getFeedItems, getDelayByDate, getAirportStats } from "@/lib/csvUtils";
import { useFlightData } from "@/lib/useFlightData";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";

export default function ManagerDashboard() {
    const auth = useAuth();
    const airportCode = auth?.airportCode || 'ATL';
    const { rows, loading } = useFlightData(airportCode);
    const [mounted, setMounted] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    const stats = getAirportStats(airportCode, rows);
    const topRiskAirports = getAllAirportStats(rows).sort((a, b) => b.delayRate - a.delayRate).slice(0, 3);
    const recentFeed = getFeedItems(rows).slice(0, 5);
    const trendData = getDelayByDate(rows, airportCode).map(d => ({ label: d.date, value: Math.round(d.delayRate * 100) }));

    if (loading) return <LoadingRadar text="SYNCHRONIZING GLOBAL OPERATIONS..." />;

    return (
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-10">
            <div className="mb-8 flex items-center gap-4">
                <h1 className="font-mono font-black text-2xl uppercase tracking-widest text-white">
                    {auth?.airportCode ? `${auth.airportCode} AIRPORT DASHBOARD` : "OPERATIONS DASHBOARD"}
                </h1>
                <span className="font-mono text-[9px] uppercase tracking-widest text-accent-neon animate-pulse flex items-center gap-2 px-3 py-1 bg-accent-neon/5 border border-accent-neon/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-neon shadow-[0_0_8px_var(--accent-neon)]" /> 
                    Live Sync Active
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 border border-[var(--border-ui)] bg-[var(--bg-card)]">
                        {[
                            { label: "Total Flights", val: stats.totalFlights.toString(), sub: "Network Wide", glow: "text-white" },
                            { label: "Delayed", val: stats.delayed.toString(), sub: "Current Session", glow: "text-accent-alert" },
                            { label: "On-Time Rate", val: (stats.onTime / (stats.totalFlights || 1) * 100).toFixed(1) + '%', sub: "Optimal", glow: "text-accent-neon" },
                            { label: "Avg Delay", val: `${stats.avgDelayMinutes}m`, sub: "Latency", glow: "text-white" }
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
                        ))}
                    </div>

                    <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-8 h-[400px] flex flex-col relative group hover:border-[var(--border-ui)]/50 transition-colors">
                        <div className="flex justify-between items-start mb-6 border-b border-[var(--border-ui)] pb-4">
                            <div>
                                <h2 className="text-xl font-heading font-black text-white uppercase tracking-tighter">Delay Probability Distribution</h2>
                                <p className="text-brand-500 font-mono text-[10px] uppercase tracking-widest mt-1">Probability (%) by date</p>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#DFFF00" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#DFFF00" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="label" stroke="#4a5568" fontSize={9} fontFamily="monospace" tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#4a5568" fontSize={9} fontFamily="monospace" tickLine={false} axisLine={false} dx={-10} unit="%" />
                                    <Tooltip 
                                        contentStyle={{ background: '#0a0c10', border: '1px solid #ffffff10', borderRadius: '0', fontSize: '10px', fontFamily: 'monospace' }}
                                        itemStyle={{ color: '#DFFF00' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#DFFF00" strokeWidth={2} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-brand-900 border border-[var(--border-ui)] p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="w-4 h-4 text-accent-alert" />
                            <h3 className="font-mono text-xs font-black text-white uppercase tracking-widest">High Risk Nodes</h3>
                        </div>
                        <div className="space-y-4">
                            {topRiskAirports.map((airport, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-brand-950 border border-white/5">
                                    <span className="font-mono text-sm text-white font-bold">{airport.code}</span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-accent-alert font-mono text-[10px] font-black">{(airport.delayRate * 100).toFixed(1)}% RISK</span>
                                        <span className="text-brand-500 font-mono text-[8px] uppercase tracking-widest">{airport.delayed} DELAYS</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-mono text-xs font-black text-white uppercase tracking-widest">Live Feed Preview</h3>
                            <Link href="/manager/feed" className="text-[10px] font-mono uppercase text-brand-500 hover:text-accent-neon transition-colors">View All</Link>
                        </div>
                        <div className="space-y-4">
                            {recentFeed.map((item, i) => (
                                <div key={i} className="border-l-2 border-white/5 pl-4 py-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-mono text-[10px] text-white font-bold">{item.flightNumber}</span>
                                        <span className={`text-[8px] font-mono px-1.5 py-0.5 ${item.status === 'delayed' ? 'bg-accent-alert/10 text-accent-alert' : 'bg-accent-neon/10 text-accent-neon'}`}>
                                            {item.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="font-mono text-[9px] text-brand-500 uppercase tracking-widest">
                                        {item.origin} → {item.destination} | {item.scheduledTime}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
