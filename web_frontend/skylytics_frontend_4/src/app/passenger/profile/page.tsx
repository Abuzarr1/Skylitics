"use client";
import React, { useEffect, useState } from "react";
import { LogOut, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { getUserInfo, logoutUser, getSavedFlights, removeSavedFlight } from "@/lib/api";

export default function PassengerProfile() {
    const router = useRouter();
    const [user, setUser] = useState<Record<string, any> | null>(null);
    const [savedFlights, setSavedFlights] = useState<any[]>([]);

    useEffect(() => {
        const info = getUserInfo();
        if (!info) { router.replace("/login"); return; }
        setUser(info);
        getSavedFlights().then(setSavedFlights);
    }, [router]);

    const displayName = user
        ? (user.full_name || `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email || "Traveller")
        : "Traveller";
    const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "??";


    function handleDisconnect() {
        logoutUser();
        router.push("/login");
    }

    return (
        <div className="min-h-screen bg-[var(--ch-brand-900)] p-8">
            <button onClick={() => router.push('/passenger')} className="flex items-center gap-2 text-brand-500 hover:text-white font-mono text-xs uppercase tracking-widest transition-colors mb-12">
                <ChevronLeft className="w-4 h-4" /> Back to Tracker
            </button>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                <div className="md:col-span-1 space-y-6">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-6 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-[var(--ch-brand-900)] border border-white/20 rounded-full flex items-center justify-center mb-6">
                            <span className="font-heading font-black text-2xl">{initials}</span>
                        </div>
                        <h2 className="font-heading font-black text-xl text-white uppercase truncate w-full">{displayName}</h2>
                        <span className="font-mono text-[10px] uppercase text-brand-500 tracking-widest mt-1">
                            {user?.email ?? "Frequent Tracker"}
                        </span>
                    </div>

                    <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-4">
                        <button
                            onClick={handleDisconnect}
                            className="flex items-center gap-4 text-accent-alert font-mono text-xs uppercase tracking-widest w-full py-3 transition-colors hover:bg-accent-alert/5"
                        >
                            <LogOut className="w-4 h-4" /> Disconnect
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <h3 className="text-xl font-heading font-black uppercase text-white mb-6">Monitored Routes</h3>

                    {savedFlights.length === 0 ? (
                        <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-8 text-center text-brand-500 font-mono text-xs uppercase tracking-widest">
                            No routes in watchlist yet.
                        </div>
                    ) : (
                        savedFlights.map((flight) => (
                            <div
                                key={flight.id}
                                className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-6 group hover:border-white/30 transition-colors flex justify-between items-center"
                            >
                                <div
                                    className="cursor-pointer flex-1"
                                    onClick={() => router.push(`/passenger/flight/${flight.callsign}`)}
                                >
                                    <h4 className="font-heading font-black text-2xl text-white uppercase mb-2 group-hover:text-accent-neon transition-colors">
                                        {flight.callsign}
                                    </h4>
                                    <p className="font-mono text-[10px] text-brand-400 uppercase tracking-widest">
                                        {flight.route}
                                    </p>
                                </div>
                                <button
                                    onClick={async () => {
                                        await removeSavedFlight(flight.id);
                                        setSavedFlights((prev) => prev.filter((f) => f.id !== flight.id));
                                    }}
                                    className="font-mono text-[10px] uppercase tracking-widest border px-3 py-1.5 border-accent-neon text-accent-neon hover:border-accent-alert hover:text-accent-alert transition-colors ml-4"
                                >
                                    Remove
                                </button>
                            </div>
                        ))
                    )}

                    <button
                        onClick={() => router.push('/passenger')}
                        className="w-full bg-[var(--ch-brand-900)] border border-[var(--border-ui)] border-dashed py-8 text-brand-500 font-mono text-xs uppercase tracking-widest hover:bg-[var(--bg-surface)] transition-colors"
                    >
                        + Add Route To Watchlist
                    </button>
                </div>

            </div>
        </div>
    );
}
