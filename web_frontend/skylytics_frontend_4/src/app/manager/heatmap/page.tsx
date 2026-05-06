
"use client";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { LoadingRadar } from "@/components/ui/LoadingRadar";
import { getAirportStats, getRoutes, getRiskLevel, REGISTERED_AIRPORTS, AIRPORT_META } from "@/lib/csvUtils";
import { useData } from "@/lib/useData";

const RouteNetworkGraph = dynamic(() => import("@/components/visualization/RouteNetworkGraph"), { 
    ssr: false,
    loading: () => <LoadingRadar text="INITIALIZING 3D GRAPH ENGINE..." />
});

export default function HeatmapPage() {
    const { rows, loading } = useData();

    const hubs = useMemo(() => {
        const stats = REGISTERED_AIRPORTS.map(code => getAirportStats(code, rows));
        const maxFlights = Math.max(...stats.map(s => s.totalFlights), 1);
        
        return REGISTERED_AIRPORTS.map(code => {
            const s = getAirportStats(code, rows);
            const risk = getRiskLevel(code, rows);
            const meta = AIRPORT_META[code];
            return {
                id: code,
                lat: meta.lat,
                lng: meta.lng,
                size: (s.totalFlights / maxFlights) * 10,
                color: risk === 'high' ? "#EF4444" : risk === 'medium' ? "#FBBF24" : "#DFFF00",
                label: code
            };
        });
    }, [rows]);

    const routes = useMemo(() => {
        const routeData = getRoutes(rows);
        const maxCount = Math.max(...routeData.map(r => r.flightCount), 1);
        
        return routeData.map(r => {
            const start = AIRPORT_META[r.origin];
            const end = AIRPORT_META[r.destination];
            if (!start || !end) return null;
            return {
                start: [start.lat, start.lng],
                end: [end.lat, end.lng],
                intensity: 0.5,
                thickness: (r.flightCount / maxCount) * 5,
                color: getRiskLevel(r.origin, rows) === 'high' ? "#EF4444" : "#DFFF00"
            };
        }).filter(Boolean);
    }, [rows]);

    if (loading) return <LoadingRadar text="CONNECTING TO GLOBAL NODE NETWORK..." />;

    return (
        <div className="w-full h-[calc(100vh-80px)] bg-brand-950 relative overflow-hidden">
            <div className="absolute top-10 left-10 z-10 pointer-events-none">
                <div className="font-mono text-[10px] text-accent-ice tracking-[0.4em] uppercase mb-2">System Blueprint</div>
                <h2 className="text-4xl font-heading font-black text-white uppercase tracking-tighter">Global Node Map</h2>
            </div>

            <Suspense fallback={<LoadingRadar text="RENDERING SPATIAL VECTORS..." />}>
                <RouteNetworkGraph 
                    hubs={hubs as any} 
                    routes={routes as any} 
                />
            </Suspense>

            <div className="absolute bottom-10 right-10 z-10 border border-white/10 bg-brand-950/80 p-6 backdrop-blur-md">
                <div className="font-mono text-[9px] text-brand-500 uppercase tracking-widest mb-4">Network Stats</div>
                <div className="space-y-3">
                    <div className="flex justify-between gap-12 text-[10px] font-mono text-brand-400 uppercase">
                        <span>Active Nodes</span>
                        <span className="text-white">{REGISTERED_AIRPORTS.length}</span>
                    </div>
                    <div className="flex justify-between gap-12 text-[10px] font-mono text-brand-400 uppercase">
                        <span>Active Arcs</span>
                        <span className="text-white">{routes.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
