"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/login?mode=register");
    }, [router]);

    return (
        <div className="min-h-screen bg-[var(--ch-brand-900)] flex items-center justify-center font-mono text-xs text-brand-600 uppercase tracking-[0.3em]">
            Redirecting to Unified Auth Node...
        </div>
    );
}
