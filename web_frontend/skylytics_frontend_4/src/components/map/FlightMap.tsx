"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

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

interface AirportNode {
    code: string;
    name: string;
    lat: number;
    lng: number;
    totalFlights: number;
    delayed: number;
    riskLevel: 'low' | 'medium' | 'high';
}

interface Props {
    flights: LiveFlight[];
    airports: AirportNode[];
    selected: LiveFlight | null;
    onSelect: (flight: LiveFlight) => void;
}

const STATUS_COLOR: Record<string, string> = {
    on_time: "#DFFF00",
    at_risk: "#FBBF24",
    delayed: "#EF4444",
    low: "#22c55e",
    medium: "#eab308",
    high: "#ef4444"
};

export default function FlightMap({ flights, airports, selected, onSelect }: Props) {
    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<any[]>([]);
    const polylineRef = useRef<any[]>([]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Dynamically import Leaflet (avoids SSR issues)
        import("leaflet").then((L) => {
            if (mapRef.current || !mapContainerRef.current) return;

            // Dark themed map using CartoDB dark tiles
            const map = L.map(mapContainerRef.current, {
                center: [30, 10],
                zoom: 2.5,
                zoomControl: true,
                attributionControl: false,
            });

            L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
                maxZoom: 18,
                subdomains: "abcd",
            }).addTo(map);

            mapRef.current = map;
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update markers and routes whenever flights data changes
    useEffect(() => {
        if (!mapRef.current || flights.length === 0) return;

        import("leaflet").then((L) => {
            // Clear old markers and polylines
            markersRef.current.forEach(m => m.remove());
            polylineRef.current.forEach(p => p.remove());
            markersRef.current = [];
            polylineRef.current = [];

            flights.forEach((flight) => {
                // Defensive check: Skip flights missing coordinates to prevent crashes (reading '0')
                if (
                    flight.origin_lat === undefined || flight.origin_lon === undefined ||
                    flight.dest_lat === undefined || flight.dest_lon === undefined ||
                    flight.current_lat === undefined || flight.current_lon === undefined
                ) {
                    console.warn(`[FlightMap] Skipping flight ${flight.callsign} due to missing telemetry.`);
                    return;
                }

                const color = STATUS_COLOR[flight.status] || "#DFFF00";
                const isSelected = selected?.id === flight.id;

                // Draw route line (dashed, faint)
                const routeLine = L.polyline(
                    [[flight.origin_lat, flight.origin_lon], [flight.dest_lat, flight.dest_lon]],
                    { color, weight: isSelected ? 2 : 1, opacity: isSelected ? 0.7 : 0.25, dashArray: "4 6" }
                ).addTo(mapRef.current);
                polylineRef.current.push(routeLine);

                // Compute bearing angle for the plane icon
                const dLon = flight.dest_lon - flight.origin_lon;
                const dLat = flight.dest_lat - flight.origin_lat;
                const bearingRad = Math.atan2(dLon, dLat);
                const bearingDeg = (bearingRad * 180 / Math.PI + 360) % 360;

                const size = isSelected ? 28 : 20;
                const glow = isSelected ? 16 : 6;
                // SVG aircraft silhouette — proper top-down airplane (fuselage + swept wings + tail)
                const planeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="transform:rotate(${bearingDeg}deg);filter:drop-shadow(0 0 ${glow}px ${color}90);">
                    <path d="M12 2 C11.2 2 10.5 2.6 10.5 3.5 L10.5 9.5 L2 15 L2 17 L10.5 14.5 L10.5 19.5 L8 21 L8 22.5 L12 21.5 L16 22.5 L16 21 L13.5 19.5 L13.5 14.5 L22 17 L22 15 L13.5 9.5 L13.5 3.5 C13.5 2.6 12.8 2 12 2 Z"
                        fill="${color}" fill-opacity="${isSelected ? 1 : 0.8}" stroke="${isSelected ? '#ffffff' : 'rgba(0,0,0,0.3)'}" stroke-width="${isSelected ? 0.6 : 0.3}"/>
                </svg>`;

                const planeIcon = L.divIcon({
                    className: "",
                    html: `<div style="width:${size}px;height:${size}px;cursor:pointer;">${planeSvg}</div>`,
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                });

                const marker = L.marker([flight.current_lat, flight.current_lon], { icon: planeIcon })
                    .addTo(mapRef.current)
                    .bindTooltip(
                        `<div style="background:#0d1117;border:1px solid #30363d;padding:8px;border-radius:4px;font-family:monospace;font-size:10px;color:#e6edf3;min-width:140px">
                            <div style="color:${color};font-weight:bold;letter-spacing:1px;margin-bottom:4px">${flight.callsign}</div>
                            <div style="color:#8b949e">${flight.origin} → ${flight.destination}</div>
                            <div style="color:#8b949e">ALT: ${flight.altitude_ft.toLocaleString()} ft</div>
                            <div style="color:#8b949e">SPD: ${flight.speed_kts} kts</div>
                            <div style="color:${color};margin-top:4px">RISK: ${Math.round(flight.delay_probability * 100)}%</div>
                        </div>`,
                        { permanent: false, direction: "top", offset: [0, -8], className: "leaflet-custom-tooltip" }
                    )
                    .on("click", () => onSelect(flight));

                markersRef.current.push(marker);
            });

            // Draw Airport Nodes
            airports.forEach((airport) => {
                const color = STATUS_COLOR[airport.riskLevel] || "#DFFF00";
                
                // SVG Circle for Airport Node
                const airportIcon = L.divIcon({
                    className: "",
                    html: `<div style="width:14px;height:14px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 0 10px ${color}80;cursor:pointer;"></div>`,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                });

                const marker = L.marker([airport.lat, airport.lng], { icon: airportIcon })
                    .addTo(mapRef.current)
                    .bindTooltip(
                        `<div style="background:#0d1117;border:1px solid #30363d;padding:10px;border-radius:0;font-family:monospace;font-size:10px;color:#e6edf3;min-width:160px">
                            <div style="color:${color};font-weight:bold;letter-spacing:1.5px;margin-bottom:4px;font-size:12px">${airport.code}</div>
                            <div style="color:#8b949e;margin-bottom:8px">${airport.name}</div>
                            <div style="border-top:1px solid #30363d;padding-top:8px">
                                <div style="display:flex;justify-content:between;margin-bottom:2px">
                                    <span style="color:#8b949e">FLIGHTS:</span>
                                    <span style="color:#fff;margin-left:auto">${airport.totalFlights}</span>
                                </div>
                                <div style="display:flex;justify-content:between;margin-bottom:2px">
                                    <span style="color:#8b949e">DELAYED:</span>
                                    <span style="color:#ef4444;margin-left:auto">${airport.delayed}</span>
                                </div>
                                <div style="display:flex;justify-content:between;margin-top:4px">
                                    <span style="color:#8b949e">RISK:</span>
                                    <span style="color:${color};margin-left:auto;font-weight:bold;text-transform:uppercase">${airport.riskLevel}</span>
                                </div>
                            </div>
                        </div>`,
                        { permanent: false, direction: "top", offset: [0, -4] }
                    );

                markersRef.current.push(marker);
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flights, selected]);

    // Pan to selected flight
    useEffect(() => {
        if (selected && mapRef.current) {
            mapRef.current.flyTo([selected.current_lat, selected.current_lon], 5, {
                animate: true,
                duration: 1,
            });
        }
    }, [selected]);

    return (
        <>
            <style>{`
                .leaflet-custom-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; }
                .leaflet-container { background: #0d1117; }
                .leaflet-control-zoom a { background: #161b22 !important; color: #e6edf3 !important; border-color: #30363d !important; }
                .leaflet-control-zoom a:hover { background: #21262d !important; }
            `}</style>
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
        </>
    );
}
