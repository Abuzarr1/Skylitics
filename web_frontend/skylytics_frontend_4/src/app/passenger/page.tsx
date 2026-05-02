"use client";
import React, { useState, useEffect } from "react";
import { Plane, Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PredictiveSearch } from "@/components/ui/PredictiveSearch";
import { getLiveFlights, getAtRiskFlights } from "@/lib/api";

const ROUTES = [
    { path: "M -60 180 Q 300 40, 660 120",  duration: 14, delay: 0,   color: "#DFFF00" },
    { path: "M -60 320 Q 250 100, 760 80",   duration: 18, delay: 3,   color: "#DFFF00" },
    { path: "M 760 60  Q 400 260, -60 400",  duration: 16, delay: 6,   color: "#fbbf24" },
    { path: "M -60 500 Q 350 300, 760 260",  duration: 20, delay: 1,   color: "#DFFF00" },
    { path: "M 760 420 Q 450 200, -60 140",  duration: 22, delay: 9,   color: "#f87171" },
    { path: "M 200 -40 Q 350 200, 560 560",  duration: 19, delay: 4,   color: "#DFFF00" },
];

const TAGS = [
    { label: "DL192 — On Time",    top: "18%", left: "72%", color: "text-accent-neon border-accent-neon/30 bg-accent-neon/5",  delay: 0 },
    { label: "AA505 — Delayed",    top: "62%", left: "12%", color: "text-accent-alert border-accent-alert/30 bg-accent-alert/5", delay: 2.5 },
    { label: "UA301 — At Risk",    top: "75%", left: "68%", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",      delay: 5 },
    { label: "B6112 — On Time",    top: "30%", left: "8%",  color: "text-accent-neon border-accent-neon/30 bg-accent-neon/5",  delay: 7 },
];

function FlightBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>

            {/* Dot grid */}
            <div className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}
            />

            {/* Radar pulse rings */}
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full border border-accent-neon/20"
                    style={{ width: i * 220, height: i * 220, top: "50%", left: "50%", x: "-50%", y: "-50%" }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.05, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, delay: i * 1.2, ease: "easeInOut" }}
                />
            ))}

            {/* Centre radar dot */}
            <motion.div
                className="absolute w-2 h-2 rounded-full bg-accent-neon"
                style={{ top: "50%", left: "50%", x: "-50%", y: "-50%" }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Flight path SVGs */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 700 600" preserveAspectRatio="xMidYMid slice">
                {ROUTES.map((route, i) => (
                    <g key={i}>
                        {/* Dashed route line */}
                        <motion.path
                            d={route.path}
                            fill="none"
                            stroke={route.color}
                            strokeWidth="1"
                            strokeDasharray="6 8"
                            strokeOpacity={0.15}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: route.duration * 0.6, delay: route.delay, ease: "easeInOut" }}
                        />

                        {/* Plane moving along path */}
                        <g opacity={0.7}>
                            <motion.text
                                fontSize="11"
                                fill={route.color}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                filter={`drop-shadow(0 0 4px ${route.color})`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 1, 0] }}
                                transition={{
                                    duration: route.duration,
                                    delay: route.delay,
                                    repeat: Infinity,
                                    repeatDelay: 2,
                                    ease: "linear",
                                    times: [0, 0.05, 0.9, 1],
                                }}
                            >
                                ✈
                                <animateMotion
                                    dur={`${route.duration}s`}
                                    begin={`${route.delay}s`}
                                    repeatCount="indefinite"
                                    path={route.path}
                                    rotate="auto"
                                />
                            </motion.text>
                        </g>
                    </g>
                ))}
            </svg>

            {/* Floating status tags */}
            {TAGS.map((tag, i) => (
                <motion.div
                    key={i}
                    className={`absolute font-mono text-[10px] uppercase tracking-widest border px-3 py-1.5 ${tag.color}`}
                    style={{ top: tag.top, left: tag.left }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -8] }}
                    transition={{
                        duration: 6,
                        delay: tag.delay + 1.5,
                        repeat: Infinity,
                        repeatDelay: 6,
                        ease: "easeInOut",
                        times: [0, 0.1, 0.8, 1],
                    }}
                >
                    {tag.label}
                </motion.div>
            ))}
        </div>
    );
}

