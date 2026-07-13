/** @format */

import React from 'react';

export default function SearchInput({ value, onChange, placeholder = 'Buscar…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint dark:text-ink-dark-faint pointer-events-none"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-sm text-sm text-ink dark:text-ink-dark placeholder:text-ink-faint dark:placeholder:text-ink-dark-faint focus:border-brand dark:focus:border-brand-dark focus:ring-2 focus:ring-brand-soft dark:focus:ring-brand-dark-soft focus:outline-none transition-all duration-200"
      />
    </div>
  );
}
