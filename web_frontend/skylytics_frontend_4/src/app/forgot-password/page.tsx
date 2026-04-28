"use client";
import React, { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/api";
import { Plane, ChevronLeft, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await resetPassword(email, "SKY-RECOVERY-KEY-" + Math.floor(Math.random()*1000));
            setSubmitted(true);
        } catch (err) {
            console.error("Recovery link generation failed:", err);
            setSubmitted(true); // Always show success for security
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
                            <h1 className="text-3xl font-heading font-black uppercase text-white mb-2 leading-tight">Access Key<br />Recovery</h1>
                            <p className="text-brand-500 font-mono text-xs uppercase tracking-widest leading-relaxed">Enter your agent identification to receive recovery instructions.</p>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 bg-accent-neon/10 border border-accent-neon flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6 text-accent-neon" />
                            </div>
                            <h1 className="text-3xl font-heading font-black uppercase text-white mb-2 leading-tight">Request<br />Submitted</h1>
                            <p className="text-brand-500 font-mono text-xs uppercase tracking-widest leading-relaxed">If that email is registered in our system, a recovery link will be dispatched to it.</p>
                        </>
                    )}
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em]">Agent Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="agent@skylytics.local"
                                className="w-full bg-[var(--bg-card)] border border-brand-700 text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent-neon transition-colors"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-foreground text-brand-900 font-bold font-mono tracking-widest uppercase py-4 hover:bg-accent-neon transition-colors"
                        >
                            Request Reset
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <Link
                            href="/login"
                            className="w-full bg-accent-neon text-brand-900 font-bold font-mono tracking-widest uppercase py-4 hover:bg-white transition-colors flex items-center justify-center"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-brand-800">
                    <Link href="/login" className="flex items-center gap-2 text-brand-500 hover:text-accent-neon font-mono text-[10px] uppercase tracking-widest transition-colors">
                        <ChevronLeft className="w-3 h-3" /> Back to Authentication
                    </Link>
                </div>
            </div>
        </div>
    );
}
