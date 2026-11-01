import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style   : 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
};

const getProgressColor = (pct) => {
  if (pct >= 100) return 'var(--color-expense)';
  if (pct >= 80)  return 'var(--color-warning)';
  return 'var(--color-income)';
};

// ── Sub-components ────────────────────────────────────────────────────────────
const StatCard = ({ icon, iconBg, label, value, sub, subColor }) => (
  <div className="stat-card">
    <div className="stat-card__icon" style={{ background: iconBg }}>{icon}</div>
    <div className="stat-card__label">{label}</div>
    <div className="stat-card__value">{value}</div>
    {sub && (
      <div className="stat-card__change" style={{ color: subColor || 'var(--color-text-muted)' }}>
        {sub}
      </div>
    )}
  </div>
);

const SectionHeader = ({ title, linkTo, linkLabel }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{title}</h2>
    {linkTo && (
      <Link to={linkTo} style={{
        fontSize  : 'var(--text-sm)',
        color     : 'var(--color-accent)',
        fontWeight: 600,
      }}>
        {linkLabel} →
      </Link>
    )}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user }              = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardAPI.getSummary();
      setData(res.data.data);
    } catch {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <LoadingSpinner size="lg" text="Loading dashboard…" />
    </div>
  );

  if (error) return (
    <div className="empty-state">
      <div className="empty-state__icon">⚠️</div>
      <div className="empty-state__title">Something went wrong</div>
      <div className="empty-state__text">{error}</div>
      <button className="btn btn--primary" onClick={fetchDashboard}>Retry</button>
    </div>
  );

  if (!data) return null;

  const currency           = user?.currency || 'USD';
  const { current_month, all_time, monthly_trend, top_categories, recent_transactions, active_budgets } = data;

  // ── Bar chart: monthly income vs expense ──────────────────────────────────
  const barData = {
    labels  : monthly_trend.map(m => m.month.slice(5)), // "06" from "2025-06"
    datasets: [
      {
        label          : 'Income',
        data           : monthly_trend.map(m => m.income),
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor    : 'rgba(16, 185, 129, 1)',
        borderWidth    : 1,
        borderRadius   : 4,
      },
      {
        label          : 'Expense',
        data           : monthly_trend.map(m => m.expense),
        backgroundColor: 'rgba(244, 63, 94, 0.75)',
        borderColor    : 'rgba(244, 63, 94, 1)',
        borderWidth    : 1,
        borderRadius   : 4,
      },
    ],
  };

  const barOptions = {
    responsive         : true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#8896b3', font: { size: 12 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${fmt(ctx.raw, currency)}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#8896b3' }, grid: { color: 'rgba(42,51,71,0.8)' } },
      y: { ticks: { color: '#8896b3', callback: (v) => fmt(v, currency) }, grid: { color: 'rgba(42,51,71,0.8)' } },
    },
  };

  // ── Doughnut chart: top expense categories ────────────────────────────────
  const doughnutData = {
    labels  : top_categories.map(c => c.name),
    datasets: [{
      data           : top_categories.map(c => c.total),
      backgroundColor: top_categories.map(c => c.color),
      borderColor    : '#1a2032',
      borderWidth    : 3,
      hoverOffset    : 6,
    }],
  };

  const doughnutOptions = {
    responsive         : true,
    maintainAspectRatio: false,
    cutout             : '68%',
    plugins: {
      legend: { position: 'right', labels: { color: '#8896b3', font: { size: 12 }, padding: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${fmt(ctx.raw, currency)}`,
        },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── Welcome banner ── */}
      <div style={{
        background   : 'linear-gradient(135deg, var(--color-accent-light) 0%, var(--color-bg-card) 100%)',
        border       : '1px solid var(--color-accent)',
        borderRadius : 'var(--radius-xl)',
        padding      : '24px 28px',
        display      : 'flex',
        alignItems   : 'center',
        justifyContent: 'space-between',
        gap          : 16,
        flexWrap     : 'wrap',
      }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 4 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span style={{ color: 'var(--color-accent)' }}>{user?.name?.split(' ')[0]}</span> 👋
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Here's your financial snapshot for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{
          textAlign : 'right',
          fontFamily: 'var(--font-mono)',
        }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4 }}>Net Balance</div>
          <div style={{
            fontSize  : 'var(--text-3xl)',
            fontWeight: 800,
            color     : all_time.net_balance >= 0 ? 'var(--color-income)' : 'var(--color-expense)',
          }}>
            {fmt(all_time.net_balance, currency)}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid-4">
        <StatCard
          icon="💰" iconBg="var(--color-income-bg)"
          label="Monthly Income"
          value={<span style={{ color: 'var(--color-income)' }}>{fmt(current_month.income, currency)}</span>}
          sub={`${current_month.transaction_count} transactions`}
        />
        <StatCard
          icon="💸" iconBg="var(--color-expense-bg)"
          label="Monthly Expenses"
          value={<span style={{ color: 'var(--color-expense)' }}>{fmt(current_month.expense, currency)}</span>}
          sub={current_month.net >= 0 ? `${fmt(current_month.net, currency)} saved` : `${fmt(Math.abs(current_month.net), currency)} over budget`}
          subColor={current_month.net >= 0 ? 'var(--color-income)' : 'var(--color-expense)'}
        />
        <StatCard
          icon="📊" iconBg="var(--color-info-bg)"
          label="Total Income (All Time)"
          value={<span style={{ color: 'var(--color-info)' }}>{fmt(all_time.total_income, currency)}</span>}
        />
        <StatCard
          icon="🎯" iconBg="var(--color-warning-bg)"
          label="Active Budgets"
          value={<span style={{ color: 'var(--color-warning)' }}>{active_budgets.length}</span>}
          sub={`${active_budgets.filter(b => b.alert_triggered).length} alerts triggered`}
          subColor="var(--color-warning)"
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid-2">
        {/* Bar chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Income vs Expenses</div>
              <div className="card-subtitle">Last {monthly_trend.length} months</div>
            </div>
          </div>
          <div style={{ height: 260 }}>
            {monthly_trend.length ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="empty-state__icon">📊</div>
                <div className="empty-state__text">No transaction data yet.</div>
              </div>
            )}
          </div>
        </div>

        {/* Doughnut */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Expense Categories</div>
              <div className="card-subtitle">This month</div>
            </div>
          </div>
          <div style={{ height: 260 }}>
            {top_categories.length ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="empty-state__icon">🍩</div>
                <div className="empty-state__text">No expense data this month.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid-2">

        {/* Recent transactions */}
        <div className="card">
          <SectionHeader title="Recent Transactions" linkTo="/transactions" linkLabel="View all" />
          {recent_transactions.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recent_transactions.map(tx => (
                <div key={tx.id} style={{
                  display      : 'flex',
                  alignItems   : 'center',
                  gap          : 12,
                  padding      : '10px 8px',
                  borderRadius : 'var(--radius-md)',
                  transition   : 'background var(--transition-fast)',
                  cursor       : 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width          : 36,
                    height         : 36,
                    borderRadius   : 'var(--radius-md)',
                    background     : tx.type === 'income' ? 'var(--color-income-bg)' : 'var(--color-expense-bg)',
                    display        : 'flex',
                    alignItems     : 'center',
                    justifyContent : 'center',
                    fontSize       : '1.1rem',
                    flexShrink     : 0,
                  }}>
                    {tx.category_icon}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description || tx.category_name}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {tx.category_name} · {new Date(tx.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize  : 'var(--text-sm)',
                    color     : tx.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)',
                    flexShrink: 0,
                  }}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, currency)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-state__icon">💳</div>
              <div className="empty-state__text">No transactions yet.</div>
              <Link to="/transactions" className="btn btn--primary btn--sm">Add Transaction</Link>
            </div>
          )}
        </div>

        {/* Active budgets */}
        <div className="card">
          <SectionHeader title="Budget Status" linkTo="/budgets" linkLabel="Manage" />
          {active_budgets.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {active_budgets.map(b => {
                const pct   = Math.min(b.percentage_used, 100);
                const color = getProgressColor(b.percentage_used);
                return (
                  <div key={b.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{b.name}</span>
                        {b.is_exceeded && (
                          <span className="badge badge--danger" style={{ marginLeft: 8 }}>Exceeded</span>
                        )}
                        {!b.is_exceeded && b.alert_triggered && (
                          <span className="badge badge--warning" style={{ marginLeft: 8 }}>Alert</span>
                        )}
                      </div>
                      <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color }}>
                        {b.percentage_used.toFixed(0)}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar__fill"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <div style={{
                      display        : 'flex',
                      justifyContent : 'space-between',
                      marginTop      : 4,
                      fontSize       : 'var(--text-xs)',
                      color          : 'var(--color-text-muted)',
                      fontFamily     : 'var(--font-mono)',
                    }}>
                      <span>{fmt(b.spent, currency)} spent</span>
                      <span>{fmt(b.amount, currency)} limit</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-state__icon">🎯</div>
              <div className="empty-state__text">No active budgets this month.</div>
              <Link to="/budgets" className="btn btn--primary btn--sm">Create Budget</Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;