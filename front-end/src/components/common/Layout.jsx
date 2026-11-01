import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

const PAGE_TITLES = {
  '/dashboard'   : { title: 'Dashboard',    subtitle: 'Your financial overview' },
  '/transactions': { title: 'Transactions', subtitle: 'Manage your income & expenses' },
  '/budgets'     : { title: 'Budgets',      subtitle: 'Track your spending limits' },
  '/analytics'   : { title: 'Analytics',    subtitle: 'Deep dive into your finances' },
  '/profile'     : { title: 'Profile',      subtitle: 'Manage your account settings' },
};

const Layout = () => {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout }  = useAuth();
  const location          = useLocation();
  const userMenuRef       = useRef(null);

  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'Expense Tracker', subtitle: '' };

  const getInitials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // Close user-menu on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-layout">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position      : 'fixed',
            inset         : 0,
            background    : 'rgba(0,0,0,0.65)',
            zIndex        : 199,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`app-sidebar${sidebarOpen ? ' open' : ''}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* ── Main ── */}
      <div className="app-main">

        {/* Top bar */}
        <header className="app-topbar">

          {/* Hamburger */}
          <button
            className="btn btn--ghost btn--icon"
            onClick={() => setSidebarOpen((p) => !p)}
            aria-label="Toggle sidebar"
            style={{ marginRight: 12, display: 'none' }}
            id="layout-hamburger"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M2 4.5h14M2 9h14M2 13.5h14"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Page title */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize  : 'var(--text-lg)',
              fontWeight: 700,
              lineHeight: 1.2,
            }}>
              {pageInfo.title}
            </h1>
            {pageInfo.subtitle && (
              <p style={{
                fontSize : 'var(--text-xs)',
                color    : 'var(--color-text-muted)',
                marginTop: 2,
              }}>
                {pageInfo.subtitle}
              </p>
            )}
          </div>

          {/* Right section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

            {/* Date */}
            <span style={{
              fontSize  : 'var(--text-xs)',
              color     : 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month  : 'short',
                day    : 'numeric',
              })}
            </span>

            {/* Avatar + dropdown */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                style={{
                  display     : 'flex',
                  alignItems  : 'center',
                  gap         : 8,
                  background  : 'var(--color-bg-tertiary)',
                  border      : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding     : '6px 10px 6px 6px',
                  cursor      : 'pointer',
                  color       : 'var(--color-text-primary)',
                  transition  : 'all var(--transition-fast)',
                }}
              >
                {/* Avatar circle */}
                <div style={{
                  width          : 28,
                  height         : 28,
                  borderRadius   : '50%',
                  background     : 'var(--color-accent-light)',
                  border         : '1px solid var(--color-accent)',
                  display        : 'flex',
                  alignItems     : 'center',
                  justifyContent : 'center',
                  fontSize       : 11,
                  fontWeight     : 700,
                  color          : 'var(--color-accent)',
                  flexShrink     : 0,
                }}>
                  {getInitials(user?.name)}
                </div>

                <span style={{
                  fontSize    : 'var(--text-sm)',
                  fontWeight  : 600,
                  maxWidth    : 100,
                  overflow    : 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace  : 'nowrap',
                }}>
                  {user?.name?.split(' ')[0]}
                </span>

                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <div style={{
                  position    : 'absolute',
                  top         : 'calc(100% + 8px)',
                  right       : 0,
                  background  : 'var(--color-bg-card)',
                  border      : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding     : 6,
                  minWidth    : 200,
                  boxShadow   : 'var(--shadow-lg)',
                  zIndex      : 'var(--z-dropdown)',
                  animation   : 'slideUp 150ms ease',
                }}>

                  {/* User info */}
                  <div style={{
                    padding      : '10px 12px 8px',
                    borderBottom : '1px solid var(--color-border)',
                    marginBottom : 6,
                  }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      {user?.name}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {user?.email}
                    </div>
                  </div>

                  {/* Profile link */}
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display       : 'flex',
                      alignItems    : 'center',
                      gap           : 10,
                      padding       : '8px 12px',
                      borderRadius  : 'var(--radius-md)',
                      fontSize      : 'var(--text-sm)',
                      color         : 'var(--color-text-primary)',
                      textDecoration: 'none',
                      transition    : 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span>👤</span>
                    Profile Settings
                  </Link>

                  {/* Logout */}
                  <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 6, paddingTop: 6 }}>
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                      style={{
                        display    : 'flex',
                        alignItems : 'center',
                        gap        : 10,
                        padding    : '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize   : 'var(--text-sm)',
                        color      : 'var(--color-expense)',
                        background : 'transparent',
                        border     : 'none',
                        cursor     : 'pointer',
                        width      : '100%',
                        transition : 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-expense-bg)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span>🚪</span>
                      Sign Out
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page outlet */}
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {/* Show hamburger on mobile */}
      <style>{`
        @media (max-width: 768px) {
          #layout-hamburger { display: flex !important; }
        }
      `}</style>

    </div>
  );
};

export default Layout;