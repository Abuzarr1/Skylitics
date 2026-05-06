"use client";
import React from "react";
import { motion } from "framer-motion";
import { 
    Cpu, 
    Database, 
    Share2, 
    Shield, 
    Zap, 
    Radio, 
    Layers, 
    Search,
    ChevronRight,
    Terminal
} from "lucide-react";

const Node = ({ icon: Icon, title, desc, status, x, y, delay = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay }}
        className="absolute w-64 p-5 bg-[var(--bg-card)] border border-[var(--border-ui)] group hover:border-accent-neon transition-colors z-20"
        style={{ left: x, top: y }}
    >
        <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[var(--ch-brand-900)] border border-white/5 flex items-center justify-center text-accent-neon group-hover:bg-accent-neon group-hover:text-brand-900 transition-colors">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-sm font-heading font-black text-white uppercase tracking-tighter">{title}</h3>
                <p className="text-[8px] font-mono text-brand-500 uppercase tracking-widest leading-none">{status}</p>
            </div>
        </div>
        <p className="text-[10px] font-mono text-brand-400 uppercase leading-relaxed tracking-wider">
            {desc}
        </p>
        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Search className="w-3 h-3 text-accent-neon" />
        </div>
    </motion.div>
);

const Connection = ({ startX, startY, endX, endY, delay = 0 }: any) => {
    const path = `M ${startX} ${startY + 40} L ${startX + 50} ${startY + 40} L ${startX + 50} ${endY + 40} L ${endX} ${endY + 40}`;
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ pointerEvents: 'none' }}>
            <motion.path
                d={path}
                fill="none"
                stroke="white"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.1 }}
                transition={{ duration: 1.5, delay, ease: "easeInOut" }}
            />
            <motion.circle
                r="3"
                fill="#DFFF00"
                initial={{ offset: 0, opacity: 0 }}
                animate={{ 
                    offset: [0, 1],
                    opacity: [0, 1, 1, 0]
                }}
                transition={{ 
                    duration: 2, 
                    delay: delay + 1, 
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <animateMotion
                    path={path}
                    dur="2s"
                    repeatCount="indefinite"
                />
            </motion.circle>
        </svg>
    );
};

