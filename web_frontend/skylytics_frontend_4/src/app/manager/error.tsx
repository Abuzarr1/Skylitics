"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function ManagerError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Error already surfaced to the user — no need to log to console
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
            <AlertTriangle className="w-10 h-10 text-accent-alert mb-6" />
            <h2 className="text-2xl font-heading font-black text-white uppercase tracking-tighter mb-3">
                Something went wrong
            </h2>
            <p className="font-mono text-xs uppercase tracking-widest text-brand-500 mb-8 max-w-sm">
                {error.message || "An unexpected error occurred in the manager portal."}
            </p>
            <button
                onClick={reset}
                className="bg-white text-black font-mono font-black uppercase tracking-widest px-10 py-3 text-sm hover:bg-accent-neon transition-colors"
            >
                Try Again
            </button>
        </div>
    );
}
