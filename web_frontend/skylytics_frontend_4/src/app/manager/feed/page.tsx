"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLiveFeed } from "@/hooks/useLiveFeed";

interface FeedItem {
    id: string;
    flight: string;
    route: string;
    status: string;
    timestamp: string;
    type: "delay" | "cleared" | "board";
}



export default function FlightFeedPage() {
    const auth = useAuth();
    const { feed, dataSource, loading } = useLiveFeed(auth?.airportCode || null);

    return (
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-10">
            <div className="w-full max-w-4xl">
            <div className="border-b border-[var(--border-ui)] pb-6 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">Live Network Feed</h1>
                    <p className="text-brand-500 font-mono text-xs uppercase tracking-widest mt-2">
                        {auth?.airportCode
                            ? `SHOWING: ${auth.airportCode} OPERATIONS`
                            : "Real-time synchronized flight anomalies and resolutions"}
                    </p>
                </div>
                <div className={`font-mono text-xs flex items-center gap-2 px-3 py-1.5 border ${dataSource === "LIVE" ? "border-accent-neon/30 text-accent-neon bg-accent-neon/5" : "border-yellow-400/30 text-yellow-400 bg-yellow-400/5"}`}>
                    <span className={`w-2 h-2 rounded-sm animate-pulse ${dataSource === "LIVE" ? "bg-accent-neon" : "bg-yellow-400"}`} />
                    {dataSource === "LIVE" ? "LIVE SYNC ACTIVE" : "LOCAL DEMO MODE"}
                </div>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {feed.length === 0 ? (
                        <motion.div exit={{ opacity: 0 }} className="text-center py-20 font-mono text-brand-500 text-sm uppercase tracking-widest border border-white/5 border-dashed">
                            Awaiting Feed Transmission...
                        </motion.div>
                    ) : feed.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: "auto" }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-5 flex items-center justify-between group hover:border-white/30 transition-colors cursor-pointer">

                                <div className="flex items-center gap-6">
                                    <div className="text-brand-500 font-mono text-[10px] w-16">{item.timestamp}</div>
                                    <div className="font-heading font-black text-xl text-white w-24">{item.flight}</div>
                                    <div className="font-mono text-sm uppercase tracking-widest text-brand-400 w-32">{item.route}</div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className={`font-mono text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 border
                                        ${item.type === "delay" ? "border-accent-alert text-accent-alert" :
                                          item.type === "cleared" ? "border-white/20 text-white" :
                                          "border-accent-neon text-accent-neon"}`}
                                    >
                                        {item.status}
                                    </div>
                                    <span className="text-brand-700 font-mono group-hover:text-white transition-colors">→</span>
                                </div>

                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            </div>
        </div>
    );
}
