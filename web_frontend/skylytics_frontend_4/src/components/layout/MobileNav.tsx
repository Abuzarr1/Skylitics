"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Plane, LayoutDashboard, BarChart3, Bot, Zap, Radio, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { label: "Dashboard", href: "/manager", icon: LayoutDashboard },
        { label: "Predict Sequence", href: "/manager/predict", icon: Plane },
        { label: "Intelligence", href: "/manager/analytics", icon: BarChart3 },
        { label: "Assistant", href: "/manager/assistant", icon: Bot },
        { label: "What-If", href: "/manager/whatif", icon: Zap },
        { label: "Live Feed", href: "/manager/feed", icon: Radio },
        { label: "Global Map", href: "/manager/heatmap", icon: Map },
    ];

    return (
        <div className="md:hidden sticky top-0 z-[100] w-full bg-brand-950 border-b border-white/5">
            <div className="flex items-center justify-between px-6 py-4">
                <Link href="/manager" className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-accent-neon" />
                    <span className="font-heading font-black text-white uppercase tracking-tighter">Skylytics</span>
                </Link>
                <button 
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-11 h-11 flex items-center justify-center text-white bg-white/5 border border-white/10 rounded-sm focus:ring-2 focus:ring-accent-neon outline-none"
                  aria-label={isOpen ? "Close Menu" : "Open Menu"}
                >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-brand-950 border-b border-white/5"
                    >
                        <div className="flex flex-col p-4 pb-10 space-y-2">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-4 px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] transition-colors rounded-sm ${
                                            isActive 
                                              ? "bg-accent-neon/10 border border-accent-neon/30 text-accent-neon" 
                                              : "text-brand-500 hover:text-white hover:bg-white/5"
                                        }`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
