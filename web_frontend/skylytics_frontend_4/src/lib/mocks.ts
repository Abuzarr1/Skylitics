/**
 * Skylytics Demo Archive — High-fidelity mock data for offline simulation.
 * Use these when the backend API is unreachable to ensure the UI stays interactive.
 */

export const MOCK_SYSTEM_STATUS = {
    status: "ONLINE",
    uptime: "24d 14h 03m",
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
        xgb_classifier: "ONLINE",
        xgb_regressor: "ONLINE",
        shap_explainer: "LOADED",
    },
    external_apis: {
        meteostat: "ONLINE",
        opensky: "ACTIVE",
        openflights: "LOCAL",
    }
};

export const MOCK_FLIGHTS = [
    // --- ATL (Delta Hub) ---
    { id: "ATL-DL-1", callsign: "DL101", airline: "Delta Air Lines", origin: "ATL", dest: "JFK", origin_lat: 33.64, origin_lon: -84.43, dest_lat: 40.64, dest_lon: -73.78, current_lat: 34.2, current_lon: -83.5, altitude_ft: 32000, speed_kts: 460, status: "on_time", delay_probability: 0.12, pred_delay_min: 0, progress: 0.15, engine: "archived_xgboost", tracked_at: "12:00:00 UTC", date: "2026-05-01" },
    { id: "ATL-DL-2", callsign: "DL455", airline: "Delta Air Lines", origin: "ATL", dest: "LAX", origin_lat: 33.64, origin_lon: -84.43, dest_lat: 33.94, dest_lon: -118.41, current_lat: 33.8, current_lon: -95.2, altitude_ft: 36000, speed_kts: 485, status: "at_risk", delay_probability: 0.45, pred_delay_min: 12, progress: 0.42, engine: "archived_xgboost", tracked_at: "12:05:00 UTC", date: "2026-05-01" },
    { id: "ATL-DL-3", callsign: "DL892", airline: "Delta Air Lines", origin: "MCO", dest: "ATL", origin_lat: 28.43, origin_lon: -81.31, dest_lat: 33.64, dest_lon: -84.43, current_lat: 31.5, current_lon: -82.8, altitude_ft: 28000, speed_kts: 420, status: "delayed", delay_probability: 0.78, pred_delay_min: 35, progress: 0.65, engine: "archived_xgboost", tracked_at: "12:10:00 UTC", date: "2026-05-01" },
    { id: "ATL-DL-4", callsign: "DL211", airline: "Delta Air Lines", origin: "ATL", dest: "ORD", origin_lat: 33.64, origin_lon: -84.43, dest_lat: 41.98, dest_lon: -87.91, current_lat: 38.2, current_lon: -86.5, altitude_ft: 34000, speed_kts: 455, status: "on_time", delay_probability: 0.08, pred_delay_min: 0, progress: 0.78, engine: "archived_xgboost", tracked_at: "12:15:00 UTC", date: "2026-05-01" },

    // --- JFK (International/Multi Hub) ---
    { id: "JFK-AA-1", callsign: "AA10", airline: "American Airlines", origin: "JFK", dest: "LAX", origin_lat: 40.64, origin_lon: -73.78, dest_lat: 33.94, dest_lon: -118.41, current_lat: 39.5, current_lon: -85.2, altitude_ft: 35000, speed_kts: 475, status: "on_time", delay_probability: 0.15, pred_delay_min: 0, progress: 0.35, engine: "archived_xgboost", tracked_at: "12:02:00 UTC", date: "2026-05-01" },
    { id: "JFK-B6-1", callsign: "B623", airline: "JetBlue Airways", origin: "JFK", dest: "MIA", origin_lat: 40.64, origin_lon: -73.78, dest_lat: 25.80, dest_lon: -80.28, current_lat: 35.2, current_lon: -76.8, altitude_ft: 33000, speed_kts: 440, status: "at_risk", delay_probability: 0.52, pred_delay_min: 18, progress: 0.48, engine: "archived_xgboost", tracked_at: "12:08:00 UTC", date: "2026-05-01" },
    { id: "JFK-DL-1", callsign: "DL42", airline: "Delta Air Lines", origin: "LHR", dest: "JFK", origin_lat: 51.47, origin_lon: -0.45, dest_lat: 40.64, dest_lon: -73.78, current_lat: 45.8, current_lon: -45.2, altitude_ft: 38000, speed_kts: 510, status: "on_time", delay_probability: 0.11, pred_delay_min: 0, progress: 0.72, engine: "archived_xgboost", tracked_at: "12:12:00 UTC", date: "2026-05-01" },
    { id: "JFK-INT-1", callsign: "BA117", airline: "British Airways", origin: "LHR", dest: "JFK", origin_lat: 51.47, origin_lon: -0.45, dest_lat: 40.64, dest_lon: -73.78, current_lat: 48.2, current_lon: -30.5, altitude_ft: 37000, speed_kts: 495, status: "delayed", delay_probability: 0.85, pred_delay_min: 45, progress: 0.55, engine: "archived_xgboost", tracked_at: "12:20:00 UTC", date: "2026-05-01" },

    // --- ORD (United/AA Hub) ---
    { id: "ORD-UA-1", callsign: "UA241", airline: "United Airlines", origin: "ORD", dest: "SFO", origin_lat: 41.98, origin_lon: -87.91, dest_lat: 37.62, dest_lon: -122.38, current_lat: 40.5, current_lon: -105.2, altitude_ft: 36000, speed_kts: 470, status: "on_time", delay_probability: 0.18, pred_delay_min: 0, progress: 0.45, engine: "archived_xgboost", tracked_at: "12:04:00 UTC", date: "2026-05-01" },
    { id: "ORD-AA-1", callsign: "AA505", airline: "American Airlines", origin: "ORD", dest: "LAX", origin_lat: 41.98, origin_lon: -87.91, dest_lat: 33.94, dest_lon: -118.41, current_lat: 38.5, current_lon: -104.0, altitude_ft: 37000, speed_kts: 492, status: "at_risk", delay_probability: 0.48, pred_delay_min: 12, progress: 0.42, engine: "archived_xgboost", tracked_at: "12:01:00 UTC", date: "2026-05-01" },
    { id: "ORD-UA-2", callsign: "UA101", airline: "United Airlines", origin: "ORD", dest: "DEN", origin_lat: 41.98, origin_lon: -87.91, dest_lat: 39.86, dest_lon: -104.67, current_lat: 40.5, current_lon: -96.5, altitude_ft: 34000, speed_kts: 450, status: "on_time", delay_probability: 0.18, pred_delay_min: 0, progress: 0.48, engine: "archived_xgboost", tracked_at: "12:15:00 UTC", date: "2026-05-01" },

    // --- LAX (Pacific/UA/DL/AS) ---
    { id: "LAX-UA-1", callsign: "UA12", airline: "United Airlines", origin: "LAX", dest: "NRT", origin_lat: 33.94, origin_lon: -118.41, dest_lat: 35.77, dest_lon: 140.39, current_lat: 34.5, current_lon: -135.2, altitude_ft: 38000, speed_kts: 520, status: "on_time", delay_probability: 0.09, pred_delay_min: 0, progress: 0.18, engine: "archived_xgboost", tracked_at: "12:06:00 UTC", date: "2026-05-01" },
    { id: "LAX-AS-1", callsign: "AS422", airline: "Alaska Airlines", origin: "SEA", dest: "LAX", origin_lat: 47.45, origin_lon: -122.31, dest_lat: 33.94, dest_lon: -118.41, current_lat: 40.2, current_lon: -120.5, altitude_ft: 32000, speed_kts: 440, status: "at_risk", delay_probability: 0.42, pred_delay_min: 10, progress: 0.55, engine: "archived_xgboost", tracked_at: "12:11:00 UTC", date: "2026-05-01" },
    { id: "LAX-DL-1", callsign: "DL452", airline: "Delta Air Lines", origin: "LAX", dest: "SEA", origin_lat: 33.94, origin_lon: -118.41, dest_lat: 47.45, dest_lon: -122.31, current_lat: 40.8, current_lon: -120.2, altitude_ft: 28000, speed_kts: 420, status: "at_risk", delay_probability: 0.58, pred_delay_min: 15, progress: 0.62, engine: "archived_xgboost", tracked_at: "12:06:00 UTC", date: "2026-05-01" },

    // --- DFW (AA Mega Hub) ---
    { id: "DFW-AA-1", callsign: "AA2201", airline: "American Airlines", origin: "DFW", dest: "ORD", origin_lat: 32.90, origin_lon: -97.04, dest_lat: 41.98, dest_lon: -87.91, current_lat: 37.5, current_lon: -92.2, altitude_ft: 35000, speed_kts: 470, status: "on_time", delay_probability: 0.14, pred_delay_min: 0, progress: 0.48, engine: "archived_xgboost", tracked_at: "12:07:00 UTC", date: "2026-05-01" },
    { id: "DFW-AA-2", callsign: "AA753", airline: "American Airlines", origin: "DFW", dest: "MIA", origin_lat: 32.90, origin_lon: -97.04, dest_lat: 25.80, dest_lon: -80.28, current_lat: 29.5, current_lon: -88.5, altitude_ft: 35000, speed_kts: 460, status: "on_time", delay_probability: 0.15, pred_delay_min: 0, progress: 0.48, engine: "archived_xgboost", tracked_at: "12:08:00 UTC", date: "2026-05-01" },
    { id: "DFW-AA-3", callsign: "AA302", airline: "American Airlines", origin: "DFW", dest: "SEA", origin_lat: 32.90, origin_lon: -97.04, dest_lat: 47.45, dest_lon: -122.31, current_lat: 40.2, current_lon: -109.5, altitude_ft: 36000, speed_kts: 460, status: "on_time", delay_probability: 0.22, pred_delay_min: 0, progress: 0.52, engine: "archived_xgboost", tracked_at: "12:17:00 UTC", date: "2026-05-01" },

    // --- MIA (AA Latin Hub) ---
    { id: "MIA-AA-1", callsign: "AA912", airline: "American Airlines", origin: "MIA", dest: "EZE", origin_lat: 25.80, origin_lon: -80.28, dest_lat: -34.82, dest_lon: -58.53, current_lat: 5.2, current_lon: -70.5, altitude_ft: 37000, speed_kts: 490, status: "on_time", delay_probability: 0.18, pred_delay_min: 0, progress: 0.35, engine: "archived_xgboost", tracked_at: "12:09:00 UTC", date: "2026-05-01" },
    { id: "MIA-AA-2", callsign: "AA122", airline: "American Airlines", origin: "MIA", dest: "JFK", origin_lat: 25.80, origin_lon: -80.28, dest_lat: 40.64, dest_lon: -73.78, current_lat: 32.5, current_lon: -77.5, altitude_ft: 33000, speed_kts: 462, status: "delayed", delay_probability: 0.61, pred_delay_min: 25, progress: 0.45, engine: "archived_xgboost", tracked_at: "12:03:00 UTC", date: "2026-05-01" },
    { id: "MIA-INT-1", callsign: "LA2415", airline: "LATAM Airlines", origin: "SCL", dest: "MIA", origin_lat: -33.39, origin_lon: -70.79, dest_lat: 25.80, dest_lon: -80.28, current_lat: -5.2, current_lon: -78.5, altitude_ft: 36000, speed_kts: 475, status: "at_risk", delay_probability: 0.42, pred_delay_min: 15, progress: 0.65, engine: "archived_xgboost", tracked_at: "12:14:00 UTC", date: "2026-05-01" },

    // --- SFO (UA Tech Hub) ---
    { id: "SFO-UA-1", callsign: "UA892", airline: "United Airlines", origin: "SFO", dest: "ORD", origin_lat: 37.62, origin_lon: -122.38, dest_lat: 41.98, dest_lon: -87.91, current_lat: 39.5, current_lon: -105.35, altitude_ft: 31000, speed_kts: 465, status: "delayed", delay_probability: 0.84, pred_delay_min: 45, progress: 0.48, engine: "archived_xgboost", tracked_at: "12:05:00 UTC", date: "2026-05-01" },
    { id: "SFO-UA-2", callsign: "UA1187", airline: "United Airlines", origin: "SFO", dest: "DEN", origin_lat: 37.62, origin_lon: -122.38, dest_lat: 39.86, dest_lon: -104.67, current_lat: 38.5, current_lon: -113.5, altitude_ft: 35000, speed_kts: 470, status: "at_risk", delay_probability: 0.51, pred_delay_min: 14, progress: 0.45, engine: "archived_xgboost", tracked_at: "12:12:00 UTC", date: "2026-05-01" },
    { id: "SFO-AS-1", callsign: "AS332", airline: "Alaska Airlines", origin: "SFO", dest: "SEA", origin_lat: 37.62, origin_lon: -122.38, dest_lat: 47.45, dest_lon: -122.31, current_lat: 42.5, current_lon: -122.35, altitude_ft: 31000, speed_kts: 450, status: "on_time", delay_probability: 0.12, pred_delay_min: 0, progress: 0.48, engine: "archived_xgboost", tracked_at: "12:16:00 UTC", date: "2026-05-01" },

    // --- DEN (UA/F9 Hub) ---
    { id: "DEN-UA-1", callsign: "UA452", airline: "United Airlines", origin: "DEN", dest: "ATL", origin_lat: 39.86, origin_lon: -104.67, dest_lat: 33.64, dest_lon: -84.43, current_lat: 36.5, current_lon: -94.2, altitude_ft: 37000, speed_kts: 485, status: "delayed", delay_probability: 0.71, pred_delay_min: 31, progress: 0.55, engine: "archived_xgboost", tracked_at: "12:14:00 UTC", date: "2026-05-01" },
    { id: "DEN-F9-1", callsign: "F9301", airline: "Frontier Airlines", origin: "DEN", dest: "LAS", origin_lat: 39.86, origin_lon: -104.67, dest_lat: 36.08, dest_lon: -115.15, current_lat: 38.2, current_lon: -109.5, altitude_ft: 32000, speed_kts: 430, status: "on_time", delay_probability: 0.25, pred_delay_min: 0, progress: 0.42, engine: "archived_xgboost", tracked_at: "12:18:00 UTC", date: "2026-05-01" },
    { id: "DEN-UA-2", callsign: "UA221", airline: "United Airlines", origin: "LAX", dest: "DEN", origin_lat: 33.94, origin_lon: -118.41, dest_lat: 39.86, dest_lon: -104.67, current_lat: 36.0, current_lon: -111.9, altitude_ft: 36000, speed_kts: 490, status: "on_time", delay_probability: 0.08, pred_delay_min: 0, progress: 0.72, engine: "archived_xgboost", tracked_at: "12:07:00 UTC", date: "2026-05-01" },

    // --- SEA (Alaska Hub) ---
    { id: "SEA-AS-1", callsign: "AS640", airline: "Alaska Airlines", origin: "SEA", dest: "ORD", origin_lat: 47.45, origin_lon: -122.31, dest_lat: 41.98, dest_lon: -87.91, current_lat: 44.2, current_lon: -105.5, altitude_ft: 35000, speed_kts: 458, status: "at_risk", delay_probability: 0.55, pred_delay_min: 15, progress: 0.48, engine: "archived_xgboost", tracked_at: "12:16:00 UTC", date: "2026-05-01" },
    { id: "SEA-AS-2", callsign: "AS12", airline: "Alaska Airlines", origin: "SEA", dest: "ANC", origin_lat: 47.45, origin_lon: -122.31, dest_lat: 61.17, dest_lon: -149.99, current_lat: 55.2, current_lon: -135.5, altitude_ft: 34000, speed_kts: 465, status: "on_time", delay_probability: 0.12, pred_delay_min: 0, progress: 0.35, engine: "archived_xgboost", tracked_at: "12:19:00 UTC", date: "2026-05-01" }
];

