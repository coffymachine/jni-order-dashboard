import { useState, useEffect } from 'react';
import Head from 'next/head';

// Named employee colors - add/edit names here to assign specific colors
// Any employee NOT in this list gets a fallback color from EMPLOYEE_FALLBACK_COLORS
const EMPLOYEE_NAMED_COLORS = {
  'Nick':  { bg: '#1e3a5f', text: '#60a5fa' },  // blue
  'Lily':    { bg: '#1a3a2a', text: '#4ade80' },  // green
  'Mitch':   { bg: '#3a2a1a', text: '#fb923c' },  // orange
  'Maddie':     { bg: '#2a1a3a', text: '#e879f9' },  // pink/magenta
  'Joe':   { bg: '#1a3a3a', text: '#2dd4bf' },  // teal
  'Angie':    { bg: '#3a3a1a', text: '#facc15' },  // yellow
  'Sarah':  { bg: '#1a2a3a', text: '#38bdf8' },  // sky
};

const EMPLOYEE_FALLBACK_COLORS = [
  { bg: '#1e3a5f', text: '#60a5fa' },
  { bg: '#3a1a1a', text: '#f87171' },
  { bg: '#1a3a2a', text: '#4ade80' },
  { bg: '#3a2a1a', text: '#fb923c' },
  { bg: '#2a1a3a', text: '#e879f9' },
  { bg: '#1a3a3a', text: '#2dd4bf' },
  { bg: '#3a3a1a', text: '#facc15' },
  { bg: '#1a2a3a', text: '#38bdf8' },
  { bg: '#2a1a2a', text: '#c084fc' },
];

const BIN_COLORS = [
  { bg: '#1e1e2e', text: '#a9b1d6' },
  { bg: '#1a1a2a', text: '#9aa5ce' },
  { bg: '#2a1a2e', text: '#bb9af7' },
  { bg: '#1a2a1a', text: '#9ece6a' },
  { bg: '#2e1a1a', text: '#f7768e' },
  { bg: '#2a2a1a', text: '#e0af68' },
  { bg: '#1a2a2e', text: '#7dcfff' },
  { bg: '#2a1a1e', text: '#ff9e64' },
];

