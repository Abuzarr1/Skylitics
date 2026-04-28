"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-8 h-8 rounded border border-white/10" />;
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 border border-brand-700 rounded-sm bg-brand-800/50 hover:bg-brand-700/50 hover:text-accent-neon transition-colors focus:ring-2 focus:ring-accent-neon outline-none"
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <Sun className="w-4 h-4 text-brand-300 hover:text-accent-neon transition-colors" />
            ) : (
                <Moon className="w-4 h-4 text-brand-300 hover:text-accent-alert transition-colors" />
            )}
        </button>
    );
}
