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
    { id: "MOCK-1", callsign: "DL192", airline: "Delta Air Lines", origin: "ATL", dest: "JFK", origin_lat: 33.64, origin_lon: -84.43, dest_lat: 40.64, dest_lon: -73.78, current_lat: 37.20, current_lon: -79.30, altitude_ft: 35000, speed_kts: 478, status: "delayed", delay_probability: 0.72, pred_delay_min: 34, progress: 0.55, engine: "archived_xgboost", tracked_at: "12:00:00 UTC", date: "2026-05-01" },
    { id: "MOCK-2", callsign: "AA505", airline: "American Airlines", origin: "ORD", dest: "ATL", origin_lat: 41.98, origin_lon: -87.91, dest_lat: 33.64, dest_lon: -84.43, current_lat: 38.50, current_lon: -86.00, altitude_ft: 37000, speed_kts: 492, status: "at_risk", delay_probability: 0.48, pred_delay_min: 12, progress: 0.42, engine: "archived_xgboost", tracked_at: "12:01:00 UTC", date: "2026-05-01" },
    { id: "MOCK-3", callsign: "B6112", airline: "JetBlue Airways", origin: "JFK", dest: "LAX", origin_lat: 40.64, origin_lon: -73.78, dest_lat: 33.94, dest_lon: -118.41, current_lat: 38.40, current_lon: -97.10, altitude_ft: 34000, speed_kts: 445, status: "on_time", delay_probability: 0.09, pred_delay_min: 0, progress: 0.68, engine: "archived_xgboost", tracked_at: "12:02:00 UTC", date: "2026-05-01" },
    { id: "MOCK-4", callsign: "AA122", airline: "American Airlines", origin: "MIA", dest: "JFK", origin_lat: 25.80, origin_lon: -80.28, dest_lat: 40.64, dest_lon: -73.78, current_lat: 32.50, current_lon: -77.50, altitude_ft: 33000, speed_kts: 462, status: "delayed", delay_probability: 0.61, pred_delay_min: 25, progress: 0.45, engine: "archived_xgboost", tracked_at: "12:03:00 UTC", date: "2026-05-01" },
    { id: "MOCK-5", callsign: "UA301", airline: "United Airlines", origin: "ORD", dest: "DFW", origin_lat: 41.98, origin_lon: -87.91, dest_lat: 32.90, dest_lon: -97.04, current_lat: 37.10, current_lon: -92.50, altitude_ft: 36000, speed_kts: 465, status: "at_risk", delay_probability: 0.38, pred_delay_min: 8, progress: 0.53, engine: "archived_xgboost", tracked_at: "12:04:00 UTC", date: "2026-05-01" },
    { id: "MOCK-6", callsign: "UA892", airline: "United Airlines", origin: "SFO", dest: "ORD", origin_lat: 37.62, origin_lon: -122.38, dest_lat: 41.98, dest_lon: -87.91, current_lat: 39.50, current_lon: -105.35, altitude_ft: 31000, speed_kts: 465, status: "delayed", delay_probability: 0.84, pred_delay_min: 45, progress: 0.48, engine: "archived_xgboost", tracked_at: "12:05:00 UTC", date: "2026-05-01" },
    { id: "MOCK-7", callsign: "DL452", airline: "Delta Air Lines", origin: "LAX", dest: "SEA", origin_lat: 33.94, origin_lon: -118.41, dest_lat: 47.45, dest_lon: -122.31, current_lat: 40.80, current_lon: -120.20, altitude_ft: 28000, speed_kts: 420, status: "at_risk", delay_probability: 0.58, pred_delay_min: 15, progress: 0.62, engine: "archived_xgboost", tracked_at: "12:06:00 UTC", date: "2026-05-01" },
    { id: "MOCK-8", callsign: "WN221", airline: "Southwest", origin: "DEN", dest: "LAX", origin_lat: 39.86, origin_lon: -104.67, dest_lat: 33.94, dest_lon: -118.41, current_lat: 36.00, current_lon: -111.90, altitude_ft: 36000, speed_kts: 490, status: "on_time", delay_probability: 0.08, pred_delay_min: 0, progress: 0.72, engine: "archived_xgboost", tracked_at: "12:07:00 UTC", date: "2026-05-01" },
    { id: "MOCK-9", callsign: "AA753", airline: "American Airlines", origin: "DFW", dest: "MIA", origin_lat: 32.90, origin_lon: -97.04, dest_lat: 25.80, dest_lon: -80.28, current_lat: 29.50, current_lon: -88.50, altitude_ft: 35000, speed_kts: 460, status: "on_time", delay_probability: 0.15, pred_delay_min: 0, progress: 0.48, engine: "archived_xgboost", tracked_at: "12:08:00 UTC", date: "2026-05-01" },
    { id: "MOCK-10", callsign: "DL788", airline: "Delta Air Lines", origin: "ATL", dest: "DFW", origin_lat: 33.64, origin_lon: -84.43, dest_lat: 32.90, dest_lon: -97.04, current_lat: 33.20, current_lon: -90.20, altitude_ft: 38000, speed_kts: 501, status: "on_time", delay_probability: 0.14, pred_delay_min: 0, progress: 0.58, engine: "archived_xgboost", tracked_at: "12:09:00 UTC", date: "2026-05-01" },
    { id: "MOCK-11", callsign: "AA201", airline: "American Airlines", origin: "MIA", dest: "SFO", origin_lat: 25.80, origin_lon: -80.28, dest_lat: 37.62, dest_lon: -122.38, current_lat: 31.50, current_lon: -101.50, altitude_ft: 34000, speed_kts: 450, status: "delayed", delay_probability: 0.82, pred_delay_min: 38, progress: 0.50, engine: "archived_xgboost", tracked_at: "12:10:00 UTC", date: "2026-05-01" },
    { id: "MOCK-12", callsign: "B6407", airline: "JetBlue Airways", origin: "JFK", dest: "MIA", origin_lat: 40.64, origin_lon: -73.78, dest_lat: 25.80, dest_lon: -80.28, current_lat: 33.40, current_lon: -77.10, altitude_ft: 34000, speed_kts: 445, status: "at_risk", delay_probability: 0.58, pred_delay_min: 19, progress: 0.68, engine: "archived_xgboost", tracked_at: "12:11:00 UTC", date: "2026-05-01" },
    { id: "MOCK-13", callsign: "UA1187", airline: "United Airlines", origin: "SFO", dest: "DEN", origin_lat: 37.62, origin_lon: -122.38, dest_lat: 39.86, dest_lon: -104.67, current_lat: 38.50, current_lon: -113.50, altitude_ft: 35000, speed_kts: 470, status: "at_risk", delay_probability: 0.51, pred_delay_min: 14, progress: 0.45, engine: "archived_xgboost", tracked_at: "12:12:00 UTC", date: "2026-05-01" },
    { id: "MOCK-14", callsign: "WN210", airline: "Southwest Airlines", origin: "LAX", dest: "SFO", origin_lat: 33.94, origin_lon: -118.41, dest_lat: 37.62, dest_lon: -122.38, current_lat: 35.80, current_lon: -120.40, altitude_ft: 28000, speed_kts: 420, status: "on_time", delay_probability: 0.11, pred_delay_min: 0, progress: 0.51, engine: "archived_xgboost", tracked_at: "12:13:00 UTC", date: "2026-05-01" },
    { id: "MOCK-15", callsign: "DL448", airline: "Delta Air Lines", origin: "DEN", dest: "ATL", origin_lat: 39.86, origin_lon: -104.67, dest_lat: 33.64, dest_lon: -84.43, current_lat: 36.50, current_lon: -94.20, altitude_ft: 37000, speed_kts: 485, status: "delayed", delay_probability: 0.71, pred_delay_min: 31, progress: 0.55, engine: "archived_xgboost", tracked_at: "12:14:00 UTC", date: "2026-05-01" },
    { id: "MOCK-16", callsign: "UA101", airline: "United Airlines", origin: "ORD", dest: "DEN", origin_lat: 41.98, origin_lon: -87.91, dest_lat: 39.86, dest_lon: -104.67, current_lat: 40.50, current_lon: -96.50, altitude_ft: 34000, speed_kts: 450, status: "on_time", delay_probability: 0.18, pred_delay_min: 0, progress: 0.48, engine: "archived_xgboost", tracked_at: "12:15:00 UTC", date: "2026-05-01" },
    { id: "MOCK-17", callsign: "SW640", airline: "Southwest Airlines", origin: "SEA", dest: "ORD", origin_lat: 47.45, origin_lon: -122.31, dest_lat: 41.98, dest_lon: -87.91, current_lat: 44.20, current_lon: -105.50, altitude_ft: 35000, speed_kts: 458, status: "at_risk", delay_probability: 0.55, pred_delay_min: 15, progress: 0.48, engine: "archived_xgboost", tracked_at: "12:16:00 UTC", date: "2026-05-01" },
    { id: "MOCK-18", callsign: "AA302", airline: "American Airlines", origin: "DFW", dest: "SEA", origin_lat: 32.90, origin_lon: -97.04, dest_lat: 47.45, dest_lon: -122.31, current_lat: 40.20, current_lon: -109.50, altitude_ft: 36000, speed_kts: 460, status: "on_time", delay_probability: 0.22, pred_delay_min: 0, progress: 0.52, engine: "archived_xgboost", tracked_at: "12:17:00 UTC", date: "2026-05-01" }
];

