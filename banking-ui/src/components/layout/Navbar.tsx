import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../ui/ThemeToggle';

interface NavbarProps {
  title?: string;
  backTo?: string;
  backLabel?: string;
}

export const Navbar = ({ title = 'Banking Dashboard', backTo, backLabel }: NavbarProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Left: back button + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {backTo && (
            <button
              onClick={() => navigate(backTo)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.875rem',
                color: 'var(--navbar-text)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {backLabel ?? 'Back'}
            </button>
          )}
          <h1 className="navbar-brand">{title}</h1>
        </div>

        {/* Right: user info + theme toggle + logout */}
        <div className="navbar-menu">
          {user && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem' 
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: '700',
                flexShrink: 0
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ 
                fontSize: '0.875rem', 
                color: 'var(--navbar-text)',
                display: window.innerWidth < 640 ? 'none' : 'block'
              }}>
                {user.name}
              </span>
              {user.role === 'Admin' && (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  borderRadius: '20px',
                  background: 'var(--badge-pending-bg)',
                  color: 'var(--badge-pending-text)',
                  display: window.innerWidth < 640 ? 'none' : 'inline-block'
                }}>
                  Admin
                </span>
              )}
            </div>
          )}

          <ThemeToggle />

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.875rem',
              color: 'var(--accent-red)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span style={{ display: window.innerWidth < 640 ? 'none' : 'block' }}>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
