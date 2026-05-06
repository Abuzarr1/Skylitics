"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/marketing/Navbar";
import { Brain, Cpu, Layers, GitBranch, ArrowRight, ShieldCheck, Zap, Activity } from "lucide-react";
import XaiMatrix from "@/components/analytics/XaiMatrix";

function LabStats() {
    const [stats, setStats] = useState<any>(null);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        async function fetch() {
            try {
                const data = await import("@/lib/api").then(m => m.getSystemStatus());
                if (data) {
                    setStats(data);
                    setIsLive(true);
                }
            } catch {
                setIsLive(false);
            }
        }
        fetch();
    }, []);

    return (
        <div className="absolute bottom-0 right-24 p-10 border-l border-t border-[var(--border-ui)] hidden lg:block bg-[var(--ch-brand-900)]/50 backdrop-blur-xl">
            <div className="flex gap-12">
                <div className="space-y-1">
                    <div className="text-[10px] font-mono text-brand-500 uppercase tracking-widest flex items-center gap-2">
                        Model Precision
                        {isLive && <div className="w-1 h-1 rounded-full bg-accent-neon animate-pulse" />}
                    </div>
                    <div className="text-2xl font-heading font-black text-white">94.2%</div>
                </div>
                <div className="space-y-1">
                    <div className="text-[10px] font-mono text-brand-500 uppercase tracking-widest flex items-center gap-2">
                        Inference
                        {isLive && <div className="w-1 h-1 rounded-full bg-accent-neon animate-pulse" />}
                    </div>
                    <div className="text-2xl font-heading font-black text-white uppercase tracking-tighter">
                        {isLive ? `${stats?.inference_latency_ms || 12}ms` : "12ms"}
                    </div>
                </div>
            </div>
        </div>
    );
}

const LabSection = ({ title, subtitle, children, delay = 0, icon: Icon }: any) => (
    <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay }}
        className="py-20 border-b border-white/5"
    >
        <div className="max-w-7xl mx-auto px-8 md:px-24">
            <div className="flex flex-col md:flex-row gap-16 items-start">
                <div className="w-full md:w-1/3 space-y-6 sticky top-32">
                    <div className="w-12 h-12 bg-[var(--bg-surface)] border border-[var(--border-ui)] flex items-center justify-center text-accent-neon">
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-heading font-black text-white uppercase tracking-tighter mb-2">{title}</h2>
                        <p className="text-[10px] font-mono text-brand-500 uppercase tracking-[0.3em] font-bold">{subtitle}</p>
                    </div>
                    <p className="text-brand-400 font-mono text-xs uppercase leading-relaxed tracking-widest border-l border-accent-neon/30 pl-6">
                        Bridging the gap between neural complexity and operational transparency.
                    </p>
                </div>
                <div className="flex-1 w-full bg-[var(--bg-card)]/30 border border-white/5 p-10 backdrop-blur-3xl relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity className="w-20 h-20 text-white" />
                    </div>
                    {children}
                </div>
            </div>
        </div>
    </motion.section>
);

