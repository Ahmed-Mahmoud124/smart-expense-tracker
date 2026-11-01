import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const INITIAL_FORM = { email: '', password: '' };

const Login = () => {
  const [form,    setForm]    = useState(INITIAL_FORM);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { login }    = useAuth();
  const navigate     = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email.trim())            e.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password)                e.password = 'Password is required.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name])  setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError)      setApiError('');
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
      await login({ email: form.email.trim(), password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo__icon">💰</div>
          <span className="auth-logo__text">Expense Tracker</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {/* API Error Banner */}
        {apiError && (
          <div style={{
            background   : 'var(--color-expense-bg)',
            border       : '1px solid var(--color-expense)',
            borderRadius : 'var(--radius-md)',
            padding      : '12px 16px',
            marginBottom : '20px',
            fontSize     : 'var(--text-sm)',
            color        : 'var(--color-expense)',
            display      : 'flex',
            alignItems   : 'center',
            gap          : '8px',
          }}>
            <span>⚠️</span>
            {apiError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email address <span className="required">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              className={`form-input${errors.email ? ' form-input--error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <span className="form-error">⚠ {errors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={`form-input${errors.password ? ' form-input--error' : ''}`}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && <span className="form-error">⚠ {errors.password}</span>}
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
                Signing in…
              </>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div style={{
          marginTop    : '20px',
          padding      : '12px 16px',
          background   : 'var(--color-bg-tertiary)',
          border       : '1px solid var(--color-border)',
          borderRadius : 'var(--radius-md)',
          fontSize     : 'var(--text-xs)',
          color        : 'var(--color-text-muted)',
        }}>
          <strong style={{ color: 'var(--color-text-secondary)' }}>Demo account:</strong>{' '}
          ahmed@example.com / Test@1234
        </div>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;