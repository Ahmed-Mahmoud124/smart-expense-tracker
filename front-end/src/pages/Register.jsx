import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'EGP', label: 'EGP — Egyptian Pound' },
  { code: 'SAR', label: 'SAR — Saudi Riyal' },
  { code: 'AED', label: 'AED — UAE Dirham' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
];

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  currency: 'USD',
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;

  const map = {
    0: { label: '', color: '' },
    1: { label: 'Very Weak', color: 'var(--color-expense)' },
    2: { label: 'Weak', color: 'var(--color-expense)' },
    3: { label: 'Fair', color: 'var(--color-warning)' },
    4: { label: 'Good', color: 'var(--color-info)' },
    5: { label: 'Strong', color: 'var(--color-income)' },
  };
  return { score, ...map[score] };
};

const Register = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();
  const pwStrength = getPasswordStrength(form.password);

  const validate = () => {
    const e = {};
    if (!form.name.trim())
      e.name = 'Name is required.';
    else if (form.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters.';

    if (!form.email.trim())
      e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Enter a valid email address.';

    if (!form.password)
      e.password = 'Password is required.';
    else if (form.password.length < 8)
      e.password = 'Password must be at least 8 characters.';
    else if (pwStrength.score < 3)
      e.password = 'Password is too weak. Add uppercase, numbers, and symbols.';

    if (!form.confirmPassword)
      e.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match.';

    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        currency: form.currency,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo__icon">💰</div>
          <span className="auth-logo__text">Expense Tracker</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start tracking your finances today — it's free</p>

        {/* API Error */}
        {apiError && (
          <div style={{
            background: 'var(--color-expense-bg)',
            border: '1px solid var(--color-expense)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-expense)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>⚠️</span>
            {apiError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name <span className="required">*</span>
            </label>
            <input
              id="name" name="name" type="text"
              autoComplete="name" autoFocus
              className={`form-input${errors.name ? ' form-input--error' : ''}`}
              placeholder="Ahmed Hassan"
              value={form.name}
              onChange={handleChange}
            />
            {errors.name && <span className="form-error">⚠ {errors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email address <span className="required">*</span>
            </label>
            <input
              id="email" name="email" type="email"
              autoComplete="email"
              className={`form-input${errors.email ? ' form-input--error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <span className="form-error">⚠ {errors.email}</span>}
          </div>

          {/* Currency */}
          <div className="form-group">
            <label className="form-label" htmlFor="currency">
              Preferred Currency <span className="required">*</span>
            </label>
            <select
              id="currency" name="currency"
              className="form-select"
              value={form.currency}
              onChange={handleChange}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              id="password" name="password" type="password"
              autoComplete="new-password"
              className={`form-input${errors.password ? ' form-input--error' : ''}`}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
            />
            {/* Password requirements */}
            <div style={{
              marginTop: '8px',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.8,
            }}>
              <strong>Password must contain:</strong>
              <div>• At least 8 characters</div>
              <div>• At least one uppercase letter (A–Z)</div>
              <div>• At least one lowercase letter (a–z)</div>
              <div>• At least one number (0–9)</div>
              <div>• At least one special character</div>
            </div>
            {/* Strength meter */}
            {form.password && (
              <div style={{ marginTop: 6 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '3px',
                  marginBottom: '4px',
                }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{
                      height: 3,
                      borderRadius: 2,
                      background: i <= pwStrength.score ? pwStrength.color : 'var(--color-border)',
                      transition: 'background 300ms ease',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: pwStrength.color, fontWeight: 600 }}>
                  {pwStrength.label}
                </span>
              </div>
            )}
            {errors.password && <span className="form-error">⚠ {errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password <span className="required">*</span>
            </label>
            <input
              id="confirmPassword" name="confirmPassword" type="password"
              autoComplete="new-password"
              className={`form-input${errors.confirmPassword ? ' form-input--error' : ''}`}
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && (
              <span className="form-error">⚠ {errors.confirmPassword}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn--primary btn--lg btn--full"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16, height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Creating account…
              </>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;