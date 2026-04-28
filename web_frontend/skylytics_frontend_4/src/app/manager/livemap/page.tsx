"use client";
import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Activity, RefreshCw, Plane, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { getLiveFlights } from "@/lib/api";

interface LiveFlight {
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

// Dynamically import the map to avoid SSR issues with Leaflet
const FlightMap = dynamic(() => import("@/components/map/FlightMap"), { ssr: false });

const MOCK_FLIGHTS: LiveFlight[] = [
    { id: "m1", callsign: "DL192", airline: "Delta Air Lines",    origin: "ATL", destination: "JFK", origin_lat: 33.64, origin_lon: -84.43, dest_lat: 40.64, dest_lon: -73.78, current_lat: 37.20, current_lon: -79.30, altitude_ft: 35000, speed_kts: 478, delay_probability: 0.72, status: "delayed",  progress: 0.55 },
    { id: "m2", callsign: "AA505", airline: "American Airlines",  origin: "ORD", destination: "LAX", origin_lat: 41.98, origin_lon: -87.91, dest_lat: 33.94, dest_lon: -118.41, current_lat: 38.50, current_lon: -104.00, altitude_ft: 37000, speed_kts: 492, delay_probability: 0.48, status: "at_risk",  progress: 0.42 },
    { id: "m3", callsign: "UA301", airline: "United Airlines",    origin: "DFW", destination: "SFO", origin_lat: 32.90, origin_lon: -97.04, dest_lat: 37.62, dest_lon: -122.38, current_lat: 35.10, current_lon: -110.50, altitude_ft: 36000, speed_kts: 465, delay_probability: 0.38, status: "at_risk",  progress: 0.33 },
    { id: "m4", callsign: "B6112", airline: "JetBlue Airways",   origin: "JFK", destination: "MIA", origin_lat: 40.64, origin_lon: -73.78, dest_lat: 25.80, dest_lon: -80.28, current_lat: 33.40, current_lon: -77.10, altitude_ft: 34000, speed_kts: 445, delay_probability: 0.09, status: "on_time",  progress: 0.68 },
    { id: "m5", callsign: "SW640", airline: "Southwest Airlines", origin: "DEN", destination: "SEA", origin_lat: 39.86, origin_lon: -104.67, dest_lat: 47.45, dest_lon: -122.31, current_lat: 44.20, current_lon: -113.50, altitude_ft: 35000, speed_kts: 458, delay_probability: 0.55, status: "at_risk",  progress: 0.48 },
    { id: "m6", callsign: "WN210", airline: "Southwest Airlines", origin: "LAS", destination: "PHX", origin_lat: 36.08, origin_lon: -115.15, dest_lat: 33.44, dest_lon: -112.01, current_lat: 34.80, current_lon: -113.60, altitude_ft: 28000, speed_kts: 420, delay_probability: 0.11, status: "on_time",  progress: 0.71 },
    { id: "m7", callsign: "DL788", airline: "Delta Air Lines",    origin: "SEA", destination: "ATL", origin_lat: 47.45, origin_lon: -122.31, dest_lat: 33.64, dest_lon: -84.43, current_lat: 41.50, current_lon: -103.20, altitude_ft: 38000, speed_kts: 501, delay_probability: 0.14, status: "on_time",  progress: 0.38 },
    { id: "m8", callsign: "AA122", airline: "American Airlines",  origin: "MIA", destination: "ORD", origin_lat: 25.80, origin_lon: -80.28, dest_lat: 41.98, dest_lon: -87.91, current_lat: 32.50, current_lon: -84.50, altitude_ft: 33000, speed_kts: 462, delay_probability: 0.61, status: "delayed",  progress: 0.22 },
];

export default function LiveMapPage() {
    const [flights, setFlights] = useState<LiveFlight[]>(MOCK_FLIGHTS);
    const [selected, setSelected] = useState<LiveFlight | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [filter, setFilter] = useState<"all" | "at_risk" | "delayed">("all");

    const fetchFlights = useCallback(async () => {
        try {
            const data = await getLiveFlights();
            setFlights(data?.length ? data : MOCK_FLIGHTS);
            setLastUpdated(new Date());
        } catch (e) {
            console.error("Failed to fetch live flights:", e);
            setFlights(MOCK_FLIGHTS);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFlights();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchFlights, 30000);
        return () => clearInterval(interval);
    }, [fetchFlights]);

    const filtered = filter === "all" ? flights : flights.filter(f => f.status === filter);
    const atRisk = flights.filter(f => f.status === "at_risk").length;
    const delayed = flights.filter(f => f.status === "delayed").length;
    const onTime = flights.filter(f => f.status === "on_time").length;

    const statusColor = (s: string) => {
        if (s === "delayed") return "text-red-400";
        if (s === "at_risk") return "text-yellow-400";
        return "text-[#DFFF00]";
    };

    const statusIcon = (s: string) => {
        if (s === "delayed") return <AlertTriangle className="w-3 h-3 text-red-400" />;
        if (s === "at_risk") return <Clock className="w-3 h-3 text-yellow-400" />;
        return <CheckCircle className="w-3 h-3 text-[#DFFF00]" />;
    };

    return (
        <div className="w-full flex gap-0 bg-[var(--ch-brand-900)] h-[calc(100vh-80px)]">
            {/* Left Sidebar */}
            <div className="w-80 border-r border-[var(--border-ui)] flex flex-col bg-[var(--bg-card)] shrink-0">
                {/* Header */}
                <div className="p-5 border-b border-[var(--border-ui)]">
                    <div className="flex items-center justify-between mb-1">
                        <h1 className="text-xl font-heading font-black uppercase text-white tracking-tight">Live Flight Map</h1>
                        <button
                            onClick={fetchFlights}
                            className="text-brand-400 hover:text-[#DFFF00] transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                    <p className="text-brand-500 font-mono text-[9px] uppercase tracking-[0.2em]">
                        {lastUpdated ? `Last sync: ${lastUpdated.toLocaleTimeString()}` : "Connecting..."}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 border-b border-[var(--border-ui)]">
                    <div className="p-3 border-r border-[var(--border-ui)] text-center">
                        <div className="text-2xl font-heading font-black text-[#DFFF00]">{onTime}</div>
                        <div className="font-mono text-[9px] uppercase tracking-widest text-brand-500">On Time</div>
                    </div>
                    <div className="p-3 border-r border-[var(--border-ui)] text-center">
                        <div className="text-2xl font-heading font-black text-yellow-400">{atRisk}</div>
                        <div className="font-mono text-[9px] uppercase tracking-widest text-brand-500">At Risk</div>
                    </div>
                    <div className="p-3 text-center">
                        <div className="text-2xl font-heading font-black text-red-400">{delayed}</div>
                        <div className="font-mono text-[9px] uppercase tracking-widest text-brand-500">Delayed</div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex border-b border-[var(--border-ui)]">
                    {(["all", "at_risk", "delayed"] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 py-2 font-mono text-[9px] uppercase tracking-widest transition-colors ${
                                filter === f ? "bg-white/10 text-white" : "text-brand-500 hover:text-brand-300"
                            }`}
                        >
                            {f === "all" ? "All" : f === "at_risk" ? "At Risk" : "Delayed"}
                        </button>
                    ))}
                </div>

                {/* Flight List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <Activity className="w-5 h-5 text-[#DFFF00] animate-pulse" />
                        </div>
                    ) : filtered.map(flight => (
                        <button
                            key={flight.id}
                            onClick={() => setSelected(flight)}
                            className={`w-full text-left p-4 border-b border-white/5 hover:bg-[var(--bg-surface)] transition-colors ${
                                selected?.id === flight.id ? "bg-white/10 border-l-2 border-l-[#DFFF00]" : ""
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <Plane className="w-3 h-3 text-brand-400" />
                                    <span className="font-mono text-xs font-bold text-white">{flight.callsign}</span>
                                </div>
                                {statusIcon(flight.status)}
                            </div>
                            <div className="font-mono text-[9px] text-brand-500 uppercase tracking-widest">
                                {flight.origin} → {flight.destination}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <span className={`font-mono text-[9px] uppercase ${statusColor(flight.status)}`}>
                                    {Math.round(flight.delay_probability * 100)}% risk
                                </span>
                                <div className="w-16 h-1 bg-brand-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#DFFF00] rounded-full"
                                        style={{ width: `${flight.progress * 100}%` }}
                                    />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Selected Flight Details */}
                {selected && (
                    <div className="border-t border-[var(--border-ui)] p-4 bg-[var(--ch-brand-900)]">
                        <div className="font-mono text-[9px] uppercase tracking-widest text-brand-500 mb-2">Active Vector</div>
                        <div className="font-heading font-black text-white text-lg">{selected.callsign}</div>
                        <div className="font-mono text-xs text-brand-300 mb-3">{selected.airline}</div>
                        <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                            <div className="text-brand-500">ALTITUDE</div>
                            <div className="text-white text-right">{selected.altitude_ft.toLocaleString()} ft</div>
                            <div className="text-brand-500">SPEED</div>
                            <div className="text-white text-right">{selected.speed_kts} kts</div>
                            <div className="text-brand-500">RISK</div>
                            <div className={`text-right font-bold ${statusColor(selected.status)}`}>
                                {Math.round(selected.delay_probability * 100)}%
                            </div>
                            <div className="text-brand-500">PROGRESS</div>
                            <div className="text-white text-right">{Math.round(selected.progress * 100)}%</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                {/* Map label */}
                <div className="absolute top-4 right-4 z-[1000] font-mono text-[10px] text-brand-500 uppercase tracking-widest flex items-center gap-2 bg-[var(--bg-card)]/90 px-3 py-2 border border-[var(--border-ui)] backdrop-blur-sm">
                    <Activity className="w-3 h-3 text-[#DFFF00] animate-pulse" />
                    {flights.length} active vectors
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 right-4 z-[1000] font-mono text-[10px] uppercase tracking-widest bg-[var(--bg-card)]/90 px-4 py-3 border border-[var(--border-ui)] backdrop-blur-sm space-y-2">
                    <div className="text-brand-500 mb-1">Risk Legend</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#DFFF00]" /><span className="text-white">On Time</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400" /><span className="text-white">At Risk</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-white">Delayed</span></div>
                </div>

                <FlightMap flights={filtered} selected={selected} onSelect={setSelected} />
            </div>
        </div>
    );
}
