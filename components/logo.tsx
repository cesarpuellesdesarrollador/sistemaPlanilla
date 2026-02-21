import React from 'react';

export const AuraLogo = ({ className = "w-8 h-8", color = "currentColor" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="eduGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    {/* Libro abierto */}
    <path d="M20 30 Q20 25 25 25 L45 25 Q50 25 50 30 L50 75 Q50 70 45 70 L25 70 Q20 70 20 75 Z" fill="url(#eduGradient)" opacity="0.2"/>
    <path d="M80 30 Q80 25 75 25 L55 25 Q50 25 50 30 L50 75 Q50 70 55 70 L75 70 Q80 70 80 75 Z" fill="url(#eduGradient)" opacity="0.2"/>
    <path d="M20 30 Q20 25 25 25 L45 25 Q50 25 50 30 L50 75" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M80 30 Q80 25 75 25 L55 25 Q50 25 50 30 L50 75" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Líneas del libro */}
    <path d="M30 40 L45 40" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <path d="M30 50 L45 50" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <path d="M55 40 L70 40" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <path d="M55 50 L70 50" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
  </svg>
);