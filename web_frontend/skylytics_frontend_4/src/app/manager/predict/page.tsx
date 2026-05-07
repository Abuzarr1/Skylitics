
"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Shield, Terminal as TerminalIcon, Search, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingRadar } from "@/components/ui/LoadingRadar";

export default function PredictPage() {
    const auth = useAuth();
    const [isPredicting, setIsPredicting] = useState(false);
    
    return (
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-10">
            {/* Header Area */}
            <div className="mb-12">
                <h1 className="text-5xl font-heading font-black text-white uppercase tracking-tighter">Predictive Analysis</h1>
                <div className="flex items-center gap-3 mt-4">
                    <div className="w-2 h-2 rounded-full border border-accent-neon flex items-center justify-center">
                        <div className="w-0.5 h-0.5 bg-accent-neon rounded-full" />
                    </div>
                    <span className="font-mono text-[9px] text-brand-500 tracking-[0.3em] uppercase font-bold">Multi-Layer Neural Network Engine v4.0 Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Form Panel */}
                <div className="lg:col-span-4 bg-brand-950 border border-white/5 p-10">
                    <div className="mb-10">
                        <h2 className="text-xl font-heading font-black text-white uppercase tracking-tight">Prediction Matrix</h2>
                        <p className="text-brand-600 font-mono text-[9px] uppercase tracking-widest mt-1 font-bold">Input Flight Parameters</p>
                    </div>

                    <form className="space-y-8">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest font-bold">Carrier Code</label>
                                <span className="text-[8px] font-mono text-brand-700 uppercase">Req</span>
                            </div>
                            <input 
                                type="text" 
                                placeholder="DL (Delta)" 
                                className="w-full bg-brand-900 border border-white/5 px-4 py-4 text-white font-mono text-xs focus:outline-none focus:border-accent-neon/50 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest font-bold">Flight Designator</label>
                                <span className="text-[8px] font-mono text-brand-700 uppercase">Req</span>
                            </div>
                            <input 
                                type="text" 
                                placeholder="e.g. DL192" 
                                className="w-full bg-brand-900 border border-white/5 px-4 py-4 text-white font-mono text-xs focus:outline-none focus:border-accent-neon/50 transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest font-bold">Origin</label>
                                <input 
                                    type="text" 
                                    placeholder="JFK" 
                                    className="w-full bg-brand-900 border border-white/5 px-4 py-4 text-white font-mono text-xs focus:outline-none focus:border-accent-neon/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest font-bold">Destination</label>
                                <input 
                                    type="text" 
                                    placeholder="LAX" 
                                    className="w-full bg-brand-900 border border-white/5 px-4 py-4 text-white font-mono text-xs focus:outline-none focus:border-accent-neon/50 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest font-bold">Aircraft Registration (Tail Number)</label>
                            <input 
                                type="text" 
                                placeholder="N900AI" 
                                className="w-full bg-brand-900 border border-white/5 px-4 py-4 text-white font-mono text-xs focus:outline-none focus:border-accent-neon/50 transition-colors"
                            />
                            <p className="text-[8px] font-mono text-brand-700 uppercase tracking-widest pt-1">Required for BI-LSTM historical chain analysis.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest font-bold">Date</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-brand-900 border border-white/5 px-4 py-4 text-white font-mono text-xs focus:outline-none focus:border-accent-neon/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest font-bold">Time (Local)</label>
                                <input 
                                    type="time" 
                                    className="w-full bg-brand-900 border border-white/5 px-4 py-4 text-white font-mono text-xs focus:outline-none focus:border-accent-neon/50 transition-colors"
                                />
                            </div>
                        </div>

                        <button 
                            type="button"
                            className="w-full bg-white text-black font-heading font-black uppercase py-5 mt-4 hover:bg-accent-neon transition-colors tracking-tighter"
                        >
                            Execute Forecast Sequence
                        </button>
                    </form>
                </div>

                {/* Output Panel */}
                <div className="lg:col-span-8 bg-brand-950 border border-white/5 relative flex flex-col overflow-hidden">
                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mb-10 group cursor-pointer hover:border-accent-neon/30 transition-colors">
                            <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full border border-white/20" />
                            </div>
                        </div>
                        <p className="max-w-md font-mono text-[11px] text-brand-600 uppercase tracking-[0.3em] leading-relaxed">
                            Awaiting parameters. System will process 1,000+ historical delay factors via XGBOOST structure.
                        </p>
                    </div>

                    <div className="absolute top-8 left-8 flex items-center gap-2">
                        <TerminalIcon className="w-3 h-3 text-brand-700" />
                        <span className="font-mono text-[9px] text-brand-700 uppercase tracking-widest">Terminal Output</span>
                    </div>

                    {/* Scanner Lines */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-accent-neon/20 animate-[scan_4s_linear_infinite]" />
                </div>
            </div>
        </div>
    );
}
