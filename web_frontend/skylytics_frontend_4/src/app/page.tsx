"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const ROUTES = [
    { path: "M -60 180 Q 300 40, 660 120",  duration: 14, delay: 0,   color: "#DFFF00" },
    { path: "M -60 320 Q 250 100, 760 80",   duration: 18, delay: 3,   color: "#DFFF00" },
    { path: "M 760 60  Q 400 260, -60 400",  duration: 16, delay: 6,   color: "#fbbf24" },
    { path: "M -60 500 Q 350 300, 760 260",  duration: 20, delay: 1,   color: "#DFFF00" },
    { path: "M 760 420 Q 450 200, -60 140",  duration: 22, delay: 9,   color: "#f87171" },
    { path: "M 200 -40 Q 350 200, 560 560",  duration: 19, delay: 4,   color: "#DFFF00" },
];

const TAGS = [
    { label: "ATL — High Congestion",  top: "15%", left: "68%", color: "text-accent-alert border-accent-alert/30 bg-accent-alert/5",  delay: 0   },
    { label: "ORD — Storm Advisory",   top: "65%", left: "10%", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",        delay: 3   },
    { label: "JFK — Model Active",     top: "72%", left: "62%", color: "text-accent-neon border-accent-neon/30 bg-accent-neon/5",     delay: 6   },
    { label: "LAX — On Schedule",      top: "28%", left: "6%",  color: "text-accent-neon border-accent-neon/30 bg-accent-neon/5",     delay: 8.5 },
];

function FlightBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>

            {/* Dot grid */}
            <div
                className="absolute inset-0 opacity-[0.04]"
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

function StatsStrip() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            try {
                const data = await import("@/lib/api").then(m => m.getSystemStatus());
                setStats(data);
            } catch (err) {
                console.error("Stats fetch failed", err);
            } finally {
                setLoading(false);
            }
        }
        fetch();
        const interval = setInterval(fetch, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) return (
        <div className="flex gap-12 mt-16 border-t border-white/5 pt-12 opacity-20">
            <div className="w-24 h-8 bg-white/10 animate-pulse" />
            <div className="w-24 h-8 bg-white/10 animate-pulse" />
            <div className="w-24 h-8 bg-white/10 animate-pulse" />
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:flex md:flex-wrap gap-x-16 gap-y-8 mt-16 border-t border-white/5 pt-12"
        >
            <div className="flex flex-col">
                <span className="font-mono text-[10px] text-brand-500 uppercase tracking-widest mb-1">Global Airspace Nodes</span>
                <span className="text-3xl font-heading font-black text-white">{stats?.live_flights ?? 0}</span>
            </div>
            <div className="flex flex-col">
                <span className="font-mono text-[10px] text-brand-500 uppercase tracking-widest mb-1">Anomalies Detected</span>
                <span className="text-3xl font-heading font-black text-accent-neon">{stats?.active_anomalies ?? 0}</span>
            </div>
            <div className="flex flex-col">
                <span className="font-mono text-[10px] text-brand-500 uppercase tracking-widest mb-1">Inference Latency</span>
                <span className="text-3xl font-heading font-black text-brand-300">{stats?.inference_latency_ms ?? 0}ms</span>
            </div>
            <div className="flex flex-col">
                <span className="font-mono text-[10px] text-brand-500 uppercase tracking-widest mb-1">Uptime Status</span>
                <span className="text-3xl font-heading font-black text-white px-2 border border-white/10">LIVE</span>
            </div>
        </motion.div>
    );
}
export default function MarketingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-[var(--ch-brand-900)] flex flex-col relative overflow-hidden">
      <Navbar />

      <FlightBackground />

      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col justify-center px-8 md:px-12 xl:px-0 relative z-10 pt-32 pb-24">

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          {/* Subtle Technical Tag */}
          <div className="flex items-center gap-4 mb-8">
            <span className="w-8 h-px bg-accent-neon opacity-70 block" />
            <span className="font-mono text-accent-neon text-xs uppercase tracking-[0.3em]">Neural Ops Active</span>
          </div>

          {/* Brutalist Heading */}
          <h1 className="text-5xl md:text-8xl xl:text-[7.5rem] font-heading font-black tracking-tighter text-white leading-[0.85] mb-8 uppercase">
            Predict <br />
            <span className="text-brand-300">Chaos.</span>
            <br />
            Deliver <br />
            <span className="text-accent-neon outline-text">Certainty.</span>
          </h1>

          <p className="text-xl md:text-2xl text-brand-300 font-sans max-w-2xl mb-12 leading-relaxed">
            Eliminate operational blackout. Harness raw SHAP-assisted neural arrays to decode global aviation friction points in real time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Link 
              href="/manager"
              className="bg-white text-brand-950 font-heading font-bold uppercase tracking-wider px-8 py-5 hover:bg-accent-neon transition-colors duration-300 flex items-center justify-center gap-3 group"
            >
              <span>Manager Portal</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/passenger" className="border border-white/30 text-white font-heading font-bold uppercase tracking-wider px-8 py-5 hover:bg-white hover:text-brand-950 transition-colors duration-300 flex items-center justify-center gap-3 group">
              <span>Passenger Tracker</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {mounted && <StatsStrip />}
        </motion.div>

      </main>
    </div>
  );
}
