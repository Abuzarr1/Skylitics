
export const REGISTERED_AIRPORTS: string[] = ['ATL', 'JFK', 'ORD', 'LAX', 'MIA', 'DFW', 'SFO', 'DEN', 'SEA'];

export const AIRPORT_META: Record<string, { name: string; lat: number; lng: number }> = {
    ATL: { name: 'Hartsfield-Jackson Atlanta', lat: 33.6407, lng: -84.4277 },
    JFK: { name: 'John F. Kennedy', lat: 40.6413, lng: -73.7781 },
    ORD: { name: "O'Hare International", lat: 41.9742, lng: -87.9073 },
    LAX: { name: 'Los Angeles International', lat: 33.9425, lng: -118.4081 },
    MIA: { name: 'Miami International', lat: 25.7959, lng: -80.2870 },
    DFW: { name: 'Dallas Fort Worth', lat: 32.8998, lng: -97.0403 },
    SFO: { name: 'San Francisco International', lat: 37.6213, lng: -122.3790 },
    DEN: { name: 'Denver International', lat: 39.8561, lng: -104.6737 },
    SEA: { name: 'Seattle-Tacoma', lat: 47.4502, lng: -122.3088 },
};

export type FlightRow = {
    flightNumber: string;
    origin: string;
    destination: string;
    scheduledTime: string;
    delayMinutes: number;
    status: 'on-time' | 'delayed' | 'cancelled';
    carrier: string;
    date: string;
    carrierDelay?: number;
    weatherDelay?: number;
    nasDelay?: number;
    lateAircraftDelay?: number;
    securityDelay?: number;
};

export type AirportStats = {
    code: string;
    totalFlights: number;
    delayed: number;
    onTime: number;
    cancelled: number;
    delayRate: number;
    avgDelayMinutes: number;
    riskLevel: 'low' | 'medium' | 'high';
};

export type DateStat = {
    date: string;
    totalFlights: number;
    delayed: number;
    delayRate: number;
};

export type CauseStat = {
    cause: string;
    totalMinutes: number;
};

export function parseCSV(raw: string): FlightRow[] {
    const lines = raw.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((h, i) => { row[h] = values[i]; });
        
        const delayMinutes = parseInt(row.delay) || parseInt(row.delay_minutes) || 0;
        const origin = row.origin || '';
        const destination = row.destination || '';
        
        return {
            flightNumber: row.flight_num || row.callsign || 'N/A',
            origin,
            destination,
            scheduledTime: row.dep_time || row.scheduled_time || '00:00',
            delayMinutes,
            status: (delayMinutes > 0 ? 'delayed' : 'on-time') as 'delayed' | 'on-time' | 'cancelled',
            carrier: row.airline || row.carrier || 'Unknown',
            date: row.date || new Date().toISOString().split('T')[0],
            carrierDelay: parseInt(row.carrier_delay) || 0,
            weatherDelay: parseInt(row.weather_delay) || 0,
            nasDelay: parseInt(row.nas_delay) || 0,
            lateAircraftDelay: parseInt(row.late_aircraft_delay) || 0,
            securityDelay: parseInt(row.security_delay) || 0,
        };
    }).filter(f => REGISTERED_AIRPORTS.includes(f.origin) || REGISTERED_AIRPORTS.includes(f.destination));
}

export async function loadAllCSVs(): Promise<FlightRow[]> {
    let allRows: FlightRow[] = [];
    for (const code of REGISTERED_AIRPORTS) {
        try {
            const res = await fetch(`/data/CSVs/${code}_mock_data.csv`);
            if (res.ok) {
                const text = await res.text();
                allRows = allRows.concat(parseCSV(text));
            }
        } catch (e) { console.error(`Error loading ${code}:`, e); }
    }
    return allRows;
}

export function getRiskLevel(code: string, rows: FlightRow[]): 'low' | 'medium' | 'high' {
    const airportRows = rows.filter(r => r.origin === code || r.destination === code);
    if (airportRows.length === 0) return 'low';
    const delayedCount = airportRows.filter(r => r.status === 'delayed').length;
    const rate = delayedCount / airportRows.length;
    if (rate < 0.20) return 'low';
    if (rate <= 0.50) return 'medium';
    return 'high';
}

export function getAirportStats(code: string, rows: FlightRow[]): AirportStats {
    const airportRows = rows.filter(r => r.origin === code || r.destination === code);
    const total = airportRows.length;
    const delayed = airportRows.filter(r => r.status === 'delayed').length;
    const cancelled = airportRows.filter(r => r.status === 'cancelled').length;
    const onTime = total - delayed - cancelled;
    const sumDelay = airportRows.reduce((acc, r) => acc + r.delayMinutes, 0);
    
    return {
        code,
        totalFlights: total,
        delayed,
        onTime,
        cancelled,
        delayRate: total > 0 ? (delayed / total) : 0,
        avgDelayMinutes: total > 0 ? (sumDelay / total) : 0,
        riskLevel: getRiskLevel(code, rows)
    };
}

export function getRoutes(rows: FlightRow[]) {
    const counts: Record<string, number> = {};
    rows.forEach(r => {
        if (REGISTERED_AIRPORTS.includes(r.origin) && REGISTERED_AIRPORTS.includes(r.destination)) {
            const key = `${r.origin}->${r.destination}`;
            counts[key] = (counts[key] || 0) + 1;
        }
    });
    return Object.entries(counts)
        .map(([key, flightCount]) => {
            const [origin, destination] = key.split('->');
            return { origin, destination, flightCount };
        })
        .sort((a, b) => b.flightCount - a.flightCount);
}

export function getFeedItems(rows: FlightRow[]) {
    return rows.map(r => ({
        flightNumber: r.flightNumber,
        origin: r.origin,
        destination: r.destination,
        scheduledTime: r.scheduledTime,
        status: r.status,
        delayMinutes: r.delayMinutes,
        carrier: r.carrier
    })).sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime));
}

export function getDelayByDate(rows: FlightRow[], code?: string): DateStat[] {
    let filtered = rows;
    if (code) filtered = rows.filter(r => r.origin === code || r.destination === code);
    
    const groups: Record<string, { total: number; delayed: number }> = {};
    filtered.forEach(r => {
        groups[r.date] = groups[r.date] || { total: 0, delayed: 0 };
        groups[r.date].total++;
        if (r.status === 'delayed') groups[r.date].delayed++;
    });
    
    return Object.entries(groups)
        .map(([date, stats]) => ({
            date,
            totalFlights: stats.total,
            delayed: stats.delayed,
            delayRate: stats.delayed / stats.total
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export function getDelayCauses(rows: FlightRow[], code?: string): CauseStat[] {
    let filtered = rows;
    if (code) filtered = rows.filter(r => r.origin === code || r.destination === code);
    
    const causes = {
        carrierDelay: 0,
        weatherDelay: 0,
        nasDelay: 0,
        lateAircraftDelay: 0,
        securityDelay: 0
    };
    
    filtered.forEach(r => {
        causes.carrierDelay += r.carrierDelay || 0;
        causes.weatherDelay += r.weatherDelay || 0;
        causes.nasDelay += r.nasDelay || 0;
        causes.lateAircraftDelay += r.lateAircraftDelay || 0;
        causes.securityDelay += r.securityDelay || 0;
    });
    
    return Object.entries(causes)
        .map(([cause, totalMinutes]) => ({ cause, totalMinutes }))
        .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

export function getAllAirportStats(rows: FlightRow[]): AirportStats[] {
    return REGISTERED_AIRPORTS
        .map(code => getAirportStats(code, rows))
        .sort((a, b) => b.totalFlights - a.totalFlights);
}