const getColorByName = (name, palette) => {
  // For employees, check named colors first
  if (palette === EMPLOYEE_FALLBACK_COLORS && EMPLOYEE_NAMED_COLORS[name]) {
    return EMPLOYEE_NAMED_COLORS[name];
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

const URGENCY = {
  overdue:  { accent: '#ef4444', dim: '#450a0a', text: '#ef4444', label: 'OVERDUE' },
  today:    { accent: '#f97316', dim: '#431407', text: '#f97316', label: 'TODAY' },
  tomorrow: { accent: '#eab308', dim: '#422006', text: '#eab308', label: 'TOMORROW' },
  ontrack:  { accent: '#22c55e', dim: '#052e16', text: '#22c55e', label: '' },
  neutral:  { accent: '#52525b', dim: '#18181b', text: '#71717a', label: '' },
};

const STATUS_STYLE = {
  'Quoted':      { bg: '#422006', text: '#fb923c' },
  'Not started': { bg: '#1c1917', text: '#78716c' },
  'In progress': { bg: '#172554', text: '#60a5fa' },
  'Done':        { bg: '#052e16', text: '#4ade80' },
};

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [now, setNow] = useState(new Date());

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load orders');
      setOrders(data.orders);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const refresh = setInterval(fetchOrders, 30000);
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(refresh); clearInterval(tick); };
  }, []);

  const getUrgency = (dueDate) => {
    if (!dueDate) return 'neutral';
    // Parse as local date to avoid UTC shift
    const [year, month, day] = dueDate.split('T')[0].split('-').map(Number);
    const due = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = Math.floor((due - today) / 86400000);
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'today';
    if (diff === 1) return 'tomorrow';
    return 'ontrack';
  };

  const formatDate = (ds) => {
    if (!ds) return '--';
    // Parse as local date by appending T00:00:00 to avoid UTC-to-local shift
    const [year, month, day] = ds.split('T')[0].split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const secsSince = lastRefresh ? Math.floor((now - lastRefresh) / 1000) : null;

  // Chip component for both employees and bin values
  const Chip = ({ label, palette }) => {
    const c = getColorByName(label, palette);
    return (
      <span style={{
        display: 'inline-block',
        padding: '0.3vh 0.6vw',
        background: c.bg,
        color: c.text,
        fontFamily: 'Barlow Condensed',
        fontSize: 'clamp(0.8rem, 1.6vh, 1.2rem)',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        letterSpacing: '0.5px',
        borderRadius: '2px',
      }}>
        {label}
      </span>
    );
  };

  const COLS = '9vw 1fr 11vw 14vw 5vw 6vw 12vw 15vw';

  return (
    <>
      <Head>
        <title>Order Board</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style global jsx>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          width: 100%; height: 100%; overflow: hidden;
          background: #09090b;
          font-family: 'JetBrains Mono', monospace;
          color: #f4f4f5;
        }
      `}</style>

      <div style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#09090b',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(255,255,255,0.015) 59px, rgba(255,255,255,0.015) 60px)',
        padding: '2vh 2.5vw',
        gap: '1.2vh',
      }}>

        {/* HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderBottom: '1px solid #27272a',
          paddingBottom: '1vh',
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: 'Barlow Condensed',
              fontSize: 'clamp(2rem, 5vh, 4rem)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-1px',
              lineHeight: 1,
              color: '#f4f4f5',
            }}>
              ORDER BOARD
            </div>
            <div style={{
              fontSize: 'clamp(0.5rem, 1vh, 0.75rem)',
              color: '#52525b',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginTop: '0.3vh',
            }}>
              Active Jobs &mdash; Next 8 Days
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'Barlow Condensed',
              fontSize: 'clamp(1.8rem, 4vh, 3rem)',
              fontWeight: 700,
              letterSpacing: '1px',
              lineHeight: 1,
            }}>
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{
              fontSize: 'clamp(0.5rem, 1vh, 0.7rem)',
              color: '#52525b',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginTop: '0.3vh',
            }}>
              {secsSince !== null ? `Refreshed ${secsSince}s ago` : 'Loading...'}
            </div>
          </div>
        </div>

        {/* COLUMN HEADERS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: COLS,
          gap: '1vw',
          padding: '0 1vw',
          flexShrink: 0,
        }}>
          {['Due', 'Client', 'Status', 'Embellishment', 'Qty', 'Time', 'Bin', 'Employee'].map(h => (
            <div key={h} style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 'clamp(0.6rem, 1.2vh, 0.85rem)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: '#a1a1aa',
              borderBottom: '2px solid #3f3f46',
              paddingBottom: '0.6vh',
            }}>
              {h}
            </div>
          ))}
        </div>

        {/* LOADING / ERROR / EMPTY */}
        {loading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', letterSpacing: '3px', fontSize: '0.8rem' }}>
            LOADING ORDERS...
          </div>
        )}
        {error && (
          <div style={{ padding: '1.5vh 1vw', background: '#1c0a0a', border: '1px solid #7f1d1d', color: '#fca5a5', fontSize: '0.8rem', flexShrink: 0 }}>
            ERROR: {error}
          </div>
        )}
        {!loading && !error && orders.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#52525b' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 'clamp(1.5rem, 4vh, 2.5rem)', fontWeight: 700, letterSpacing: '3px' }}>ALL CLEAR</div>
            <div style={{ fontSize: '0.7rem', marginTop: '0.5vh', letterSpacing: '1px' }}>No active orders this week</div>
          </div>
        )}

        {/* ORDER ROWS */}
        {!loading && !error && orders.length > 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5vh',
            overflow: 'hidden',
          }}>
            {orders.map((order) => {
              const urgency = getUrgency(order.dueDate);
              const u = URGENCY[urgency];
              const s = STATUS_STYLE[order.status] || { bg: '#27272a', text: '#71717a' };

              return (
                <div key={order.id} style={{
                  display: 'grid',
                  gridTemplateColumns: COLS,
                  gap: '1vw',
                  alignItems: 'center',
                  padding: '0 1vw',
                  flex: 1,
                  background: '#111113',
                  border: `1px solid ${u.dim}`,
                  borderLeft: `4px solid ${u.accent}`,
                  minHeight: 0,
                }}>

                  {/* Due */}
                  <div>
                    <div style={{
                      fontFamily: 'Barlow Condensed',
                      fontSize: 'clamp(1rem, 2.4vh, 1.8rem)',
                      fontWeight: 700,
                      color: u.text,
                      lineHeight: 1,
                    }}>
                      {formatDate(order.dueDate)}
                    </div>
                    {u.label && (
                      <div style={{
                        fontSize: 'clamp(0.45rem, 0.9vh, 0.6rem)',
                        color: u.accent,
                        letterSpacing: '1px',
                        marginTop: '0.2vh',
                        fontWeight: 700,
                      }}>
                        {u.label}
                      </div>
                    )}
                  </div>

                  {/* Client */}
                  <div style={{
                    fontFamily: 'Barlow Condensed',
                    fontSize: 'clamp(1rem, 2.6vh, 2rem)',
                    fontWeight: 700,
                    color: '#f4f4f5',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {order.client}
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.4vh 0.7vw',
                      background: s.bg,
                      color: s.text,
                      fontFamily: 'Barlow Condensed',
                      fontSize: 'clamp(0.8rem, 1.6vh, 1.2rem)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      whiteSpace: 'nowrap',
                    }}>
                      {order.status}
                    </span>
                  </div>

                  {/* Embellishment */}
                  <div style={{
                    fontFamily: 'Barlow Condensed',
                    fontSize: 'clamp(1rem, 2.2vh, 1.6rem)',
                    fontWeight: 700,
                    color: '#d4d4d8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '0.3px',
                  }}>
                    {order.embellishment || '--'}
                  </div>

                  {/* Qty */}
                  <div style={{
                    fontFamily: 'Barlow Condensed',
                    fontSize: 'clamp(1rem, 2.4vh, 1.8rem)',
                    fontWeight: 900,
                    color: u.text,
                  }}>
                    {order.quantity || '--'}
                  </div>

                  {/* Time */}
                  <div style={{
                    fontFamily: 'Barlow Condensed',
                    fontSize: 'clamp(1rem, 2.2vh, 1.6rem)',
                    fontWeight: 700,
                    color: '#a1a1aa',
                    letterSpacing: '0.3px',
                  }}>
                    {order.time || '--'}
                  </div>

                  {/* Bin - chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3vw', alignItems: 'center', overflow: 'hidden' }}>
                    {order.bin && order.bin.length > 0
                      ? order.bin.map(b => <Chip key={b} label={b} palette={BIN_COLORS} />)
                      : <span style={{ color: '#3f3f46', fontSize: '0.75rem' }}>--</span>
                    }
                  </div>

                  {/* Employee - chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3vw', alignItems: 'center', overflow: 'hidden' }}>
                    {order.employees && order.employees.length > 0
                      ? order.employees.map(emp => <Chip key={emp} label={emp} palette={EMPLOYEE_FALLBACK_COLORS} />)
                      : <span style={{ color: '#3f3f46', fontSize: '0.75rem' }}>--</span>
                    }
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* LEGEND */}
        <div style={{
          display: 'flex',
          gap: '2vw',
          paddingTop: '0.8vh',
          borderTop: '1px solid #18181b',
          flexShrink: 0,
          alignItems: 'center',
        }}>
          {[
            { label: 'Overdue', color: '#ef4444' },
            { label: 'Due Today', color: '#f97316' },
            { label: 'Due Tomorrow', color: '#eab308' },
            { label: 'On Track', color: '#22c55e' },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4vw' }}>
              <div style={{ width: '0.6vw', height: '0.6vw', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 'clamp(0.45rem, 0.9vh, 0.65rem)', color: '#52525b', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {label}
              </span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 'clamp(0.45rem, 0.9vh, 0.65rem)', color: '#3f3f46', letterSpacing: '1px' }}>
            AUTO-REFRESHES EVERY 30S
          </div>
        </div>

      </div>
    </>
  );
}