export default function SolutionsPage() {
    return (
        <div className="min-h-screen bg-[var(--ch-brand-900)] flex flex-col relative overflow-hidden selection:bg-accent-neon selection:text-black">
            <Navbar />
            
            {/* Background Grid */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Hero Section */}
            <section className="relative pt-40 pb-24 px-8 md:px-24 border-b border-white/5 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="max-w-3xl"
                    >
                        <div className="font-mono text-accent-neon text-xs uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
                            <span className="w-12 h-px bg-accent-neon" /> Technical Intelligence Lab
                        </div>
                        <h1 className="text-6xl md:text-8xl font-heading font-black tracking-tighter uppercase text-white leading-[0.9] mb-10">
                            The Science of <br />
                            <span className="text-brand-300">Predictive</span> <br />
                            <span className="text-accent-neon">Resolution.</span>
                        </h1>
                        <p className="text-xl text-brand-400 font-mono leading-relaxed max-w-xl mb-12">
                            A deep-dive into the ML mechanisms powering the Skylytics engine. We replace the 'Black Box' with mathematical transparency.
                        </p>
                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 right-[-10%] w-[600px] h-[600px] bg-accent-neon/5 blur-[120px] rounded-full pointer-events-none" />
                
                <LabStats />
            </section>

            {/* Lab Section 1: Ingest & Ensemble */}
            <LabSection 
                title="Ensemble Architecture" 
                subtitle="Hybrid XGBoost Array" 
                icon={Cpu}
                delay={0.2}
            >
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-6 bg-[var(--ch-brand-900)] border border-white/5 space-y-4">
                            <h4 className="text-white font-heading font-bold uppercase tracking-tight flex items-center gap-2">
                                <GitBranch className="w-4 h-4 text-accent-neon" /> Boosted Learning
                            </h4>
                            <p className="text-brand-400 font-mono text-[10px] uppercase leading-loose tracking-widest">
                                Utilizing iterative gradient boosting, our model builds sequential decision trees that learn from the residual errors of previous iterations, ensuring high accuracy in volatile atmospheric conditions.
                            </p>
                        </div>
                        <div className="p-6 bg-[var(--ch-brand-900)] border border-white/5 space-y-4">
                            <h4 className="text-white font-heading font-bold uppercase tracking-tight flex items-center gap-2">
                                <Layers className="w-4 h-4 text-accent-ice" /> Dimensional Reduction
                            </h4>
                            <p className="text-brand-400 font-mono text-[10px] uppercase leading-loose tracking-widest">
                                Processing 140+ feature vectors spanning carrier history, ground load, and atmospheric pressure, optimized through custom PCA layers for sub-15ms inference.
                            </p>
                        </div>
                    </div>
                    

                </div>
            </LabSection>

            {/* Lab Section 2: Interpretability */}
            <LabSection 
                title="Interpretability Lab" 
                subtitle="SHAP Attribution Matrix" 
                icon={Brain}
                delay={0.3}
            >
                <div className="space-y-12">
                    <div className="flex flex-col md:flex-row justify-between gap-10">
                        <div className="flex-1 space-y-6">
                            <p className="text-brand-300 font-mono text-sm leading-relaxed uppercase tracking-wider italic">
                                "The key to trustworthy AI is not just the answer, but the journey to it."
                            </p>
                            <p className="text-brand-500 font-mono text-[10px] uppercase leading-loose tracking-widest">
                                Our SHAP (SHapley Additive exPlanations) engine decomposes every prediction into its component influences. This allows managers to see precisely how much each variable—like wind speed or previous delays—contributed to the final risk score.
                            </p>
                            <div className="flex gap-4">
                                <button disabled className="px-6 py-3 border border-[var(--border-ui)] transition-colors font-mono text-[10px] uppercase text-white flex items-center gap-3 opacity-50 cursor-not-allowed">
                                    Read Whitepaper <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2">
                            <XaiMatrix />
                        </div>
                    </div>
                </div>
            </LabSection>

            {/* Technical Methodology Footer */}
            <section className="py-24 bg-[var(--bg-card)] px-8 md:px-24 border-t border-white/5">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="inline-flex items-center gap-3 px-4 py-2 border border-accent-neon/30 bg-accent-neon/5 rounded-full mb-4">
                        <ShieldCheck className="w-4 h-4 text-accent-neon" />
                        <span className="text-[10px] font-mono text-accent-neon uppercase tracking-widest">Scientific Integrity Verified</span>
                    </div>
                    <h2 className="text-4xl font-heading font-black text-white uppercase tracking-tighter">Predictive <span className="text-brand-300">Certainty.</span></h2>
                    <p className="text-brand-500 font-mono text-xs uppercase leading-relaxed tracking-widest max-w-2xl mx-auto">
                        Skylytics architectural standards ensure that every datum is processed with mathematical rigour, providing human-interpretable results for complex aviation logistics.
                    </p>
                </div>
            </section>
        </div>
    );
}
