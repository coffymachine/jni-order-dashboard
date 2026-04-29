import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [tick, setTick] = useState(0);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load orders');
      }

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
    const refreshInterval = setInterval(fetchOrders, 30000);
    const tickInterval = setInterval(() => setTick(t => t + 1), 1000);
    return () => {
      clearInterval(refreshInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const getUrgency = (dueDate) => {
    if (!dueDate) return 'neutral';
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'today';
    if (diff === 1) return 'tomorrow';
    return 'ontrack';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusStyle = (status) => {
    const map = {
      'Quoted':      { bg: '#3f3f46', color: '#a1a1aa' },
      'Not Started': { bg: '#1c1917', color: '#a8a29e' },
      'In Progress': { bg: '#1e3a5f', color: '#60a5fa' },
      'Complete':    { bg: '#052e16', color: '#4ade80' },
    };
    return map[status] || { bg: '#27272a', color: '#71717a' };
  };

  const urgencyColors = {
    overdue:  { accent: '#ef4444', dimmed: '#7f1d1d', text: '#ef4444' },
    today:    { accent: '#f97316', dimmed: '#7c2d12', text: '#f97316' },
    tomorrow: { accent: '#eab308', dimmed: '#713f12', text: '#eab308' },
    ontrack:  { accent: '#22c55e', dimmed: '#14532d', text: '#22c55e' },
    neutral:  { accent: '#52525b', dimmed: '#27272a', text: '#71717a' },
  };

  const urgencyLabels = {
    overdue: 'OVERDUE',
    today: 'DUE TODAY',
    tomorrow: 'DUE TOMORROW',
    ontrack: 'ON TRACK',
    neutral: '',
  };

  const secondsSinceRefresh = lastRefresh
    ? Math.floor((new Date() - lastRefresh) / 1000)
    : null;

  return (
    <>
      <Head>
        <title>Order Dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </Head>

      <style global jsx>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #09090b; color: #f4f4f5; }
        body {
          font-family: 'IBM Plex Mono', monospace;
          background-image:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 39px,
              rgba(255,255,255,0.02) 39px,
              rgba(255,255,255,0.02) 40px
            );
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        padding: '24px 32px',
        maxWidth: '1800px',
        margin: '0 auto',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '1px solid #27272a',
        }}>
          <div>
            <div style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: '4rem',
              fontWeight: 900,
              letterSpacing: '-1px',
              textTransform: 'uppercase',
              lineHeight: 1,
              color: '#f4f4f5',
            }}>
              ORDER BOARD
            </div>
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '0.7rem',
              color: '#52525b',
              marginTop: '6px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              Active Jobs &mdash; Sorted by Due Date
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#f4f4f5',
              letterSpacing: '1px',
            }}>
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{
              fontSize: '0.65rem',
              color: '#52525b',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}>
              {secondsSinceRefresh !== null
                ? `Refreshed ${secondsSinceRefresh}s ago`
                : 'Loading...'}
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr 160px 180px 80px 90px 100px 220px',
          gap: '12px',
          padding: '0 16px 10px',
          borderBottom: '1px solid #27272a',
          marginBottom: '8px',
        }}>
          {['Due', 'Client', 'Status', 'Embellishment', 'Qty', 'Time', 'Bin', 'Employee'].map(h => (
            <div key={h} style={{
              fontSize: '0.6rem',
              fontFamily: 'IBM Plex Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: '#52525b',
            }}>{h}</div>
          ))}
        </div>

        {/* States */}
        {loading && (
          <div style={{ padding: '80px 16px', textAlign: 'center', color: '#52525b', fontSize: '0.85rem', letterSpacing: '2px' }}>
            LOADING ORDERS...
          </div>
        )}

        {error && (
          <div style={{
            margin: '16px 0',
            padding: '16px',
            background: '#1c0a0a',
            border: '1px solid #7f1d1d',
            color: '#fca5a5',
            fontSize: '0.8rem',
            fontFamily: 'IBM Plex Mono, monospace',
          }}>
            ERROR: {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div style={{ padding: '80px 16px', textAlign: 'center', color: '#52525b' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '2rem', fontWeight: 700, letterSpacing: '2px' }}>
              ALL CLEAR
            </div>
            <div style={{ fontSize: '0.7rem', marginTop: '8px', letterSpacing: '1px' }}>No active orders</div>
          </div>
        )}

        {/* Order Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {orders.map((order, i) => {
            const urgency = getUrgency(order.dueDate);
            const colors = urgencyColors[urgency];
            const statusStyle = getStatusStyle(order.status);

            return (
              <div
                key={order.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 160px 180px 80px 90px 100px 220px',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: '#111113',
                  border: `1px solid ${colors.dimmed}`,
                  borderLeft: `4px solid ${colors.accent}`,
                  animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                  transition: 'background 0.2s',
                }}
              >
                {/* Due Date */}
                <div>
                  <div style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: colors.text,
                    lineHeight: 1,
                  }}>
                    {formatDate(order.dueDate)}
                  </div>
                  {urgencyLabels[urgency] && (
                    <div style={{
                      fontSize: '0.55rem',
                      fontFamily: 'IBM Plex Mono',
                      color: colors.accent,
                      letterSpacing: '1px',
                      marginTop: '3px',
                      opacity: 0.8,
                    }}>
                      {urgencyLabels[urgency]}
                    </div>
                  )}
                </div>

                {/* Client */}
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#f4f4f5',
                  letterSpacing: '0.5px',
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
                    padding: '4px 10px',
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    fontSize: '0.7rem',
                    fontFamily: 'IBM Plex Mono',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}>
                    {order.status}
                  </span>
                </div>

                {/* Embellishment */}
                <div style={{
                  fontSize: '0.8rem',
                  fontFamily: 'IBM Plex Mono',
                  color: '#a1a1aa',
                }}>
                  {order.embellishment || '--'}
                </div>

                {/* Quantity */}
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: colors.text,
                  opacity: 0.9,
                }}>
                  {order.quantity || '--'}
                </div>

                {/* Time */}
                <div style={{
                  fontSize: '0.8rem',
                  fontFamily: 'IBM Plex Mono',
                  color: '#71717a',
                }}>
                  {order.time || '--'}
                </div>

                {/* Bin */}
                <div style={{
                  fontSize: '0.85rem',
                  fontFamily: 'IBM Plex Mono',
                  color: '#a1a1aa',
                  fontWeight: 600,
                }}>
                  {order.bin || '--'}
                </div>

                {/* Employee */}
                <div style={{
                  fontSize: '0.8rem',
                  fontFamily: 'IBM Plex Mono',
                  color: '#71717a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {order.employee || '--'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        {orders.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '24px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #18181b',
          }}>
            {[
              { label: 'Overdue', color: '#ef4444' },
              { label: 'Due Today', color: '#f97316' },
              { label: 'Due Tomorrow', color: '#eab308' },
              { label: 'On Track', color: '#22c55e' },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.6rem', color: '#52525b', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
