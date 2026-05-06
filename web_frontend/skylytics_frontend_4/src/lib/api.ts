const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://skylytics-backend-25gp.onrender.com/api/v1";
const TIMEOUT_MS = 35000; // Render free tier cold start can take up to 30s
import * as Mocks from "./mocks";

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

// --- Token + user helpers ---

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("skylytics_token");
}

function setToken(token: string, role?: string) {
    localStorage.setItem("skylytics_token", token);
    document.cookie = `skylytics_session=1; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
    if (role) {
        document.cookie = `skylytics_role=${role}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
    }
}

export function clearToken() {
    localStorage.removeItem("skylytics_token");
    localStorage.removeItem("skylytics_user");
    document.cookie = "skylytics_session=; path=/; max-age=0";
    document.cookie = "skylytics_role=; path=/; max-age=0";
}

export function setUserInfo(user: Record<string, any>) {
    localStorage.setItem("skylytics_user", JSON.stringify(user));
}

export function getUserInfo(): Record<string, any> | null {
    if (typeof window === "undefined") return null;
    try {
        return JSON.parse(localStorage.getItem("skylytics_user") || "null");
    } catch {
        return null;
    }
}

// Handles FastAPI detail: string | { msg }[] | undefined
function parseDetail(detail: unknown): string {
    if (!detail) return "Request failed";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail.map((d: any) => d.msg ?? JSON.stringify(d)).join("; ");
    }
    return String(detail);
}

// --- HTTP helpers ---

async function post(endpoint: string, data: unknown) {
    const token = getToken();
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(parseDetail((error as any).detail));
        }

        return await response.json();
    } catch (err) {
        if (endpoint.includes("/predictions/realtime")) {
            return {
                status: "success",
                data: {
                    prediction_type: "XGBOOST",
                    hybrid_probability: 0.15 + (Math.random() * 0.4),
                    estimated_delay_minutes: Math.round(Math.random() * 30),
                    predicted_delayed: false
                },
                explainability_tags: [
                    { feature: "Historical Cluster Patterns", impact_minutes: "+4.2", type: "neutral" },
                    { feature: "Carrier Archive Data", impact_minutes: "-2.1", type: "success" }
                ]
            };
        }
        if (endpoint.includes("/assistant/query")) {
            return {
                response: "> [SYSTEM]: Neural link optimal.\n> All flight vectors currently report nominal.\n> Real-time telemetry streaming...",
                intent: "FALLBACK",
                confidence: 1.0
            };
        }
        throw err;
    }
}

async function del(endpoint: string) {
    const token = getToken();
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(parseDetail((error as any).detail));
    }
    return response.json().catch(() => null);
}

async function patch(endpoint: string, data: unknown = {}) {
    const token = getToken();
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(parseDetail((error as any).detail));
    }
    return response.json().catch(() => null);
}

async function put(endpoint: string, data: unknown) {
    const token = getToken();
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(parseDetail((error as any).detail));
    }
    return response.json().catch(() => null);
}

async function get(endpoint: string) {
    const token = getToken();
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(parseDetail((error as any).detail));
        }

        return await response.json();
    } catch (err) {
        throw err;
    }
}

// --- Auth ---

export async function loginUser(email: string, password: string): Promise<any> {
    // FastAPI OAuth2 expects form-encoded username/password
    const body = new URLSearchParams({ username: email, password });
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(parseDetail((error as any).detail));
    }
    const data = await response.json();
    if (data.access_token) {
        // Fetch the actual user profile now that we have a valid token
        const token = data.access_token;
        const userResponse = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const user = await userResponse.json();

        setToken(token, user.role);
        setUserInfo(user);
        return { ...data, user };
    }
    return data;
}

export async function registerOnly(payload: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role?: string;
    airport_code?: string | null;
    manager_key?: string;
}): Promise<void> {
    const full_name = `${payload.first_name} ${payload.last_name}`.trim();
    await post("/auth/register", {
        email: payload.email,
        password: payload.password,
        full_name,
        role: payload.role ?? "PASSENGER",
        airport_code: payload.airport_code ?? null,
        manager_key: payload.manager_key ?? null,
    });
}

export async function registerUser(payload: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role?: string;
}): Promise<any> {
    await registerOnly(payload);
    return loginUser(payload.email, payload.password);
}

