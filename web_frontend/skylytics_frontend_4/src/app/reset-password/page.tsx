"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plane, Lock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { resetPassword } from "@/lib/api";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const email = searchParams.get("email") || "";
    
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("Access keys do not match.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Security requirements: Minimum 8 characters.");
            return;
        }

        setLoading(true);
        try {
            await resetPassword(email, newPassword);
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || "Failed to reset key.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--ch-brand-900)] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: "linear-gradient(#DFFF00 1px, transparent 1px), linear-gradient(90deg, #DFFF00 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
            
            <div className="absolute top-8 right-8 z-10">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-ui)] p-8 relative z-10 shadow-2xl">
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 border border-accent-neon flex items-center justify-center bg-[var(--ch-brand-900)] skew-x-[-10deg]">
                            <Plane className="w-4 h-4 text-accent-neon" />
                        </div>
                        <span className="text-xl font-heading font-black tracking-tighter uppercase text-white">
                            Skylytics
                        </span>
                    </div>

                    {!submitted ? (
                        <>
                            <h1 className="text-3xl font-heading font-black uppercase text-white mb-2 leading-tight">Re-Initialize<br />Access Key</h1>
                            <p className="text-brand-500 font-mono text-xs uppercase tracking-widest leading-relaxed">System identified recovery token: <span className="text-accent-neon">{token || "AUTO-GEN-01"}</span></p>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 bg-accent-neon/10 border border-accent-neon flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-6 h-6 text-accent-neon" />
                            </div>
                            <h1 className="text-3xl font-heading font-black uppercase text-white mb-2 leading-tight">Key Reset<br />Successful</h1>
                            <p className="text-brand-500 font-mono text-xs uppercase tracking-widest leading-relaxed">Your new operational access key has been synchronized with the core matrix.</p>
                        </>
                    )}
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em]">New Access Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-600" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-[var(--bg-card)] border border-brand-700 text-white pl-10 pr-4 py-3 font-mono text-sm focus:outline-none focus:border-accent-neon transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em]">Confirm New Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-600" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-[var(--bg-card)] border border-brand-700 text-white pl-10 pr-4 py-3 font-mono text-sm focus:outline-none focus:border-accent-neon transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-3 bg-accent-alert/5 border border-accent-alert/20">
                                <ShieldAlert className="w-4 h-4 text-accent-alert shrink-0" />
                                <p className="text-[10px] font-mono text-accent-alert uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-foreground text-brand-900 font-bold font-mono tracking-widest uppercase py-4 hover:bg-accent-neon transition-colors disabled:opacity-50"
                        >
                            {loading ? "Re-initializing..." : "Establish New Key"}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-8">
                        <div className="p-4 border border-brand-700 bg-[var(--bg-card)] text-center">
                            <p className="text-[10px] font-mono text-brand-400 uppercase tracking-widest leading-relaxed">
                                Security clearing complete. You may now return to the main terminal to initialize your session.
                            </p>
                        </div>
                        <Link 
                            href="/login"
                            className="w-full bg-foreground text-brand-900 font-bold font-mono tracking-widest uppercase py-4 hover:bg-accent-neon transition-colors flex items-center justify-center"
                        >
                            Proceed to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
