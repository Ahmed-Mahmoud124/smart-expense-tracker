import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { path: '/dashboard',    icon: '📊', label: 'Dashboard'    },
  { path: '/transactions', icon: '💳', label: 'Transactions' },
  { path: '/budgets',      icon: '🎯', label: 'Budgets'      },
  { path: '/analytics',   icon: '📈', label: 'Analytics'    },
  { path: '/profile',      icon: '👤', label: 'Profile'      },
];

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav style={{
      display       : 'flex',
      flexDirection : 'column',
      height        : '100%',
      padding       : '0',
      overflowY     : 'auto',
      overflowX     : 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding      : '24px 20px',
        borderBottom : '1px solid var(--color-border)',
        display      : 'flex',
        alignItems   : 'center',
        gap          : '12px',
        flexShrink   : 0,
      }}>
        <div style={{
          width           : 38,
          height          : 38,
          background      : 'var(--color-accent-light)',
          border          : '1px solid var(--color-accent)',
          borderRadius    : 'var(--radius-lg)',
          display         : 'flex',
          alignItems      : 'center',
          justifyContent  : 'center',
          fontSize        : '1.1rem',
          flexShrink      : 0,
        }}>
          💰
        </div>
        <div className="sidebar-label">
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, lineHeight: 1.1 }}>
            Expense
          </div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1.1 }}>
            Tracker
          </div>
        </div>
      </div>

      {/* User info strip */}
      <div style={{
        padding      : '16px 20px',
        borderBottom : '1px solid var(--color-border)',
        flexShrink   : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width           : 34,
            height          : 34,
            background      : 'var(--color-accent-light)',
            border          : '1px solid var(--color-accent)',
            borderRadius    : '50%',
            display         : 'flex',
            alignItems      : 'center',
            justifyContent  : 'center',
            fontSize        : '11px',
            fontWeight      : 700,
            color           : 'var(--color-accent)',
            flexShrink      : 0,
          }}>
            {getInitials(user?.name)}
          </div>
          <div className="sidebar-label" style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize     : 'var(--text-sm)',
              fontWeight   : 600,
              overflow     : 'hidden',
              textOverflow : 'ellipsis',
              whiteSpace   : 'nowrap',
            }}>
              {user?.name}
            </div>
            <div style={{
              fontSize     : 'var(--text-xs)',
              color        : 'var(--color-text-muted)',
              overflow     : 'hidden',
              textOverflow : 'ellipsis',
              whiteSpace   : 'nowrap',
            }}>
              {user?.currency} Account
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{
          fontSize     : 'var(--text-xs)',
          fontWeight   : 600,
          color        : 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding      : '8px 10px 4px',
        }} className="sidebar-label">
          Navigation
        </div>

        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              style={{
                display        : 'flex',
                alignItems     : 'center',
                gap            : '12px',
                padding        : '10px',
                borderRadius   : 'var(--radius-md)',
                fontSize       : 'var(--text-sm)',
                fontWeight     : isActive ? 600 : 500,
                color          : isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                background     : isActive ? 'var(--color-accent-light)' : 'transparent',
                border         : `1px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
                transition     : 'all var(--transition-fast)',
                textDecoration : 'none',
                whiteSpace     : 'nowrap',
                overflow       : 'hidden',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--color-bg-hover)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }
              }}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        <button
          onClick={logout}
          style={{
            display        : 'flex',
            alignItems     : 'center',
            gap            : '12px',
            padding        : '10px',
            borderRadius   : 'var(--radius-md)',
            fontSize       : 'var(--text-sm)',
            fontWeight     : 500,
            color          : 'var(--color-text-muted)',
            background     : 'transparent',
            border         : '1px solid transparent',
            cursor         : 'pointer',
            width          : '100%',
            transition     : 'all var(--transition-fast)',
            whiteSpace     : 'nowrap',
            overflow       : 'hidden',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background   = 'var(--color-expense-bg)';
            e.currentTarget.style.color        = 'var(--color-expense)';
            e.currentTarget.style.borderColor  = 'var(--color-expense)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background   = 'transparent';
            e.currentTarget.style.color        = 'var(--color-text-muted)';
            e.currentTarget.style.borderColor  = 'transparent';
          }}
        >
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🚪</span>
          <span className="sidebar-label">Sign Out</span>
        </button>
      </div>

      {/* Sidebar label collapse CSS */}
      <style>{`
        @media (max-width: 1024px) and (min-width: 769px) {
          .sidebar-label { display: none !important; }
          .app-sidebar   { width: var(--sidebar-collapsed) !important; }
        }
      `}</style>
    </nav>
  );
};

export default Sidebar;