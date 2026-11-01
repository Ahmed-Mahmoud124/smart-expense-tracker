import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

const fmt = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
};

const CHART_DEFAULTS = {
  responsive         : true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#8896b3', font: { size: 12 }, padding: 16 } },
  },
  scales: {
    x: { ticks: { color: '#8896b3' }, grid: { color: 'rgba(42,51,71,0.6)' } },
    y: { ticks: { color: '#8896b3' }, grid: { color: 'rgba(42,51,71,0.6)' } },
  },
};

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, subtitle, children, controls }) => (
  <div className="card">
    <div className="card-header">
      <div>
        <div className="card-title">{title}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
      {controls && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{controls}</div>}
    </div>
    {children}
  </div>
);

// ── Analytics page ────────────────────────────────────────────────────────────
const Analytics = () => {
  const { user } = useAuth();
  const currency  = user?.currency || 'USD';

  // ── State ──────────────────────────────────────────────────────────────────
  const [monthly,   setMonthly]   = useState([]);
  const [breakdown, setBreakdown] = useState({ breakdown: [], grand_total: 0 });
  const [daily,     setDaily]     = useState([]);
  const [yearly,    setYearly]    = useState([]);

  const [monthRange,    setMonthRange]    = useState(12);
  const [breakdownType, setBreakdownType] = useState('expense');
  const [breakdownStart, setBreakdownStart] = useState('');
  const [breakdownEnd,   setBreakdownEnd]   = useState('');

  const now        = new Date();
  const [dailyYear,  setDailyYear]  = useState(now.getFullYear());
  const [dailyMonth, setDailyMonth] = useState(now.getMonth() + 1);

  const [loadingMonthly,   setLoadingMonthly]   = useState(true);
  const [loadingBreakdown, setLoadingBreakdown] = useState(true);
  const [loadingDaily,     setLoadingDaily]     = useState(true);
  const [loadingYearly,    setLoadingYearly]    = useState(true);

  // ── Fetchers ───────────────────────────────────────────────────────────────
  const fetchMonthly = useCallback(async () => {
    setLoadingMonthly(true);
    try {
      const { data } = await dashboardAPI.getMonthlyAnalytics({ months: monthRange });
      setMonthly(data.data.monthly_analytics);
    } catch { /* non-fatal */ }
    finally { setLoadingMonthly(false); }
  }, [monthRange]);

  const fetchBreakdown = useCallback(async () => {
    setLoadingBreakdown(true);
    try {
      const params = { type: breakdownType };
      if (breakdownStart) params.start_date = breakdownStart;
      if (breakdownEnd)   params.end_date   = breakdownEnd;
      const { data } = await dashboardAPI.getCategoryBreakdown(params);
      setBreakdown(data.data);
    } catch { /* non-fatal */ }
    finally { setLoadingBreakdown(false); }
  }, [breakdownType, breakdownStart, breakdownEnd]);

  const fetchDaily = useCallback(async () => {
    setLoadingDaily(true);
    try {
      const { data } = await dashboardAPI.getDailySpending({ year: dailyYear, month: dailyMonth });
      setDaily(data.data.daily_spending);
    } catch { /* non-fatal */ }
    finally { setLoadingDaily(false); }
  }, [dailyYear, dailyMonth]);

  const fetchYearly = useCallback(async () => {
    setLoadingYearly(true);
    try {
      const { data } = await dashboardAPI.getYearlyComparison();
      setYearly(data.data.yearly_comparison);
    } catch { /* non-fatal */ }
    finally { setLoadingYearly(false); }
  }, []);

  useEffect(() => { fetchMonthly();   }, [fetchMonthly]);
  useEffect(() => { fetchBreakdown(); }, [fetchBreakdown]);
  useEffect(() => { fetchDaily();     }, [fetchDaily]);
  useEffect(() => { fetchYearly();    }, [fetchYearly]);

  // ── Chart configs ──────────────────────────────────────────────────────────

  // 1. Monthly bar chart
  const monthlyBarData = {
    labels  : monthly.map(m => m.label || m.month),
    datasets: [
      {
        label          : 'Income',
        data           : monthly.map(m => m.income),
        backgroundColor: 'rgba(16,185,129,0.75)',
        borderColor    : 'rgba(16,185,129,1)',
        borderWidth    : 1,
        borderRadius   : 5,
      },
      {
        label          : 'Expense',
        data           : monthly.map(m => m.expense),
        backgroundColor: 'rgba(244,63,94,0.75)',
        borderColor    : 'rgba(244,63,94,1)',
        borderWidth    : 1,
        borderRadius   : 5,
      },
    ],
  };

  const monthlyBarOptions = {
    ...CHART_DEFAULTS,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.raw, currency)}` },
      },
    },
    scales: {
      x: { ...CHART_DEFAULTS.scales.x },
      y: {
        ...CHART_DEFAULTS.scales.y,
        ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: (v) => fmt(v, currency) },
      },
    },
  };

  // 2. Net balance line overlay
  const netLineData = {
    labels  : monthly.map(m => m.label || m.month),
    datasets: [
      {
        label          : 'Net Balance',
        data           : monthly.map(m => m.net),
        borderColor    : '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        borderWidth    : 2,
        pointRadius    : 4,
        pointBackgroundColor: '#3b82f6',
        fill           : true,
        tension        : 0.4,
      },
    ],
  };

  const lineOptions = {
    ...CHART_DEFAULTS,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      tooltip: {
        callbacks: { label: (ctx) => ` Net: ${fmt(ctx.raw, currency)}` },
      },
    },
    scales: {
      x: { ...CHART_DEFAULTS.scales.x },
      y: {
        ...CHART_DEFAULTS.scales.y,
        ticks: { callback: (v) => fmt(v, currency), color: '#8896b3' },
      },
    },
  };

  // 3. Category doughnut
  const doughnutData = {
    labels  : breakdown.breakdown.map(c => c.name),
    datasets: [{
      data           : breakdown.breakdown.map(c => c.total),
      backgroundColor: breakdown.breakdown.map(c => c.color),
      borderColor    : '#1a2032',
      borderWidth    : 3,
      hoverOffset    : 8,
    }],
  };

  const doughnutOptions = {
    responsive         : true,
    maintainAspectRatio: false,
    cutout             : '65%',
    plugins: {
      legend: {
        position: 'right',
        labels  : { color: '#8896b3', font: { size: 11 }, padding: 10, boxWidth: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${fmt(ctx.raw, currency)} (${breakdown.breakdown[ctx.dataIndex]?.percentage}%)`,
        },
      },
    },
  };

  // 4. Daily area chart
  const dailyAreaData = {
    labels  : daily.map(d => `${d.day}`),
    datasets: [
      {
        label          : 'Expense',
        data           : daily.map(d => d.expense),
        borderColor    : 'rgba(244,63,94,0.9)',
        backgroundColor: 'rgba(244,63,94,0.12)',
        borderWidth    : 2,
        fill           : true,
        tension        : 0.4,
        pointRadius    : 3,
        pointBackgroundColor: 'rgba(244,63,94,0.9)',
      },
      {
        label          : 'Income',
        data           : daily.map(d => d.income),
        borderColor    : 'rgba(16,185,129,0.9)',
        backgroundColor: 'rgba(16,185,129,0.08)',
        borderWidth    : 2,
        fill           : true,
        tension        : 0.4,
        pointRadius    : 3,
        pointBackgroundColor: 'rgba(16,185,129,0.9)',
      },
    ],
  };

  const dailyOptions = {
    ...CHART_DEFAULTS,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      tooltip: {
        callbacks: {
          title: (items) => `Day ${items[0].label}`,
          label: (ctx)   => ` ${ctx.dataset.label}: ${fmt(ctx.raw, currency)}`,
        },
      },
    },
    scales: {
      x: { ...CHART_DEFAULTS.scales.x, title: { display: true, text: 'Day of Month', color: '#4f627a' } },
      y: {
        ...CHART_DEFAULTS.scales.y,
        ticks: { callback: (v) => fmt(v, currency), color: '#8896b3' },
      },
    },
  };

  // ── Month options for daily selector ──────────────────────────────────────
  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Page header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Deep insights into your financial patterns</p>
        </div>
      </div>

      {/* ── Year-over-year comparison ── */}
      {!loadingYearly && yearly.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {yearly.map(y => {
            const net = parseFloat(y.total_income) - parseFloat(y.total_expense);
            return (
              <div key={y.year} className="card" style={{ borderColor: y.year === now.getFullYear() ? 'var(--color-accent)' : 'var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{y.year}</span>
                  {y.year === now.getFullYear() && (
                    <span className="badge badge--success">Current Year</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Income',   value: fmt(y.total_income,  currency), color: 'var(--color-income)'  },
                    { label: 'Expenses', value: fmt(y.total_expense, currency), color: 'var(--color-expense)' },
                    { label: 'Net',      value: fmt(net, currency),
                      color: net >= 0 ? 'var(--color-income)' : 'var(--color-expense)' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {s.label}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-sm)', color: s.color }}>
                        {s.value}
                      </span>
                    </div>
                  ))}
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4 }}>Savings rate</div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar__fill"
                        style={{
                          width     : `${Math.max(0, Math.min(100, (net / parseFloat(y.total_income || 1)) * 100))}%`,
                          background: net >= 0 ? 'var(--color-income)' : 'var(--color-expense)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Monthly income vs expense bar chart ── */}
      <Section
        title="Monthly Income vs Expenses"
        subtitle={`Last ${monthRange} months`}
        controls={
          <select
            className="form-select"
            value={monthRange}
            onChange={e => setMonthRange(Number(e.target.value))}
            style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: 'var(--text-xs)' }}
          >
            {[3, 6, 12, 24].map(n => <option key={n} value={n}>{n} months</option>)}
          </select>
        }
      >
        <div style={{ height: 300 }}>
          {loadingMonthly ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <LoadingSpinner size="md" />
            </div>
          ) : monthly.length ? (
            <Bar data={monthlyBarData} options={monthlyBarOptions} />
          ) : (
            <div className="empty-state"><div className="empty-state__icon">📊</div><div className="empty-state__text">No data available.</div></div>
          )}
        </div>
      </Section>

      {/* ── Net balance trend line ── */}
      <Section
        title="Net Balance Trend"
        subtitle="Monthly savings or deficit"
      >
        <div style={{ height: 260 }}>
          {loadingMonthly ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <LoadingSpinner size="md" />
            </div>
          ) : monthly.length ? (
            <Line data={netLineData} options={lineOptions} />
          ) : (
            <div className="empty-state"><div className="empty-state__icon">📈</div><div className="empty-state__text">No data available.</div></div>
          )}
        </div>
      </Section>

      {/* ── Category breakdown ── */}
      <div className="grid-2">
        <Section
          title="Category Breakdown"
          subtitle={`${breakdownType === 'expense' ? 'Expense' : 'Income'} by category`}
          controls={
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="form-select"
                value={breakdownType}
                onChange={e => setBreakdownType(e.target.value)}
                style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: 'var(--text-xs)' }}
              >
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </select>
            </div>
          }
        >
          {/* Date range filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="date" className="form-input"
              value={breakdownStart}
              onChange={e => setBreakdownStart(e.target.value)}
              style={{ flex: '1 1 140px', fontSize: 'var(--text-xs)', padding: '6px 10px' }}
              placeholder="Start date"
            />
            <input
              type="date" className="form-input"
              value={breakdownEnd}
              onChange={e => setBreakdownEnd(e.target.value)}
              style={{ flex: '1 1 140px', fontSize: 'var(--text-xs)', padding: '6px 10px' }}
              placeholder="End date"
            />
            {(breakdownStart || breakdownEnd) && (
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => { setBreakdownStart(''); setBreakdownEnd(''); }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ height: 280 }}>
            {loadingBreakdown ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <LoadingSpinner size="md" />
              </div>
            ) : breakdown.breakdown.length ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div className="empty-state"><div className="empty-state__icon">🍩</div><div className="empty-state__text">No data for selected period.</div></div>
            )}
          </div>
        </Section>

        {/* Category table */}
        <Section
          title="Category Details"
          subtitle={`Total: ${fmt(breakdown.grand_total, currency)}`}
        >
          <div style={{ height: 360, overflowY: 'auto' }}>
            {loadingBreakdown ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
                <LoadingSpinner size="md" />
              </div>
            ) : breakdown.breakdown.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {breakdown.breakdown.map((cat, idx) => (
                  <div key={cat.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                        background: cat.color + '22',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem', flexShrink: 0,
                      }}>
                        {cat.icon}
                      </span>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cat.name}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, flexShrink: 0, marginLeft: 8, color: breakdownType === 'expense' ? 'var(--color-expense)' : 'var(--color-income)' }}>
                            {fmt(cat.total, currency)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                            <div style={{ width: `${cat.percentage}%`, height: '100%', background: cat.color, borderRadius: 'var(--radius-full)', transition: 'width 600ms ease' }} />
                          </div>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="empty-state__icon">📂</div>
                <div className="empty-state__text">No categories with transactions.</div>
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* ── Daily spending ── */}
      <Section
        title="Daily Spending Pattern"
        subtitle={`${MONTHS[dailyMonth - 1]} ${dailyYear}`}
        controls={
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="form-select"
              value={dailyMonth}
              onChange={e => setDailyMonth(Number(e.target.value))}
              style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: 'var(--text-xs)' }}
            >
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select
              className="form-select"
              value={dailyYear}
              onChange={e => setDailyYear(Number(e.target.value))}
              style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: 'var(--text-xs)' }}
            >
              {[now.getFullYear() - 1, now.getFullYear()].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        }
      >
        <div style={{ height: 280 }}>
          {loadingDaily ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <LoadingSpinner size="md" />
            </div>
          ) : daily.length ? (
            <Line data={dailyAreaData} options={dailyOptions} />
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state__icon">📅</div>
              <div className="empty-state__text">No transactions recorded for this month.</div>
            </div>
          )}
        </div>
      </Section>

    </div>
  );
};

export default Analytics;