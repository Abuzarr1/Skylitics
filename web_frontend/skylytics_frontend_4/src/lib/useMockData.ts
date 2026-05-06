"use client";
import { useState, useEffect } from 'react';
import { loadAllCSVs, FlightRow } from './csvUtils';

/**
 * useMockData - Simplified hook for loading flight data from CSVs.
 * Loads all CSV files once, then filters by airport code if provided.
 */
export function useMockData(airportCode?: string) {
    const [rows, setRows] = useState<FlightRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        loadAllCSVs().then(allRows => {
            if (!isMounted) return;
            
            const result = airportCode
                ? allRows.filter(r => r.origin === airportCode || r.destination === airportCode)
                : allRows;
                
            setRows(result);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load mock data:", err);
            if (isMounted) setLoading(false);
        });

        return () => { isMounted = false; };
    }, [airportCode]);

    return { rows, loading };
}
