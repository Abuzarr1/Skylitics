import React, { useState } from 'react';

export default function SkylyticsBackendDoc() {
  const [activeModule, setActiveModule] = useState('auth');

  // ========== STYLES ==========
  const styles = {
    page: {
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0a1628 0%, #050a14 60%, #02050a 100%)',
      color: '#e8eef7',
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
      padding: '48px 24px 120px',
      position: 'relative',
      overflow: 'hidden',
    },
    gridBg: {
      position: 'fixed',
      inset: 0,
      backgroundImage: `linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px)`,
      backgroundSize: '48px 48px',
      pointerEvents: 'none',
      zIndex: 0,
    },
    container: {
      maxWidth: '1280px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 1,
    },
    header: {
      borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
      paddingBottom: '32px',
      marginBottom: '48px',
    },
    docTag: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '11px',
      letterSpacing: '2px',
      color: '#38bdf8',
      textTransform: 'uppercase',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    pulse: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#22d3ee',
      boxShadow: '0 0 12px #22d3ee',
      animation: 'pulse 2s infinite',
    },
    title: {
      fontFamily: "'Fraunces', Georgia, serif",
      fontSize: 'clamp(42px, 6vw, 72px)',
      fontWeight: 300,
      lineHeight: 0.95,
      letterSpacing: '-0.02em',
      margin: '0 0 16px',
      color: '#f1f5fd',
    },
    titleAccent: {
      fontStyle: 'italic',
      color: '#38bdf8',
      fontWeight: 400,
    },
    subtitle: {
      fontSize: '16px',
      color: '#94a3b8',
      maxWidth: '720px',
      lineHeight: 1.6,
      fontWeight: 300,
    },
    metaRow: {
      display: 'flex',
      gap: '32px',
      marginTop: '24px',
      flexWrap: 'wrap',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '11px',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    metaItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    metaLabel: { color: '#475569' },
    metaValue: { color: '#cbd5e1', fontSize: '13px' },

    section: {
      marginBottom: '72px',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '16px',
      marginBottom: '32px',
      paddingBottom: '16px',
      borderBottom: '1px dashed rgba(56, 189, 248, 0.15)',
    },
    sectionNum: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '12px',
      color: '#38bdf8',
      fontWeight: 600,
      letterSpacing: '1px',
    },
    sectionTitle: {
      fontFamily: "'Fraunces', Georgia, serif",
      fontSize: '32px',
      fontWeight: 400,
      color: '#f1f5fd',
      letterSpacing: '-0.01em',
      margin: 0,
    },
    sectionDesc: {
      fontSize: '14px',
      color: '#94a3b8',
      lineHeight: 1.7,
      marginBottom: '24px',
      maxWidth: '800px',
    },

    card: {
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(56, 189, 248, 0.12)',
      borderRadius: '4px',
      padding: '24px',
      marginBottom: '16px',
      backdropFilter: 'blur(12px)',
    },
    cardTitle: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '13px',
      fontWeight: 600,
      color: '#38bdf8',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },

    stackGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
    },
    stackItem: {
      background: 'rgba(15, 23, 42, 0.5)',
      border: '1px solid rgba(148, 163, 184, 0.1)',
      borderRadius: '4px',
      padding: '20px',
      transition: 'all 0.2s',
    },
    stackName: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '14px',
      color: '#f1f5fd',
      fontWeight: 600,
      marginBottom: '4px',
    },
    stackVer: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '11px',
      color: '#22d3ee',
      marginBottom: '10px',
    },
    stackDesc: {
      fontSize: '12px',
      color: '#94a3b8',
      lineHeight: 1.6,
    },

    moduleTabs: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      marginBottom: '24px',
      padding: '6px',
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(56, 189, 248, 0.12)',
      borderRadius: '4px',
    },
    tab: (active) => ({
      padding: '10px 16px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '1px',
      textTransform: 'uppercase',
      background: active ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
      color: active ? '#38bdf8' : '#64748b',
      border: active ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
      borderRadius: '2px',
      cursor: 'pointer',
      transition: 'all 0.15s',
    }),

    endpointTable: {
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '12px',
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      color: '#64748b',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
      fontWeight: 600,
    },
    td: {
      padding: '14px 12px',
      borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
      color: '#cbd5e1',
      verticalAlign: 'top',
    },
    method: (m) => {
      const colors = {
        GET: { bg: 'rgba(34, 211, 238, 0.12)', fg: '#22d3ee' },
        POST: { bg: 'rgba(34, 197, 94, 0.12)', fg: '#4ade80' },
        PUT: { bg: 'rgba(251, 191, 36, 0.12)', fg: '#fbbf24' },
        PATCH: { bg: 'rgba(251, 146, 60, 0.12)', fg: '#fb923c' },
        DELETE: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#f87171' },
        WS: { bg: 'rgba(168, 85, 247, 0.12)', fg: '#c084fc' },
      };
      const c = colors[m] || colors.GET;
      return {
        display: 'inline-block',
        padding: '3px 8px',
        background: c.bg,
        color: c.fg,
        fontWeight: 700,
        fontSize: '10px',
        borderRadius: '2px',
        letterSpacing: '0.5px',
      };
    },
    role: (r) => {
      const colors = {
        PUBLIC: '#64748b',
        PASSENGER: '#22d3ee',
        MANAGER: '#fbbf24',
        ADMIN: '#f87171',
      };
      return {
        display: 'inline-block',
        padding: '2px 8px',
        border: `1px solid ${colors[r] || '#64748b'}`,
        color: colors[r] || '#64748b',
        fontSize: '9px',
        letterSpacing: '1px',
        borderRadius: '2px',
      };
    },

    twoCol: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
    },

    codeBlock: {
      background: '#020617',
      border: '1px solid rgba(56, 189, 248, 0.15)',
      borderRadius: '4px',
      padding: '20px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '12px',
      color: '#cbd5e1',
      lineHeight: 1.7,
      overflowX: 'auto',
      whiteSpace: 'pre',
    },

    erdCanvas: {
      background: 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.04) 0%, transparent 70%), #020617',
      border: '1px solid rgba(56, 189, 248, 0.2)',
      borderRadius: '4px',
      padding: '32px',
      overflowX: 'auto',
    },

    footer: {
      marginTop: '80px',
      paddingTop: '32px',
      borderTop: '1px solid rgba(56, 189, 248, 0.15)',
      textAlign: 'center',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '11px',
      color: '#475569',
      letterSpacing: '1px',
    },
  };

  // ========== DATA ==========

  const techStack = [
    { name: 'Python', ver: '3.12.x', desc: 'Runtime. Modern type hints, pattern matching.' },
    { name: 'FastAPI', ver: '0.135.3', desc: 'Async web framework. Auto OpenAPI docs.' },
    { name: 'Uvicorn', ver: '0.32.x', desc: 'ASGI server with uvloop for speed.' },
    { name: 'Pydantic', ver: '2.x', desc: 'Request/response validation & serialization.' },
    { name: 'SQLAlchemy', ver: '2.0.x', desc: 'Async ORM with typed models.' },
    { name: 'Alembic', ver: '1.13.x', desc: 'Database schema migrations.' },
    { name: 'PostgreSQL', ver: '17.x', desc: 'Primary relational store (AWS RDS).' },
    { name: 'Redis', ver: '7.4.x', desc: 'Cache, rate limiting, pub/sub, sessions.' },
    { name: 'asyncpg', ver: '0.30.x', desc: 'Async Postgres driver.' },
    { name: 'SQLAdmin', ver: '0.20.x', desc: 'Auto-generated admin UI on FastAPI.' },
    { name: 'ARQ', ver: '0.26.x', desc: 'Redis-backed async task queue (ML jobs).' },
    { name: 'python-jose', ver: '3.3.x', desc: 'JWT auth token encoding.' },
    { name: 'passlib[bcrypt]', ver: '1.7.x', desc: 'Password hashing.' },
    { name: 'httpx', ver: '0.28.x', desc: 'Async HTTP client for external APIs.' },
    { name: 'Docker', ver: '27.x', desc: 'Containerization for deployment.' },
  ];

  const mlStack = [
    { name: 'pandas', ver: '2.2.x', desc: 'Tabular data manipulation.' },
    { name: 'numpy', ver: '2.1.x', desc: 'Numerical computation.' },
    { name: 'scikit-learn', ver: '1.5.x', desc: 'Baseline models, preprocessing, metrics.' },
    { name: 'XGBoost', ver: '2.1.x', desc: 'Gradient-boosted tree classifier/regressor.' },
    { name: 'LightGBM', ver: '4.5.x', desc: 'Fast gradient boosting, complements XGBoost.' },
    { name: 'PyTorch', ver: '2.6.x', desc: 'Deep learning for LSTM / Transformer models.' },
    { name: 'transformers', ver: '4.46.x', desc: 'HuggingFace transformer architectures.' },
    { name: 'imbalanced-learn', ver: '0.13.x', desc: 'SMOTE for class imbalance.' },
    { name: 'SHAP', ver: '0.46.x', desc: 'Explainability — feature attributions.' },
    { name: 'LIME', ver: '0.2.x', desc: 'Local surrogate explanations.' },
    { name: 'joblib', ver: '1.4.x', desc: 'Model serialization.' },
    { name: 'MLflow', ver: '2.18.x', desc: 'Experiment tracking & model registry.' },
  ];

  const externalAPIs = [
    {
      name: 'Meteostat API',
      url: 'meteostat.net',
      purpose: 'Real-time + historical weather per airport (temp, wind, visibility, precipitation).',
      auth: 'API Key (RapidAPI)',
      usage: 'Called hourly by ETL worker; cached in Redis (TTL 1h); fallback to last known good on failure.',
      criticality: 'HIGH',
    },
    {
      name: 'OpenSky Network API',
      url: 'opensky-network.org',
      purpose: 'Live flight positions, callsigns, ADS-B state vectors for real-time traffic density.',
      auth: 'OAuth2 (client credentials)',
      usage: 'Polled every 60s for active flights in tracked airspaces; feeds congestion feature.',
      criticality: 'MEDIUM',
    },
    {
      name: 'OpenFlights Dataset',
      url: 'openflights.org/data.html',
      purpose: 'Static reference data — airports, airlines, routes, IATA/ICAO codes, coordinates.',
      auth: 'None (public CSV)',
      usage: 'Seeded once into PostgreSQL at bootstrap; refreshed monthly via cron.',
      criticality: 'LOW',
    },
    {
      name: 'Kaggle BTS Flight Delays (2015)',
      url: 'kaggle.com/datasets/usdot/flight-delays',
      purpose: 'Historical training corpus — 5.8M US flight records with delays, causes, distances.',
      auth: 'Kaggle API token',
      usage: 'Bulk-loaded once; used for model training and as live-API fallback data source.',
      criticality: 'HIGH',
    },
    {
      name: 'Apple Push Notification Service',
      url: 'api.push.apple.com',
      purpose: 'Delivering delay alerts, gate changes, boarding reminders to iOS app.',
      auth: 'Apple Developer JWT (p8 key)',
      usage: 'Triggered by alert engine when delay probability crosses user threshold.',
      criticality: 'HIGH',
    },
    {
      name: 'SendGrid / AWS SES',
      url: 'sendgrid.com / aws.amazon.com/ses',
      purpose: 'Transactional email — verification, password reset, manager digests.',
      auth: 'API Key / IAM role',
      usage: 'Fire-and-forget from ARQ background worker.',
      criticality: 'MEDIUM',
    },
  ];

  const modules = {
    auth: {
      name: 'Auth & Users',
      prefix: '/api/v1/auth',
      desc: 'Registration, login, JWT issuance, refresh, password reset, role management, Apple/Google SSO.',
      endpoints: [
        { m: 'POST', path: '/register', role: 'PUBLIC', desc: 'Create passenger account (email + password).' },
        { m: 'POST', path: '/register/manager', role: 'PUBLIC', desc: 'Request airline manager account (pending admin approval).' },
        { m: 'POST', path: '/login', role: 'PUBLIC', desc: 'Exchange credentials for access + refresh JWT.' },
        { m: 'POST', path: '/login/apple', role: 'PUBLIC', desc: 'Sign in with Apple (iOS).' },
        { m: 'POST', path: '/login/google', role: 'PUBLIC', desc: 'OAuth2 Google sign-in.' },
        { m: 'POST', path: '/refresh', role: 'PUBLIC', desc: 'Refresh access token using refresh token.' },
        { m: 'POST', path: '/logout', role: 'PASSENGER', desc: 'Revoke refresh token, clear session.' },
        { m: 'POST', path: '/forgot-password', role: 'PUBLIC', desc: 'Send password reset email.' },
        { m: 'POST', path: '/reset-password', role: 'PUBLIC', desc: 'Consume reset token, set new password.' },
        { m: 'POST', path: '/verify-email', role: 'PUBLIC', desc: 'Confirm email via token sent on signup.' },
        { m: 'GET', path: '/me', role: 'PASSENGER', desc: 'Get current authenticated user profile.' },
        { m: 'PATCH', path: '/me', role: 'PASSENGER', desc: 'Update own profile (name, preferences).' },
        { m: 'POST', path: '/me/change-password', role: 'PASSENGER', desc: 'Change password (requires old password).' },
        { m: 'DELETE', path: '/me', role: 'PASSENGER', desc: 'Self-delete account (soft delete, 30-day grace).' },
      ],
    },
    flights: {
      name: 'Flights',
      prefix: '/api/v1/flights',
      desc: 'Core flight lookup, search, live status. Read-heavy, aggressively cached.',
      endpoints: [
        { m: 'GET', path: '/search', role: 'PASSENGER', desc: 'Search by flight number / route / date. Query params: ?flight_no, ?from, ?to, ?date.' },
        { m: 'GET', path: '/{flight_id}', role: 'PASSENGER', desc: 'Full flight detail — schedule, status, aircraft, gate.' },
        { m: 'GET', path: '/{flight_id}/status', role: 'PASSENGER', desc: 'Lightweight live status (for widgets & polling).' },
        { m: 'GET', path: '/{flight_id}/timeline', role: 'PASSENGER', desc: 'Event timeline: scheduled → boarding → pushback → takeoff → landed.' },
        { m: 'GET', path: '/{flight_id}/dependencies', role: 'MANAGER', desc: 'Upstream/downstream flights sharing aircraft or crew.' },
        { m: 'GET', path: '/airport/{iata}/departures', role: 'PASSENGER', desc: 'All departures from airport today.' },
        { m: 'GET', path: '/airport/{iata}/arrivals', role: 'PASSENGER', desc: 'All arrivals at airport today.' },
        { m: 'GET', path: '/route/{from}/{to}', role: 'PASSENGER', desc: 'All flights on a route with historical avg delay.' },
        { m: 'WS', path: '/ws/live/{flight_id}', role: 'PASSENGER', desc: 'WebSocket stream of live status updates.' },
      ],
    },
    predictions: {
      name: 'Predictions & ML',
      prefix: '/api/v1/predictions',
      desc: 'Delay probability, duration regression, explainability. This is the product core.',
      endpoints: [
        { m: 'GET', path: '/flight/{flight_id}', role: 'PASSENGER', desc: 'Get delay prediction — probability + predicted minutes + confidence interval.' },
        { m: 'POST', path: '/batch', role: 'MANAGER', desc: 'Predict for a list of flight IDs (max 500 per request).' },
        { m: 'GET', path: '/flight/{flight_id}/explain', role: 'MANAGER', desc: 'Full SHAP feature attributions — detailed for managers.' },
        { m: 'GET', path: '/flight/{flight_id}/explain/simple', role: 'PASSENGER', desc: 'Plain-English one-liner explanation for end users.' },
        { m: 'POST', path: '/whatif', role: 'MANAGER', desc: 'What-if simulator — override features (weather, depart time, aircraft) and re-predict.' },
        { m: 'GET', path: '/heatmap', role: 'MANAGER', desc: 'Delay heatmap data — airports with predicted severity. Filters: ?region, ?time_window, ?airline.' },
        { m: 'GET', path: '/trends', role: 'MANAGER', desc: 'Aggregated trends: route-level, hour-of-day, day-of-week delay patterns.' },
        { m: 'POST', path: '/feedback', role: 'MANAGER', desc: 'Flag a prediction as incorrect — feeds retraining pipeline.' },
        { m: 'GET', path: '/models', role: 'ADMIN', desc: 'List all deployed model versions with metrics.' },
        { m: 'POST', path: '/models/{id}/promote', role: 'ADMIN', desc: 'Promote a model from staging to production.' },
        { m: 'POST', path: '/models/retrain', role: 'ADMIN', desc: 'Trigger background retraining job via ARQ.' },
      ],
    },
    saved: {
      name: 'Saved Flights / Trips',
      prefix: '/api/v1/saved',
      desc: 'Personal flight watchlists — the passenger app home screen data source.',
      endpoints: [
        { m: 'GET', path: '/', role: 'PASSENGER', desc: 'List all flights the user is tracking.' },
        { m: 'POST', path: '/', role: 'PASSENGER', desc: 'Save a flight to watchlist. Body: { flight_id, notify }.' },
        { m: 'DELETE', path: '/{saved_id}', role: 'PASSENGER', desc: 'Remove a flight from watchlist.' },
        { m: 'PATCH', path: '/{saved_id}', role: 'PASSENGER', desc: 'Update preferences (rename, toggle notifications).' },
        { m: 'GET', path: '/upcoming', role: 'PASSENGER', desc: 'Only upcoming flights in next 48h, sorted chronologically.' },
      ],
    },
    notifications: {
      name: 'Notifications & Alerts',
      prefix: '/api/v1/notifications',
      desc: 'Push, email, in-app notifications. User preferences and alert rules.',
      endpoints: [
        { m: 'GET', path: '/', role: 'PASSENGER', desc: 'List in-app notifications (paginated).' },
        { m: 'PATCH', path: '/{id}/read', role: 'PASSENGER', desc: 'Mark notification as read.' },
        { m: 'POST', path: '/mark-all-read', role: 'PASSENGER', desc: 'Mark every notification as read.' },
        { m: 'GET', path: '/preferences', role: 'PASSENGER', desc: 'Get user notification settings.' },
        { m: 'PUT', path: '/preferences', role: 'PASSENGER', desc: 'Update channels (push / email) and quiet hours.' },
        { m: 'POST', path: '/device-token', role: 'PASSENGER', desc: 'Register APNs device token for push.' },
        { m: 'DELETE', path: '/device-token/{token}', role: 'PASSENGER', desc: 'Unregister a device.' },
        { m: 'GET', path: '/rules', role: 'MANAGER', desc: 'List custom alert rules for manager.' },
        { m: 'POST', path: '/rules', role: 'MANAGER', desc: 'Create alert rule (e.g., "notify if AA* delay > 70%").' },
        { m: 'DELETE', path: '/rules/{id}', role: 'MANAGER', desc: 'Delete alert rule.' },
      ],
    },
    ops: {
      name: 'Operations (Manager)',
      prefix: '/api/v1/ops',
      desc: 'Manager-exclusive analytics, dashboards, reporting.',
      endpoints: [
        { m: 'GET', path: '/dashboard', role: 'MANAGER', desc: 'Main KPI dashboard data — on-time %, avg delay, at-risk count.' },
        { m: 'GET', path: '/at-risk', role: 'MANAGER', desc: 'Top N flights with highest delay probability (today).' },
        { m: 'GET', path: '/analytics/routes', role: 'MANAGER', desc: 'Route-level aggregated performance.' },
        { m: 'GET', path: '/analytics/airports', role: 'MANAGER', desc: 'Airport-level congestion analytics.' },
        { m: 'GET', path: '/analytics/export', role: 'MANAGER', desc: 'Export filtered dataset as CSV or PDF report.' },
        { m: 'GET', path: '/watchlist', role: 'MANAGER', desc: 'Manager personal flight watchlist (separate from passenger saved).' },
        { m: 'POST', path: '/watchlist', role: 'MANAGER', desc: 'Add flight to manager watchlist.' },
      ],
    },
    collab: {
      name: 'Team Collaboration',
      prefix: '/api/v1/collab',
      desc: 'Manager-to-manager comms: threaded notes on flights, shift handoffs.',
      endpoints: [
        { m: 'GET', path: '/threads', role: 'MANAGER', desc: 'List discussion threads on flights manager follows.' },
        { m: 'POST', path: '/threads', role: 'MANAGER', desc: 'Start thread on a flight.' },
        { m: 'GET', path: '/threads/{id}/messages', role: 'MANAGER', desc: 'Fetch messages in a thread.' },
        { m: 'POST', path: '/threads/{id}/messages', role: 'MANAGER', desc: 'Post message in thread.' },
        { m: 'POST', path: '/handoff', role: 'MANAGER', desc: 'Create shift handoff note with attached flights/scenarios.' },
        { m: 'GET', path: '/handoff/latest', role: 'MANAGER', desc: 'Fetch most recent handoff for incoming shift.' },
        { m: 'WS', path: '/ws/thread/{id}', role: 'MANAGER', desc: 'Live updates in a thread (Redis pub/sub).' },
      ],
    },
    assistant: {
      name: 'AI Assistant',
      prefix: '/api/v1/assistant',
      desc: 'Natural-language Q&A over flight/prediction data. LLM with tool-calling to internal APIs.',
      endpoints: [
        { m: 'POST', path: '/query', role: 'MANAGER', desc: 'Submit natural-language question, receive structured answer.' },
        { m: 'GET', path: '/sessions', role: 'MANAGER', desc: 'List conversation history.' },
        { m: 'GET', path: '/sessions/{id}', role: 'MANAGER', desc: 'Fetch full conversation.' },
        { m: 'DELETE', path: '/sessions/{id}', role: 'MANAGER', desc: 'Delete a conversation.' },
        { m: 'POST', path: '/query/passenger', role: 'PASSENGER', desc: 'Simplified assistant for passengers (strict scope).' },
      ],
    },
    reference: {
      name: 'Reference Data',
      prefix: '/api/v1/ref',
      desc: 'Public read-only lookups — airports, airlines, aircraft types. Backed by OpenFlights.',
      endpoints: [
        { m: 'GET', path: '/airports', role: 'PUBLIC', desc: 'Paginated list of airports. Filters: ?country, ?search.' },
        { m: 'GET', path: '/airports/{iata}', role: 'PUBLIC', desc: 'Airport detail with coordinates, timezone.' },
        { m: 'GET', path: '/airlines', role: 'PUBLIC', desc: 'List airlines.' },
        { m: 'GET', path: '/airlines/{iata}', role: 'PUBLIC', desc: 'Airline detail.' },
        { m: 'GET', path: '/aircraft-types', role: 'PUBLIC', desc: 'ICAO aircraft types reference.' },
      ],
    },
    admin: {
      name: 'Admin (SQLAdmin)',
      prefix: '/admin',
      desc: 'Auto-generated admin UI + custom endpoints for platform operators. MFA required, separate subdomain.',
      endpoints: [
        { m: 'GET', path: '/admin/', role: 'ADMIN', desc: 'SQLAdmin dashboard home.' },
        { m: 'GET', path: '/admin/users', role: 'ADMIN', desc: 'User CRUD (passengers + managers).' },
        { m: 'POST', path: '/admin/users/{id}/approve-manager', role: 'ADMIN', desc: 'Approve pending manager signup.' },
        { m: 'POST', path: '/admin/users/{id}/suspend', role: 'ADMIN', desc: 'Suspend user account.' },
        { m: 'POST', path: '/admin/users/{id}/impersonate', role: 'ADMIN', desc: 'Generate short-lived impersonation token for support.' },
        { m: 'GET', path: '/admin/flights', role: 'ADMIN', desc: 'Flight data management UI.' },
        { m: 'GET', path: '/admin/models', role: 'ADMIN', desc: 'ML model registry UI.' },
        { m: 'GET', path: '/admin/audit-log', role: 'ADMIN', desc: 'Immutable audit log of admin actions.' },
        { m: 'GET', path: '/admin/system/health', role: 'ADMIN', desc: 'System health — API, DB, Redis, external APIs.' },
        { m: 'POST', path: '/admin/system/cache/flush', role: 'ADMIN', desc: 'Flush Redis cache by pattern.' },
        { m: 'POST', path: '/admin/etl/run', role: 'ADMIN', desc: 'Manually trigger ETL pipeline.' },
        { m: 'GET', path: '/admin/feature-flags', role: 'ADMIN', desc: 'Feature flag management.' },
      ],
    },
    system: {
      name: 'System / Health',
      prefix: '/',
      desc: 'Infrastructure endpoints — health checks, metrics, OpenAPI docs.',
      endpoints: [
        { m: 'GET', path: '/health', role: 'PUBLIC', desc: 'Liveness probe for load balancer.' },
        { m: 'GET', path: '/health/ready', role: 'PUBLIC', desc: 'Readiness probe — checks DB & Redis connectivity.' },
        { m: 'GET', path: '/metrics', role: 'ADMIN', desc: 'Prometheus metrics endpoint.' },
        { m: 'GET', path: '/docs', role: 'PUBLIC', desc: 'Swagger UI (disabled in production).' },
        { m: 'GET', path: '/redoc', role: 'PUBLIC', desc: 'ReDoc documentation.' },
        { m: 'GET', path: '/openapi.json', role: 'PUBLIC', desc: 'OpenAPI 3.1 schema.' },
      ],
    },
  };

  // ========== ERD TABLES ==========
  const erdTables = [
    {
      name: 'users', x: 40, y: 40, color: '#22d3ee',
      fields: [
        ['id', 'UUID PK'],
        ['email', 'VARCHAR UNIQUE'],
        ['password_hash', 'VARCHAR'],
        ['role', 'ENUM'],
        ['full_name', 'VARCHAR'],
        ['is_verified', 'BOOL'],
        ['is_active', 'BOOL'],
        ['airline_id', 'UUID FK?'],
        ['apple_sub', 'VARCHAR?'],
        ['google_sub', 'VARCHAR?'],
        ['created_at', 'TIMESTAMP'],
        ['deleted_at', 'TIMESTAMP?'],
      ],
    },
    {
      name: 'refresh_tokens', x: 340, y: 40, color: '#22d3ee',
      fields: [
        ['id', 'UUID PK'],
        ['user_id', 'UUID FK'],
        ['token_hash', 'VARCHAR'],
        ['expires_at', 'TIMESTAMP'],
        ['revoked', 'BOOL'],
      ],
    },
    {
      name: 'device_tokens', x: 600, y: 40, color: '#22d3ee',
      fields: [
        ['id', 'UUID PK'],
        ['user_id', 'UUID FK'],
        ['platform', 'ENUM'],
        ['token', 'VARCHAR'],
        ['last_seen', 'TIMESTAMP'],
      ],
    },
    {
      name: 'airports', x: 40, y: 330, color: '#fbbf24',
      fields: [
        ['id', 'UUID PK'],
        ['iata', 'CHAR(3) UNIQUE'],
        ['icao', 'CHAR(4)'],
        ['name', 'VARCHAR'],
        ['city', 'VARCHAR'],
        ['country', 'VARCHAR'],
        ['latitude', 'DECIMAL'],
        ['longitude', 'DECIMAL'],
        ['timezone', 'VARCHAR'],
        ['elevation_ft', 'INT'],
      ],
    },
    {
      name: 'airlines', x: 340, y: 330, color: '#fbbf24',
      fields: [
        ['id', 'UUID PK'],
        ['iata', 'CHAR(2) UNIQUE'],
        ['icao', 'CHAR(3)'],
        ['name', 'VARCHAR'],
        ['country', 'VARCHAR'],
        ['logo_url', 'VARCHAR'],
      ],
    },
    {
      name: 'aircraft', x: 600, y: 330, color: '#fbbf24',
      fields: [
        ['id', 'UUID PK'],
        ['icao_type', 'VARCHAR'],
        ['registration', 'VARCHAR'],
        ['model', 'VARCHAR'],
        ['capacity', 'INT'],
      ],
    },
    {
      name: 'routes', x: 860, y: 330, color: '#fbbf24',
      fields: [
        ['id', 'UUID PK'],
        ['origin_id', 'UUID FK'],
        ['dest_id', 'UUID FK'],
        ['distance_km', 'INT'],
        ['avg_duration_min', 'INT'],
      ],
    },
    {
      name: 'flights', x: 40, y: 640, color: '#4ade80',
      fields: [
        ['id', 'UUID PK'],
        ['flight_number', 'VARCHAR'],
        ['airline_id', 'UUID FK'],
        ['origin_id', 'UUID FK'],
        ['dest_id', 'UUID FK'],
        ['aircraft_id', 'UUID FK?'],
        ['scheduled_dep', 'TIMESTAMP'],
        ['scheduled_arr', 'TIMESTAMP'],
        ['actual_dep', 'TIMESTAMP?'],
        ['actual_arr', 'TIMESTAMP?'],
        ['status', 'ENUM'],
        ['gate', 'VARCHAR?'],
        ['terminal', 'VARCHAR?'],
        ['data_source', 'VARCHAR'],
        ['ingested_at', 'TIMESTAMP'],
      ],
    },
    {
      name: 'flight_events', x: 340, y: 640, color: '#4ade80',
      fields: [
        ['id', 'UUID PK'],
        ['flight_id', 'UUID FK'],
        ['event_type', 'ENUM'],
        ['occurred_at', 'TIMESTAMP'],
        ['metadata', 'JSONB'],
      ],
    },
    {
      name: 'weather_snapshots', x: 600, y: 640, color: '#4ade80',
      fields: [
        ['id', 'UUID PK'],
        ['airport_id', 'UUID FK'],
        ['observed_at', 'TIMESTAMP'],
        ['temperature_c', 'DECIMAL'],
        ['wind_speed', 'DECIMAL'],
        ['wind_dir', 'INT'],
        ['visibility_m', 'INT'],
        ['precipitation_mm', 'DECIMAL'],
        ['conditions', 'VARCHAR'],
        ['source', 'VARCHAR'],
      ],
    },
    {
      name: 'predictions', x: 40, y: 1000, color: '#c084fc',
      fields: [
        ['id', 'UUID PK'],
        ['flight_id', 'UUID FK'],
        ['model_id', 'UUID FK'],
        ['delay_probability', 'DECIMAL'],
        ['predicted_delay_min', 'INT'],
        ['confidence_lower', 'INT'],
        ['confidence_upper', 'INT'],
        ['features_snapshot', 'JSONB'],
        ['created_at', 'TIMESTAMP'],
      ],
    },
    {
      name: 'explanations', x: 340, y: 1000, color: '#c084fc',
      fields: [
        ['id', 'UUID PK'],
        ['prediction_id', 'UUID FK'],
        ['method', 'ENUM'],
        ['shap_values', 'JSONB'],
        ['top_factors', 'JSONB'],
        ['plain_text', 'TEXT'],
      ],
    },
    {
      name: 'ml_models', x: 600, y: 1000, color: '#c084fc',
      fields: [
        ['id', 'UUID PK'],
        ['name', 'VARCHAR'],
        ['version', 'VARCHAR'],
        ['algorithm', 'ENUM'],
        ['metrics', 'JSONB'],
        ['artifact_path', 'VARCHAR'],
        ['status', 'ENUM'],
        ['trained_at', 'TIMESTAMP'],
        ['promoted_at', 'TIMESTAMP?'],
      ],
    },
    {
      name: 'whatif_scenarios', x: 860, y: 1000, color: '#c084fc',
      fields: [
        ['id', 'UUID PK'],
        ['user_id', 'UUID FK'],
        ['flight_id', 'UUID FK'],
        ['overrides', 'JSONB'],
        ['result', 'JSONB'],
        ['created_at', 'TIMESTAMP'],
      ],
    },
    {
      name: 'saved_flights', x: 40, y: 1330, color: '#fb7185',
      fields: [
        ['id', 'UUID PK'],
        ['user_id', 'UUID FK'],
        ['flight_id', 'UUID FK'],
        ['nickname', 'VARCHAR?'],
        ['notify_enabled', 'BOOL'],
        ['created_at', 'TIMESTAMP'],
      ],
    },
    {
      name: 'alert_rules', x: 340, y: 1330, color: '#fb7185',
      fields: [
        ['id', 'UUID PK'],
        ['user_id', 'UUID FK'],
        ['name', 'VARCHAR'],
        ['conditions', 'JSONB'],
        ['channels', 'VARCHAR[]'],
        ['is_active', 'BOOL'],
      ],
    },
    {
      name: 'notifications', x: 600, y: 1330, color: '#fb7185',
      fields: [
        ['id', 'UUID PK'],
        ['user_id', 'UUID FK'],
        ['flight_id', 'UUID FK?'],
        ['type', 'ENUM'],
        ['title', 'VARCHAR'],
        ['body', 'TEXT'],
        ['is_read', 'BOOL'],
        ['sent_at', 'TIMESTAMP'],
      ],
    },
    {
      name: 'notification_prefs', x: 860, y: 1330, color: '#fb7185',
      fields: [
        ['id', 'UUID PK'],
        ['user_id', 'UUID FK'],
        ['push_enabled', 'BOOL'],
        ['email_enabled', 'BOOL'],
        ['quiet_hours_start', 'TIME'],
        ['quiet_hours_end', 'TIME'],
      ],
    },
    {
      name: 'collab_threads', x: 40, y: 1640, color: '#38bdf8',
      fields: [
        ['id', 'UUID PK'],
        ['flight_id', 'UUID FK'],
        ['created_by', 'UUID FK'],
        ['title', 'VARCHAR'],
        ['created_at', 'TIMESTAMP'],
      ],
    },
    {
      name: 'collab_messages', x: 340, y: 1640, color: '#38bdf8',
      fields: [
        ['id', 'UUID PK'],
        ['thread_id', 'UUID FK'],
        ['user_id', 'UUID FK'],
        ['body', 'TEXT'],
        ['created_at', 'TIMESTAMP'],
      ],
    },
    {
      name: 'handoffs', x: 600, y: 1640, color: '#38bdf8',
      fields: [
        ['id', 'UUID PK'],
        ['from_user', 'UUID FK'],
        ['airline_id', 'UUID FK'],
        ['notes', 'TEXT'],
        ['attached_flights', 'JSONB'],
        ['created_at', 'TIMESTAMP'],
      ],
    },
    {
      name: 'assistant_sessions', x: 860, y: 1640, color: '#38bdf8',
      fields: [
        ['id', 'UUID PK'],
        ['user_id', 'UUID FK'],
        ['started_at', 'TIMESTAMP'],
        ['last_message_at', 'TIMESTAMP'],
      ],
    },
    {
      name: 'assistant_messages', x: 40, y: 1900, color: '#38bdf8',
      fields: [
        ['id', 'UUID PK'],
        ['session_id', 'UUID FK'],
        ['role', 'ENUM'],
        ['content', 'TEXT'],
        ['tool_calls', 'JSONB?'],
        ['created_at', 'TIMESTAMP'],
      ],
    },
    {
      name: 'audit_log', x: 340, y: 1900, color: '#f87171',
      fields: [
        ['id', 'UUID PK'],
        ['actor_id', 'UUID FK'],
        ['action', 'VARCHAR'],
        ['entity_type', 'VARCHAR'],
        ['entity_id', 'UUID'],
        ['before', 'JSONB'],
        ['after', 'JSONB'],
        ['ip_address', 'INET'],
        ['created_at', 'TIMESTAMP'],
      ],
    },
    {
      name: 'feature_flags', x: 600, y: 1900, color: '#f87171',
      fields: [
        ['id', 'UUID PK'],
        ['key', 'VARCHAR UNIQUE'],
        ['enabled', 'BOOL'],
        ['rollout_pct', 'INT'],
        ['description', 'TEXT'],
      ],
    },
    {
      name: 'feedback', x: 860, y: 1900, color: '#f87171',
      fields: [
        ['id', 'UUID PK'],
        ['user_id', 'UUID FK'],
        ['prediction_id', 'UUID FK'],
        ['was_correct', 'BOOL'],
        ['actual_delay', 'INT?'],
        ['comments', 'TEXT?'],
      ],
    },
  ];

  const erdRelations = [
    // users hub
    ['users', 'refresh_tokens', 'right'],
    ['users', 'device_tokens', 'right'],
    ['users', 'saved_flights', 'down'],
    ['users', 'notifications', 'down'],
    ['users', 'notification_prefs', 'down'],
    ['users', 'alert_rules', 'down'],
    ['users', 'collab_messages', 'down'],
    ['users', 'assistant_sessions', 'down'],
    ['users', 'audit_log', 'down'],
    ['users', 'feedback', 'down'],
    ['users', 'whatif_scenarios', 'down'],
    // airlines / airports / routes
    ['airports', 'routes', 'right'],
    ['airlines', 'flights', 'down'],
    ['airports', 'flights', 'down'],
    ['airports', 'weather_snapshots', 'right'],
    ['aircraft', 'flights', 'down'],
    // flights hub
    ['flights', 'flight_events', 'right'],
    ['flights', 'predictions', 'down'],
    ['flights', 'saved_flights', 'down'],
    ['flights', 'collab_threads', 'down'],
    // predictions
    ['predictions', 'explanations', 'right'],
    ['ml_models', 'predictions', 'up'],
    ['predictions', 'feedback', 'down'],
    // collab
    ['collab_threads', 'collab_messages', 'right'],
    ['assistant_sessions', 'assistant_messages', 'down'],
  ];

  // helper to compute anchor points for simple relation lines
  const tableW = 240;
  const getAnchor = (tName, side) => {
    const t = erdTables.find((x) => x.name === tName);
    if (!t) return null;
    const rowH = 18;
    const headerH = 36;
    const h = headerH + t.fields.length * rowH + 8;
    if (side === 'right') return { x: t.x + tableW, y: t.y + h / 2 };
    if (side === 'left') return { x: t.x, y: t.y + h / 2 };
    if (side === 'bottom') return { x: t.x + tableW / 2, y: t.y + h };
    if (side === 'top') return { x: t.x + tableW / 2, y: t.y };
    return { x: t.x, y: t.y };
  };

  const makePath = (from, to, direction) => {
    let a, b;
    if (direction === 'right') {
      a = getAnchor(from, 'right');
      b = getAnchor(to, 'left');
    } else if (direction === 'down') {
      a = getAnchor(from, 'bottom');
      b = getAnchor(to, 'top');
    } else if (direction === 'up') {
      a = getAnchor(from, 'top');
      b = getAnchor(to, 'bottom');
    } else {
      a = getAnchor(from, 'right');
      b = getAnchor(to, 'left');
    }
    if (!a || !b) return null;
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    return `M ${a.x} ${a.y} Q ${midX} ${a.y}, ${midX} ${midY} T ${b.x} ${b.y}`;
  };

  const erdHeight = 2100;
  const erdWidth = 1120;

  // ========== RENDER ==========
  const currentModule = modules[activeModule];

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,400&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        body { margin: 0; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={styles.gridBg} />

      <div style={styles.container}>
        {/* ========== HEADER ========== */}
        <header style={styles.header}>
          <div style={styles.docTag}>
            <span style={styles.pulse}></span>
            BACKEND ARCHITECTURE · TECHNICAL SPECIFICATION
          </div>
          <h1 style={styles.title}>
            Skylytics <span style={styles.titleAccent}>/ backend</span>
          </h1>
          <p style={styles.subtitle}>
            Complete backend blueprint for the flight delay prediction platform. FastAPI modular
            monolith with layered architecture, PostgreSQL + Redis, hybrid ML pipeline, and REST + WebSocket
            APIs serving both the iOS passenger app and the web operations dashboard.
          </p>
          <div style={styles.metaRow}>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>DOCUMENT</span>
              <span style={styles.metaValue}>fyp_backend.spec</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>VERSION</span>
              <span style={styles.metaValue}>v1.0</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>ARCHITECTURE</span>
              <span style={styles.metaValue}>Modular Monolith · Layered</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>MODULES</span>
              <span style={styles.metaValue}>{Object.keys(modules).length}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>DB TABLES</span>
              <span style={styles.metaValue}>{erdTables.length}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>ENDPOINTS</span>
              <span style={styles.metaValue}>
                {Object.values(modules).reduce((s, m) => s + m.endpoints.length, 0)}+
              </span>
            </div>
          </div>
        </header>

        {/* ========== SECTION 1: ARCHITECTURE OVERVIEW ========== */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionNum}>§ 01</span>
            <h2 style={styles.sectionTitle}>System Architecture</h2>
          </div>
          <p style={styles.sectionDesc}>
            Single FastAPI application internally divided into business modules. Each module owns its
            routers, services, and repositories. Layers are strictly enforced: routers never touch the
            database directly. ML and ETL run as background workers against the same codebase.
          </p>

          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>▸</span> Layer Breakdown
            </div>
            <pre style={styles.codeBlock}>{`┌─────────────────────────────────────────────────────────────┐
│  CLIENTS                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  iOS App    │  │  Web (Pax)  │  │  Web (Ops)  │         │
│  │  SwiftUI    │  │  Next.js 16 │  │  Next.js 16 │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │   HTTPS/JSON   │  WebSocket     │
          └────────────────┼────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  EDGE                                                        │
│  · AWS CloudFront (CDN)                                      │
│  · AWS ALB  (TLS termination, rate limit)                    │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION · FastAPI 0.135.3 (Uvicorn + uvloop)            │
│                                                              │
│  ┌────────────────── PRESENTATION LAYER ──────────────────┐ │
│  │  Routers · Pydantic schemas · OpenAPI docs · Auth deps │ │
│  └─────────────────────────┬──────────────────────────────┘ │
│                            ▼                                 │
│  ┌──────────────────── SERVICE LAYER ─────────────────────┐ │
│  │  Business logic · Orchestration · ML inference calls   │ │
│  │  What-If engine · Alert engine · Cache-aside reads     │ │
│  └─────────────────────────┬──────────────────────────────┘ │
│                            ▼                                 │
│  ┌────────────────── REPOSITORY LAYER ────────────────────┐ │
│  │  SQLAlchemy 2.0 async · Transactions · Query builders  │ │
│  └─────────────────────────┬──────────────────────────────┘ │
│                            ▼                                 │
│  ┌──────────────────── DATA LAYER ────────────────────────┐ │
│  │  PostgreSQL 17 (primary)  ·  Redis 7.4 (cache + pubsub)│ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
          │                                     ▲
          ▼                                     │
┌──────────────────────────┐        ┌──────────────────────────┐
│  WORKERS · ARQ + Redis   │        │  ML SUBSYSTEM            │
│  · ETL ingestion         │◀──────▶│  · XGBoost / LightGBM    │
│  · Model retraining      │        │  · LSTM / Transformer    │
│  · Notification dispatch │        │  · SHAP / LIME           │
│  · Alert evaluation      │        │  · MLflow registry       │
└──────────────────────────┘        └──────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL · Meteostat · OpenSky · OpenFlights · APNs · SES  │
└─────────────────────────────────────────────────────────────┘`}</pre>
          </div>

          <div style={styles.twoCol}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                <span>▸</span> Design Principles
              </div>
              <ul style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.8, paddingLeft: '18px', margin: 0 }}>
                <li><strong style={{ color: '#38bdf8' }}>API-first:</strong> every feature goes through REST. No frontend-specific backdoors.</li>
                <li><strong style={{ color: '#38bdf8' }}>Strict layering:</strong> router → service → repo → DB. Never skip.</li>
                <li><strong style={{ color: '#38bdf8' }}>Async everywhere:</strong> asyncpg, httpx, ARQ — no blocking I/O in request path.</li>
                <li><strong style={{ color: '#38bdf8' }}>Cache-aside:</strong> read-through Redis for flight/prediction data with short TTLs.</li>
                <li><strong style={{ color: '#38bdf8' }}>Idempotency:</strong> mutating endpoints accept Idempotency-Key header.</li>
                <li><strong style={{ color: '#38bdf8' }}>Graceful degradation:</strong> if live APIs fail, fall back to cached/historical data.</li>
              </ul>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                <span>▸</span> Cross-Cutting Concerns
              </div>
              <ul style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.8, paddingLeft: '18px', margin: 0 }}>
                <li><strong style={{ color: '#38bdf8' }}>Auth:</strong> JWT access (15min) + refresh token (30d) rotation.</li>
                <li><strong style={{ color: '#38bdf8' }}>RBAC:</strong> role claim enforced via FastAPI dependency on every route.</li>
                <li><strong style={{ color: '#38bdf8' }}>Rate limiting:</strong> Redis token-bucket, per-user and per-IP.</li>
                <li><strong style={{ color: '#38bdf8' }}>Observability:</strong> structlog JSON logs + Prometheus metrics + OpenTelemetry traces.</li>
                <li><strong style={{ color: '#38bdf8' }}>Error handling:</strong> RFC 7807 Problem Details responses.</li>
                <li><strong style={{ color: '#38bdf8' }}>CORS:</strong> whitelist passenger web + ops web origins only.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ========== SECTION 2: TECH STACK ========== */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionNum}>§ 02</span>
            <h2 style={styles.sectionTitle}>Technology Stack</h2>
          </div>
          <p style={styles.sectionDesc}>
            All versions pinned as of April 2026. Exact versions locked in{' '}
            <code style={{ color: '#22d3ee' }}>pyproject.toml</code> + <code style={{ color: '#22d3ee' }}>poetry.lock</code>.
          </p>

          <div style={{ ...styles.cardTitle, marginBottom: '12px' }}>
            <span>▸</span> Core Backend & Infrastructure
          </div>
          <div style={styles.stackGrid}>
            {techStack.map((t) => (
              <div key={t.name} style={styles.stackItem}>
                <div style={styles.stackName}>{t.name}</div>
                <div style={styles.stackVer}>v{t.ver}</div>
                <div style={styles.stackDesc}>{t.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ ...styles.cardTitle, marginTop: '32px', marginBottom: '12px' }}>
            <span>▸</span> Machine Learning & Data
          </div>
          <div style={styles.stackGrid}>
            {mlStack.map((t) => (
              <div key={t.name} style={styles.stackItem}>
                <div style={styles.stackName}>{t.name}</div>
                <div style={styles.stackVer}>v{t.ver}</div>
                <div style={styles.stackDesc}>{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ========== SECTION 3: MODULES & ENDPOINTS ========== */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionNum}>§ 03</span>
            <h2 style={styles.sectionTitle}>API Modules & Endpoints</h2>
          </div>
          <p style={styles.sectionDesc}>
            {Object.values(modules).reduce((s, m) => s + m.endpoints.length, 0)} endpoints across{' '}
            {Object.keys(modules).length} modules. Each module is a self-contained folder with its own
            router, service, and repository. Click a module to explore.
          </p>

          <div style={styles.moduleTabs}>
            {Object.entries(modules).map(([key, mod]) => (
              <button key={key} style={styles.tab(activeModule === key)} onClick={() => setActiveModule(key)}>
                {mod.name}
              </button>
            ))}
          </div>

          <div style={styles.card}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ ...styles.cardTitle, marginBottom: '6px' }}>
                <span>▸</span> {currentModule.name}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  color: '#22d3ee',
                  marginBottom: '8px',
                }}
              >
                prefix: {currentModule.prefix}
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>{currentModule.desc}</div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={styles.endpointTable}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: '80px' }}>METHOD</th>
                    <th style={{ ...styles.th, width: '320px' }}>PATH</th>
                    <th style={{ ...styles.th, width: '110px' }}>ACCESS</th>
                    <th style={styles.th}>DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {currentModule.endpoints.map((e, i) => (
                    <tr key={i}>
                      <td style={styles.td}>
                        <span style={styles.method(e.m)}>{e.m}</span>
                      </td>
                      <td style={{ ...styles.td, color: '#f1f5fd' }}>
                        {currentModule.prefix.startsWith('/admin') || currentModule.prefix === '/' ? e.path : currentModule.prefix + e.path}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.role(e.role)}>{e.role}</span>
                      </td>
                      <td style={{ ...styles.td, fontFamily: "'IBM Plex Sans', sans-serif", color: '#94a3b8' }}>
                        {e.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========== SECTION 4: EXTERNAL APIS ========== */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionNum}>§ 04</span>
            <h2 style={styles.sectionTitle}>External APIs & Data Sources</h2>
          </div>
          <p style={styles.sectionDesc}>
            All external dependencies wrapped in adapter classes under{' '}
            <code style={{ color: '#22d3ee' }}>app/integrations/</code>. Each has retry logic (tenacity), circuit
            breakers, and Redis-backed response caching.
          </p>

          {externalAPIs.map((api) => (
            <div key={api.name} style={styles.card}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <div style={{ ...styles.cardTitle, marginBottom: '4px' }}>
                    <span>▸</span> {api.name}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#64748b' }}>
                    {api.url}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '1px',
                    background:
                      api.criticality === 'HIGH'
                        ? 'rgba(239, 68, 68, 0.12)'
                        : api.criticality === 'MEDIUM'
                        ? 'rgba(251, 191, 36, 0.12)'
                        : 'rgba(34, 197, 94, 0.12)',
                    color:
                      api.criticality === 'HIGH'
                        ? '#f87171'
                        : api.criticality === 'MEDIUM'
                        ? '#fbbf24'
                        : '#4ade80',
                    borderRadius: '2px',
                  }}
                >
                  {api.criticality}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 20px', fontSize: '12px' }}>
                <div style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>
                  Purpose
                </div>
                <div style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{api.purpose}</div>
                <div style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>
                  Auth
                </div>
                <div style={{ color: '#cbd5e1' }}>{api.auth}</div>
                <div style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>
                  Usage
                </div>
                <div style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{api.usage}</div>
              </div>
            </div>
          ))}
        </section>

        {/* ========== SECTION 5: DATABASE ERD ========== */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionNum}>§ 05</span>
            <h2 style={styles.sectionTitle}>Database Schema / ERD</h2>
          </div>
          <p style={styles.sectionDesc}>
            PostgreSQL 17 schema · {erdTables.length} tables · UUID primary keys · soft deletes on user
            data · JSONB for flexible payloads (features, SHAP values, tool calls). Grouped by color:{' '}
            <span style={{ color: '#22d3ee' }}>auth</span>,{' '}
            <span style={{ color: '#fbbf24' }}>reference</span>,{' '}
            <span style={{ color: '#4ade80' }}>flights</span>,{' '}
            <span style={{ color: '#c084fc' }}>ML</span>,{' '}
            <span style={{ color: '#fb7185' }}>user data</span>,{' '}
            <span style={{ color: '#38bdf8' }}>collab</span>,{' '}
            <span style={{ color: '#f87171' }}>admin</span>.
          </p>

          <div style={styles.erdCanvas}>
            <svg width={erdWidth} height={erdHeight} style={{ minWidth: erdWidth }}>
              <defs>
                <marker
                  id="arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,8 L8,4 z" fill="#38bdf8" opacity="0.6" />
                </marker>
                <pattern id="erdGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56,189,248,0.05)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width={erdWidth} height={erdHeight} fill="url(#erdGrid)" />

              {/* relation lines first (behind tables) */}
              {erdRelations.map(([from, to, dir], i) => {
                const d = makePath(from, to, dir);
                if (!d) return null;
                return (
                  <path
                    key={i}
                    d={d}
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    fill="none"
                    opacity="0.35"
                    markerEnd="url(#arrow)"
                    strokeDasharray="4 3"
                  />
                );
              })}

              {/* tables */}
              {erdTables.map((t) => {
                const rowH = 18;
                const headerH = 36;
                const h = headerH + t.fields.length * rowH + 8;
                return (
                  <g key={t.name}>
                    <rect
                      x={t.x}
                      y={t.y}
                      width={tableW}
                      height={h}
                      rx="2"
                      fill="rgba(2,6,23,0.95)"
                      stroke={t.color}
                      strokeWidth="1.5"
                      opacity="0.95"
                    />
                    <rect x={t.x} y={t.y} width={tableW} height={headerH} rx="2" fill={t.color} opacity="0.15" />
                    <text
                      x={t.x + 12}
                      y={t.y + 22}
                      fill={t.color}
                      fontFamily="'JetBrains Mono', monospace"
                      fontSize="13"
                      fontWeight="700"
                    >
                      ▸ {t.name}
                    </text>
                    <line x1={t.x} y1={t.y + headerH} x2={t.x + tableW} y2={t.y + headerH} stroke={t.color} opacity="0.3" />
                    {t.fields.map(([name, type], i) => (
                      <g key={i}>
                        <text
                          x={t.x + 12}
                          y={t.y + headerH + 14 + i * rowH}
                          fill="#cbd5e1"
                          fontFamily="'JetBrains Mono', monospace"
                          fontSize="10"
                        >
                          {name}
                        </text>
                        <text
                          x={t.x + tableW - 12}
                          y={t.y + headerH + 14 + i * rowH}
                          fill="#64748b"
                          fontFamily="'JetBrains Mono', monospace"
                          fontSize="9"
                          textAnchor="end"
                        >
                          {type}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>

          <div style={{ ...styles.card, marginTop: '16px' }}>
            <div style={styles.cardTitle}>
              <span>▸</span> Key Schema Decisions
            </div>
            <ul style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.8, paddingLeft: '18px', margin: 0 }}>
              <li>
                <strong style={{ color: '#38bdf8' }}>UUIDv7 primary keys</strong> — time-sortable, avoids
                hot-spot issues, safe to expose in URLs.
              </li>
              <li>
                <strong style={{ color: '#38bdf8' }}>JSONB for ML payloads</strong> —{' '}
                <code style={{ color: '#22d3ee' }}>features_snapshot</code>,{' '}
                <code style={{ color: '#22d3ee' }}>shap_values</code>,{' '}
                <code style={{ color: '#22d3ee' }}>overrides</code> — keeps schema stable as model features evolve.
              </li>
              <li>
                <strong style={{ color: '#38bdf8' }}>Soft deletes</strong> on{' '}
                <code style={{ color: '#22d3ee' }}>users</code> via{' '}
                <code style={{ color: '#22d3ee' }}>deleted_at</code> — 30-day grace before hard purge.
              </li>
              <li>
                <strong style={{ color: '#38bdf8' }}>Partitioning:</strong>{' '}
                <code style={{ color: '#22d3ee' }}>flights</code>,{' '}
                <code style={{ color: '#22d3ee' }}>predictions</code>,{' '}
                <code style={{ color: '#22d3ee' }}>weather_snapshots</code> partitioned by month for
                efficient archival.
              </li>
              <li>
                <strong style={{ color: '#38bdf8' }}>Indexes:</strong> composite on{' '}
                <code style={{ color: '#22d3ee' }}>(flight_number, scheduled_dep)</code>, GIN index on
                JSONB columns, BRIN on time-series tables.
              </li>
              <li>
                <strong style={{ color: '#38bdf8' }}>Audit log</strong> is append-only; no updates or deletes
                allowed — enforced via Postgres trigger.
              </li>
              <li>
                <strong style={{ color: '#38bdf8' }}>Migrations:</strong> every schema change ships as an
                Alembic migration with both upgrade and downgrade paths.
              </li>
            </ul>
          </div>
        </section>

        {/* ========== SECTION 6: PROJECT STRUCTURE ========== */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionNum}>§ 06</span>
            <h2 style={styles.sectionTitle}>Project File Structure</h2>
          </div>
          <p style={styles.sectionDesc}>
            Modular monolith layout. Each business module is a self-contained folder. Shared plumbing
            lives in <code style={{ color: '#22d3ee' }}>app/core/</code>.
          </p>

          <div style={styles.card}>
            <pre style={styles.codeBlock}>{`skylytics-backend/
├── app/
│   ├── main.py                     # FastAPI entry · app factory · lifespan
│   ├── config.py                   # pydantic-settings · env vars
│   │
│   ├── core/                       # cross-cutting plumbing
│   │   ├── database.py             # async engine, session, Base
│   │   ├── redis.py                # redis client factory
│   │   ├── security.py             # JWT, password hashing
│   │   ├── dependencies.py         # auth deps: get_current_user, require_role
│   │   ├── exceptions.py           # custom exceptions + handlers
│   │   ├── middleware.py           # logging, request ID, CORS
│   │   ├── rate_limit.py           # Redis token bucket
│   │   └── logging.py              # structlog config
│   │
│   ├── modules/                    # one folder per business module
│   │   ├── auth/
│   │   │   ├── router.py           # /api/v1/auth/*
│   │   │   ├── schemas.py          # Pydantic DTOs
│   │   │   ├── models.py           # SQLAlchemy ORM
│   │   │   ├── service.py          # business logic
│   │   │   ├── repository.py       # DB queries
│   │   │   └── dependencies.py     # module-specific deps
│   │   ├── users/
│   │   ├── flights/
│   │   ├── predictions/
│   │   ├── saved/
│   │   ├── notifications/
│   │   ├── ops/
│   │   ├── collab/
│   │   ├── assistant/
│   │   ├── reference/
│   │   └── admin/
│   │
│   ├── ml/                         # ML subsystem (pipes & filters)
│   │   ├── pipeline/
│   │   │   ├── ingest.py           # raw data loaders
│   │   │   ├── clean.py            # null handling, dedup
│   │   │   ├── features.py         # feature engineering
│   │   │   ├── encode.py           # cyclical, categorical
│   │   │   ├── balance.py          # SMOTE
│   │   │   └── split.py            # train/val/test
│   │   ├── models/
│   │   │   ├── base.py             # abstract Model interface
│   │   │   ├── xgboost_clf.py      # delay classifier
│   │   │   ├── xgboost_reg.py      # delay duration regressor
│   │   │   ├── lightgbm_ens.py     # LightGBM variant
│   │   │   ├── lstm_temporal.py    # temporal propagation
│   │   │   └── hybrid.py           # stacked hybrid
│   │   ├── training/
│   │   │   ├── train.py            # training loop
│   │   │   ├── evaluate.py         # metrics
│   │   │   └── registry.py         # MLflow wrapper
│   │   ├── inference/
│   │   │   ├── predictor.py        # load + cache + predict
│   │   │   └── whatif.py           # feature overrides
│   │   └── explain/
│   │       ├── shap_explainer.py
│   │       ├── lime_explainer.py
│   │       └── narrator.py         # SHAP → plain English
│   │
│   ├── integrations/               # external API adapters
│   │   ├── meteostat.py
│   │   ├── opensky.py
│   │   ├── openflights.py
│   │   ├── apns.py                 # Apple Push
│   │   └── email.py                # SES / SendGrid
│   │
│   ├── workers/                    # ARQ background jobs
│   │   ├── etl_worker.py           # scheduled ingest
│   │   ├── retrain_worker.py
│   │   ├── alert_worker.py
│   │   └── notification_worker.py
│   │
│   └── admin_panel/                # SQLAdmin config
│       ├── views.py
│       └── auth_backend.py
│
├── migrations/                     # Alembic
│   ├── versions/
│   ├── env.py
│   └── alembic.ini
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── fixtures/
│   └── conftest.py
│
├── scripts/
│   ├── seed_reference_data.py      # load OpenFlights
│   ├── load_kaggle_dataset.py
│   └── create_admin_user.py
│
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.worker
│   └── docker-compose.yml
│
├── pyproject.toml                  # poetry · pinned deps
├── poetry.lock
├── .env.example
├── README.md
└── Makefile`}</pre>
          </div>
        </section>

        {/* ========== SECTION 7: DATA FLOW EXAMPLES ========== */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionNum}>§ 07</span>
            <h2 style={styles.sectionTitle}>Critical Data Flows</h2>
          </div>
          <p style={styles.sectionDesc}>
            Three end-to-end flows showing how request, cache, DB, and ML subsystem interact.
          </p>

          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>▸</span> Flow 1 · Passenger requests delay prediction
            </div>
            <pre style={styles.codeBlock}>{`iOS App                FastAPI              Redis              PostgreSQL         ML Subsystem
   │                      │                     │                     │                    │
   │  GET /predictions/   │                     │                     │                    │
   │  flight/{id}         │                     │                     │                    │
   ├─────────────────────▶│                     │                     │                    │
   │                      │  check auth (JWT)   │                     │                    │
   │                      │  resolve role       │                     │                    │
   │                      │                     │                     │                    │
   │                      │  GET pred:{id}      │                     │                    │
   │                      ├────────────────────▶│                     │                    │
   │                      │  MISS               │                     │                    │
   │                      │◀────────────────────┤                     │                    │
   │                      │                     │                     │                    │
   │                      │  load flight        │                     │                    │
   │                      ├─────────────────────────────────────────▶│                    │
   │                      │◀─────────────────────────────────────────┤                    │
   │                      │                     │                     │                    │
   │                      │  fetch features (weather, congestion)     │                    │
   │                      ├────────────────────────────────────────────────────────────────▶
   │                      │                     │                     │                    │
   │                      │  hybrid model infer + narrate (plain)     │                    │
   │                      │◀───────────────────────────────────────────────────────────────┤
   │                      │                     │                     │                    │
   │                      │  persist prediction │                     │                    │
   │                      ├─────────────────────────────────────────▶│                    │
   │                      │  SETEX pred:{id} 300                      │                    │
   │                      ├────────────────────▶│                     │                    │
   │                      │                     │                     │                    │
   │  200 + simple expl.  │                     │                     │                    │
   │◀─────────────────────┤                     │                     │                    │`}</pre>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>▸</span> Flow 2 · Manager runs what-if simulation
            </div>
            <pre style={styles.codeBlock}>{`Ops Dashboard    FastAPI           Predictor        SHAP           PostgreSQL
      │               │                  │              │                │
      │ POST /predictions/whatif         │              │                │
      │ { flight_id, overrides: {        │              │                │
      │   wind_speed: 35, depart +15m    │              │                │
      │ }}                               │              │                │
      ├──────────────▶│                  │              │                │
      │               │ require_role(MANAGER)           │                │
      │               │                  │              │                │
      │               │ load base features              │                │
      │               ├────────────────────────────────────────────────▶│
      │               │◀────────────────────────────────────────────────┤
      │               │                  │              │                │
      │               │ merge overrides  │              │                │
      │               ├─────────────────▶│              │                │
      │               │ prediction       │              │                │
      │               │◀─────────────────┤              │                │
      │               │                  │              │                │
      │               │ request full SHAP attributions  │                │
      │               ├───────────────────────────────▶│                │
      │               │ top factors + values            │                │
      │               │◀───────────────────────────────┤                │
      │               │                  │              │                │
      │               │ persist whatif_scenarios row    │                │
      │               ├───────────────────────────────────────────────▶│
      │               │                  │              │                │
      │ 200 + SHAP bar chart data        │              │                │
      │◀──────────────┤                  │              │                │`}</pre>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>▸</span> Flow 3 · Scheduled ETL + alert dispatch
            </div>
            <pre style={styles.codeBlock}>{`                                    ┌─────────────────┐
                                    │  ARQ Scheduler  │
                                    │  (every 15 min) │
                                    └────────┬────────┘
                                             ▼
                                    ┌─────────────────┐
                                    │   etl_worker    │
                                    └────────┬────────┘
                                             │
                      ┌──────────────────────┼──────────────────────┐
                      ▼                      ▼                      ▼
               ┌────────────┐         ┌────────────┐         ┌────────────┐
               │ Meteostat  │         │  OpenSky   │         │   Kaggle   │
               │ (weather)  │         │   (live)   │         │ (fallback) │
               └──────┬─────┘         └──────┬─────┘         └──────┬─────┘
                      │                      │                      │
                      └──────────────────────┼──────────────────────┘
                                             ▼
                                    ┌─────────────────┐
                                    │  clean/encode   │
                                    │  feature eng    │
                                    └────────┬────────┘
                                             ▼
                                    ┌─────────────────┐
                                    │   PostgreSQL    │
                                    │  flights,       │
                                    │  weather_snaps  │
                                    └────────┬────────┘
                                             ▼
                                    ┌─────────────────┐
                                    │  alert_worker   │◀── evaluates alert_rules
                                    └────────┬────────┘
                                             │  match
                              ┌──────────────┴──────────────┐
                              ▼                             ▼
                     ┌─────────────────┐           ┌─────────────────┐
                     │  notification_  │           │  notifications  │
                     │     worker      │──── write ──▶   (DB row)    │
                     └────────┬────────┘           └─────────────────┘
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
            ┌────────┐  ┌────────┐  ┌──────────┐
            │  APNs  │  │  SES   │  │ WebSocket│
            │  (iOS) │  │ (email)│  │ (in-app) │
            └────────┘  └────────┘  └──────────┘`}</pre>
          </div>
        </section>

        {/* ========== SECTION 8: NFR ========== */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionNum}>§ 08</span>
            <h2 style={styles.sectionTitle}>Non-Functional Targets</h2>
          </div>

          <div style={styles.stackGrid}>
            {[
              ['Prediction latency (cached)', '< 50ms p95', 'Redis hit'],
              ['Prediction latency (cold)', '< 500ms p95', 'Full model inference'],
              ['API availability', '99.5% monthly', 'Graceful degradation'],
              ['Concurrent users', '500 sustained', 'Single EC2 t3.large'],
              ['DB query p99', '< 100ms', 'Indexed paths only'],
              ['Cache hit ratio', '> 80%', 'Flight + prediction reads'],
              ['JWT token lifetime', '15 min access, 30d refresh', 'Rotation on refresh'],
              ['Rate limit (passenger)', '60 req/min', 'Per-user Redis bucket'],
              ['Rate limit (manager)', '600 req/min', 'Higher for dashboards'],
              ['Model retrain cadence', 'Weekly', 'ARQ scheduled job'],
              ['Backup frequency', 'Daily full + 15min WAL', 'AWS RDS automated'],
              ['Audit log retention', '2 years', 'Cold storage after 90d'],
            ].map(([k, v, note]) => (
              <div key={k} style={styles.stackItem}>
                <div style={{ ...styles.stackName, fontSize: '12px' }}>{k}</div>
                <div style={{ ...styles.stackVer, color: '#4ade80', fontSize: '14px' }}>{v}</div>
                <div style={styles.stackDesc}>{note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ========== FOOTER ========== */}
        <footer style={styles.footer}>
          SKYLYTICS · BACKEND SPEC v1.0 · FINAL YEAR PROJECT · {new Date().getFullYear()}
          <br />
          <span style={{ color: '#334155', marginTop: '8px', display: 'inline-block' }}>
            ─ FastAPI 0.135.3 · PostgreSQL 17 · Redis 7.4 · Python 3.12 ─
          </span>
        </footer>
      </div>
    </div>
  );
}
