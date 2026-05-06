
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Radio, Search } from "lucide-react";
import { LoadingRadar } from "@/components/ui/LoadingRadar";
import { getFeedItems } from "@/lib/csvUtils";
import { useData } from "@/lib/useData";

export default function LiveFeedPage() {
    const { rows, loading } = useData();
    const [search, setSearch] = useState("");

    const feedItems = useMemo(() => {
        const items = getFeedItems(rows);
        if (!search) return items;
        return items.filter(item => 
            item.flightNumber.toLowerCase().includes(search.toLowerCase()) ||
            item.origin.toLowerCase().includes(search.toLowerCase()) ||
            item.destination.toLowerCase().includes(search.toLowerCase())
        );
    }, [rows, search]);

    if (loading) return <LoadingRadar text="INTERCEPTING NETWORK LOGS..." />;

    return (
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-10">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <Radio className="w-5 h-5 text-accent-neon" />
                        <span className="font-mono text-[10px] text-accent-ice tracking-[0.4em] uppercase">Operations Feed</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-heading font-black text-white uppercase tracking-tighter">Live Network Log</h1>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500" />
                    <input 
                        type="text"
                        placeholder="FILTER BY CALLSIGN OR NODE..."
                        className="bg-[var(--bg-card)] border border-white/5 pl-12 pr-6 py-3 font-mono text-[10px] text-white focus:outline-none focus:border-accent-neon/50 w-full md:w-80 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border border-white/5 bg-[var(--bg-card)]/30 overflow-hidden">
                <table className="w-full text-left font-mono text-[10px] uppercase tracking-widest">
                    <thead className="bg-white/5 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4 text-brand-500 font-bold">Vector</th>
                            <th className="px-6 py-4 text-brand-500 font-bold">Route</th>
                            <th className="px-6 py-4 text-brand-500 font-bold">Scheduled</th>
                            <th className="px-6 py-4 text-brand-500 font-bold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {feedItems.map((item, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-5 font-bold text-white">{item.flightNumber}</td>
                                <td className="px-6 py-5 text-brand-400">{item.origin} → {item.destination}</td>
                                <td className="px-6 py-5 text-brand-400">{item.scheduledTime}</td>
                                <td className="px-6 py-5">
                                    <span className={`px-2 py-1 border ${item.status === 'delayed' ? 'text-accent-alert border-accent-alert/30 bg-accent-alert/5' : 'text-accent-neon border-accent-neon/30 bg-accent-neon/5'}`}>
                                        {item.status.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
