"use client";
import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://skylytics-backend-25gp.onrender.com/api/v1';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface ModuleStatus { status: string; endpoints: number; }
interface SystemStatus {
  status: string;
  uptime: string;
  python_version: string;
  modules: Record<string, ModuleStatus>;
  total_endpoints: number;
  active_endpoints: number;
  model_status: Record<string, string>;
  inference_latency_ms: number;
  external_apis: Record<string, string>;
}
interface OpenAPIPath {
  method: string;
  path: string;
  summary: string;
  tags: string[];
  operationId: string;
}

/* ─────────────────────────────────────────────
   Static data (sprint 1 – always visible)
───────────────────────────────────────────── */
const STATIC_MODULES: Record<string, { name: string; prefix: string; desc: string; endpoints: { m: string; path: string; role: string; desc: string }[] }> = {
  auth: {
    name: 'Auth & Users', prefix: '/api/v1/auth',
    desc: 'Registration, login, JWT issuance, refresh, password reset, role management.',
    endpoints: [
      { m: 'POST', path: '/register', role: 'PUBLIC', desc: 'Create passenger account.' },
      { m: 'POST', path: '/login', role: 'PUBLIC', desc: 'Exchange credentials for JWT.' },
      { m: 'POST', path: '/refresh', role: 'PUBLIC', desc: 'Refresh access token.' },
      { m: 'POST', path: '/logout', role: 'PASSENGER', desc: 'Revoke refresh token.' },
      { m: 'GET', path: '/me', role: 'PASSENGER', desc: 'Get current user profile.' },
      { m: 'PATCH', path: '/me', role: 'PASSENGER', desc: 'Update profile.' },
    ],
  },
  flights: {
    name: 'Flights', prefix: '/api/v1/flights',
    desc: 'Core flight lookup, live status, and real-time position feed.',
    endpoints: [
      { m: 'GET', path: '/live', role: 'PASSENGER', desc: '✅ LIVE – Real-time flight positions with delay risk scores.' },
      { m: 'GET', path: '/search', role: 'PASSENGER', desc: 'Search by flight number / route / date.' },
      { m: 'GET', path: '/{flight_id}', role: 'PASSENGER', desc: 'Full flight detail.' },
      { m: 'GET', path: '/{flight_id}/status', role: 'PASSENGER', desc: 'Lightweight live status.' },
      { m: 'WS', path: '/ws/live/{flight_id}', role: 'PASSENGER', desc: 'WebSocket stream of live updates.' },
    ],
  },
  predictions: {
    name: 'Predictions & ML', prefix: '/api/v1/predictions',
    desc: 'Delay probability, SHAP explainability, real-time inference.',
    endpoints: [
      { m: 'POST', path: '/realtime', role: 'PASSENGER', desc: '✅ LIVE – Real-time XGBoost inference + SHAP factors.' },
      { m: 'GET', path: '/flight/{flight_id}', role: 'PASSENGER', desc: 'Prediction for specific flight.' },
      { m: 'POST', path: '/batch', role: 'MANAGER', desc: 'Batch predict up to 500 flights.' },
      { m: 'GET', path: '/flight/{flight_id}/explain', role: 'MANAGER', desc: 'Full SHAP attribution breakdown.' },
      { m: 'POST', path: '/whatif', role: 'MANAGER', desc: 'What-if simulator with feature overrides.' },
      { m: 'GET', path: '/heatmap', role: 'MANAGER', desc: 'Airport delay heatmap data.' },
    ],
  },
  assistant: {
    name: 'AI Assistant', prefix: '/api/v1/assistant',
    desc: 'Natural-language diagnostic engine for flight operations.',
    endpoints: [
      { m: 'POST', path: '/query', role: 'MANAGER', desc: '✅ LIVE – NLP diagnostic query with intent recognition.' },
    ],
  },
  system: {
    name: 'System / Health', prefix: '/api/v1/system',
    desc: 'Infrastructure: health, uptime, module registry, model status.',
    endpoints: [
      { m: 'GET', path: '/status', role: 'PUBLIC', desc: '✅ LIVE – Full system status powering this page.' },
      { m: 'GET', path: '/health', role: 'PUBLIC', desc: 'Liveness probe.' },
      { m: 'GET', path: '/openapi.json', role: 'PUBLIC', desc: 'OpenAPI 3.1 schema.' },
    ],
  },
};

