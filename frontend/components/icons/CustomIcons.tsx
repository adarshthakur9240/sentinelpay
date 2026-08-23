import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function RadarSweepIcon({ className = "", size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6C875" />
          <stop offset="100%" stopColor="#C9A24D" />
        </linearGradient>
        <radialGradient id="radarPing" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E6C875" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#C9A24D" stopOpacity="0" />
        </radialGradient>
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Outer radar circle */}
      <circle cx="12" cy="12" r="9.5" stroke="url(#goldGrad)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      {/* Mid radar circle */}
      <circle cx="12" cy="12" r="6" stroke="url(#goldGrad)" strokeWidth="1.2" opacity="0.4" />
      {/* Crosshairs */}
      <line x1="12" y1="2.5" x2="12" y2="21.5" stroke="url(#goldGrad)" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="2 2" />
      <line x1="2.5" y1="12" x2="21.5" y2="12" stroke="url(#goldGrad)" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="2 2" />
      {/* Radar sweep sector */}
      <path d="M12 12 L19.5 7 A 9.5 9.5 0 0 0 12 2.5 Z" fill="url(#radarPing)" opacity="0.75" />
      {/* Center ping */}
      <circle cx="12" cy="12" r="2.2" fill="url(#goldGrad)" filter="url(#goldGlow)" />
      {/* Detected anomaly ping */}
      <circle cx="17.5" cy="8" r="1.5" fill="#C4707A" />
      <circle cx="17.5" cy="8" r="3" stroke="#C4707A" strokeWidth="0.8" strokeOpacity="0.5" />
    </svg>
  );
}

export function BiometricShieldIcon({ className = "", size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6C875" />
          <stop offset="100%" stopColor="#C9A24D" />
        </linearGradient>
      </defs>
      {/* Shield boundary */}
      <path
        d="M12 2.5 L20 6.5 V12 C20 17 16.5 20.8 12 22 C7.5 20.8 4 17 4 12 V6.5 L12 2.5 Z"
        stroke="url(#shieldGrad)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Inner biometric fingerprint arches */}
      <path d="M12 7.5 C10 7.5 8.5 9 8.5 11 C8.5 14 10 16 12 16" stroke="url(#shieldGrad)" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      <path d="M12 9.5 C10.8 9.5 10 10.3 10 11.5 C10 13.5 11.2 14.8 12 14.8 C12.8 14.8 14 13.5 14 11.5" stroke="url(#shieldGrad)" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
      <path d="M14 8.5 C15 9.5 15.5 10.8 15.5 12.2 C15.5 15 13.8 17.5 12 18.5" stroke="url(#shieldGrad)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <circle cx="12" cy="11.5" r="0.8" fill="#E6C875" />
    </svg>
  );
}

export function TreeAttributionIcon({ className = "", size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="treeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6C875" />
          <stop offset="100%" stopColor="#C9A24D" />
        </linearGradient>
      </defs>
      {/* Root node */}
      <circle cx="12" cy="4" r="2.2" stroke="url(#treeGrad)" strokeWidth="1.5" fill="#12121A" />
      {/* Primary branches */}
      <path d="M12 6.5 V10 M12 10 L6.5 14 M12 10 L17.5 14" stroke="url(#treeGrad)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Mid nodes */}
      <circle cx="6.5" cy="14" r="1.8" stroke="url(#treeGrad)" strokeWidth="1.3" fill="#12121A" />
      <circle cx="17.5" cy="14" r="1.8" stroke="url(#treeGrad)" strokeWidth="1.3" fill="#12121A" />
      {/* Sub branches */}
      <path d="M6.5 16 L4 19.5 M6.5 16 L9 19.5 M17.5 16 L15 19.5 M17.5 16 L20 19.5" stroke="url(#treeGrad)" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      {/* Leaf attribution nodes */}
      <circle cx="4" cy="20" r="1.4" fill="#C9A24D" />
      <circle cx="9" cy="20" r="1.4" fill="#C4707A" />
      <circle cx="15" cy="20" r="1.4" fill="#C9A24D" />
      <circle cx="20" cy="20" r="1.4" fill="#C4707A" />
    </svg>
  );
}

export function TelemetrySpikeIcon({ className = "", size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C9A24D" stopOpacity="0.4" />
          <stop offset="45%" stopColor="#E6C875" />
          <stop offset="55%" stopColor="#C4707A" />
          <stop offset="100%" stopColor="#C9A24D" stopOpacity="0.4" />
        </linearGradient>
        <filter id="spikeGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Baseline trace line */}
      <path
        d="M2 13.5 H6 L8.5 10 L10.5 16 L12.5 3.5 L14.5 21 L16.5 11 L18.5 13.5 H22"
        stroke="url(#waveGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Peak Anomaly Marker */}
      <circle cx="12.5" cy="3.5" r="2" fill="#C4707A" filter="url(#spikeGlow)" />
      <circle cx="12.5" cy="3.5" r="4.5" stroke="#C4707A" strokeWidth="0.8" strokeOpacity="0.5" />
    </svg>
  );
}

export function CostMatrixIcon({ className = "", size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="costGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6C875" />
          <stop offset="100%" stopColor="#C9A24D" />
        </linearGradient>
      </defs>
      {/* Fulcrum pillar */}
      <path d="M12 5 V19 M8 20.5 H16" stroke="url(#costGrad)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="5" r="1.8" fill="#E6C875" />
      {/* Beam tilted to optimal threshold point */}
      <path d="M4.5 9.5 L19.5 7" stroke="url(#costGrad)" strokeWidth="1.6" strokeLinecap="round" />
      {/* Left Pan (Fraud Loss) */}
      <path d="M4.5 9.5 V14 M2 14 Q4.5 16.5 7 14 Z" stroke="#C4707A" strokeWidth="1.3" strokeLinejoin="round" fill="#C4707A" fillOpacity="0.15" />
      {/* Right Pan (Friction Cost) */}
      <path d="M19.5 7 V12 M17 12 Q19.5 14.5 22 12 Z" stroke="url(#costGrad)" strokeWidth="1.3" strokeLinejoin="round" fill="#C9A24D" fillOpacity="0.15" />
    </svg>
  );
}
