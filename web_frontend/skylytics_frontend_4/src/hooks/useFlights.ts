import { useState, useEffect, useCallback } from "react";
import { getLiveFlights } from "@/lib/api";
import { MOCK_FLIGHTS } from "@/lib/mocks";

export interface LiveFlight {
    id: string;
    callsign: string;
    airline: string;
    origin: string;
    destination: string;
    origin_lat: number;
    origin_lon: number;
    dest_lat: number;
    dest_lon: number;
    current_lat: number;
    current_lon: number;
    altitude_ft: number;
    speed_kts: number;
    delay_probability: number;
    status: string;
    progress: number;
}

export function useFlights(airportCode: string | null) {
    // 1. Initial Mock State: filter locally from MOCK_FLIGHTS
    const filterMock = (code: string | null): LiveFlight[] => {
        const mapped = MOCK_FLIGHTS.map((f: any) => ({ ...f, destination: f.dest })) as LiveFlight[];
        if (!code) return mapped;
        return mapped.filter(f => f.origin === code || f.destination === code);
    };

    const [flights, setFlights] = useState<LiveFlight[]>(filterMock(airportCode));
    const [isLive, setIsLive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchFlights = useCallback(async () => {
        if (!airportCode) return;
        setLoading(true);
        try {
            const data: LiveFlight[] = await getLiveFlights();
            if (data && data.length > 0) {
                const filtered = data.filter(f => f.origin === airportCode || f.destination === airportCode);
                setFlights(filtered);
                setIsLive(true);
            } else {
                setFlights(filterMock(airportCode));
                setIsLive(false);
            }
        } catch {
            setFlights(filterMock(airportCode));
            setIsLive(false);
        } finally {
            setLoading(false);
            setLastUpdated(new Date());
        }
    }, [airportCode]);

    useEffect(() => {
        // Immediately reset to the new airport's mock data when selection changes
        setFlights(filterMock(airportCode));
        setIsLive(false);
        fetchFlights();
        
        // Poll for live data every 30s
        const interval = setInterval(fetchFlights, 30_000);
        return () => clearInterval(interval);
    }, [fetchFlights, airportCode]);

    return { flights, isLive, loading, lastUpdated, refetch: fetchFlights };
}
