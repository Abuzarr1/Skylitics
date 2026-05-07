
"use client";
import React, { useState, useEffect } from "react";
import { Activity, ShieldAlert, Zap, Globe, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { LoadingRadar } from "@/components/ui/LoadingRadar";
import { getAllAirportStats, getFeedItems, getDelayByDate, getAirportStats } from "@/lib/csvUtils";
import { useMockData } from "@/lib/useMockData";
import { useAuth } from "@/hooks/useAuth";

export default function ManagerDashboard() {
    const auth = useAuth();
    const airportCode = auth?.airportCode || 'SEA';
    const { rows, loading } = useMockData(airportCode);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const stats = getAirportStats(airportCode, rows);
    const recentFeed = getFeedItems(rows).slice(0, 6);
    const trendData = getDelayByDate(rows, airportCode).map(d => ({ 
        label: d.date, 
        value: Math.round(d.delayRate * 100) 
    }));

    if (loading) return <LoadingRadar text="SYNCHRONIZING GLOBAL OPERATIONS..." />;

    return (
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-10">
            {/* Page Header */}
            <div className="mb-12 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-neon shadow-[0_0_8px_#DFFF00]" />
                    <span className="font-mono text-[10px] text-brand-500 uppercase tracking-[0.3em] font-bold">Live Sync Active</span>
                </div>
                <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tighter">
                    {airportCode} Airport Dashboard
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-8">
                    {/* 4-Metric Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 bg-brand-950 border border-white/5 divide-x divide-white/5">
                        {[
                            { label: "Active Nodes", val: "1899", sub: "+12.4%", subColor: "text-brand-500" },
                            { label: "High Risk", val: "784", sub: "CRITICAL", subColor: "text-accent-alert" },
                            { label: "Est. Impact", val: "5.3m", sub: "AVERAGE", subColor: "text-accent-neon" },
                            { label: "Net Sync", val: "58.7%", sub: "OPTIMAL", subColor: "text-brand-500" }
                        ].map((metric, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className="p-8 group"
                            >
                                <div className="font-mono text-[9px] text-brand-600 uppercase tracking-[0.2em] mb-6 font-bold">{metric.label}</div>
                                <div className={`text-4xl font-heading font-black tracking-tighter mb-2 ${i === 2 ? 'text-accent-neon' : i === 1 ? 'text-accent-alert' : 'text-white'}`}>
                                    {metric.val}
                                </div>
                                <div className={`text-[9px] font-mono uppercase tracking-widest ${metric.subColor} font-bold`}>{metric.sub}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Chart Panel */}
                    <div className="bg-brand-950 border border-white/5 p-8 h-[500px] flex flex-col relative">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-xl font-heading font-black text-white uppercase tracking-tight">Delay Probability Distribution</h2>
                                <p className="text-brand-600 font-mono text-[9px] uppercase tracking-widest mt-1.5 font-bold">Avg Delay (min) by hour of day</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-accent-neon animate-pulse" />
                                <span className="font-mono text-[9px] text-brand-500 uppercase tracking-widest">Live Sync</span>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#DFFF00" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#DFFF00" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                                    <XAxis dataKey="label" stroke="#333" fontSize={8} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#333" fontSize={8} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} dx={-10} />
                                    <Tooltip 
                                        contentStyle={{ background: '#050505', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0', fontSize: '9px', fontFamily: 'JetBrains Mono' }}
                                        itemStyle={{ color: '#DFFF00' }}
                                        cursor={{ stroke: '#DFFF00', strokeWidth: 1 }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#DFFF00" 
                                        strokeWidth={1.5} 
                                        fill="url(#colorValue)" 
                                        animationDuration={2000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Anomalies */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h3 className="font-mono text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em]">Live Route Anomalies</h3>
                    </div>
                    <div className="space-y-3">
                        {recentFeed.map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                className="bg-brand-950 border border-white/5 p-5 group hover:border-white/10 transition-colors cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-heading font-black text-white text-lg tracking-tight uppercase">{item.flightNumber}</span>
                                    <span className="font-mono text-[8px] text-brand-600 border border-white/10 px-2 py-0.5 uppercase tracking-widest">Scheduled</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="font-mono text-[10px] text-brand-400 uppercase tracking-widest">
                                            {item.origin} → {item.destination}
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-[9px] text-brand-500 uppercase tracking-widest">Est. Delay</div>
                                            <div className="font-mono text-[10px] text-white font-bold">{item.delayMinutes} min</div>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                        <div className="font-mono text-[8px] text-brand-600 uppercase tracking-widest flex items-center gap-1.5">
                                            Threat Index: <span className="text-accent-neon">Low</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-brand-400 font-mono text-[8px] uppercase tracking-widest group-hover:text-accent-neon transition-colors">
                                            Open Predictor <ArrowUpRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
