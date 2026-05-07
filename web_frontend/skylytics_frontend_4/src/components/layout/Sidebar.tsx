"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Plane, Map, Bot, Settings, LogOut, MapPin, Zap, Radio, BarChart3, Activity } from "lucide-react";
import { logoutUser } from "@/lib/api";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const auth = useAuth();

    const coreMatrixItems = [
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
        <aside className="hidden md:flex flex-col w-[260px] h-screen bg-brand-950 border-r border-white/5 p-4 fixed left-0 top-0 overflow-y-auto pb-10 z-50">

            {/* Brutalist Logo */}
            <Link href="/" className="flex items-center gap-3 mb-10 px-2 mt-4 hover:opacity-80 transition-opacity group">
                <Plane className="w-5 h-5 text-accent-neon group-hover:rotate-12 transition-transform" />
                <span className="text-xl font-heading font-black text-white uppercase tracking-tighter">
                    Skylytics<span className="text-accent-neon">.</span>
                </span>
            </Link>

            {/* Airport / Role Badge */}
            {auth && (
                <div className="mb-8 mx-2 px-3 py-2 bg-brand-900 border border-white/5 rounded-sm">
                    {auth.isAdmin ? (
                        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-brand-400">
                            <span className="text-yellow-400">ADMIN</span>
                            <span className="text-brand-600 mx-1">—</span>
                            ALL AIRPORTS
                        </div>
                    ) : auth.isManager && auth.airportCode ? (
                        <div className="flex items-center justify-between gap-2">
                            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-brand-400 flex items-center gap-1.5">
                                <span className="text-accent-neon font-bold">{auth.airportCode}</span>
                                <span className="text-brand-600">|</span>
                                <span>MANAGER</span>
                            </div>
                            <Link
                                href="/manager/select-airport"
                                className="font-mono text-[8px] uppercase tracking-widest text-brand-600 hover:text-accent-neon transition-colors"
                            >
                                Switch
                            </Link>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Navigation Matrix */}
            <nav className="flex-1 space-y-0.5">
                <div className="px-4 mb-3 font-mono text-[9px] uppercase tracking-[0.3em] text-brand-500 font-bold">Core Matrix</div>
                {coreMatrixItems.map((item, idx) => {
                    const isActive = pathname === item.href || (item.href !== "/manager" && pathname.startsWith(item.href));

                    return (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.03, ease: "easeOut" }}
                        >
                            <Link
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group font-mono text-[10px] uppercase tracking-widest border-l-2 ${isActive
                                        ? "border-accent-neon bg-white/5 text-white font-black"
                                        : "border-transparent text-brand-500 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <item.icon className={`w-3.5 h-3.5 ${isActive ? "text-accent-neon" : "group-hover:text-accent-neon transition-colors"}`} />
                                <span>{item.label}</span>
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            {/* Network Status Box - Simplified */}
            <div className="mt-8 mx-2 bg-brand-900 border border-white/5 rounded-sm p-4 relative overflow-hidden">
                <div className="font-mono text-[8px] uppercase text-brand-600 tracking-widest mb-2">Network Status</div>
                <div className="flex items-center gap-2 text-brand-300 font-mono text-[9px] uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-accent-neon animate-pulse rounded-full"></span>
                    Live Link Active
                </div>
            </div>

            <div className="mt-8 space-y-0.5">
                <div className="px-4 mb-3 font-mono text-[9px] uppercase tracking-[0.3em] text-brand-500 font-bold">System</div>
                <Link
                    href="/manager/settings"
                    className="flex items-center gap-3 px-4 py-3 text-[10px] text-brand-500 font-mono uppercase tracking-widest hover:text-white hover:bg-white/5 transition-colors border-l-2 border-transparent"
                >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Config</span>
                </Link>
                <button
                    className="flex items-center w-full gap-3 px-4 py-3 text-[10px] text-accent-alert font-mono uppercase tracking-widest hover:bg-accent-alert/5 transition-colors border-l-2 border-transparent"
                    onClick={handleLogout}
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Terminate Session</span>
                </button>
            </div>
        </aside>
    );
}