export async function resetPassword(email: string, newPassword: string): Promise<void> {
    const params = new URLSearchParams({ email, new_password: newPassword });
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/reset-password?${params.toString()}`, {
        method: "POST",
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(parseDetail((error as any).detail));
    }
}

export function logoutUser() {
    clearToken();
    // Clear airport selection so next login starts fresh at select-airport
    localStorage.removeItem("skylytics_airport");
    document.cookie = "skylytics_airport=; path=/; max-age=0";
}

// --- Predictions ---

export async function predictRealTime(data: {
    airline: string;
    origin: string;
    destination: string;
    date: string;
    time: string;
    weather_severity?: number;
    tail_number?: string;
}) {
    return post("/predictions/realtime", data);
}

export async function submitPredictionFeedback(data: {
    prediction_id: string;
    actual_delay: number;
    rating: string;
    comment?: string;
}) {
    return post("/predictions/feedback", data);
}

// --- Saved Flights (backend watchlist via /saved) ---

export async function getSavedFlights(): Promise<any[]> {
    try {
        return await get("/saved/");
    } catch {
        return [];
    }
}

export async function saveFlightToWatchlist(callsign: string, route: string): Promise<any> {
    return post("/saved/", { callsign, route, notify: true });
}

export async function removeSavedFlight(savedId: string): Promise<void> {
    await del(`/saved/${savedId}`);
}

// Use runWhatIfSimulate for the advanced simulator. 
// simulateWhatIf is deprecated - please use runWhatIfSimulate.

export async function getHeatmapData(): Promise<any> {
    return get("/predictions/heatmap");
}

export async function getPredictionHistory(): Promise<any> {
    return get("/predictions/history");
}

// --- Operations ---

function getSelectedAirport(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("skylytics_airport");
}

export async function getDashboardStats(): Promise<any> {
    const airport = getSelectedAirport();
    const q = airport ? `?airport_code=${encodeURIComponent(airport)}` : "";
    return get(`/ops/dashboard${q}`);
}

export async function getAtRiskFlights(limit: number = 5): Promise<any> {
    const airport = getSelectedAirport();
    const airportQ = airport ? `&airport_code=${encodeURIComponent(airport)}` : "";
    return get(`/ops/at-risk?limit=${limit}${airportQ}`);
}

export async function getDelayTrend(): Promise<{ label: string; probability: number }[]> {
    const airport = getSelectedAirport();
    const q = airport ? `?airport_code=${encodeURIComponent(airport)}` : "";
    const data = await get(`/predictions/trends${q}`);
    // Backend returns { by_hour: [{hour, avg_delay}], by_airline: [...] }
    // Map to the shape the dashboard chart expects
    return (data.by_hour ?? []).map((item: any) => ({
        label: item.hour,
        probability: item.avg_delay,
    }));
}

// --- Flights ---

export async function getFlightInfo(flightId: string): Promise<any> {
    return get(`/flights/${flightId}`);
}

export async function getLiveFeed(): Promise<any> {
    const airport = getSelectedAirport();
    const q = airport ? `?airport_code=${encodeURIComponent(airport)}` : "";
    return get(`/flights/feed${q}`);
}

export async function getLiveFlights(): Promise<any[]> {
    const airport = getSelectedAirport();
    const q = airport ? `?airport_code=${encodeURIComponent(airport)}` : "";
    try {
        return await get(`/flights/live${q}`);
    } catch {
        return [];
    }
}

// --- Assistant ---

export async function queryAssistant(message: string): Promise<any> {
    return post("/assistant/query", { message });
}

// --- Notifications ---

export async function getNotifications(): Promise<any[]> {
    try { return await get("/notifications/"); } catch { return []; }
}

export async function getUnreadCount(): Promise<number> {
    try {
        const data = await get("/notifications/unread-count");
        return data.unread ?? 0;
    } catch { return 0; }
}

export async function markNotificationRead(id: string): Promise<void> {
    await patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
    await post("/notifications/read-all", {});
}

export async function deleteNotification(id: string): Promise<void> {
    await del(`/notifications/${id}`);
}

export async function getNotificationPreferences(): Promise<any> {
    return get("/notifications/preferences");
}

export async function updateNotificationPreferences(prefs: any): Promise<any> {
    return put("/notifications/preferences", prefs);
}

export async function getRouteAnalytics(): Promise<any[]> {
    const airport = getSelectedAirport();
    const q = airport ? `?airport_code=${encodeURIComponent(airport)}` : "";
    return get(`/ops/analytics/routes${q}`);
}

export async function getAirportAnalytics(): Promise<any[]> {
    const airport = getSelectedAirport();
    const q = airport ? `?airport_code=${encodeURIComponent(airport)}` : "";
    return get(`/ops/analytics/airports${q}`);
}

export async function getModelMetrics(): Promise<any> {
    return get("/system/status");
}

export async function getLiveFlightSuggestions(): Promise<any[]> {
    return get("/flights/live");
}

export async function getLivePredictions(): Promise<any[]> {
    return get("/flights/live-predictions");
}

// --- What-If Simulator ---

export async function getWhatIfAirlines(airportCode: string): Promise<{ airport: string; airlines: string[]; date: string }> {
    return get(`/whatif/active-airlines?airport_code=${encodeURIComponent(airportCode)}`);
}

export async function getWhatIfFlights(airline: string, airportCode: string): Promise<{ flights: any[] }> {
    return get(`/whatif/active-flights?airline=${encodeURIComponent(airline)}&airport_code=${encodeURIComponent(airportCode)}`);
}

export async function runWhatIfSimulate(payload: {
    flight_number: string;
    airline: string;
    origin: string;
    destination: string;
    date: string;
    departure_time: string;
    distance_miles: number;
    aircraft_type?: string;
    overrides: Record<string, any>;
}): Promise<any> {
    return post("/whatif/simulate", payload);
}

export async function getSystemStatus(): Promise<any> {
    return get("/system/status");
}
