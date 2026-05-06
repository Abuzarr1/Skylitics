
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { BarChart3, PieChart as PieIcon, TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { LoadingRadar } from "@/components/ui/LoadingRadar";
import { getDelayCauses, getDelayByDate } from "@/lib/csvUtils";
import { useFlightData } from "@/lib/useFlightData";

export default function AnalyticsPage() {
    const { rows, loading } = useFlightData();

    const causeData = useMemo(() => {
        const causes = getDelayCauses(rows);
        // Map to existing chart labels
        return causes.map(c => ({
            name: c.cause.replace('Delay', '').toUpperCase(),
            value: c.totalMinutes
        }));
    }, [rows]);

    const trendData = useMemo(() => {
        return getDelayByDate(rows).map(d => ({
            date: d.date,
            rate: Math.round(d.delayRate * 100)
        }));
    }, [rows]);

    const COLORS = ["#DFFF00", "#30363d", "#8b949e", "#4a5568", "#2d3748"];

    if (loading) return <LoadingRadar text="DECONSTRUCTING ANOMALY VECTORS..." />;

    return (
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-10">
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="w-5 h-5 text-accent-neon" />
                    <span className="font-mono text-[10px] text-accent-ice tracking-[0.4em] uppercase">Intelligence Sync</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-heading font-black text-white uppercase tracking-tighter">Root Cause Analysis</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[var(--bg-card)] border border-white/5 p-8">
                    <h3 className="text-xl font-heading font-black text-white uppercase tracking-tighter mb-8">Primary Delay Drivers</h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={causeData} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                                    {causeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ background: '#0a0c10', border: '1px solid #ffffff10', fontSize: '10px', fontFamily: 'monospace' }}
                                    itemStyle={{ color: '#DFFF00' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-white/5 p-8">
                    <h3 className="text-xl font-heading font-black text-white uppercase tracking-tighter mb-8">System Reliability Trend</h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="date" stroke="#4a5568" fontSize={9} fontFamily="monospace" />
                                <YAxis stroke="#4a5568" fontSize={9} fontFamily="monospace" unit="%" />
                                <Tooltip 
                                    contentStyle={{ background: '#0a0c10', border: '1px solid #ffffff10', fontSize: '10px', fontFamily: 'monospace' }}
                                    itemStyle={{ color: '#DFFF00' }}
                                />
                                <Bar dataKey="rate" fill="#DFFF00" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
