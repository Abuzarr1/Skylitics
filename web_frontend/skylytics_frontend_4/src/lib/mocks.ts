/**
 * Skylytics Demo Archive — High-fidelity mock data for offline simulation.
 * Use these when the backend API is unreachable to ensure the UI stays interactive.
 */

export const MOCK_SYSTEM_STATUS = {
    status: "ARCHIVE (OFFLINE)",
    uptime: "24d 14h 02m",
    python_version: "3.11.2",
    platform: "Skylytics-Cloud",
    live_flights: 1422,
    active_anomalies: 12,
    inference_latency_ms: 32,
    modules: {
        auth: { status: "LOADED", endpoints: 14 },
        flights: { status: "SIMULATED", endpoints: 9 },
        predictions: { status: "OFFLINE", endpoints: 11 },
        system: { status: "ACTIVE", endpoints: 6 },
    },
    total_endpoints: 91,
    active_endpoints: 40,
    model_status: {
        xgb_classifier: "ARCHIVED",
        xgb_regressor: "ARCHIVED",
    },
    external_apis: {
        meteostat: "MOCKED",
        opensky: "UNREACHABLE",
        openflights: "LOCAL",
    }
};

export const MOCK_FLIGHTS = [
    {
        id: "MOCK-AA101",
        callsign: "AA101",
        airline: "American Airlines",
        origin: "JFK",
        dest: "LAX",
        origin_lat: 40.64, origin_lon: -73.78,
        dest_lat: 33.94, dest_lon: -118.41,
        current_lat: 37.20, current_lon: -96.10,
        altitude_ft: 34000,
        speed_kts: 480,
        status: "on_time",
        delay_probability: 0.12,
        pred_delay_min: 0,
        progress: 0.45,
        engine: "archived_xgboost",
        tracked_at: "12:00:00 UTC",
        date: "2026-04-26"
    },
    {
        id: "MOCK-DL452",
        callsign: "DL452",
        airline: "Delta Air Lines",
        origin: "ATL",
        dest: "ORD",
        origin_lat: 33.64, origin_lon: -84.43,
        dest_lat: 41.98, dest_lon: -87.91,
        current_lat: 37.80, current_lon: -86.20,
        altitude_ft: 28000,
        speed_kts: 420,
        status: "at_risk",
        delay_probability: 0.58,
        pred_delay_min: 15,
        progress: 0.62,
        engine: "archived_xgboost",
        tracked_at: "12:05:00 UTC",
        date: "2026-04-26"
    },
    {
        id: "MOCK-UA892",
        callsign: "UA892",
        airline: "United Airlines",
        origin: "SFO",
        dest: "SEA",
        origin_lat: 37.62, origin_lon: -122.38,
        dest_lat: 47.45, dest_lon: -122.31,
        current_lat: 42.50, current_lon: -122.35,
        altitude_ft: 31000,
        speed_kts: 465,
        status: "delayed",
        delay_probability: 0.84,
        pred_delay_min: 45,
        progress: 0.48,
        engine: "archived_xgboost",
        tracked_at: "11:58:00 UTC",
        date: "2026-04-26"
    },
    {
        id: "MOCK-WN221",
        callsign: "WN221",
        airline: "Southwest",
        origin: "LAS",
        dest: "DEN",
        origin_lat: 36.08, origin_lon: -115.15,
        dest_lat: 39.86, dest_lon: -104.67,
        current_lat: 38.00, current_lon: -109.90,
        altitude_ft: 36000,
        speed_kts: 490,
        status: "on_time",
        delay_probability: 0.08,
        pred_delay_min: 0,
        progress: 0.72,
        engine: "archived_xgboost",
        tracked_at: "12:10:00 UTC",
        date: "2026-04-26"
    },
    {
        id: "MOCK-B6305",
        callsign: "B6305",
        airline: "JetBlue",
        origin: "BOS",
        dest: "MCO",
        origin_lat: 42.36, origin_lon: -71.01,
        dest_lat: 28.43, dest_lon: -81.31,
        current_lat: 35.40, current_lon: -76.20,
        altitude_ft: 33000,
        speed_kts: 475,
        status: "at_risk",
        delay_probability: 0.46,
        pred_delay_min: 8,
        progress: 0.38,
        engine: "archived_xgboost",
        tracked_at: "12:02:00 UTC",
        date: "2026-04-26"
    }
];

export const MOCK_DASHBOARD_STATS = {
    total_tracked: 1422,
    at_risk: 12,
    avg_delay: "14m",
    net_sync: "98.4%",
    est_impact: "Low",
    anomalies: [
        { id: 1, callsign: "DL452", route: "ATL → ORD", risk: 58, status: "Critical" },
        { id: 2, callsign: "UA892", route: "SFO → SEA", risk: 84, status: "Delayed" },
    ],
};

export const MOCK_AT_RISK_FLIGHTS = [
    { id: "MOCK-DL452", callsign: "DL452", origin: "ATL", destination: "ORD", delay_probability: 0.58, status: "at_risk", aircraft_type: "B739", altitude_ft: 28000, speed_kts: 420 },
    { id: "MOCK-UA892", callsign: "UA892", origin: "SFO", destination: "SEA", delay_probability: 0.84, status: "delayed", aircraft_type: "A321", altitude_ft: 31000, speed_kts: 465 },
    { id: "MOCK-AA101", callsign: "AA101", origin: "JFK", destination: "LAX", delay_probability: 0.12, status: "on_time", aircraft_type: "B772", altitude_ft: 34000, speed_kts: 480 },
    { id: "MOCK-WN221", callsign: "WN221", origin: "LAS", destination: "DEN", delay_probability: 0.08, status: "on_time", aircraft_type: "B738", altitude_ft: 36000, speed_kts: 490 },
    { id: "MOCK-B6305", callsign: "B6305", origin: "BOS", destination: "MCO", delay_probability: 0.46, status: "at_risk", aircraft_type: "A320", altitude_ft: 33000, speed_kts: 475 },
];

export const MOCK_DELAY_TREND = [
    { label: "00:00", probability: 12 }, { label: "02:00", probability: 15 },
    { label: "04:00", probability: 18 }, { label: "06:00", probability: 14 },
    { label: "08:00", probability: 12 }, { label: "10:00", probability: 10 },
    { label: "12:00", probability: 11 }, { label: "14:00", probability: 13 },
    { label: "16:00", probability: 15 }, { label: "18:00", probability: 14 },
    { label: "20:00", probability: 12 }, { label: "22:00", probability: 12 },
];

export const MOCK_ANALYTICS_ROUTES = [
    { route: "ATL → LAX", risk_score: 0.72 },
    { route: "ORD → JFK", risk_score: 0.65 },
    { route: "SFO → ORD", risk_score: 0.58 },
    { route: "DFW → PHX", risk_score: 0.45 },
    { route: "JFK → LHR", risk_score: 0.38 },
];

export const MOCK_ANALYTICS_AIRPORTS = [
    { airport: "ATL", congestion_score: 0.68, flights_out: 420 },
    { airport: "ORD", congestion_score: 0.75, flights_out: 310 },
    { airport: "JFK", congestion_score: 0.52, flights_out: 280 },
    { airport: "LAX", congestion_score: 0.48, flights_out: 350 },
    { airport: "DFW", congestion_score: 0.41, flights_out: 290 },
    { airport: "SFO", congestion_score: 0.38, flights_out: 210 },
    { airport: "DEN", congestion_score: 0.55, flights_out: 240 },
    { airport: "PHX", congestion_score: 0.32, flights_out: 180 },
];
