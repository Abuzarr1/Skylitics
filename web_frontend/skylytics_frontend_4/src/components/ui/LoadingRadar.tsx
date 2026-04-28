"use client";
import { motion } from "framer-motion";

export function LoadingRadar({ text = "SYNCING..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[160px]">
            <div className="relative w-16 h-16 mb-4">
                {/* Radar Grid Circles */}
                <div className="absolute inset-0 border border-brand-700 rounded-full opacity-50" />
                <div className="absolute inset-2 border border-brand-700 rounded-full opacity-30" />
                
                {/* Radar Sweep Arc */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(223, 255, 0, 0.4) 360deg)",
                        borderRight: "2px solid #DFFF00"
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Blip */}
                <motion.div 
                    className="absolute w-1.5 h-1.5 bg-accent-neon rounded-full left-1/4 top-1/4 shadow-[0_0_8px_#DFFF00]"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
            </div>
            <div className="font-mono text-xs text-brand-500 uppercase tracking-[0.2em] animate-pulse">
                {text}
            </div>
        </div>
    );
}
