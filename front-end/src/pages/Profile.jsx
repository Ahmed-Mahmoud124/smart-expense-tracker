import React, { useState, useEffect, useCallback } from 'react';
import { profileAPI, authAPI } from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { toast } from 'react-toastify';

const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar'       },
  { code: 'EUR', label: 'EUR — Euro'            },
  { code: 'GBP', label: 'GBP — British Pound'  },
  { code: 'EGP', label: 'EGP — Egyptian Pound' },
  { code: 'SAR', label: 'SAR — Saudi Riyal'    },
  { code: 'AED', label: 'AED — UAE Dirham'     },
  { code: 'JPY', label: 'JPY — Japanese Yen'   },
  { code: 'CAD', label: 'CAD — Canadian Dollar'},
  { code: 'AUD', label: 'AUD — Australian Dollar'},
  { code: 'CHF', label: 'CHF — Swiss Franc'    },
];

const fmt = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(0)}`;
  }
};

// ── Section card ──────────────────────────────────────────────────────────────
const SectionCard = ({ title, icon, children }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{title}</h2>
    </div>
    {children}
  </div>
);

// ── Profile page ──────────────────────────────────────────────────────────────
const Profile = () => {
  const { updateUser, logout } = useAuth();

  const [ ,    setProfile]    = useState(null);
  const [stats,      setStats]      = useState(null);
  const [goals,      setGoals]      = useState(null);
  const [loading,    setLoading]    = useState(true);

  // Profile form
  const [profileForm,    setProfileForm]    = useState({ name: '', email: '', currency: 'USD', timezone: 'UTC' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors,  setProfileErrors]  = useState({});

  // Goals form
  const [goalsForm,    setGoalsForm]    = useState({ monthly_income_goal: '', monthly_expense_limit: '' });
  const [goalsLoading, setGoalsLoading] = useState(false);

  // Password form
  const [pwForm,    setPwForm]    = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors,  setPwErrors]  = useState({});

  // Delete modal
  const [deleteModal,   setDeleteModal]   = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading,  setDeleteLoading]  = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, goalsRes] = await Promise.all([
        profileAPI.get(),
        profileAPI.getGoals(),
      ]);
      const p = profileRes.data.data.profile;
      const s = profileRes.data.data.statistics;
      const g = goalsRes.data.data;

      setProfile(p);
      setStats(s);
      setGoals(g);

      setProfileForm({
        name    : p.name,
        email   : p.email,
        currency: p.currency,
        timezone: p.timezone || 'UTC',
      });
      setGoalsForm({
        monthly_income_goal  : p.monthly_income_goal   ?? '',
        monthly_expense_limit: p.monthly_expense_limit ?? '',
      });
    } catch {
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Profile save ─────────────────────────────────────────────────────────
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!profileForm.name.trim())  errs.name  = 'Name is required.';
    if (!profileForm.email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(profileForm.email)) errs.email = 'Invalid email.';
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }

    setProfileLoading(true);
    try {
      const { data } = await profileAPI.update(profileForm);
      setProfile(data.data.profile);
      updateUser(data.data.profile);
      toast.success('Profile updated successfully.');
      setProfileErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Goals save ───────────────────────────────────────────────────────────
  const handleGoalsSubmit = async (e) => {
    e.preventDefault();
    setGoalsLoading(true);
    try {
      await profileAPI.update({
        monthly_income_goal  : goalsForm.monthly_income_goal   ? parseFloat(goalsForm.monthly_income_goal)   : null,
        monthly_expense_limit: goalsForm.monthly_expense_limit ? parseFloat(goalsForm.monthly_expense_limit) : null,
      });
      toast.success('Financial goals updated.');
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update goals.');
    } finally {
      setGoalsLoading(false);
    }
  };

  // ── Password change ───────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword)   errs.currentPassword = 'Current password is required.';
    if (!pwForm.newPassword)       errs.newPassword     = 'New password is required.';
    else if (pwForm.newPassword.length < 8) errs.newPassword = 'Min 8 characters.';
    if (pwForm.newPassword !== pwForm.confirmPassword)
      errs.confirmPassword = 'Passwords do not match.';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }

    setPwLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword    : pwForm.newPassword,
        confirmPassword: pwForm.confirmPassword,
      });
      toast.success('Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!deletePassword) { toast.error('Please enter your password.'); return; }
    setDeleteLoading(true);
    try {
      await profileAPI.deleteAccount({ password: deletePassword });
      toast.info('Account deleted. Goodbye!');
      logout();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <LoadingSpinner size="lg" text="Loading profile…" />
    </div>
  );

  const currency = profileForm.currency || 'USD';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 800 }}>

      {/* Page header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* ── Account stats ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          {[
            { label: 'Transactions',     value: stats.total_transactions,        mono: false },
            { label: 'Total Income',     value: fmt(stats.total_income,  currency), mono: true, color: 'var(--color-income)' },
            { label: 'Total Expenses',   value: fmt(stats.total_expense, currency), mono: true, color: 'var(--color-expense)' },
            { label: 'Net Balance',      value: fmt(stats.net_balance,   currency), mono: true,
              color: stats.net_balance >= 0 ? 'var(--color-income)' : 'var(--color-expense)' },
            { label: 'Active Budgets',   value: stats.active_budgets,             mono: false },
            { label: 'Custom Categories',value: stats.custom_categories,          mono: false },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
              <div style={{
                fontSize   : 'var(--text-lg)',
                fontWeight : 800,
                fontFamily : s.mono ? 'var(--font-mono)' : 'inherit',
                color      : s.color || 'var(--color-text-primary)',
              }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Profile info ── */}
      <SectionCard title="Account Information" icon="👤">
        <form onSubmit={handleProfileSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="p-name">Full Name <span className="required">*</span></label>
                <input
                  id="p-name" type="text"
                  className={`form-input${profileErrors.name ? ' form-input--error' : ''}`}
                  value={profileForm.name}
                  onChange={e => { setProfileForm(p => ({ ...p, name: e.target.value })); setProfileErrors(p => ({ ...p, name: '' })); }}
                />
                {profileErrors.name && <span className="form-error">⚠ {profileErrors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="p-email">Email Address <span className="required">*</span></label>
                <input
                  id="p-email" type="email"
                  className={`form-input${profileErrors.email ? ' form-input--error' : ''}`}
                  value={profileForm.email}
                  onChange={e => { setProfileForm(p => ({ ...p, email: e.target.value })); setProfileErrors(p => ({ ...p, email: '' })); }}
                />
                {profileErrors.email && <span className="form-error">⚠ {profileErrors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="p-currency">Currency</label>
                <select
                  id="p-currency"
                  className="form-select"
                  value={profileForm.currency}
                  onChange={e => setProfileForm(p => ({ ...p, currency: e.target.value }))}
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="p-timezone">Timezone</label>
                <input
                  id="p-timezone" type="text"
                  className="form-input"
                  placeholder="e.g. Africa/Cairo"
                  value={profileForm.timezone}
                  onChange={e => setProfileForm(p => ({ ...p, timezone: e.target.value }))}
                />
                <span className="form-hint">IANA timezone string (e.g. America/New_York)</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn--primary" disabled={profileLoading}>
                {profileLoading ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Saving…
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </SectionCard>

      {/* ── Financial goals ── */}
      <SectionCard title="Financial Goals" icon="🎯">
        {goals && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Income goal progress */}
            {goals.income_goal && (
              <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Monthly Income Goal
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-income)', marginBottom: 8 }}>
                  {goals.income_goal.percentage}%
                </div>
                <div className="progress-bar" style={{ marginBottom: 6 }}>
                  <div className="progress-bar__fill progress-bar__fill--ok" style={{ width: `${Math.min(goals.income_goal.percentage, 100)}%` }} />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {fmt(goals.income_goal.actual, currency)} / {fmt(goals.income_goal.goal, currency)}
                </div>
              </div>
            )}

            {/* Expense limit progress */}
            {goals.expense_limit && (
              <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Monthly Expense Limit
                </div>
                <div style={{
                  fontSize : 'var(--text-xl)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color    : goals.expense_limit.exceeded ? 'var(--color-expense)' : 'var(--color-warning)',
                  marginBottom: 8,
                }}>
                  {goals.expense_limit.percentage}%
                </div>
                <div className="progress-bar" style={{ marginBottom: 6 }}>
                  <div
                    className="progress-bar__fill"
                    style={{
                      width     : `${Math.min(goals.expense_limit.percentage, 100)}%`,
                      background: goals.expense_limit.exceeded ? 'var(--color-expense)' : 'var(--color-warning)',
                    }}
                  />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {fmt(goals.expense_limit.actual, currency)} / {fmt(goals.expense_limit.limit, currency)}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleGoalsSubmit} noValidate>
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="income-goal">
                Monthly Income Goal
              </label>
              <input
                id="income-goal" type="number" min="0" step="0.01"
                className="form-input"
                placeholder="e.g. 5000"
                value={goalsForm.monthly_income_goal}
                onChange={e => setGoalsForm(p => ({ ...p, monthly_income_goal: e.target.value }))}
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <span className="form-hint">Target income to aim for each month</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expense-limit">
                Monthly Expense Limit
              </label>
              <input
                id="expense-limit" type="number" min="0" step="0.01"
                className="form-input"
                placeholder="e.g. 3000"
                value={goalsForm.monthly_expense_limit}
                onChange={e => setGoalsForm(p => ({ ...p, monthly_expense_limit: e.target.value }))}
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <span className="form-hint">Maximum spending allowed per month</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn--primary" disabled={goalsLoading}>
              {goalsLoading ? 'Saving…' : 'Update Goals'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Change password ── */}
      <SectionCard title="Change Password" icon="🔒">
        <form onSubmit={handlePasswordSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="cur-pw">Current Password <span className="required">*</span></label>
              <input
                id="cur-pw" type="password" autoComplete="current-password"
                className={`form-input${pwErrors.currentPassword ? ' form-input--error' : ''}`}
                value={pwForm.currentPassword}
                onChange={e => { setPwForm(p => ({ ...p, currentPassword: e.target.value })); setPwErrors(p => ({ ...p, currentPassword: '' })); }}
              />
              {pwErrors.currentPassword && <span className="form-error">⚠ {pwErrors.currentPassword}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="new-pw">New Password <span className="required">*</span></label>
                <input
                  id="new-pw" type="password" autoComplete="new-password"
                  className={`form-input${pwErrors.newPassword ? ' form-input--error' : ''}`}
                  value={pwForm.newPassword}
                  onChange={e => { setPwForm(p => ({ ...p, newPassword: e.target.value })); setPwErrors(p => ({ ...p, newPassword: '' })); }}
                />
                {pwErrors.newPassword && <span className="form-error">⚠ {pwErrors.newPassword}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="conf-pw">Confirm Password <span className="required">*</span></label>
                <input
                  id="conf-pw" type="password" autoComplete="new-password"
                  className={`form-input${pwErrors.confirmPassword ? ' form-input--error' : ''}`}
                  value={pwForm.confirmPassword}
                  onChange={e => { setPwForm(p => ({ ...p, confirmPassword: e.target.value })); setPwErrors(p => ({ ...p, confirmPassword: '' })); }}
                />
                {pwErrors.confirmPassword && <span className="form-error">⚠ {pwErrors.confirmPassword}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn--primary" disabled={pwLoading}>
                {pwLoading ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </div>
        </form>
      </SectionCard>

      {/* ── Danger zone ── */}
      <SectionCard title="Danger Zone" icon="⚠️">
        <div style={{
          background   : 'var(--color-danger-bg)',
          border       : '1px solid var(--color-danger)',
          borderRadius : 'var(--radius-lg)',
          padding      : '16px 20px',
          display      : 'flex',
          alignItems   : 'center',
          justifyContent: 'space-between',
          gap          : 16,
          flexWrap     : 'wrap',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-danger)', marginBottom: 4 }}>Delete Account</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Permanently delete your account and all associated data. This cannot be undone.
            </div>
          </div>
          <button
            className="btn btn--danger"
            onClick={() => setDeleteModal(true)}
          >
            Delete Account
          </button>
        </div>
      </SectionCard>

      {/* Delete confirm modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => { setDeleteModal(false); setDeletePassword(''); }}
        title="Delete Account"
        size="sm"
        footer={
          <>
            <button className="btn btn--secondary" onClick={() => { setDeleteModal(false); setDeletePassword(''); }}>
              Cancel
            </button>
            <button className="btn btn--danger" onClick={handleDeleteAccount} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting…' : 'Delete Forever'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>
          This will permanently delete your account, all transactions, budgets, and categories. This action <strong>cannot</strong> be undone.
        </p>
        <div className="form-group">
          <label className="form-label" htmlFor="del-pw">Confirm with your password</label>
          <input
            id="del-pw" type="password"
            className="form-input"
            placeholder="Enter your password"
            value={deletePassword}
            onChange={e => setDeletePassword(e.target.value)}
          />
        </div>
      </Modal>

    </div>
  );
};

export default Profile;