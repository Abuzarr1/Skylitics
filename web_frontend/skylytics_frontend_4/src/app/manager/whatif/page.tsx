
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Plane, CloudSnow, Eye, Users, Clock, MapPin, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingRadar } from "@/components/ui/LoadingRadar";

export default function WhatIfSimulator() {
    const auth = useAuth();
    const airportCode = auth?.airportCode || 'SEA';
    
    return (
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Parameters Side */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-brand-950 border border-white/5 p-8">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                            <div className="w-2 h-2 rounded-full bg-yellow-400/20" />
                        </div>

                        <div className="space-y-8">
                            {/* Mission Parameters */}
                            <div>
                                <h3 className="font-mono text-[10px] text-brand-600 uppercase tracking-[0.2em] mb-6 font-bold">Mission Parameters</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest flex items-center gap-2">
                                            <MapPin className="w-3 h-3" /> Origin (Your Airport)
                                        </label>
                                        <div className="bg-brand-900 border border-white/5 px-4 py-3 text-accent-neon font-mono text-xs font-bold">{airportCode}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest">Airline</label>
                                        <select className="w-full bg-brand-900 border border-white/5 px-4 py-3 text-white font-mono text-xs focus:outline-none">
                                            <option>DL</option>
                                            <option>AA</option>
                                            <option>UA</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest">Flight Number</label>
                                        <select className="w-full bg-brand-900 border border-white/5 px-4 py-3 text-white font-mono text-xs focus:outline-none">
                                            <option>DL183</option>
                                            <option>DL240</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest">Destination</label>
                                        <div className="bg-brand-900 border border-white/5 px-4 py-3 text-white font-mono text-xs">JFK</div>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-white/5 flex justify-between items-center font-mono text-[8px] uppercase tracking-widest text-brand-500">
                                    <div className="flex gap-4">
                                        <span>Status: <span className="text-accent-neon">On Time</span></span>
                                        <span>Gate: <span className="text-white">A16</span></span>
                                    </div>
                                    <span>13:45</span>
                                </div>
                                <div className="grid grid-cols-2 gap-6 mt-6">
                                    <div className="space-y-2">
                                        <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest">Date</label>
                                        <input type="text" value="24/04/2026" className="w-full bg-brand-900 border border-white/5 px-4 py-3 text-white font-mono text-xs focus:outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest">Departure Time</label>
                                        <input type="text" value="01:45 PM" className="w-full bg-brand-900 border border-white/5 px-4 py-3 text-white font-mono text-xs focus:outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-mono text-[9px] uppercase text-brand-500 tracking-widest">Aircraft Type</label>
                                        <div className="bg-brand-900 border border-white/5 px-4 py-3 text-white font-mono text-xs">BOEING 737</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between font-mono text-[9px] uppercase text-brand-500 tracking-widest">
                                            <span>Distance</span>
                                            <span className="text-white">865 MI</span>
                                        </div>
                                        <input type="range" className="w-full h-1 bg-white/10 appearance-none accent-white mt-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="h-[1px] bg-white/5" />

                            {/* Override Parameters */}
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-mono text-[10px] text-brand-600 uppercase tracking-[0.2em] font-bold">Override Parameters</h3>
                                    <button className="text-[9px] font-mono text-yellow-400 uppercase tracking-widest">Clear (0/10)</button>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest">
                                            <span className="text-brand-500 flex items-center gap-2"><CloudSnow className="w-3 h-3" /> Weather Severity</span>
                                            <span className="text-yellow-400 font-bold">Clear</span>
                                        </div>
                                        <input type="range" className="w-full h-1 bg-white/10 appearance-none accent-white" />
                                        <div className="flex justify-between font-mono text-[7px] text-brand-700 uppercase tracking-widest">
                                            <span>Clear</span>
                                            <span>Extreme</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest">
                                            <span className="text-brand-500 flex items-center gap-2"><Clock className="w-3 h-3" /> Incoming Flight Delay</span>
                                            <span className="text-yellow-400 font-bold">On Time</span>
                                        </div>
                                        <input type="range" className="w-full h-1 bg-white/10 appearance-none accent-white" />
                                        <div className="flex justify-between font-mono text-[7px] text-brand-700 uppercase tracking-widest">
                                            <span>On Time</span>
                                            <span>+180 min</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest">
                                            <span className="text-brand-500 flex items-center gap-2"><Eye className="w-3 h-3" /> Visibility</span>
                                            <span className="text-yellow-400 font-bold">10 MI</span>
                                        </div>
                                        <input type="range" className="w-full h-1 bg-white/10 appearance-none accent-white" />
                                        <div className="flex justify-between font-mono text-[7px] text-brand-700 uppercase tracking-widest">
                                            <span>0 mi</span>
                                            <span>10 mi</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest">
                                            <span className="text-brand-500 flex items-center gap-2"><Users className="w-3 h-3" /> Passenger Load</span>
                                            <span className="text-yellow-400 font-bold">78%</span>
                                        </div>
                                        <input type="range" className="w-full h-1 bg-white/10 appearance-none accent-white" />
                                        <div className="flex justify-between font-mono text-[7px] text-brand-700 uppercase tracking-widest">
                                            <span>50%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Output Side */}
                <div className="lg:col-span-7 bg-brand-950 border border-white/5 relative flex flex-col items-center justify-center text-center p-20 overflow-hidden">
                    <div className="absolute top-4 right-4 font-mono text-[10px] text-brand-800">N</div>
                    
                    <div className="relative z-10 flex flex-col items-center max-w-xs">
                        <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center mb-8">
                            <Zap className="w-6 h-6 text-brand-800" />
                        </div>
                        <p className="font-mono text-[10px] text-brand-600 uppercase tracking-[0.3em] leading-relaxed font-bold">
                            Select a flight and configure overrides, then run the simulation.
                        </p>
                    </div>

                    {/* Scanner Line */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-accent-neon/5 animate-[scan_6s_linear_infinite]" />
                </div>
            </div>
        </div>
    );
}
