"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Plane, ChevronRight, ChevronLeft, Shield, Eye, EyeOff, Radio,
    Fingerprint, CheckCircle2, User, Mail, Lock, Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { loginUser, registerOnly } from "@/lib/api";
import { setSelectedAirport } from "@/hooks/useAuth";

// ── Airports ──
const AIRPORTS = [
    { code: "ATL", name: "Hartsfield-Jackson", city: "Atlanta, GA"       },
    { code: "JFK", name: "John F. Kennedy",    city: "New York, NY"      },
    { code: "ORD", name: "O'Hare International", city: "Chicago, IL"     },
    { code: "LAX", name: "Los Angeles Intl",   city: "Los Angeles, CA"   },
    { code: "DFW", name: "Dallas/Fort Worth",  city: "Dallas, TX"        },
    { code: "MIA", name: "Miami International", city: "Miami, FL"        },
    { code: "SFO", name: "San Francisco Intl", city: "San Francisco, CA" },
    { code: "DEN", name: "Denver International", city: "Denver, CO"      },
    { code: "SEA", name: "Seattle-Tacoma",     city: "Seattle, WA"       },
];

// ── Animated radar sweep ──
function RadarSweep() {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[500px] h-[500px]">
                {[1, 2, 3, 4].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full border border-accent-neon/10"
                        style={{
                            width: `${i * 25}%`,
                            height: `${i * 25}%`,
                            left: `${50 - (i * 25) / 2}%`,
                            top: `${50 - (i * 25) / 2}%`,
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.15, duration: 0.8 }}
                    />
                ))}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-1/2 h-[1px] origin-left"
                    style={{ background: "linear-gradient(90deg, rgba(223,255,0,0.6) 0%, transparent 100%)" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-neon"
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ boxShadow: "0 0 20px rgba(223,255,0,0.6)" }}
                />
                {[
                    { x: "30%", y: "25%", delay: 1.2 },
                    { x: "70%", y: "35%", delay: 2.1 },
                    { x: "45%", y: "72%", delay: 0.8 },
                    { x: "65%", y: "60%", delay: 3.0 },
                    { x: "22%", y: "55%", delay: 1.8 },
                ].map((blip, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full bg-accent-neon/70"
                        style={{ left: blip.x, top: blip.y }}
                        animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5] }}
                        transition={{ duration: 4, repeat: Infinity, delay: blip.delay, times: [0, 0.1, 0.7, 1] }}
                    />
                ))}
            </div>
        </div>
    );
}

