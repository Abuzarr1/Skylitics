"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLiveFeed } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface FeedItem {
    id: string;
    flight: string;
    route: string;
    status: string;
    timestamp: string;
    type: "delay" | "cleared" | "board";
}

const POLL_INTERVAL = 30_000;

const MOCK_FEED: FeedItem[] = [
    { id: "m1", flight: "DL192", route: "ATL → JFK", status: "DELAYED +34 MIN",  timestamp: "08:14", type: "delay"   },
    { id: "m2", flight: "AA505", route: "ORD → LAX", status: "AT RISK",           timestamp: "08:21", type: "delay"   },
    { id: "m3", flight: "UA301", route: "DFW → SFO", status: "BOARDING",          timestamp: "08:35", type: "board"   },
    { id: "m4", flight: "B6112", route: "JFK → MIA", status: "CLEARED",           timestamp: "08:47", type: "cleared" },
    { id: "m5", flight: "SW640", route: "DEN → SEA", status: "DELAYED +18 MIN",   timestamp: "09:02", type: "delay"   },
    { id: "m6", flight: "WN210", route: "LAS → PHX", status: "ON TIME",           timestamp: "09:11", type: "board"   },
    { id: "m7", flight: "DL788", route: "SEA → ATL", status: "CLEARED",           timestamp: "09:23", type: "cleared" },
    { id: "m8", flight: "AA122", route: "MIA → ORD", status: "AT RISK",           timestamp: "09:37", type: "delay"   },
];

export default function FlightFeedPage() {
    const auth = useAuth();
    const [feed, setFeed] = useState<FeedItem[]>(MOCK_FEED);
    const [connected, setConnected] = useState(false);

    const fetchFeed = useCallback(async () => {
        try {
            const data: FeedItem[] = await getLiveFeed();
            setFeed(data?.length ? data : MOCK_FEED);
            setConnected(true);
        } catch {
            setFeed(MOCK_FEED);
            setConnected(false);
        }
    }, []);

    useEffect(() => {
        fetchFeed();
        const interval = setInterval(fetchFeed, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchFeed]);

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
                <div className={`font-mono text-xs flex items-center gap-2 ${connected ? "text-accent-neon" : "text-accent-alert"}`}>
                    <span className={`w-2 h-2 rounded-sm animate-pulse ${connected ? "bg-accent-neon" : "bg-accent-alert"}`} />
                    {connected ? "connected" : "reconnecting..."}
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
