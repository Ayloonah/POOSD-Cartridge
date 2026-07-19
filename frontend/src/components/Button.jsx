import React from 'react';

export default function Button({ children, variant = 'primary', style, onClick }) {
  const baseStyle = {
    padding: '10px 24px',
    borderRadius: '4px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'Inter',
    border: 'none',
    ...style
  };

  const variants = {
    primary: { backgroundColor: '#143910', color: '#FFFFFF' },
    secondary: { backgroundColor: '#98B910', color: '#143910' },
    tertiary: { backgroundColor: '#E5E7EB', color: '#111827' },
  };

  return (
    <button style={{ ...baseStyle, ...variants[variant] }} onClick={onClick}>
      {children}
    </button>
  );
}