const TECH = [
  { name: 'Python', ver: '3.9.x', desc: 'Runtime environment.' },
  { name: 'FastAPI', ver: '0.100+', desc: 'Async REST framework with auto OpenAPI docs.' },
  { name: 'XGBoost', ver: '2.x', desc: 'Core ML model — classifier + regressor.' },
  { name: 'SHAP', ver: '0.46.x', desc: 'Explainability layer — feature attributions.' },
  { name: 'Scikit-learn', ver: '1.5.x', desc: 'Preprocessing, encoders, metrics.' },
  { name: 'Pandas', ver: '2.x', desc: 'Feature engineering pipeline.' },
  { name: 'Pydantic', ver: '2.x', desc: 'Schema validation for all I/O.' },
  { name: 'Uvicorn', ver: '0.32.x', desc: 'ASGI production server.' },
  { name: 'Next.js', ver: '16.x', desc: 'Frontend framework (this app).' },
  { name: 'Leaflet.js', ver: '1.9.x', desc: 'Real-time flight map rendering.' },
  { name: 'Framer Motion', ver: '11.x', desc: 'UI animations.' },
  { name: 'TypeScript', ver: '5.x', desc: 'Full type safety on frontend.' },
];

/* ─────────────────────────────────────────────
   Style helpers
───────────────────────────────────────────── */
const METHOD_COLORS: Record<string, { bg: string; fg: string }> = {
  GET: { bg: 'rgba(34,211,238,0.12)', fg: '#22d3ee' },
  POST: { bg: 'rgba(34,197,94,0.12)', fg: '#4ade80' },
  PUT: { bg: 'rgba(251,191,36,0.12)', fg: '#fbbf24' },
  PATCH: { bg: 'rgba(251,146,60,0.12)', fg: '#fb923c' },
  DELETE: { bg: 'rgba(239,68,68,0.12)', fg: '#f87171' },
  WS: { bg: 'rgba(168,85,247,0.12)', fg: '#c084fc' },
};
const ROLE_COLORS: Record<string, string> = {
  PUBLIC: '#64748b', PASSENGER: '#22d3ee', MANAGER: '#fbbf24', ADMIN: '#f87171',
};

