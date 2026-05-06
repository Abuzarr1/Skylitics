"use client";
import { useState, useEffect } from "react";
import { loadAllCSVs, FlightRow } from "./csvUtils";

/**
 * useData - Resilient two-mode data fetching hook.
 * Mode 1: Load CSV data immediately for zero-delay UX.
 * Mode 2: Silently attempt live API in background; swap data if successful.
 */
export function useData(airportCode?: string) {
    const [rows, setRows] = useState<FlightRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function init() {
            // STEP 1: Load CSV immediately — this is what the user sees first
            const csvRows = await loadAllCSVs();
            const filtered = (r: FlightRow) =>
                !airportCode || r.origin === airportCode || r.destination === airportCode;

            if (!cancelled) {
                setRows(csvRows.filter(filtered));
                setLoading(false); // Page renders with CSV data NOW
            }

            // STEP 2: Try live API silently in background
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 2000); // 2-second hard timeout

                const res = await fetch('/api/flights/live', {
                    signal: controller.signal
                });
                clearTimeout(timeout);

                if (res.ok) {
                    const json = await res.json();
                    const liveRows: FlightRow[] = json?.data ?? [];
                    if (liveRows.length > 0 && !cancelled) {
                        setRows(liveRows.filter(filtered));
                        // Silently upgraded to live data
                    }
                }
            } catch (err) {
                // API failed or timed out — stay on CSV data, do nothing
            }
        }

        init();
        return () => { cancelled = true; };
    }, [airportCode]);

    return { rows, loading };
}