function DataTicker({ items, className }: { items: string[]; className?: string }) {
    const [index, setIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setIndex((prev) => (prev + 1) % items.length), 2500);
        return () => clearInterval(interval);
    }, [items.length]);

    return (
        <div className={`overflow-hidden h-4 ${className}`}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -16, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="font-mono text-[10px] text-accent-neon/60 uppercase tracking-[0.25em]"
                >
                    {items[index]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function ScanLine() {
    return (
        <motion.div
            className="absolute left-0 right-0 h-[1px] pointer-events-none z-20"
            style={{
                background: "linear-gradient(90deg, transparent, rgba(223,255,0,0.3), transparent)",
                boxShadow: "0 0 8px rgba(223,255,0,0.2)",
            }}
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
    );
}

// ── Login Form ──
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await loginUser(email, password);
            const userRole = (data.user?.role ?? "").toUpperCase();
            const redirectTo = searchParams.get("redirect");

            if (redirectTo) {
                window.location.href = redirectTo;
            } else if (userRole === "ADMIN") {
                window.location.href = "/manager";
            } else if (userRole === "MANAGER") {
                window.location.href = "/manager/select-airport";
            } else {
                window.location.href = "/passenger";
            }
        } catch (err: any) {
            const msg: string = err?.message ?? "";
            if (err?.name === "AbortError" || msg === "Failed to fetch") {
                setError("Server is starting up — please wait a moment and try again.");
            } else if (msg.toLowerCase().includes("incorrect") || msg.includes("401")) {
                setError("Incorrect email or password.");
            } else if (msg.includes("deactivated")) {
                setError("This account has been deactivated.");
            } else {
                setError(msg || "Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            key="login-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <motion.div
                    className="w-10 h-10 rounded-sm border border-accent-neon/30 bg-accent-neon/5 flex items-center justify-center"
                    animate={{ borderColor: ["rgba(223,255,0,0.3)", "rgba(223,255,0,0.6)", "rgba(223,255,0,0.3)"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <Fingerprint className="w-5 h-5 text-accent-neon" />
                </motion.div>
                <div>
                    <h2 className="text-2xl font-heading font-black uppercase text-white leading-none">
                        Initialize Session
                    </h2>
                    <p className="font-mono text-[9px] text-brand-500 uppercase tracking-[0.2em] mt-1">
                        Clearance Level Required
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                        <Radio className="w-3 h-3 text-brand-600" />
                        Agent Identification
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="agent@skylytics.local"
                        className="w-full bg-[var(--bg-card)] border border-brand-700 text-white px-4 py-3.5 font-mono text-sm focus:outline-none focus:border-accent-neon focus:ring-1 focus:ring-accent-neon/20 transition-all rounded-none"
                        required
                        autoComplete="email"
                    />
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                            <Shield className="w-3 h-3 text-brand-600" />
                            Access Key
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-accent-neon/70 hover:text-accent-neon text-[9px] uppercase font-mono tracking-widest transition-colors"
                        >
                            Recover Key →
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-[var(--bg-card)] border border-brand-700 text-white px-4 py-3.5 pr-12 font-mono text-sm focus:outline-none focus:border-accent-neon focus:ring-1 focus:ring-accent-neon/20 transition-all rounded-none"
                            required
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-600 hover:text-accent-neon transition-colors p-1"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <p className="font-mono text-xs text-accent-alert uppercase tracking-widest border border-accent-alert/30 bg-accent-alert/10 px-4 py-3">
                                ⚠ {error}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent-neon text-[var(--ch-brand-900)] font-bold font-mono tracking-widest uppercase py-4 hover:bg-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    {loading ? (
                        <motion.span
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            className="flex items-center gap-2"
                        >
                            <motion.div
                                className="w-4 h-4 border-2 border-[var(--ch-brand-900)]/30 border-t-[var(--ch-brand-900)] rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Authenticating...
                        </motion.span>
                    ) : (
                        <>
                            Establish Uplink
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </motion.button>
            </form>

            <div className="pt-4 text-center">
                <p className="font-mono text-[9px] text-brand-600 uppercase tracking-[0.2em]">
                    No active clearance?{" "}
                    <button
                        onClick={onSwitch}
                        className="text-accent-neon hover:text-white transition-colors ml-1"
                    >
                        Request Access →
                    </button>
                </p>
            </div>
        </motion.div>
    );
}

// ── Register Form ──
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
    const [form, setForm] = useState({
        first_name: "", last_name: "", email: "", password: "", role: "MANAGER",
        manager_key: "",
    });
    const [confirmPassword, setConfirmPassword] = useState("");
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedAirport, setAirport] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        // 1. Validate form fields locally
        if (!form.first_name.trim() || !form.last_name.trim()) {
            setError("Name fields cannot be blank.");
            return;
        }
        if (!form.email.includes("@")) {
            setError("Please enter a valid agent email.");
            return;
        }
        if (form.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (form.password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!form.manager_key.trim()) {
            setError("Manager Access Key is required.");
            return;
        }

        // 2. Simply navigate to Step 2 (No API call)
        setStep(2);
    };

    const [statusMsg, setStatusMsg] = useState<string | null>(null);

    function friendlyError(err: any): string {
        const msg: string = err?.message ?? "";
        if (err?.name === "AbortError" || msg === "Failed to fetch" || msg.toLowerCase().includes("network")) {
            return "Cannot reach server. Please try again in a moment.";
        }
        if (msg.toLowerCase().includes("already exists")) {
            return "Email already registered — sign in instead.";
        }
        if (msg.includes("422") || msg.toLowerCase().includes("validation")) {
            return "Please check your details and try again.";
        }
        if (msg.includes("500")) {
            return "Server error. Please try again in a moment.";
        }
        return msg || "Registration failed. Please try again.";
    }

    const isNetworkError = (err: any) =>
        err?.name === "AbortError" || err?.message === "Failed to fetch";

    const handleRegister = async (airport?: string) => {
        const emailLower = form.email.toLowerCase().trim();
        const code = airport ?? selectedAirport ?? null;
        const payload = {
            ...form,
            email: emailLower,
            airport_code: code,
        };

        setError(null);
        setStatusMsg(null);
        setLoading(true);

        try {
            // 1. Registration — if 409, the account was already created (prior timed-out attempt)
            setStatusMsg("Establishing Identity...");
            let alreadyExisted = false;
            try {
                await registerOnly(payload);
            } catch (regErr: any) {
                const regMsg = (regErr?.message ?? "").toLowerCase();
                if (regMsg.includes("already exists") || regMsg.includes("409")) {
                    // Previous attempt created the account but timed out before redirect
                    alreadyExisted = true;
                } else {
                    throw regErr;
                }
            }

            // 2. Automatic Authentication
            setStatusMsg(alreadyExisted ? "Account found — authenticating..." : "Identity Verified! Authenticating...");
            const data = await loginUser(emailLower, form.password);

            if (data) {
                if (code) setSelectedAirport(code);

                const role = (data.user?.role ?? "").toUpperCase();
                setStatusMsg("Clearing local buffer...");

                if (role === "ADMIN") {
                    window.location.href = "/manager";
                } else if (role === "MANAGER") {
                    window.location.href = code ? "/manager" : "/manager/select-airport";
                } else {
                    window.location.href = "/passenger";
                }
            }
        } catch (err: any) {
            setError(friendlyError(err));
            setStatusMsg(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            key="register-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div
                        key="reg-step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.35 }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-sm border border-accent-neon/30 bg-accent-neon/5 flex items-center justify-center">
                                <Fingerprint className="w-5 h-5 text-accent-neon" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-heading font-black uppercase text-white leading-none">
                                    Identity Check
                                </h2>
                                <p className="font-mono text-[9px] text-brand-500 uppercase tracking-[0.2em] mt-1">
                                    Request Operational Clearance
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleStep1} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <User className="w-3 h-3" /> Full Name <span className="text-accent-neon text-[8px]">REQ</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.first_name}
                                        placeholder="Jane Smith"
                                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                        className="w-full bg-[var(--bg-card)] border border-brand-700 text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent-neon transition-colors rounded-none"
                                        required
                                        maxLength={100}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> Email Address <span className="text-accent-neon text-[8px]">REQ</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        placeholder="manager@airline.com"
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full bg-[var(--bg-card)] border border-brand-700 text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent-neon transition-colors rounded-none"
                                        required
                                        maxLength={100}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Lock className="w-3 h-3" /> Password <span className="text-brand-600 text-[8px]">(MIN 8 CHARS)</span>
                                </label>
                                <input
                                    type="password"
                                    value={form.password}
                                    placeholder="Strong password"
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className={`w-full bg-[var(--bg-card)] border ${form.password && confirmPassword && form.password !== confirmPassword ? 'border-accent-alert' : 'border-brand-700'} text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent-neon transition-colors rounded-none`}
                                    required
                                    minLength={8}
                                    maxLength={100}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Lock className="w-3 h-3" /> Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    placeholder="Repeat password"
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full bg-[var(--bg-card)] border ${form.password && confirmPassword && form.password !== confirmPassword ? 'border-accent-alert' : 'border-brand-700'} text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent-neon transition-colors rounded-none`}
                                    required
                                    minLength={8}
                                    maxLength={100}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Fingerprint className="w-3 h-3" /> Manager Access Key <span className="text-accent-neon text-[8px]">REQ</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.manager_key}
                                    placeholder="Enter manager key"
                                    onChange={(e) => setForm({ ...form, manager_key: e.target.value })}
                                    className="w-full bg-[var(--bg-card)] border border-brand-700 text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent-neon transition-colors rounded-none"
                                    required
                                />
                            </div>

                            {error && (
                                <p className="font-mono text-xs text-accent-alert uppercase tracking-widest border border-accent-alert/20 bg-accent-alert/5 px-4 py-3">
                                    ⚠ {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-accent-neon text-brand-900 font-bold font-mono tracking-widest uppercase py-4 hover:bg-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="animate-pulse">Analyzing...</span>
                                ) : (
                                    <>Next: Hub Selection <ChevronRight className="w-4 h-4 group-hover:translate-x-1" /></>
                                )}
                            </button>
                        </form>

                        <div className="pt-4 text-center">
                            <p className="font-mono text-[9px] text-brand-600 uppercase tracking-[0.2em]">
                                Already cleared?{" "}
                                <button
                                    onClick={onSwitch}
                                    className="text-accent-neon hover:text-white transition-colors ml-1"
                                >
                                    Sign In →
                                </button>
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="reg-step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.35 }}
                    >
                        <button
                            onClick={() => {
                                setStep(1);
                                setError(null); // Clear errors when going back
                            }}
                            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-500 hover:text-white transition-colors mb-5"
                        >
                            <ChevronLeft className="w-3 h-3" /> Back
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-sm border border-accent-neon/30 bg-accent-neon/5 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-accent-neon" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-heading font-black uppercase text-white leading-none">
                                    Hub Selection
                                </h2>
                                <p className="font-mono text-[9px] text-brand-500 uppercase tracking-[0.2em] mt-1">
                                    Assign operational authority
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {AIRPORTS.map((ap) => {
                                const isSelected = selectedAirport === ap.code;
                                return (
                                    <button
                                        key={ap.code}
                                        type="button"
                                        onClick={() => setAirport(ap.code)}
                                        className={`relative text-left p-2.5 border transition-all group ${
                                            isSelected
                                                ? "border-accent-neon bg-accent-neon/10"
                                                : "border-brand-800 bg-brand-900/50 hover:border-brand-600"
                                        }`}
                                    >
                                        {isSelected && <CheckCircle2 className="absolute top-1.5 right-1.5 w-3 h-3 text-accent-neon" />}
                                        <div className={`font-heading font-black text-lg mb-0.5 ${isSelected ? "text-accent-neon" : "text-white group-hover:text-accent-neon"}`}>
                                            {ap.code}
                                        </div>
                                        <div className="font-mono text-[7px] uppercase tracking-widest text-brand-500 leading-tight">
                                            {ap.name}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {statusMsg && (
                            <p className="font-mono text-xs text-yellow-400 uppercase tracking-widest border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 mb-4 animate-pulse">
                                ⟳ {statusMsg}
                            </p>
                        )}

                        {error && !statusMsg && (
                            <p className="font-mono text-xs text-accent-alert uppercase tracking-widest border border-accent-alert/20 bg-accent-alert/5 px-4 py-3 mb-4">
                                ⚠ {error}
                            </p>
                        )}

                        <button
                            onClick={() => selectedAirport && handleRegister(selectedAirport)}
                            disabled={!selectedAirport || loading}
                            className="w-full bg-accent-neon text-brand-900 font-bold font-mono tracking-widest uppercase py-4 hover:bg-white transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                        >
                            {loading
                                ? <span className="animate-pulse">{statusMsg ? "Please wait..." : "Establishing Nexus..."}</span>
                                : selectedAirport
                                ? `Activate ${selectedAirport} Console →`
                                : "Awaiting Selection"}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Main Page ──
function AuthPageContent() {
    const searchParams = useSearchParams();
    const modeParam = searchParams.get("mode");
    const [tab, setTab] = useState<"login" | "register">(modeParam === "register" ? "register" : "login");

    useEffect(() => {
        if (modeParam === "register") setTab("register");
        else if (modeParam === "login") setTab("login");
    }, [modeParam]);

    return (
        <div className="min-h-screen bg-[var(--ch-brand-900)] flex relative overflow-hidden">
            <ScanLine />

            {/* LEFT PANEL */}
            <div className="hidden lg:flex w-[55%] relative flex-col justify-between overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(ellipse at 50% 50%, rgba(223,255,0,0.03) 0%, transparent 60%), linear-gradient(135deg, rgba(10,12,16,1) 0%, rgba(15,20,30,1) 100%)",
                    }}
                />
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "linear-gradient(#DFFF00 1px, transparent 1px), linear-gradient(90deg, #DFFF00 1px, transparent 1px)",
                        backgroundSize: "50px 50px",
                    }}
                />
                <RadarSweep />

                {/* Top bar */}
                <motion.div
                    className="relative z-10 p-10 flex items-center justify-between"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-11 h-11 border-2 border-accent-neon rounded-sm flex items-center justify-center bg-[var(--ch-brand-900)] skew-x-[-10deg]"
                            whileHover={{ scale: 1.05, skewX: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Plane className="w-5 h-5 text-accent-neon" />
                        </motion.div>
                        <div>
                            <span className="text-xl font-heading font-black tracking-tighter uppercase text-white block leading-none">
                                Skylytics
                            </span>
                            <span className="font-mono text-[8px] text-brand-600 uppercase tracking-[0.3em]">
                                Command Center v4.1
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Center content */}
                <motion.div
                    className="relative z-10 px-10 flex-1 flex flex-col justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                >
                    <AnimatePresence mode="wait">
                        {tab === "login" ? (
                            <motion.div
                                key="left-login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <h1 className="text-[4.5rem] font-heading font-black tracking-[-0.04em] uppercase text-white leading-[0.85] mb-6 text-white">
                                    Authorized<br />
                                    <span className="text-accent-neon">Personnel</span><br />
                                    Only
                                </h1>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="left-register"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <h1 className="text-[4.5rem] font-heading font-black tracking-[-0.04em] uppercase text-white leading-[0.85] mb-6 text-white">
                                    Establish<br />
                                    <span className="text-accent-neon">Protocol</span><br />
                                    Uplink
                                </h1>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <div className="relative z-10 p-10 flex items-center justify-between border-t border-white/5">
                    <span className="text-brand-700 font-mono text-[10px] uppercase tracking-[0.2em]">
                        System.Auth.Node.01
                    </span>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-full lg:w-[45%] flex flex-col justify-center relative bg-[var(--ch-brand-900)]">
                <div className="absolute top-8 right-8 z-10">
                    <ThemeToggle />
                </div>

                <motion.div
                    className="w-full max-w-md mx-auto px-8 md:px-12 relative z-10"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                >
                    {/* Tab switcher */}
                    <div className="flex mb-8 border border-brand-800">
                        {(["login", "register"] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`flex-1 py-3 font-mono text-[10px] uppercase tracking-[0.2em] transition-all relative ${
                                    tab === t
                                        ? "bg-accent-neon text-[var(--ch-brand-900)] font-bold"
                                        : "text-brand-500 hover:text-white"
                                }`}
                            >
                                {t === "login" ? "Sign In" : "Register"}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {tab === "login" ? (
                            <LoginForm key="login" onSwitch={() => setTab("register")} />
                        ) : (
                            <RegisterForm key="register" onSwitch={() => setTab("login")} />
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#DFFF00]/20 border-t-[#DFFF00] rounded-full animate-spin" /></div>}>
            <AuthPageContent />
        </Suspense>
    );
}