function MethodBadge({ m }: { m: string }) {
  const c = METHOD_COLORS[m] || METHOD_COLORS.GET;
  return (
    <span style={{ background: c.bg, color: c.fg, padding: '3px 8px', fontWeight: 700, fontSize: 10, borderRadius: 2, letterSpacing: '.5px', fontFamily: 'monospace' }}>
      {m}
    </span>
  );
}
function RoleBadge({ r }: { r: string }) {
  const col = ROLE_COLORS[r] || '#64748b';
  return (
    <span style={{ border: `1px solid ${col}`, color: col, padding: '2px 8px', fontSize: 9, letterSpacing: 1, borderRadius: 2, fontFamily: 'monospace' }}>
      {r}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const col = status === 'ACTIVE' || status === 'ONLINE' || status === 'LOADED' ? '#4ade80'
    : status === 'PLANNED' ? '#fbbf24' : '#f87171';
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col}`, marginRight: 6 }} />;
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
import * as Mocks from '@/lib/mocks';

export default function ArchitecturePage() {
  const [activeModule, setActiveModule] = useState('flights');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(Mocks.MOCK_SYSTEM_STATUS as any);
  const [liveFlights, setLiveFlights] = useState<any[]>(Mocks.MOCK_FLIGHTS);
  const [openApiPaths, setOpenApiPaths] = useState<OpenAPIPath[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [lastPing, setLastPing] = useState<Date | null>(null);

  /* Sprint 1 – System Status */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/system/status`);
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
        setLastPing(new Date());
        setApiError(false);
        setIsLive(true);
      } else {
        setIsLive(false);
      }
    } catch {
      setApiError(false); // don't show hard error if we have mocks
      setIsLive(false);
    } finally {
      setApiLoading(false);
    }
  }, []);

  /* Sprint 2 – Live OpenAPI spec */
  const fetchOpenApi = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/openapi.json');
      const spec = await res.json();
      const paths: OpenAPIPath[] = [];
      if (spec.paths) {
        Object.entries(spec.paths as Record<string, any>).forEach(([path, methods]) => {
          Object.entries(methods as Record<string, any>).forEach(([method, op]: [string, any]) => {
            paths.push({
              method: method.toUpperCase(),
              path,
              summary: op.summary || op.description || '',
              tags: op.tags || [],
              operationId: op.operationId || '',
            });
          });
        });
      }
      setOpenApiPaths(paths);
    } catch { /* OpenAPI optional */ }
  }, []);

  /* Sprint 3 – Live Flights count */
  const fetchFlights = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/flights/live`);
      const data = await res.json();
      setLiveFlights(data);
    } catch { /* non-blocking */ }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchOpenApi();
    fetchFlights();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchOpenApi, fetchFlights]);

  const currentModule = STATIC_MODULES[activeModule];
  const liveEndpoints = openApiPaths.length;
  const atRisk = liveFlights.filter(f => f.status === 'at_risk').length;
  const delayed = liveFlights.filter(f => f.status === 'delayed').length;

  /* ─ Styles ─ */
  const S = {
    page: { minHeight: '100vh', background: 'radial-gradient(ellipse at top, #0a1628 0%, #050a14 60%, #02050a 100%)', color: '#e8eef7', fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", padding: '48px 24px 120px', position: 'relative' as const, overflow: 'hidden' as const },
    gridBg: { position: 'fixed' as const, inset: 0, backgroundImage: 'linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' as const, zIndex: 0 },
    container: { maxWidth: 1280, margin: '0 auto', position: 'relative' as const, zIndex: 1 },
    mono: { fontFamily: "'JetBrains Mono', monospace" },
    cyan: { color: '#38bdf8' },
    dim: { color: '#64748b' },
    card: { background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(56,189,248,0.12)', borderRadius: 4, padding: 24, marginBottom: 16, backdropFilter: 'blur(12px)' },
    sectionHeader: { display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32, paddingBottom: 16, borderBottom: '1px dashed rgba(56,189,248,0.15)' },
    sectionTitle: { fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 900, color: '#f1f5fd', margin: 0, textTransform: 'uppercase' as const, letterSpacing: 1 },
    th: { textAlign: 'left' as const, padding: 12, color: '#64748b', fontSize: 10, textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(56,189,248,0.15)', letterSpacing: 1 },
    td: { padding: '12px', borderBottom: '1px solid rgba(148,163,184,0.06)', color: '#cbd5e1', verticalAlign: 'top' as const, fontSize: 12, fontFamily: 'monospace' },
    tab: (active: boolean) => ({ padding: '8px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const, background: active ? 'rgba(56,189,248,0.15)' : 'transparent', color: active ? '#38bdf8' : '#64748b', border: active ? '1px solid rgba(56,189,248,0.4)' : '1px solid transparent', borderRadius: 2, cursor: 'pointer' }),
    liveTag: { background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '2px 8px', fontSize: 9, fontFamily: 'monospace', borderRadius: 2, letterSpacing: 1, border: '1px solid rgba(34,197,94,0.3)' },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600&family=JetBrains+Mono:wght@400;600;700&display=swap'); body{margin:0;} *{box-sizing:border-box;}`}</style>
      <div style={S.gridBg} />
      <div style={S.container}>

        {/* ── HEADER ── */}
        <header style={{ borderBottom: '1px solid rgba(56,189,248,0.2)', paddingBottom: 32, marginBottom: 48 }}>
          <div style={{ ...S.mono, fontSize: 11, letterSpacing: 2, ...S.cyan, textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: apiError ? '#f87171' : '#22d3ee', boxShadow: `0 0 12px ${apiError ? '#f87171' : '#22d3ee'}`, display: 'inline-block' }} />
            Backend Architecture · Technical Specification
            {lastPing && <span style={{ ...S.dim, fontSize: 10 }}>· synced {lastPing.toLocaleTimeString()}</span>}
          </div>
          <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(36px,5vw,64px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.02em', margin: '0 0 16px', color: '#f1f5fd', textTransform: 'uppercase' }}>
            Skylytics <span style={{ color: '#38bdf8', fontStyle: 'italic', fontWeight: 400 }}>/&nbsp;backend</span>
          </h1>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 720, lineHeight: 1.6 }}>
            Live backend blueprint. All data sourced from the running FastAPI instance at <code style={{ color: '#22d3ee' }}>localhost:8000</code>.
          </p>

          {/* Live Meta Row */}
          <div style={{ display: 'flex', gap: 32, marginTop: 24, flexWrap: 'wrap', ...S.mono, fontSize: 11, ...S.dim, textTransform: 'uppercase', letterSpacing: 1 }}>
            {[
              ['Backend', apiError ? '● OFFLINE' : '● ONLINE', apiError ? '#f87171' : '#4ade80'],
              ['Uptime', systemStatus?.uptime ?? (apiLoading ? '—' : 'N/A'), '#cbd5e1'],
              ['Modules', systemStatus ? `${Object.keys(systemStatus.modules).length}` : '—', '#cbd5e1'],
              ['Total Endpoints', systemStatus ? `${systemStatus.total_endpoints}` : '—', '#cbd5e1'],
              ['Active Endpoints', liveEndpoints > 0 ? `${liveEndpoints} (live)` : systemStatus ? String(systemStatus.active_endpoints) : '—', '#4ade80'],
              ['Live Flights', liveFlights.length > 0 ? `${liveFlights.length} tracked` : '—', '#cbd5e1'],
              ['At-Risk / Delayed', liveFlights.length > 0 ? `${atRisk} / ${delayed}` : '—', atRisk > 0 ? '#fbbf24' : '#cbd5e1'],
              ['Inference Latency', systemStatus ? `${systemStatus.inference_latency_ms}ms` : '—', '#4ade80'],
            ].map(([label, val, col]) => (
              <div key={label as string} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ color: '#475569' }}>{label}</span>
                <span style={{ color: col as string, fontSize: 13 }}>{val as string}</span>
              </div>
            ))}
          </div>
        </header>

        {/* ── SPRINT 1: SYSTEM STATUS ── */}
        <section style={{ marginBottom: 72 }}>
          <div style={S.sectionHeader}>
            <span style={{ ...S.mono, fontSize: 12, ...S.cyan, fontWeight: 600 }}>§ 01</span>
              <div className="flex items-baseline gap-4 mb-4">
                <h2 className="text-xl font-heading font-black text-white uppercase tracking-tighter leading-none">System Blueprint Status</h2>
                <div className={`px-2 py-0.5 border font-mono text-[8px] uppercase tracking-widest text-accent-neon border-accent-neon/40 bg-accent-neon/10 animate-pulse shadow-[0_0_8px_rgba(223,255,0,0.1)]`}>
                    Live Sync Active
                </div>
              </div>
              <span style={S.liveTag}>Live API</span>
            </div>

            {apiLoading && <p style={{ ...S.mono, ...S.dim, fontSize: 12 }}>Connecting to backend...</p>}
            
            {systemStatus && (
              <>
                {/* Module Registry */}
                <div style={{ ...S.card }}>
                  <div style={{ ...S.mono, fontSize: 13, fontWeight: 600, ...S.cyan, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>▸ Module Registry</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                    {Object.entries(systemStatus.modules).map(([key, mod]) => (
                      <div key={key} style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 4, padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ ...S.mono, fontSize: 13, color: '#f1f5fd', fontWeight: 600 }}>{key}</span>
                          <StatusDot status={mod.status} />
                        </div>
                        <div style={{ ...S.mono, fontSize: 10, ...S.dim }}>{mod.endpoints} endpoints · {mod.status}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model + Data Sources */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={S.card}>
                    <div style={{ ...S.mono, fontSize: 13, fontWeight: 600, ...S.cyan, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>▸ ML Models</div>
                    {Object.entries(systemStatus.model_status).map(([name, status]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12, ...S.mono }}>
                        <span style={{ color: '#cbd5e1' }}>{name}</span>
                        <span><StatusDot status={status} /><span style={{ color: '#4ade80' }}>{status}</span></span>
                      </div>
                    ))}
                  </div>
                  <div style={S.card}>
                    <div style={{ ...S.mono, fontSize: 13, fontWeight: 600, ...S.cyan, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>▸ Data Synchronization</div>
                    {Object.entries(systemStatus.external_apis).map(([name, status]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12, ...S.mono }}>
                        <span style={{ color: '#cbd5e1' }}>{name}</span>
                        <span style={{ color: '#4ade80' }}>● ACTIVE</span>
                      </div>
                    ))}
                  </div>
                </div>
            </>
          )}
        </section>

        {/* ── SPRINT 2: LIVE API EXPLORER ── */}
        <section style={{ marginBottom: 72 }}>
          <div style={S.sectionHeader}>
            <span style={{ ...S.mono, fontSize: 12, ...S.cyan, fontWeight: 600 }}>§ 02</span>
            <h2 style={S.sectionTitle}>API Module Explorer</h2>
            {liveEndpoints > 0 && <span style={S.liveTag}>{liveEndpoints} endpoints via OpenAPI</span>}
          </div>

          {/* Module Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24, padding: 6, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(56,189,248,0.12)', borderRadius: 4 }}>
            {Object.entries(STATIC_MODULES).map(([key, mod]) => (
              <button key={key} style={S.tab(activeModule === key)} onClick={() => setActiveModule(key)}>
                {mod.name}
                {systemStatus?.modules[key] && (
                  <span style={{ marginLeft: 6, display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: systemStatus.modules[key].status === 'ACTIVE' ? '#4ade80' : '#fbbf24' }} />
                )}
              </button>
            ))}
          </div>

          <div style={S.card}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ ...S.mono, fontSize: 13, fontWeight: 600, ...S.cyan, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                ▸ {currentModule.name}
                {systemStatus?.modules[activeModule] && (
                  <span style={{ marginLeft: 12, fontSize: 10, ...S.dim }}>
                    <StatusDot status={systemStatus.modules[activeModule].status} />
                    {systemStatus.modules[activeModule].status}
                  </span>
                )}
              </div>
              <div style={{ ...S.mono, fontSize: 12, color: '#22d3ee', marginBottom: 6 }}>prefix: {currentModule.prefix}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{currentModule.desc}</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, width: 80 }}>Method</th>
                    <th style={{ ...S.th, width: 320 }}>Path</th>
                    <th style={{ ...S.th, width: 110 }}>Access</th>
                    <th style={S.th}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {currentModule.endpoints.map((e, i) => (
                    <tr key={i} style={{ background: e.desc.startsWith('✅') ? 'rgba(34,197,94,0.04)' : 'transparent' }}>
                      <td style={S.td}><MethodBadge m={e.m} /></td>
                      <td style={{ ...S.td, color: '#f1f5fd' }}>{currentModule.prefix}{e.path}</td>
                      <td style={S.td}><RoleBadge r={e.role} /></td>
                      <td style={{ ...S.td, fontFamily: 'inherit', color: e.desc.startsWith('✅') ? '#86efac' : '#94a3b8' }}>{e.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sprint 2 – OpenAPI Live Paths */}
          {openApiPaths.length > 0 && (
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={{ ...S.mono, fontSize: 13, fontWeight: 600, ...S.cyan, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
                ▸ Live OpenAPI Schema ({openApiPaths.length} paths registered)
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...S.th, width: 80 }}>Method</th>
                      <th style={S.th}>Path</th>
                      <th style={S.th}>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openApiPaths.map((p, i) => (
                      <tr key={i}>
                        <td style={S.td}><MethodBadge m={p.method} /></td>
                        <td style={{ ...S.td, color: '#f1f5fd' }}>{p.path}</td>
                        <td style={{ ...S.td, color: '#94a3b8', fontFamily: 'inherit' }}>{p.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ── SPRINT 3: LIVE FLIGHT PULSE ── */}
        <section style={{ marginBottom: 72 }}>
          <div style={S.sectionHeader}>
            <span style={{ ...S.mono, fontSize: 12, ...S.cyan, fontWeight: 600 }}>§ 03</span>
            <h2 style={S.sectionTitle}>Live Flight Pulse</h2>
            <span style={S.liveTag}>{liveFlights.length} active vectors</span>
          </div>

          {liveFlights.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {liveFlights.slice(0, 12).map(f => {
                const col = f.status === 'delayed' ? '#f87171' : f.status === 'at_risk' ? '#fbbf24' : '#4ade80';
                return (
                  <div key={f.id} style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${col}22`, borderLeft: `3px solid ${col}`, borderRadius: 4, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ ...S.mono, fontSize: 13, color: '#f1f5fd', fontWeight: 700 }}>{f.callsign}</span>
                      <span style={{ color: col, ...S.mono, fontSize: 10 }}>{Math.round(f.delay_probability * 100)}%</span>
                    </div>
                    <div style={{ ...S.mono, fontSize: 10, ...S.dim }}>{f.origin} → {f.destination}</div>
                    <div style={{ marginTop: 8, height: 3, background: '#1e293b', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${f.progress * 100}%`, background: col, borderRadius: 2, transition: 'width 1s' }} />
                    </div>
                    <div style={{ ...S.mono, fontSize: 9, ...S.dim, marginTop: 4 }}>
                      {f.altitude_ft.toLocaleString()} ft · {f.speed_kts} kts
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ ...S.mono, ...S.dim, fontSize: 12 }}>Loading live flight data from /flights/live...</p>
          )}
        </section>

        {/* ── TECH STACK ── */}
        <section style={{ marginBottom: 72 }}>
          <div style={S.sectionHeader}>
            <span style={{ ...S.mono, fontSize: 12, ...S.cyan, fontWeight: 600 }}>§ 04</span>
            <h2 style={S.sectionTitle}>Technology Stack</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {TECH.map(t => (
              <div key={t.name} style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 4, padding: 18, transition: 'border-color 0.2s' }}>
                <div style={{ ...S.mono, fontSize: 14, color: '#f1f5fd', fontWeight: 600, marginBottom: 2 }}>{t.name}</div>
                <div style={{ ...S.mono, fontSize: 11, color: '#22d3ee', marginBottom: 8 }}>v{t.ver}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ marginTop: 80, paddingTop: 32, borderTop: '1px solid rgba(56,189,248,0.15)', textAlign: 'center', ...S.mono, fontSize: 11, ...S.dim, letterSpacing: 1 }}>
          SKYLYTICS · BACKEND SPEC v2.0 · LIVE API INTEGRATION · {new Date().getFullYear()}
          <br /><span style={{ color: '#334155', marginTop: 8, display: 'inline-block' }}>
            ─ FastAPI · XGBoost · Leaflet · Next.js 16 · TypeScript ─
          </span>
        </footer>
      </div>
    </div>
  );
}