export const MOCK_FEED = [
    // ATL
    { id: "m1", flight: "DL192", route: "ATL → JFK", status: "DELAYED +34 MIN",  timestamp: "08:14", type: "delay", airport: "ATL" },
    { id: "m2", flight: "DL455", route: "ATL → LAX", status: "AT RISK",           timestamp: "08:45", type: "delay", airport: "ATL" },
    { id: "m3", flight: "DL892", route: "MCO → ATL", status: "DELAYED +35 MIN",  timestamp: "09:12", type: "delay", airport: "ATL" },
    
    // JFK
    { id: "m4", flight: "AA10",  route: "JFK → LAX", status: "BOARDING",          timestamp: "08:35", type: "board", airport: "JFK" },
    { id: "m5", flight: "B623",  route: "JFK → MIA", status: "AT RISK",           timestamp: "08:55", type: "delay", airport: "JFK" },
    { id: "m6", flight: "BA117", route: "LHR → JFK", status: "DELAYED +45 MIN",  timestamp: "09:20", type: "delay", airport: "JFK" },
    
    // ORD
    { id: "m7", flight: "UA241", route: "ORD → SFO", status: "CLEARED",           timestamp: "08:47", type: "cleared", airport: "ORD" },
    { id: "m8", flight: "AA505", route: "ORD → LAX", status: "AT RISK",           timestamp: "09:05", type: "delay", airport: "ORD" },
    
    // LAX
    { id: "m9", flight: "UA12",  route: "LAX → NRT", status: "ON TIME",           timestamp: "09:11", type: "board", airport: "LAX" },
    { id: "m10", flight: "DL452", route: "LAX → SEA", status: "AT RISK",           timestamp: "09:30", type: "delay", airport: "LAX" },
    
    // DFW
    { id: "m11", flight: "AA2201", route: "DFW → ORD", status: "CLEARED",          timestamp: "09:23", type: "cleared", airport: "DFW" },
    { id: "m12", flight: "AA753", route: "DFW → MIA", status: "ON TIME",           timestamp: "09:45", type: "board", airport: "DFW" },
    
    // MIA
    { id: "m13", flight: "AA912", route: "MIA → EZE", status: "ON TIME",           timestamp: "09:55", type: "board", airport: "MIA" },
    { id: "m14", flight: "LA2415", route: "SCL → MIA", status: "AT RISK",           timestamp: "10:15", type: "delay", airport: "MIA" },
    
    // SFO
    { id: "m15", flight: "UA892", route: "SFO → ORD", status: "DELAYED +45 MIN",  timestamp: "10:25", type: "delay", airport: "SFO" },
    { id: "m16", flight: "AS332", route: "SFO → SEA", status: "ON TIME",           timestamp: "10:45", type: "board", airport: "SFO" },
    
    // DEN
    { id: "m17", flight: "UA452", route: "DEN → ATL", status: "DELAYED +31 MIN",  timestamp: "11:05", type: "delay", airport: "DEN" },
    { id: "m18", flight: "F9301", route: "DEN → LAS", status: "ON TIME",           timestamp: "11:20", type: "board", airport: "DEN" },
    
    // SEA
    { id: "m19", flight: "AS640", route: "SEA → ORD", status: "AT RISK",           timestamp: "11:35", type: "delay", airport: "SEA" },
    { id: "m20", flight: "AS12",  route: "SEA → ANC", status: "CLEARED",           timestamp: "11:55", type: "cleared", airport: "SEA" }
];

