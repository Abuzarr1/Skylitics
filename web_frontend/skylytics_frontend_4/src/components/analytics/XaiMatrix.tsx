"use client";
import React from "react";
import { motion } from "framer-motion";

interface XaiNodeProps {
    label: string;
    value: number;
    delay: number;
}

const XaiNode = ({ label, value, delay }: XaiNodeProps) => (
    <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay }}
        className="flex items-center gap-4 group"
    >
        <div className="w-24 text-right">
            <span className="text-[10px] font-mono text-brand-500 uppercase tracking-widest">{label}</span>
        </div>
        <div className="flex-1 h-3 bg-brand-950/50 border border-white/5 relative overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1, delay: delay + 0.3, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 bg-accent-neon shadow-[0_0_10px_rgba(223,255,0,0.3)]"
            />
            {/* Gloss Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
        </div>
        <div className="w-12">
            <span className="text-[10px] font-mono text-white font-bold">{value}%</span>
        </div>
    </motion.div>
);

export default function XaiMatrix() {
    const features = [
        { label: "Wind Magnitude", value: 82 },
        { label: "Cloud Ceiling", value: 64 },
        { label: "Carrier Index", value: 48 },
        { label: "Runway Load", value: 39 },
        { label: "Temp Variance", value: 24 },
    ];

    return (
        <div className="space-y-6 relative">
            {/* Vertical Flow Line */}
            <div className="absolute left-[108px] top-0 bottom-0 w-px bg-white/5" />
            
            {features.map((f, i) => (
                <XaiNode key={f.label} label={f.label} value={f.value} delay={i * 0.1} />
            ))}

            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                <div className="text-[8px] font-mono text-brand-600 uppercase tracking-[0.3em]">
                    Feature Attribution Layer 01
                </div>
                <div className="text-[8px] font-mono text-accent-neon uppercase tracking-widest">
                    SHAP_VAL_STABLE
                </div>
            </div>
        </div>
    );
}
