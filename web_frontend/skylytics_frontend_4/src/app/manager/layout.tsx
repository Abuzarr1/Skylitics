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
                <header className="hidden md:flex h-[70px] items-center justify-between px-10 text-white z-40 border-b border-white/5 bg-brand-900/80 backdrop-blur-md sticky top-0">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-heading font-black tracking-tight uppercase">Manager Vector</h1>
                        <p className="text-[9px] font-mono text-brand-500 uppercase tracking-widest mt-0.5">
                            {auth?.isAdmin
                                ? "Admin — All Airports"
                                : auth?.airportCode
                                    ? `Active Session · ${auth.airportCode} Operations`
                                    : "Active Session"}
                        </p>
                    </div>

                    <div className="flex items-center gap-8">
                        <form onSubmit={handleSearch} className="hidden lg:flex items-center border border-white/5 bg-brand-950 px-4 py-2 text-brand-500 font-mono text-[9px] w-64 focus-within:border-accent-neon/50 transition-colors">
                            <Search className="w-3 h-3 mr-3 text-brand-600" />
                            <input 
                                type="text" 
                                placeholder="QUERY FLIGHT ID..." 
                                className="bg-transparent focus:outline-none w-full placeholder:text-brand-700 text-white" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>

                        <div className="flex items-center gap-6">
                            <Link href="/passenger" className="hidden lg:block font-mono text-[9px] uppercase tracking-widest border border-white/10 text-brand-400 px-4 py-2 hover:bg-white hover:text-black transition-colors">
                                Passenger View
                            </Link>
                            
                            <Link href="/manager/notifications" className="relative group p-1">
                                <Bell className="w-4 h-4 text-brand-400 group-hover:text-white transition-colors" />
                                {unread > 0 && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-alert rounded-full text-[7px] font-mono font-bold text-white flex items-center justify-center">
                                        {unread > 9 ? "!" : unread}
                                    </span>
                                )}
                            </Link>

                            <div className="flex items-center gap-4 pl-6 border-l border-white/5">
                                <div className="text-right">
                                    <div className="text-[10px] font-black font-mono tracking-wider uppercase text-white leading-none">{displayName}</div>
                                    <div className="text-[8px] font-mono text-brand-600 uppercase tracking-[0.2em] mt-1.5 flex items-center justify-end gap-1.5">
                                        <span className="w-1 h-1 bg-accent-neon rounded-full"></span>
                                        Online
                                    </div>
                                </div>
                                <div className="w-9 h-9 bg-brand-900 border border-white/10 flex items-center justify-center text-brand-600 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-accent-neon opacity-0 group-hover:opacity-5 transition-opacity"></div>
                                    <MonitorPlay className="w-4 h-4" />
                                </div>
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
