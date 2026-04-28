"use client";

import { useEffect, useState } from "react";

export interface AuthUser {
    userId: string;
    name: string;
    email: string;
    role: string;
    airportCode: string | null;  // selected airport (from session, not DB)
    isAdmin: boolean;
    isManager: boolean;
}

const USER_KEY    = "skylytics_user";
const AIRPORT_KEY = "skylytics_airport";

function parseUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        const role = (data.role ?? "PASSENGER").toUpperCase();
        const airportCode = localStorage.getItem(AIRPORT_KEY) ?? null;
        return {
            userId:      data.id ?? "",
            name:        data.full_name ?? data.name ?? "",
            email:       data.email ?? "",
            role,
            airportCode,
            isAdmin:     role === "ADMIN",
            isManager:   role === "MANAGER",
        };
    } catch {
        return null;
    }
}

export function useAuth(): AuthUser | null {
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        setUser(parseUser());

        function onStorage(e: StorageEvent) {
            if (e.key === USER_KEY || e.key === AIRPORT_KEY) {
                setUser(parseUser());
            }
        }
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    return user;
}

/** Call this from the select-airport page after the user picks an airport */
export function setSelectedAirport(code: string) {
    localStorage.setItem(AIRPORT_KEY, code);
    document.cookie = `skylytics_airport=${code}; path=/; max-age=${60 * 60 * 24 * 7}`;
    // Dispatch a storage event so useAuth re-reads across tabs
    window.dispatchEvent(new StorageEvent("storage", { key: AIRPORT_KEY, newValue: code }));
}

/** Clear airport selection (on logout) */
export function clearSelectedAirport() {
    localStorage.removeItem(AIRPORT_KEY);
    document.cookie = "skylytics_airport=; path=/; max-age=0";
}