export const MOCK_FEED = [
    { id: "m1", flight: "DL192", route: "ATL → JFK", status: "DELAYED +34 MIN",  timestamp: "08:14", type: "delay"   },
    { id: "m2", flight: "AA505", route: "ORD → ATL", status: "AT RISK",           timestamp: "08:21", type: "delay"   },
    { id: "m3", flight: "UA301", route: "ORD → DFW", status: "BOARDING",          timestamp: "08:35", type: "board"   },
    { id: "m4", flight: "B6112", route: "JFK → LAX", status: "CLEARED",           timestamp: "08:47", type: "cleared" },
    { id: "m5", flight: "SW640", route: "SEA → ORD", status: "DELAYED +18 MIN",   timestamp: "09:02", type: "delay"   },
    { id: "m6", flight: "WN210", route: "LAX → SFO", status: "ON TIME",           timestamp: "09:11", type: "board"   },
    { id: "m7", flight: "DL788", route: "ATL → DFW", status: "CLEARED",           timestamp: "09:23", type: "cleared" },
    { id: "m8", flight: "AA122", route: "MIA → JFK", status: "AT RISK",           timestamp: "09:37", type: "delay"   },
    { id: "m9", flight: "UA892", route: "SFO → ORD", status: "DELAYED +45 MIN",   timestamp: "09:42", type: "delay"   },
    { id: "m10", flight: "DL452", route: "LAX → SEA", status: "AT RISK",           timestamp: "09:55", type: "delay"   },
    { id: "m11", flight: "WN221", route: "DEN → LAX", status: "BOARDING",          timestamp: "10:05", type: "board"   },
    { id: "m12", flight: "AA753", route: "DFW → MIA", status: "CLEARED",           timestamp: "10:12", type: "cleared" },
    { id: "m13", flight: "AA201", route: "MIA → SFO", status: "DELAYED +38 MIN",   timestamp: "10:18", type: "delay"   },
    { id: "m14", flight: "B6407", route: "JFK → MIA", status: "AT RISK",           timestamp: "10:25", type: "delay"   },
    { id: "m15", flight: "UA1187", route: "SFO → DEN", status: "CLEARED",           timestamp: "10:30", type: "cleared" },
    { id: "m16", flight: "DL448", route: "DEN → ATL", status: "DELAYED +31 MIN",   timestamp: "10:45", type: "delay"   },
    { id: "m17", flight: "UA101", route: "ORD → DEN", status: "ON TIME",           timestamp: "10:52", type: "board"   },
    { id: "m18", flight: "AA302", route: "DFW → SEA", status: "CLEARED",           timestamp: "11:00", type: "cleared" }
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
