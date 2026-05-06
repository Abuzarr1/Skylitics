
"use client";
import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { LoadingRadar } from "@/components/ui/LoadingRadar";
import { getAirportStats, getRoutes, getRiskLevel, REGISTERED_AIRPORTS, AIRPORT_META } from "@/lib/csvUtils";
import { useFlightData } from "@/lib/useFlightData";

const FlightMap = dynamic(() => import("@/components/map/FlightMap"), { 
    ssr: false,
    loading: () => <LoadingRadar text="INITIALIZING GEOSPATIAL ENGINE..." />
});

export default function LiveMapPage() {
    const { rows, loading } = useFlightData();
    const [selected, setSelected] = useState<any>(null);

    const airportNodes = useMemo(() => {
        return REGISTERED_AIRPORTS.map(code => {
            const stats = getAirportStats(code, rows);
            const meta = AIRPORT_META[code];
            return {
                code,
                name: meta.name,
                lat: meta.lat,
                lng: meta.lng,
                totalFlights: stats.totalFlights,
                delayed: stats.delayed,
                riskLevel: stats.riskLevel
            };
        });
    }, [rows]);

    const mappedFlights = useMemo(() => {
        const routes = getRoutes(rows);
        return routes.map((r, i) => {
            const start = AIRPORT_META[r.origin];
            const end = AIRPORT_META[r.destination];
            if (!start || !end) return null;
            
            const progress = Math.floor(Math.random() * 100);
            const current_lat = start.lat + (end.lat - start.lat) * (progress / 100);
            const current_lon = start.lng + (end.lng - start.lng) * (progress / 100);

            const risk = getRiskLevel(r.origin, rows);

            return {
                id: `flight-${i}`,
                callsign: `SKL${100 + i}`,
                airline: "Skylytics Air",
                origin: r.origin,
                destination: r.destination,
                origin_lat: start.lat,
                origin_lon: start.lng,
                dest_lat: end.lat,
                dest_lon: end.lng,
                current_lat,
                current_lon,
                altitude_ft: 32000,
                speed_kts: 450,
                delay_probability: risk === 'high' ? 0.8 : risk === 'medium' ? 0.4 : 0.1,
                status: risk === 'high' ? "delayed" : risk === 'medium' ? "at_risk" : "on_time",
                progress
            };
        }).filter(Boolean);
    }, [rows]);

    if (loading) return <LoadingRadar text="CONNECTING TO LIVE FLIGHT TELEMETRY..." />;

    return (
        <div className="w-full h-[calc(100vh-80px)] bg-brand-950 relative overflow-hidden">
            <div className="absolute top-10 left-10 z-10 pointer-events-none">
                <div className="font-mono text-[10px] text-accent-ice tracking-[0.4em] uppercase mb-2">Operational Vector</div>
                <h2 className="text-4xl font-heading font-black text-white uppercase tracking-tighter">Live Flight Map</h2>
            </div>

            <FlightMap 
                flights={mappedFlights as any} 
                airports={airportNodes as any}
                selected={selected} 
                onSelect={setSelected} 
            />
        </div>
    );
}
