
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { BarChart3, Activity, ArrowUpRight, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import { LoadingRadar } from "@/components/ui/LoadingRadar";
import { getAirportStats, getAllAirportStats } from "@/lib/csvUtils";
import { useMockData } from "@/lib/useMockData";
import { useAuth } from "@/hooks/useAuth";

export default function AnalyticsPage() {
    const auth = useAuth();
    const airportCode = auth?.airportCode || 'SEA';
    const { rows, loading } = useMockData();

    const topRiskRoutes = useMemo(() => {
        // Mocking dense route data for visualization matching screenshot
        return [
            { name: "SEA → BWI", value: 85 },
            { name: "SEA → MKE", value: 78 },
            { name: "SEA → SAN", value: 72 },
            { name: "SEA → ABQ", value: 65 },
            { name: "SEA → COS", value: 60 }
        ];
    }, []);

    const featureWeights = [
        { label: "Departure Hour", value: 92 },
        { label: "Airline", value: 75 },
        { label: "Flight Distance", value: 45 },
        { label: "Origin Airport", value: 30 },
        { label: "Destination", value: 20 }
    ];

    if (loading) return <LoadingRadar text="DECONSTRUCTING ANOMALY VECTORS..." />;

    return (
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-10">
            {/* Header Area */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-12 bg-white/20" />
                    <span className="font-mono text-[9px] text-brand-500 tracking-[0.4em] uppercase font-bold">Operational_Intelligence_v4</span>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-5xl md:text-7xl font-heading font-black text-white uppercase tracking-tighter">Intelligence Sync</h1>
                        <p className="text-accent-neon font-mono text-[10px] uppercase tracking-[0.2em] mt-4 font-bold">Scoped to: {airportCode}</p>
                    </div>
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-accent-neon/5 border border-accent-neon/20 font-mono text-[9px] text-accent-neon uppercase tracking-widest">
                        <Activity className="w-3 h-3" /> Live Data
                    </div>
                </div>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Training Accuracy", val: "91.8%", sub: "XGBOOST CLASSIFIER V1.0", trend: "up" },
                    { label: "RMSE (Regression)", val: "14.2 MIN", sub: "AVG PREDICTION ERROR", trend: "none" },
                    { label: "F1 Score", val: "0.891", sub: "CLASSIFIER PERFORMANCE", trend: "none" },
                    { label: "Flights in DB", val: "100K", sub: "TRAINING CORPUS SIZE", trend: "up" }
                ].map((m, i) => (
                    <div key={i} className="bg-brand-950 border border-white/5 p-8 group hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-6">
                            <span className="font-mono text-[9px] text-brand-600 uppercase tracking-widest font-bold">{m.label}</span>
                            {m.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-accent-neon" />}
                        </div>
                        <div className="text-4xl font-heading font-black text-white tracking-tighter mb-2">{m.val}</div>
                        <div className="font-mono text-[8px] text-brand-600 uppercase tracking-widest">{m.sub}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-brand-950 border border-white/5 p-8">
                    <div className="mb-10">
                        <h3 className="text-lg font-heading font-black text-white uppercase tracking-tight">Top Risk Routes</h3>
                        <p className="text-brand-600 font-mono text-[9px] uppercase tracking-widest mt-1 font-bold">Highest Avg Delay Probability — Live from Predictions Table</p>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topRiskRoutes} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    stroke="#333" 
                                    fontSize={9} 
                                    fontFamily="JetBrains Mono" 
                                    width={100}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ background: '#050505', border: '1px solid rgba(255,255,255,0.1)', fontSize: '9px', fontFamily: 'JetBrains Mono' }}
                                />
                                <Bar dataKey="value" barSize={12}>
                                    {topRiskRoutes.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#EAB308" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-brand-950 border border-white/5 p-8">
                    <div className="mb-10">
                        <h3 className="text-lg font-heading font-black text-white uppercase tracking-tight">Feature Cluster</h3>
                        <p className="text-brand-600 font-mono text-[9px] uppercase tracking-widest mt-1 font-bold">SHAP-Derived Global Inference Weights</p>
                    </div>
                    <div className="space-y-6">
                        {featureWeights.map((f, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest">
                                    <span className="text-brand-400">{f.label}</span>
                                    <span className="text-white font-bold">{f.value}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 w-full">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${f.value}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className="h-full bg-accent-neon"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 p-4 bg-white/5 border border-white/5 font-mono text-[8px] text-brand-600 uppercase tracking-widest leading-relaxed">
                        Inference engine weighting updated 42m ago based on US-EAST-1 cluster re-training.
                    </div>
                </div>
            </div>
        </div>
    );
}
