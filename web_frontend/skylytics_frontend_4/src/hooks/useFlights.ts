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

export type DataSource = "LIVE" | "EXTERNAL" | "DEMO";

const AIRPORT_ICAO: Record<string, string> = {
    ATL: "KATL",
    JFK: "KJFK",
    ORD: "KORD",
    LAX: "KLAX",
    DFW: "KDFW",
    MIA: "KMIA",
    SFO: "KSFO",
    DEN: "KDEN",
    SEA: "KSEA",
};

export function useFlights(airportCode: string | null) {
    const filterMock = (code: string | null): LiveFlight[] => {
        if (!code) return [];
        return MOCK_FLIGHTS
            .filter((f: any) => f.origin === code || f.dest === code)
            .map((f: any) => ({ ...f, destination: f.dest })) as LiveFlight[];
    };

    const [flights, setFlights] = useState<LiveFlight[]>(filterMock(airportCode));
    const [dataSource, setDataSource] = useState<DataSource>("DEMO");
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());

    const fetchFlights = useCallback(async () => {
        if (!airportCode) return;
        
        // Priority 1: FastAPI Backend
        try {
            const data: LiveFlight[] = await getLiveFlights();
            if (data && data.length > 0) {
                const filtered = data.filter(f => f.origin === airportCode || f.destination === airportCode);
                if (filtered.length > 0) {
                    setFlights(filtered);
                    setDataSource("LIVE");
                    setLastUpdated(new Date());
                    return;
                }
            }
        } catch (err) {
            // Silently try Priority 2
        }

        // Priority 2: OpenSky Network
        try {
            const icao = AIRPORT_ICAO[airportCode];
            if (icao) {
                const response = await fetch(`https://opensky-network.org/api/states/all`);
                const data = await response.json();
                
                if (data && data.states) {
                    const externalFlights: LiveFlight[] = data.states
                        .slice(0, 15)
                        .map((s: any, idx: number) => ({
                            id: `external-${s[0]}`,
                            callsign: s[1]?.trim() || "UNK",
                            airline: "External Carrier",
                            origin: idx % 2 === 0 ? airportCode : "EXT",
                            destination: idx % 2 === 0 ? "EXT" : airportCode,
                            origin_lat: s[6] || 0,
                            origin_lon: s[5] || 0,
                            dest_lat: s[6] || 0,
                            dest_lon: s[5] || 0,
                            current_lat: s[6] || 0,
                            current_lon: s[5] || 0,
                            altitude_ft: Math.round((s[7] || 0) * 3.28084),
                            speed_kts: Math.round((s[9] || 0) * 1.94384),
                            delay_probability: 0.05,
                            status: "on_time",
                            progress: 0.5,
                        }));
                    
                    if (externalFlights.length > 0) {
                        setFlights(externalFlights);
                        setDataSource("EXTERNAL");
                        setLastUpdated(new Date());
                        return;
                    }
                }
            }
        } catch (err) {
            // Silently fallback to mocks
        }

        // Priority 3: Mock Data (Phase 0)
        setFlights(filterMock(airportCode));
        setDataSource("DEMO");
        setLastUpdated(new Date());
    }, [airportCode]);

    useEffect(() => {
        // Immediately load mocks on mount or airport change
        setFlights(filterMock(airportCode));
        setDataSource("DEMO");
        
        fetchFlights();
        
        // Polling every 60 seconds
        const interval = setInterval(fetchFlights, 60_000);
        return () => clearInterval(interval);
    }, [fetchFlights, airportCode]);

    return { flights, dataSource, loading, lastUpdated, refetch: fetchFlights, isLive: dataSource === "LIVE" };
}