// Field names must match the API response shape from /ops/dashboard and /ops/at-risk
export const MOCK_DASHBOARD_STATS = {
    total_tracked:      152,
    delayed_count:      6,
    at_risk_count:      5,
    avg_delay_min:      22.4,
    on_time_pct:        91.2,
    model_accuracy_pct: 91.8,
    airport:            null,
};

export const MOCK_AT_RISK_FLIGHTS = [
    { flight_id: "MOCK-1", callsign: "AA201",  route: "JFK → LAX", risk: 0.82, status: "delayed",  predicted_delay: 38 },
    { flight_id: "MOCK-2", callsign: "DL448",  route: "JFK → ATL", risk: 0.71, status: "delayed",  predicted_delay: 31 },
    { flight_id: "MOCK-3", callsign: "B6407",  route: "JFK → MCO", risk: 0.58, status: "at_risk",  predicted_delay: 19 },
    { flight_id: "MOCK-4", callsign: "UA1187", route: "JFK → ORD", risk: 0.51, status: "at_risk",  predicted_delay: 14 },
    { flight_id: "MOCK-5", callsign: "AA753",  route: "JFK → MIA", risk: 0.44, status: "at_risk",  predicted_delay: 9  },
];

export const MOCK_DELAY_TREND = [
    { label: "06:00", probability: 8  },
    { label: "07:00", probability: 14 },
    { label: "08:00", probability: 22 },
    { label: "09:00", probability: 18 },
    { label: "10:00", probability: 12 },
    { label: "11:00", probability: 10 },
    { label: "12:00", probability: 11 },
    { label: "13:00", probability: 13 },
    { label: "14:00", probability: 15 },
    { label: "15:00", probability: 19 },
    { label: "16:00", probability: 28 },
    { label: "17:00", probability: 35 },
    { label: "18:00", probability: 42 },
    { label: "19:00", probability: 38 },
    { label: "20:00", probability: 24 },
    { label: "21:00", probability: 17 },
    { label: "22:00", probability: 11 },
    { label: "23:00", probability: 8  },
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
