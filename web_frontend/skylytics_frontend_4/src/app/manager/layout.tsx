"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { Search, Bell, MonitorPlay, LogOut } from "lucide-react";
import { getUserInfo, getUnreadCount, logoutUser } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ManagerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = useAuth();
    const router = useRouter();
    const [displayName, setDisplayName] = useState("Op-Control");
    const [unread, setUnread] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/manager/predict?flight=${searchQuery.trim().toUpperCase()}`);
        }
    };

    const handleLogout = async () => {
        const API = process.env.NEXT_PUBLIC_API_URL || "https://skylytics-backend-25gp.onrender.com/api/v1";
        const token = typeof window !== "undefined" ? localStorage.getItem("skylytics_token") : null;
        try {
            await fetch(`${API}/auth/logout`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            }).catch(() => {});
        } finally {
            logoutUser();
            window.location.href = "/";
        }
    };

    useEffect(() => {
        const user = getUserInfo();
        if (user) {
            setDisplayName(user.full_name || `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email || "Op-Control");
        }
        getUnreadCount().then(setUnread);
        const interval = setInterval(() => getUnreadCount().then(setUnread), 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[var(--ch-brand-900)] selection:bg-accent-neon selection:text-black">
            <Sidebar />

            <div className="flex-1 md:ml-[260px] flex flex-col relative min-h-screen">
                <MobileNav />

                {/* Top Header - Stark Line Design - Hidden on Mobile */}
                <header className="hidden md:flex h-[80px] items-center justify-between px-10 text-white z-10 border-b border-white/5 bg-[var(--ch-brand-900)]/80 backdrop-blur-md">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-heading font-black tracking-tight uppercase">Manager Vector</h1>
                        <p className="text-[10px] font-mono text-brand-400 uppercase tracking-widest">
                            {auth?.isAdmin
                                ? "Admin — All Airports"
                                : auth?.airportCode
                                    ? `Active Session · ${auth.airportCode} Operations`
                                    : "Active Session"}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <form onSubmit={handleSearch} className="hidden lg:flex items-center border border-[var(--border-ui)] bg-[var(--bg-card)] px-4 py-2 text-brand-400 font-mono text-xs w-64 focus-within:border-accent-neon transition-colors">
                            <Search className="w-3 h-3 mr-3 text-brand-500" />
                            <input 
                                type="text" 
                                placeholder="QUERY FLIGHT ID..." 
                                className="bg-transparent focus:outline-none w-full placeholder:text-brand-600 text-white" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>

                        <Link href="/passenger" className="hidden lg:block font-mono text-[10px] uppercase tracking-widest border border-[var(--border-ui)] text-brand-400 px-3 py-1.5 hover:bg-white hover:text-black transition-colors">
                            Passenger View
                        </Link>
                        <Link href="/manager/notifications" className="relative group p-2">
                            <Bell className="w-5 h-5 text-brand-300 group-hover:text-white transition-colors" />
                            {unread > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-accent-alert rounded-sm text-[9px] font-mono font-bold text-white flex items-center justify-center px-0.5">
                                    {unread > 9 ? "9+" : unread}
                                </span>
                            )}
                        </Link>
                        <div className="flex items-center gap-3 pl-6 border-l border-[var(--border-ui)]">
                            <div className="text-right">
                                <div className="text-xs font-bold font-mono tracking-wider uppercase text-white">{displayName}</div>
                                <div className="text-[10px] font-mono text-brand-500 uppercase tracking-widest">Online</div>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-10 h-10 bg-[var(--bg-card)] border border-white/20 flex items-center justify-center text-accent-neon">
                                    <MonitorPlay className="w-4 h-4" />
                                </div>
                                <button onClick={handleLogout} className="w-10 h-10 bg-[var(--bg-card)] border border-white/20 flex items-center justify-center text-brand-500 hover:text-accent-alert hover:border-accent-alert transition-colors" title="Logout">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