export default function PassengerRoot() {
    const [flightId, setFlightId] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [networkAlert, setNetworkAlert] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Load real flight suggestions from live flights endpoint
        getLiveFlights()
            .then((flights: any[]) => {
                const mapped = flights.slice(0, 6).map((f: any, i: number) => ({
                    id: String(i + 1),
                    label: f.callsign,
                    category: "Flight",
                    meta: `${f.origin} ▸ ${f.destination} | ${
                        f.status === "delayed" ? `+${f.delay_minutes}m Delay` :
                        f.status === "at_risk"  ? "At Risk" : "On Time"
                    }`,
                }));
                setSuggestions(mapped);
            })
            .catch(() => {
                setSuggestions([]);
            });

        // Load real network alert from at-risk flights
        getAtRiskFlights(3)
            .then((flights: any[]) => {
                if (flights.length === 0) return;
                const topRoutes = flights.map((f: any) => f.route || f.callsign).join(", ");
                const maxDelay = Math.max(...flights.map((f: any) => f.predicted_delay || 0));
                setNetworkAlert(
                    `${flights.length} high-risk flights currently tracked: ${topRoutes}. ` +
                    `Skylytics models estimate up to ${maxDelay} min delays on affected routes.`
                );
            })
            .catch(() => setNetworkAlert(null));
    }, []);

    const saveToRecent = (f: any) => {
        const stored = localStorage.getItem("skylytics_recent_flights");
        let recent = stored ? JSON.parse(stored) : [];
        
        const newEntry = {
            flight: f.callsign || f,
            route: f.route || (f.origin && f.destination ? `${f.origin} → ${f.destination}` : "Active Vector"),
            status: (f.status || "ON TIME").toUpperCase(),
            timestamp: Date.now()
        };

        // Remove duplicates
        recent = recent.filter((r: any) => r.flight !== newEntry.flight);
        // Add to top
        recent.unshift(newEntry);
        // Max 5
        recent = recent.slice(0, 5);
        
        localStorage.setItem("skylytics_recent_flights", JSON.stringify(recent));
    };

    const handleSearch = (val: string) => {
        const flightCode = val.toUpperCase();
        if (flightCode) {
            const flightDetail = suggestions.find(s => s.label === flightCode);
            saveToRecent(flightDetail ? {
                callsign: flightDetail.label,
                route: flightDetail.meta?.split('|')[0].trim(),
                status: flightDetail.meta?.includes('Delay') ? 'DELAYED' : 
                        flightDetail.meta?.includes('Risk') ? 'AT RISK' : 'ON TIME'
            } : flightCode);
            
            router.push(`/passenger/flight/${flightCode}`);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--ch-brand-900)] flex flex-col relative overflow-hidden">

            <FlightBackground />

            {/* Navigation */}
            <nav className="w-full px-8 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-[var(--ch-brand-900)] border border-[var(--border-ui)] flex items-center justify-center">
                        <Plane className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-heading font-black text-white uppercase tracking-tight">Skylytics Public</span>
                </div>
                <div className="flex items-center gap-6">
                    <ThemeToggle />
                    <button onClick={() => router.push('/passenger/profile')} className="font-mono text-xs uppercase tracking-widest text-brand-500 hover:text-white transition-colors hidden sm:block">
                        Saved Flights
                    </button>
                    <Link href="/login" className="font-mono text-xs uppercase tracking-widest border border-accent-neon/60 text-accent-neon px-4 py-2 hover:bg-accent-neon hover:text-brand-950 transition-colors">
                        Sign In for Manager
                    </Link>
                </div>
            </nav>

            {/* Main Search */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-2xl text-center space-y-8"
                >
                    {/* Live indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center justify-center gap-3"
                    >
                        <span className="w-2 h-2 rounded-full bg-accent-neon animate-pulse" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-neon">Live Prediction Feed Active</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-heading font-black text-white uppercase tracking-tighter leading-[0.9]">
                        Track Your<br /><span className="text-accent-neon">Trajectory</span>
                    </h1>

                    <p className="text-brand-500 font-mono text-sm uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
                        Access predictive AI delay models translated for passenger visibility. Enter your flight designator below.
                    </p>

                    <div className="flex items-center w-full mt-10">
                        <PredictiveSearch
                            placeholder="Enter Flight Designator (e.g. DL192)"
                            onSearch={setFlightId}
                            onSubmit={handleSearch}
                            suggestions={suggestions}
                            className="flex-1"
                            required
                            pattern="[a-zA-Z]{2,3}\d+"
                        />
                        <button 
                            onClick={() => handleSearch(flightId)}
                            className="bg-foreground text-brand-900 px-8 py-[12px] font-bold uppercase hover:bg-accent-neon transition-colors group flex items-center justify-center h-full min-h-[46px]"
                        >
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Stats strip */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="grid grid-cols-2 sm:grid-cols-3 border border-[var(--border-ui)] bg-[var(--bg-card)]/60 backdrop-blur-sm"
                    >
                        {[
                            { label: "Flights Tracked", value: "100K+" },
                            { label: "Model Accuracy",  value: "91.8%" },
                            { label: "Avg Response",    value: "12ms"  },
                        ].map((stat, i) => (
                            <div key={i} className="p-4 text-center border-r border-[var(--border-ui)] last:border-0">
                                <div className="font-heading font-black text-xl text-white">{stat.value}</div>
                                <div className="font-mono text-[9px] uppercase tracking-widest text-brand-500 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>

                    <div className="flex items-center justify-center gap-3">
                        <span className="h-px flex-1 bg-white/10" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-brand-500">Are you airline staff?</span>
                        <Link href="/login" className="font-mono text-[10px] uppercase tracking-widest text-accent-neon hover:underline">
                            Register and Login with Email →
                        </Link>
                        <span className="h-px flex-1 bg-white/10" />
                    </div>

                    {networkAlert && (
                        <div className="text-left bg-[var(--bg-card)]/80 backdrop-blur-sm border-l-2 border-accent-ice p-6">
                            <h4 className="font-mono text-[10px] uppercase text-brand-500 tracking-widest mb-2">Network Alert</h4>
                            <p className="text-brand-300 font-mono text-xs leading-relaxed">
                                {networkAlert}
                            </p>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
