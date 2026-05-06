
import { useState, useEffect } from 'react';
import { loadAllCSVs, FlightRow } from './csvUtils';

export function useFlightData(airportCode?: string) {
    const [rows, setRows] = useState<FlightRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        async function load() {
            // 1. Pre-load CSV immediately so fallback is instant
            const csvRows = await loadAllCSVs();

            // 2. Try live API
            try {
                // Using a 3s timeout as requested
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                const res = await fetch('/api/flights/live', { 
                    signal: controller.signal 
                });
                
                clearTimeout(timeoutId);

                if (res.ok) {
                    const json = await res.json();
                    if (json?.data?.length > 0) {
                        const data = airportCode
                            ? json.data.filter((r: any) => r.origin === airportCode || r.destination === airportCode)
                            : json.data;
                        
                        if (isMounted) {
                            setRows(data);
                            setLoading(false);
                            return;
                        }
                    }
                }
            } catch (err) {
                // Silent fallback to CSV
                console.debug('API unavailable, falling back to CSV data source.');
            }

            // 3. Fallback to CSV
            if (isMounted) {
                setRows(airportCode
                    ? csvRows.filter(r => r.origin === airportCode || r.destination === airportCode)
                    : csvRows);
                setLoading(false);
            }
        }

        load();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [airportCode]);

    return { rows, loading };
}
