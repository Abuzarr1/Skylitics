"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane, Menu, X, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { logoutUser } from "@/lib/api";

const NAV_LINKS = [
    { href: "/",             label: "Platform"         },
    { href: "/solutions",    label: "Intelligence Lab" },
    { href: "/data",         label: "Decision Ledger"  },
    { href: "/architecture", label: "Architecture"     },
];

export default function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const auth = useAuth();

    const handleLogout = async () => {
        try {
            await fetch(`http://localhost:8000/api/v1/auth/logout`, { method: "POST" });
        } catch (e) {}
        logoutUser();
        window.location.href = "/";
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between border-b border-white/5 bg-brand-900/60 backdrop-blur-lg">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 border-2 border-accent-neon rounded flex items-center justify-center bg-brand-950 skew-x-[-10deg]">
                        <Plane className="w-5 h-5 text-accent-neon" />
                    </div>
                    <span className="text-2xl font-heading font-black tracking-tighter uppercase text-white">
                        Skylytics
                    </span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-8 font-mono text-sm uppercase tracking-widest text-text-dim">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={pathname === link.href
                                ? "text-white border-b border-accent-neon"
                                : "hover:text-white transition-colors"}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    {!!auth ? (
                        <div className="hidden md:flex items-center gap-3">
                            <Link href={auth.role === "PASSENGER" ? "/passenger" : "/manager"} className="bg-accent-neon text-brand-950 font-bold font-mono tracking-widest uppercase text-sm px-6 py-3 rounded hover:bg-white transition-colors max-w-[200px] truncate" title={auth.name}>
                                {auth.name || "Dashboard"}
                            </Link>
                            <button onClick={handleLogout} className="text-brand-400 hover:text-white p-2 transition-colors flex items-center gap-2 group" title="Logout">
                                <LogOut className="w-5 h-5 group-hover:text-accent-alert transition-colors" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="hidden md:block text-white hover:text-accent-neon font-bold font-mono tracking-widest uppercase text-sm transition-colors">
                                Sign In
                            </Link>
                            <Link href="/register" className="hidden md:block bg-accent-neon text-brand-950 font-bold font-mono tracking-widest uppercase text-sm px-6 py-3 rounded hover:bg-white transition-colors">
                                Register
                            </Link>
                        </>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden text-white p-1"
                        onClick={() => setMobileOpen((v) => !v)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </nav>

            {/* Mobile dropdown */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-[81px] left-0 right-0 z-40 bg-brand-950 border-b border-white/10 flex flex-col px-8 py-6 gap-6 md:hidden"
                    >
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`font-mono text-sm uppercase tracking-widest ${
                                    pathname === link.href ? "text-accent-neon" : "text-brand-400 hover:text-white"
                                } transition-colors`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="border-t border-white/5 pt-6 pb-2 flex flex-col gap-4">
                            {!!auth ? (
                                <>
                                    <Link
                                        href={auth.role === "PASSENGER" ? "/passenger" : "/manager"}
                                        onClick={() => setMobileOpen(false)}
                                        className="bg-accent-neon text-brand-950 font-bold font-mono tracking-widest uppercase text-sm px-6 py-3 text-center hover:bg-white transition-colors block truncate"
                                    >
                                        {auth.name || "Dashboard"}
                                    </Link>
                                    <button
                                        onClick={() => { setMobileOpen(false); handleLogout(); }}
                                        className="text-brand-400 hover:text-accent-alert font-bold font-mono tracking-widest uppercase text-sm px-6 py-3 text-center transition-colors block"
                                    >
                                        LOGOUT
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileOpen(false)}
                                        className="text-white hover:text-accent-neon font-bold font-mono tracking-widest uppercase text-sm text-center transition-colors block"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        onClick={() => setMobileOpen(false)}
                                        className="bg-accent-neon text-brand-950 font-bold font-mono tracking-widest uppercase text-sm px-6 py-3 text-center hover:bg-white transition-colors block"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
