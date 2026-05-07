"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Plane, Map, Bot, Settings, LogOut, MapPin, Zap, Radio, BarChart3 } from "lucide-react";
import { logoutUser } from "@/lib/api";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const auth = useAuth();

    const navItems = [
        { label: "Dashboard", href: "/manager", icon: LayoutDashboard },
        { label: "Predictive Intelligence", href: "/manager/analytics", icon: BarChart3 },
        { label: "Copilot Assistant", href: "/manager/assistant", icon: Bot },
        { label: "Predict Sequence", href: "/manager/predict", icon: Plane },
        { label: "What-If Simulator", href: "/manager/whatif", icon: Zap },
        { label: "Live Feed", href: "/manager/feed", icon: Radio },
        { label: "Global Node Map", href: "/manager/heatmap", icon: Map },
        { label: "Live Flight Map", href: "/manager/livemap", icon: MapPin },
    ];

    async function handleLogout() {
        const API = process.env.NEXT_PUBLIC_API_URL || "https://skylytics-backend-25gp.onrender.com/api/v1";
        const token = typeof window !== "undefined" ? localStorage.getItem("skylytics_token") : null;
        try {
            await fetch(`${API}/auth/logout`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            }).catch(() => {});
        } finally {
            logoutUser();
            router.push("/login");
        }
    }

    return (
        <aside className="hidden md:flex flex-col w-[260px] h-screen bg-brand-950 border-r border-white/5 p-4 fixed left-0 top-0 overflow-y-auto pb-10">

            {/* Brutalist Logo */}
            <Link href="/" className="flex items-center gap-3 mb-12 px-2 mt-4 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-sm bg-brand-900 border border-white/10 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-accent-neon" />
                </div>
                <span className="text-xl font-heading font-black text-white uppercase tracking-tighter">
                    Skylytics<span className="text-accent-neon">.</span>
                </span>
            </Link>

            {/* Airport / Role Badge */}
            {auth && (
                <div className="mb-6 mx-2 px-3 py-2 bg-brand-900 border border-white/5 rounded-sm">
                    {auth.isAdmin ? (
                        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-brand-400">
                            <span className="text-yellow-400">ADMIN</span>
                            <span className="text-brand-600 mx-1">—</span>
                            ALL AIRPORTS
                        </div>
                    ) : auth.isManager && auth.airportCode ? (
                        <div className="flex items-center justify-between gap-2">
                            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-brand-400 flex items-center gap-1.5">
                                <Plane className="w-3 h-3 text-yellow-400 shrink-0" />
                                <span className="text-yellow-400 font-bold">{auth.airportCode}</span>
                                <span className="text-brand-600">|</span>
                                <span>MANAGER</span>
                            </div>
                            <a
                                href="/manager/select-airport"
                                className="font-mono text-[8px] uppercase tracking-widest text-brand-600 hover:text-yellow-400 transition-colors"
                            >
                                Switch
                            </a>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Navigation Matrix */}
            <nav className="flex-1 space-y-1">
                <div className="px-4 mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-500">Core Matrix</div>
                {navItems.map((item, idx) => {
                    const isActive = pathname === item.href || (item.href !== "/manager" && pathname.startsWith(item.href));

                    return (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.05, ease: "easeOut" }}
                        >
                            <Link
                                href={item.href}
                                className={`flex items-center gap-4 px-4 py-3 border-l-2 transition-all duration-200 group font-mono text-sm uppercase tracking-widest ${isActive
                                        ? "border-accent-neon bg-white/5 text-white font-bold"
                                        : "border-transparent text-brand-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <item.icon className={`w-4 h-4 ${isActive ? "text-accent-neon" : "group-hover:text-accent-neon transition-colors"}`} />
                                <span>{item.label}</span>
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            {/* Tech Spec Box */}
            <div className="mt-8 bg-brand-900 border border-white/5 rounded-sm p-5 relative overflow-hidden group hover:border-white/10 transition-colors">
                <div className="absolute top-0 right-0 w-8 h-8 bg-white/5 -rotate-45 translate-x-4 -translate-y-4"></div>
                <div className="font-mono text-[9px] uppercase text-brand-500 tracking-widest mb-1">Network Status</div>
                <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold">
                    <span className="w-2 h-2 bg-accent-neon animate-pulse rounded-full shrink-0"></span>
                    Predictive Link Secure
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
                    <div>
                        <div className="font-mono text-[7px] text-brand-500 uppercase">Latency</div>
                        <div className="font-mono text-[9px] text-brand-200">24ms</div>
                    </div>
                    <div>
                        <div className="font-mono text-[7px] text-brand-500 uppercase">Node</div>
                        <div className="font-mono text-[9px] text-brand-200">US-E1</div>
                    </div>
                </div>
                <div className="my-4 border-t border-white/5" />
                <Link href="/manager/assistant" className="border border-white/10 text-brand-200 font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 block w-full text-center hover:bg-white hover:text-black hover:border-white transition-colors">
                    Engage Copilot
                </Link>
            </div>

            <div className="mt-8 space-y-1">
                <div className="px-4 mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-500">System</div>
                <Link
                    href="/manager/settings"
                    className="flex items-center gap-4 px-4 py-3 text-sm text-brand-400 font-mono uppercase tracking-widest hover:text-white hover:bg-white/5 transition-colors border-l-2 border-transparent"
                >
                    <Settings className="w-4 h-4" />
                    <span>Config</span>
                </Link>
                <button
                    className="flex items-center w-full gap-4 px-4 py-3 text-sm text-accent-alert font-mono uppercase tracking-widest hover:bg-accent-alert/5 transition-colors border-l-2 border-transparent"
                    onClick={handleLogout}
                >
                    <LogOut className="w-4 h-4" />
                    <span>Terminate Session</span>
                </button>
            </div>
        </aside>
    );
}
