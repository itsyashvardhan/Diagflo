
import React from 'react';

interface DiagfloLogoProps {
    className?: string;
    variant?: 'default' | 'solid';
}

export const DiagfloLogo: React.FC<DiagfloLogoProps> = ({ className = "w-8 h-8", variant = 'default' }) => {
    const uniqueId = React.useId();
    const gradId = `df-grad-${uniqueId}`;
    const glowId = `df-glow-${uniqueId}`;

    return (
        <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Diagflo Logo"
        >
            <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Optional 'Solid' Background */}
            {variant === 'solid' && (
                <rect
                    x="4"
                    y="4"
                    width="56"
                    height="56"
                    rx="14"
                    fill={`url(#${gradId})`}
                />
            )}

            {/* The Symbol */}
            <g
                transform={variant === 'solid' ? "translate(0,0)" : "scale(1.1) translate(-3,-3)"}
            >
                {/* Vertical input line */}
                <path
                    d="M22 17 V47"
                    stroke={variant === 'solid' ? "white" : `url(#${gradId})`}
                    strokeWidth="6"
                    strokeLinecap="round"
                />

                {/* The Loop */}
                <path
                    d="M22 17 H32 C43 17 47 25 47 32 C47 39 43 47 32 47 H22"
                    stroke={variant === 'solid' ? "white" : `url(#${gradId})`}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />

                {/* The Node */}
                <circle
                    cx="47"
                    cy="32"
                    r="4"
                    fill={variant === 'solid' ? "white" : `url(#${gradId})`}
                    filter={variant === 'solid' ? "" : `url(#${glowId})`}
                />
            </g>
        </svg>
    );
};
