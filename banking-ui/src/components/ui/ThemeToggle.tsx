import { useState, useEffect } from 'react';

export const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute(
      'data-theme', next ? 'dark' : 'light'
    );
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    setIsDark(saved === 'dark');
  }, []);

  return (
    <button
      onClick={toggle}
      style={{
        background: 'transparent',
        border: '1.5px solid var(--border-color)',
        color: 'var(--navbar-text)',
        borderRadius: '8px',
        padding: '0.4rem 0.75rem',
        cursor: 'pointer',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'all 0.2s',
        fontWeight: '500'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>
        {isDark ? '☀️' : '🌙'}
      </span>
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
};