export default function ArchitecturePage() {
    return (
        <div className="max-w-[1600px] mx-auto px-10 py-10 selection:bg-accent-neon selection:text-black">
            {/* Header Area */}
            <div className="mb-12 border-b border-white/5 pb-8 flex justify-between items-end">
                <div>
                    <div className="font-mono text-accent-neon text-[10px] uppercase tracking-[0.4em] mb-4 flex items-center gap-4">
                        <span className="w-12 h-px bg-accent-neon" /> SYSTEM_BLUEPRINT_V4.0
                    </div>
                    <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tighter uppercase text-white leading-none">
                        Core <span className="text-brand-300">Architecture</span>
                    </h1>
                </div>
                <div className="hidden lg:flex items-center gap-10 text-right">
                    <div>
                        <div className="text-[10px] font-mono text-brand-500 uppercase tracking-widest">Global Matrix</div>
                        <div className="text-white font-mono text-xs font-bold uppercase">Active Vectors: 1,242</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-mono text-brand-500 uppercase tracking-widest">Neural Health</div>
                        <div className="text-accent-neon font-mono text-xs font-bold uppercase tracking-wider">Operational</div>
                    </div>
                </div>
            </div>

            {/* Visualizer Container */}
            <div className="relative h-[800px] bg-[var(--bg-card)]/30 border border-white/5 overflow-hidden group">
                {/* Background Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
                
                {/* Scanline Overlay */}
                <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,2px_100%]" />

                {/* Nodes & Connections (Conceptual Layout) */}
                <Connection startX={100} startY={100} endX={450} endY={250} delay={0.2} />
                <Connection startX={100} startY={300} endX={450} endY={250} delay={0.4} />
                <Connection startX={100} startY={500} endX={450} endY={250} delay={0.6} />
                
                <Connection startX={450} startY={250} endX={800} endY={250} delay={1.2} />
                <Connection startX={800} startY={250} endX={1150} endY={100} delay={1.8} />
                <Connection startX={800} startY={250} endX={1150} endY={400} delay={2.0} />

                {/* Data Fabric Layer */}
                <Node 
                    icon={Radio} 
                    title="LIVE FLIGHT FEED" 
                    desc="Captures real-time aircraft positions and velocities from a global network of sensors." 
                    status="SYNCING_LIVE" 
                    x={100} y={100}
                    delay={0.1}
                />
                <Node 
                    icon={Radio} 
                    title="WEATHER INTELLIGENCE" 
                    desc="Integrates global atmospheric telemetry including wind, visibility, and severe storm alerts." 
                    status="OPERATIONAL" 
                    x={100} y={300}
                    delay={0.3}
                />
                <Node 
                    icon={Database} 
                    title="AIRLINE RECORDS" 
                    desc="Synchronizes with official carrier schedules and historical flight logs." 
                    status="ACTIVE_SOCKET" 
                    x={100} y={500}
                    delay={0.5}
                />

                {/* Inference Core */}
                <div className="absolute left-[450px] top-[250px] -translate-x-1/2 w-80 p-8 border-2 border-accent-neon bg-[var(--ch-brand-900)]/80 backdrop-blur-xl z-30 shadow-[0_0_50px_rgba(223,255,0,0.1)]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-accent-neon flex items-center justify-center text-brand-900">
                            <Cpu className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-heading font-black text-white uppercase tracking-tighter">AI BRAIN</h2>
                            <p className="text-[10px] font-mono text-accent-neon uppercase animate-pulse">Inference Active</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-ui)] font-mono text-[10px] text-brand-300 uppercase leading-relaxed">
                            <span className="text-accent-neon">▸</span> PREDRCTION_ENGINE_V4.0<br />
                            <span className="text-accent-neon">▸</span> XAI_REASONING_LAYER<br />
                            <span className="text-accent-neon">▸</span> REALTIME_VECTOR_RISK
                        </div>
                        <div className="flex justify-between items-center text-[8px] font-mono text-brand-500 uppercase tracking-widest">
                            <span>Latency: 24ms</span>
                            <span>Accuracy: 94.2%</span>
                        </div>
                    </div>
                </div>

                {/* Delivery Layer */}
                <Node 
                    icon={Layers} 
                    title="DATA PROCESSOR" 
                    desc="Handles complex data transformation and prepares it for the visual dashboard." 
                    status="PROCESSING" 
                    x={800} y={250}
                    delay={1.5}
                />

                {/* Edge Nodes */}
                <Node 
                    icon={Terminal} 
                    title="ADMIN COMMAND" 
                    desc="The primary high-fidelity operational center for airline management." 
                    status="READY" 
                    x={1150} y={100}
                    delay={2.1}
                />
                <Node 
                    icon={Share2} 
                    title="PASSENGER APP" 
                    desc="The final consumer-facing endpoint for public flight tracking." 
                    status="ENCRYPTED" 
                    x={1150} y={400}
                    delay={2.3}
                />
            </div>

            {/* Tech Spec Cards */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 border border-[var(--border-ui)] bg-[var(--bg-card)]/40 hover:bg-[var(--bg-card)] transition-colors cursor-default">
                    <div className="w-8 h-8 rounded-full bg-accent-neon shadow-[0_0_15px_rgba(223,255,0,0.4)] mb-6 flex items-center justify-center text-brand-900">
                        <Zap className="w-4 h-4" />
                    </div>
                    <h4 className="text-lg font-heading font-black text-white uppercase mb-3">How it Works</h4>
                    <p className="text-[11px] font-mono text-brand-500 uppercase tracking-wider leading-relaxed">
                        Raw flight vectors and weather data are normalized into a "Neural Matrix" which the AI Brain uses to predict delays in milliseconds.
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/5 font-mono text-[9px] text-accent-neon uppercase tracking-widest">
                        Operational Logic: Real-time Synthesis
                    </div>
                </div>
                <div className="p-8 border border-[var(--border-ui)] bg-[var(--bg-card)]/40 hover:bg-[var(--bg-card)] transition-colors cursor-default">
                    <div className="w-8 h-8 rounded-full bg-accent-ice shadow-[0_0_15px_rgba(165,243,252,0.4)] mb-6 flex items-center justify-center text-brand-900">
                        <Shield className="w-4 h-4" />
                    </div>
                    <h4 className="text-lg font-heading font-black text-white uppercase mb-3">AI Explainability</h4>
                    <p className="text-[11px] font-mono text-brand-500 uppercase tracking-wider leading-relaxed">
                        The system doesn't just give a number; it explains WHY a flight is delayed by showing which factors (Weather, Route, Airline) had the biggest impact.
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/5 font-mono text-[9px] text-accent-ice uppercase tracking-widest">
                        Technical Logic: SHAP Reasoning
                    </div>
                </div>
                <div className="p-8 border border-[var(--border-ui)] bg-[var(--bg-card)]/40 hover:bg-[var(--bg-card)] transition-colors cursor-default">
                    <div className="w-full h-full text-left group flex flex-col items-start">
                        <div className="w-8 h-8 border border-white/20 mb-6 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                        <h4 className="text-lg font-heading font-black text-white uppercase mb-3">System Scalability</h4>
                        <p className="text-[11px] font-mono text-brand-500 uppercase tracking-wider leading-relaxed">
                            Designed to handle thousands of concurrent flight vectors. The modular architecture allows for new data sources (like satellite telemetry) to be added instantly.
                        </p>
                        <div className="mt-4 pt-4 border-t border-white/5 font-mono text-[9px] text-white uppercase tracking-widest">
                            Infrastructure Logic: Modular Edge
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
