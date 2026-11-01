import React from 'react';

const LoadingSpinner = ({
  fullScreen = false,
  size       = 'md',
  text       = '',
  color      = 'var(--color-accent)',
}) => {
  const sizes = {
    sm: { spinner: 20, border: 2 },
    md: { spinner: 36, border: 3 },
    lg: { spinner: 52, border: 4 },
    xl: { spinner: 72, border: 5 },
  };

  const { spinner, border } = sizes[size] || sizes.md;

  const spinnerEl = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div
        style={{
          width       : spinner,
          height      : spinner,
          borderRadius: '50%',
          border      : `${border}px solid var(--color-border)`,
          borderTopColor: color,
          animation   : 'spin 0.75s linear infinite',
          flexShrink  : 0,
        }}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <span style={{
          fontSize  : 'var(--text-sm)',
          color     : 'var(--color-text-secondary)',
          fontWeight: 500,
        }}>
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position       : 'fixed',
        inset          : 0,
        background     : 'var(--color-bg-primary)',
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'center',
        flexDirection  : 'column',
        gap            : '24px',
        zIndex         : 9999,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width       : 40,
            height      : 40,
            background  : 'var(--color-accent-light)',
            border      : '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-lg)',
            display     : 'flex',
            alignItems  : 'center',
            justifyContent: 'center',
            fontSize    : '1.25rem',
          }}>
            💰
          </div>
          <span style={{
            fontSize  : 'var(--text-xl)',
            fontWeight: 700,
            color     : 'var(--color-text-primary)',
          }}>
            Expense Tracker
          </span>
        </div>
        {spinnerEl}
        {!text && (
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Loading your financial data…
          </span>
        )}
      </div>
    );
  }

  return spinnerEl;
};

export default LoadingSpinner;