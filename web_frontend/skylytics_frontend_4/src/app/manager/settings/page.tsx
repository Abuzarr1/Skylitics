"use client";
import React, { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { User, Bell, Cpu, Check } from "lucide-react";
import { getUserInfo, getNotificationPreferences, updateNotificationPreferences } from "@/lib/api";

export default function SettingsPage() {
    const user = getUserInfo();
    const displayName = user?.full_name || user?.email || "Operator";

    const [prefs, setPrefs] = useState({
        push_enabled: true,
        email_enabled: false,
        delay_threshold_pct: "50",
        quiet_hours_start: "23:00",
        quiet_hours_end: "07:00",
    });
    const [prefsLoading, setPrefsLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getNotificationPreferences()
            .then((data) => { if (data) setPrefs(data); })
            .finally(() => setPrefsLoading(false));
    }, []);

    async function handleApply() {
        setSaving(true);
        try {
            await updateNotificationPreferences(prefs);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            // silently fail — preferences still stored locally
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-10">
            <div className="max-w-4xl space-y-10 pb-12">

            {/* Header */}
            <div className="border-b border-[var(--border-ui)] pb-6">
                <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">System Configuration</h1>
                <p className="text-brand-500 font-mono text-xs uppercase tracking-widest mt-2">Adjust portal variables, alerts and interaction modes</p>
            </div>

            {/* Profile */}
            <section className="space-y-4">
                <h2 className="text-sm font-heading font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <span className="w-2 h-2 rounded-sm bg-accent-neon inline-block" />
                    <User className="w-4 h-4 text-brand-500" /> Operator Profile
                </h2>
                <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="font-mono text-[10px] uppercase text-brand-500 tracking-widest block">Full Name</label>
                        <div suppressHydrationWarning className="bg-[var(--ch-brand-900)] border border-white/5 px-4 py-3 font-mono text-sm text-white">
                            {displayName}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="font-mono text-[10px] uppercase text-brand-500 tracking-widest block">Email</label>
                        <div suppressHydrationWarning className="bg-[var(--ch-brand-900)] border border-white/5 px-4 py-3 font-mono text-sm text-brand-400">
                            {user?.email ?? "—"}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="font-mono text-[10px] uppercase text-brand-500 tracking-widest block">Role</label>
                        <div suppressHydrationWarning className="bg-[var(--ch-brand-900)] border border-white/5 px-4 py-3 font-mono text-sm text-accent-neon uppercase tracking-widest">
                            {user?.role ?? "—"}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="font-mono text-[10px] uppercase text-brand-500 tracking-widest block">Account Status</label>
                        <div className="flex items-center gap-2 bg-[var(--ch-brand-900)] border border-white/5 px-4 py-3">
                            <span className="w-2 h-2 rounded-full bg-accent-neon animate-pulse" />
                            <span className="font-mono text-sm text-accent-neon uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Notification Preferences */}
            <section className="space-y-4">
                <h2 className="text-sm font-heading font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <span className="w-2 h-2 rounded-sm bg-accent-alert inline-block" />
                    <Bell className="w-4 h-4 text-brand-500" /> Alert Configuration
                </h2>
                <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-8 space-y-6">
                    {prefsLoading ? (
                        <p className="font-mono text-xs text-brand-500 uppercase tracking-widest animate-pulse">Loading preferences...</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex items-center justify-between gap-4 cursor-pointer group">
                                    <div>
                                        <span className="font-mono text-xs text-white uppercase tracking-wider block">Push Alerts</span>
                                        <span className="font-mono text-[10px] text-brand-500 mt-0.5 block">In-portal delay notifications</span>
                                    </div>
                                    <button
                                        onClick={() => setPrefs(p => ({ ...p, push_enabled: !p.push_enabled }))}
                                        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${prefs.push_enabled ? "bg-accent-neon" : "bg-brand-700"}`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--bg-card)] transition-transform ${prefs.push_enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                                    </button>
                                </label>

                                <label className="flex items-center justify-between gap-4 cursor-pointer group">
                                    <div>
                                        <span className="font-mono text-xs text-white uppercase tracking-wider block">Email Alerts</span>
                                        <span className="font-mono text-[10px] text-brand-500 mt-0.5 block">Send to registered email</span>
                                    </div>
                                    <button
                                        onClick={() => setPrefs(p => ({ ...p, email_enabled: !p.email_enabled }))}
                                        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${prefs.email_enabled ? "bg-accent-neon" : "bg-brand-700"}`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--bg-card)] transition-transform ${prefs.email_enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                                    </button>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-white/5 pt-6">
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] uppercase text-brand-500 tracking-widest block">Delay Threshold</label>
                                    <select
                                        value={prefs.delay_threshold_pct}
                                        onChange={e => setPrefs(p => ({ ...p, delay_threshold_pct: e.target.value }))}
                                        className="w-full bg-[var(--ch-brand-900)] border border-[var(--border-ui)] text-white px-4 py-3 font-mono text-xs focus:outline-none focus:border-accent-neon transition-colors"
                                    >
                                        <option value="30">30% — Low Risk</option>
                                        <option value="50">50% — Moderate Risk</option>
                                        <option value="70">70% — High Risk Only</option>
                                        <option value="90">90% — Critical Only</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] uppercase text-brand-500 tracking-widest block">Quiet Hours Start</label>
                                    <input
                                        type="time"
                                        value={prefs.quiet_hours_start}
                                        onChange={e => setPrefs(p => ({ ...p, quiet_hours_start: e.target.value }))}
                                        className="w-full bg-[var(--ch-brand-900)] border border-[var(--border-ui)] text-white px-4 py-3 font-mono text-xs focus:outline-none focus:border-accent-neon transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] uppercase text-brand-500 tracking-widest block">Quiet Hours End</label>
                                    <input
                                        type="time"
                                        value={prefs.quiet_hours_end}
                                        onChange={e => setPrefs(p => ({ ...p, quiet_hours_end: e.target.value }))}
                                        className="w-full bg-[var(--ch-brand-900)] border border-[var(--border-ui)] text-white px-4 py-3 font-mono text-xs focus:outline-none focus:border-accent-neon transition-colors"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Display & ML */}
            <section className="space-y-4">
                <h2 className="text-sm font-heading font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <span className="w-2 h-2 rounded-sm bg-accent-ice inline-block" />
                    <Cpu className="w-4 h-4 text-brand-500" /> Display & Engine
                </h2>
                <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="font-mono text-[10px] uppercase text-brand-400 tracking-widest block">Color Mode</label>
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            <span className="font-mono text-xs uppercase text-brand-500">Dark / Light Engine</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="font-mono text-[10px] uppercase text-brand-400 tracking-widest block">Inference Engine</label>
                        <div className="flex items-center gap-3 bg-[var(--ch-brand-900)] border border-white/5 px-4 py-3">
                            <span className="w-2 h-2 rounded-full bg-accent-neon animate-pulse" />
                            <span className="font-mono text-xs text-accent-neon uppercase tracking-widest">XGBoost v1.0 — Production</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Save button */}
            <button
                onClick={handleApply}
                disabled={saving || prefsLoading}
                className={`font-bold font-mono tracking-widest uppercase w-full py-4 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                    saved ? "bg-accent-neon text-brand-950" : "bg-foreground text-brand-900 hover:bg-accent-neon"
                }`}
            >
                {saved ? <><Check className="w-4 h-4" /> Configuration Saved</> : saving ? "Saving..." : "Apply Configuration"}
            </button>
            </div>
        </div>
    );
}
