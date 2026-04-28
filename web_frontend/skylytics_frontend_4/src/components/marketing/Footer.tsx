"use client";
import Link from "next/link";
import { Plane, Globe, Terminal, Cpu, Activity } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-brand-950 border-t border-white/5 pt-20 pb-10 px-8 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-accent-neon/5 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16 relative z-10">
                {/* Brand Section */}
                <div className="max-w-xs space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border border-accent-neon rounded flex items-center justify-center bg-brand-900 skew-x-[-10deg]">
                            <Plane className="w-4 h-4 text-accent-neon" />
                        </div>
                        <span className="text-xl font-heading font-black tracking-tighter uppercase text-white">
                            Skylytics
                        </span>
                    </div>
                    <p className="text-brand-500 font-mono text-xs leading-relaxed uppercase tracking-wider">
                        Decoding aviation entropy via neural array synthesis. Predictive logic for the next era of logistics.
                    </p>
                    <div className="flex gap-4">
                        <div className="p-2 border border-white/10 text-brand-700">
                            <Cpu className="w-4 h-4" />
                        </div>
                        <div className="p-2 border border-white/10 text-brand-700">
                            <Globe className="w-4 h-4" />
                        </div>
                        <div className="p-2 border border-white/10 text-brand-700">
                            <Terminal className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* Navigation Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-12 flex-1 max-w-2xl">
                    <div className="space-y-6">
                        <h4 className="font-mono text-[10px] text-accent-neon uppercase tracking-[0.3em] font-bold">Platform</h4>
                        <ul className="flex flex-col gap-3 font-mono text-xs uppercase tracking-widest text-brand-400">
                            <li><Link href="/" className="hover:text-white transition-colors">Overview</Link></li>
                            <li><Link href="/solutions" className="hover:text-white transition-colors">Solutions</Link></li>
                            <li><Link href="/data" className="hover:text-white transition-colors">Inference Logs</Link></li>
                            <li><Link href="/architecture" className="hover:text-white transition-colors">System Blueprint</Link></li>
                            <li><Link href="/manager" className="hover:text-white transition-colors">Terminal</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="font-mono text-[10px] text-accent-neon uppercase tracking-[0.3em] font-bold">Resources</h4>
                        <ul className="flex flex-col gap-3 font-mono text-xs uppercase tracking-widest text-brand-600">
                            <li>Documentation</li>
                            <li>API Reference</li>
                            <li>XAI Models</li>
                            <li>SHAP Labs</li>
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="font-mono text-[10px] text-accent-neon uppercase tracking-[0.3em] font-bold">System Status</h4>
                        <div className="p-4 border border-white/5 bg-brand-900 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] text-brand-500 uppercase">Latency</span>
                                <span className="font-mono text-[10px] text-accent-neon">12ms</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] text-brand-500 uppercase">Uptime</span>
                                <span className="font-mono text-[10px] text-white font-bold">99.9%</span>
                            </div>
                            <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-accent-neon animate-pulse" />
                                <span className="font-mono text-[10px] text-white uppercase tracking-tighter">Operational</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <span className="font-mono text-[10px] text-brand-600 uppercase tracking-widest">
                    &copy; 2026 Skylytics Infrastructure Group. All Rights Reserved.
                </span>
                <div className="flex gap-8 font-mono text-[10px] text-brand-700 uppercase tracking-widest">
                    <span>Privacy Protocol</span>
                    <span>Terms of Vector</span>
                </div>
            </div>
        </footer>
    );
}
