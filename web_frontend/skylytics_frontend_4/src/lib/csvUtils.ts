export const REGISTERED_AIRPORTS = [
  'ATL','JFK','ORD','LAX','MIA','DFW','SFO','DEN','SEA'
];

export const AIRPORT_META: Record<string, { name: string, lat: number, lng: number }> = {
  ATL: { name:'Hartsfield-Jackson Atlanta', lat:33.6407,  lng:-84.4277  },
  JFK: { name:'John F. Kennedy',            lat:40.6413,  lng:-73.7781  },
  ORD: { name:"O'Hare International",       lat:41.9742,  lng:-87.9073  },
  LAX: { name:'Los Angeles International',  lat:33.9425,  lng:-118.4081 },
  MIA: { name:'Miami International',        lat:25.7959,  lng:-80.2870  },
  DFW: { name:'Dallas Fort Worth',          lat:32.8998,  lng:-97.0403  },
  SFO: { name:'San Francisco International',lat:37.6213,  lng:-122.3790 },
  DEN: { name:'Denver International',       lat:39.8561,  lng:-104.6737 },
  SEA: { name:'Seattle-Tacoma',             lat:47.4502,  lng:-122.3088 },
};

export interface FlightRow {
  flightNumber: string;
  origin: string;
  destination: string;
  scheduledTime: string;
  date: string;
  carrier: string;
  delayMinutes: number;
  status: 'on-time' | 'delayed' | 'cancelled';
  carrierDelay?: number;
  weatherDelay?: number;
  nasDelay?: number;
  lateAircraftDelay?: number;
  securityDelay?: number;
}

export interface AirportStats {
  code: string;
  name: string;
  totalFlights: number;
  delayed: number;
  onTime: number;
  cancelled: number;
  delayRate: number;
  avgDelayMinutes: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export function parseCSV(raw: string): FlightRow[] {
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l);
    
    // Find the FLIGHTS section if it exists, otherwise assume standard CSV
    let flightsIndex = lines.findIndex(l => l.includes('## FLIGHTS'));
    const dataLines = flightsIndex !== -1 ? lines.slice(flightsIndex + 1).filter(l => !l.startsWith('#')) : lines.filter(l => !l.startsWith('#'));
    
    if (dataLines.length < 2) return [];
    
    const headers = dataLines[0].split(',').map(h => h.trim().toLowerCase());
    
    return dataLines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((h, i) => { row[h] = values[i]; });
        
        const delayMinutes = parseInt(row.delay_minutes) || parseInt(row.delay) || 0;
        const origin = (row.origin || '').toUpperCase();
        const destination = (row.destination || '').toUpperCase();
        
        // Status mapping
        let status: 'on-time' | 'delayed' | 'cancelled' = 'on-time';
        if (row.status === 'cancelled') {
            status = 'cancelled';
        } else if (row.status === 'delayed' || row.status === 'atRisk' || delayMinutes > 15) {
            status = 'delayed';
        }

        return {
            flightNumber: row.callsign || row.flight_num || row.flightnumber || 'N/A',
            origin,
            destination,
            scheduledTime: row.dep_time || row.scheduled_time || '00:00',
            delayMinutes,
            status,
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
    const promises = REGISTERED_AIRPORTS.map(async (code) => {
        try {
            const res = await fetch(`/data/CSVs/${code}_mock_data.csv`);
            if (res.ok) {
                const text = await res.text();
                return parseCSV(text);
            }
        } catch (e) {
            console.error(`Error loading ${code}:`, e);
        }
        return [];
    });
    const results = await Promise.all(promises);
    return results.flat();
}

export function getRiskLevel(code: string, rows: FlightRow[]): 'low' | 'medium' | 'high' {
    const relevant = rows.filter(r => r.origin === code || r.destination === code);
    if (relevant.length === 0) return 'low';
    const delayed = relevant.filter(r => r.status === 'delayed').length;
    const rate = delayed / relevant.length;
    if (rate < 0.20) return 'low';
    if (rate <= 0.50) return 'medium';
    return 'high';
}

export function getAirportStats(code: string, rows: FlightRow[]): AirportStats {
    const relevant = rows.filter(r => r.origin === code || r.destination === code);
    const delayed = relevant.filter(r => r.status === 'delayed');
    const onTime = relevant.filter(r => r.status === 'on-time');
    const cancelled = relevant.filter(r => r.status === 'cancelled');
    const totalDelay = delayed.reduce((sum, r) => sum + r.delayMinutes, 0);
    
    return {
        code,
        name: AIRPORT_META[code]?.name || code,
        totalFlights: relevant.length,
        delayed: delayed.length,
        onTime: onTime.length,
        cancelled: cancelled.length,
        delayRate: relevant.length > 0 ? (delayed.length / relevant.length) : 0,
        avgDelayMinutes: delayed.length > 0 ? Math.round(totalDelay / delayed.length) : 0,
        riskLevel: getRiskLevel(code, rows)
    };
}

export function getAllAirportStats(rows: FlightRow[]): AirportStats[] {
    return REGISTERED_AIRPORTS.map(code => getAirportStats(code, rows))
        .sort((a, b) => b.delayRate - a.delayRate);
}

export function getRoutes(rows: FlightRow[]) {
    const routeMap = new Map<string, number>();
    rows.forEach(r => {
        if (REGISTERED_AIRPORTS.includes(r.origin) && REGISTERED_AIRPORTS.includes(r.destination)) {
            const key = `${r.origin}->${r.destination}`;
            routeMap.set(key, (routeMap.get(key) || 0) + 1);
        }
    });
    
    return Array.from(routeMap.entries()).map(([key, count]) => {
        const [origin, destination] = key.split('->');
        return { origin, destination, flightCount: count };
    }).sort((a, b) => b.flightCount - a.flightCount);
}

export function getFeedItems(rows: FlightRow[]) {
    return [...rows].sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime));
}

export function getDelayByDate(rows: FlightRow[], code?: string) {
    const filtered = code ? rows.filter(r => r.origin === code || r.destination === code) : rows;
    const dateMap = new Map<string, { total: number, delayed: number }>();
    
    filtered.forEach(r => {
        const stats = dateMap.get(r.date) || { total: 0, delayed: 0 };
        stats.total++;
        if (r.status === 'delayed') stats.delayed++;
        dateMap.set(r.date, stats);
    });
    
    return Array.from(dateMap.entries()).map(([date, stats]) => ({
        date,
        totalFlights: stats.total,
        delayed: stats.delayed,
        delayRate: stats.total > 0 ? (stats.delayed / stats.total) : 0
    })).sort((a, b) => a.date.localeCompare(b.date));
}

export function getDelayCauses(rows: FlightRow[], code?: string) {
    const filtered = code ? rows.filter(r => r.origin === code || r.destination === code) : rows;
    const causes = {
        'Carrier': 0,
        'Weather': 0,
        'NAS': 0,
        'Late Aircraft': 0,
        'Security': 0
    };
    
    filtered.forEach(r => {
        causes['Carrier'] += r.carrierDelay || 0;
        causes['Weather'] += r.weatherDelay || 0;
        causes['NAS'] += r.nasDelay || 0;
        causes['Late Aircraft'] += r.lateAircraftDelay || 0;
        causes['Security'] += r.securityDelay || 0;
    });
    
    return Object.entries(causes).map(([cause, totalMinutes]) => ({
        cause,
        totalMinutes
    })).sort((a, b) => b.totalMinutes - a.totalMinutes);
}
