import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function NeumorphicRadarIcon({ className = "", size = 26, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="neuRadarRim" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A1A22" />
          <stop offset="100%" stopColor="#08080C" />
        </linearGradient>
        <radialGradient id="neuRadarCenter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FCE2E9" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#F2B8C6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F2B8C6" stopOpacity="0" />
        </radialGradient>
        <filter id="neuSoftBevel" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1.5" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.7" />
          <feDropShadow dx="-1" dy="-1" stdDeviation="1.2" floodColor="#FFFFFF" floodOpacity="0.06" />
        </filter>
      </defs>
      {/* Outer Clay Disc */}
      <circle cx="14" cy="14" r="12" fill="url(#neuRadarRim)" filter="url(#neuSoftBevel)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      {/* Mid Ring Emboss */}
      <circle cx="14" cy="14" r="7.5" stroke="#F2B8C6" strokeWidth="1.2" strokeOpacity="0.45" strokeDasharray="3 2" />
      {/* Center Radar Sweep */}
      <path d="M14 14 L22 8.5 A 10 10 0 0 0 14 4 Z" fill="url(#neuRadarCenter)" />
      {/* Center Raised Node */}
      <circle cx="14" cy="14" r="3" fill="#F2B8C6" />
      <circle cx="14" cy="14" r="1.5" fill="#F7F6F3" />
      {/* Detected Anomaly Pin */}
      <circle cx="19.5" cy="9.5" r="1.8" fill="#A8B5E0" />
      <circle cx="19.5" cy="9.5" r="3.2" stroke="#A8B5E0" strokeWidth="0.8" strokeOpacity="0.5" />
    </svg>
  );
}

export function NeumorphicTreeIcon({ className = "", size = 26, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="neuTreeRim" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A1A22" />
          <stop offset="100%" stopColor="#08080C" />
        </linearGradient>
        <filter id="neuPillBevel">
          <feDropShadow dx="1" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.6" />
          <feDropShadow dx="-0.8" dy="-0.8" stdDeviation="0.8" floodColor="#FFFFFF" floodOpacity="0.08" />
        </filter>
      </defs>
      {/* Background Plate */}
      <rect x="2" y="2" width="24" height="24" rx="7" fill="url(#neuTreeRim)" filter="url(#neuPillBevel)" stroke="rgba(255,255,255,0.05)" />
      {/* Root Node */}
      <circle cx="14" cy="6.5" r="2.5" fill="#F2B8C6" />
      {/* Decision Branches */}
      <path d="M14 9 L8 14.5 M14 9 L20 14.5" stroke="#F2B8C6" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.6" />
      {/* Split Nodes */}
      <circle cx="8" cy="15" r="2" fill="#A8B5E0" />
      <circle cx="20" cy="15" r="2" fill="#A8B5E0" />
      {/* Child Branches */}
      <path d="M8 17 L5.5 21.5 M8 17 L10.5 21.5 M20 17 L17.5 21.5 M20 17 L22.5 21.5" stroke="#8E8E98" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" />
      {/* Leaf Nodes */}
      <circle cx="5.5" cy="22" r="1.5" fill="#F2B8C6" />
      <circle cx="10.5" cy="22" r="1.5" fill="#A8B5E0" />
      <circle cx="17.5" cy="22" r="1.5" fill="#A8B5E0" />
      <circle cx="22.5" cy="22" r="1.5" fill="#F2B8C6" />
    </svg>
  );
}

export function NeumorphicShieldCheckIcon({ className = "", size = 26, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="neuShieldBlue" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#181C2A" />
          <stop offset="100%" stopColor="#0A0D16" />
        </linearGradient>
      </defs>
      {/* Soft Shield Base */}
      <path
        d="M14 3.5 L23 7.5 V13.5 C23 19.5 19 23.5 14 25.5 C9 23.5 5 19.5 5 13.5 V7.5 L14 3.5 Z"
        fill="url(#neuShieldBlue)"
        stroke="#A8B5E0"
        strokeWidth="1.2"
      />
      {/* Checkmark */}
      <path
        d="M10 13.5 L13 16.5 L18.5 11"
        stroke="#A8B5E0"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NeumorphicShieldAlertIcon({ className = "", size = 26, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="neuShieldRed" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#241418" />
          <stop offset="100%" stopColor="#100609" />
        </linearGradient>
      </defs>
      {/* Soft Shield Base */}
      <path
        d="M14 3.5 L23 7.5 V13.5 C23 19.5 19 23.5 14 25.5 C9 23.5 5 19.5 5 13.5 V7.5 L14 3.5 Z"
        fill="url(#neuShieldRed)"
        stroke="#F2B8C6"
        strokeWidth="1.2"
      />
      {/* Exclamation */}
      <path d="M14 9.5 V15" stroke="#F2B8C6" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="14" cy="18.5" r="1.2" fill="#F2B8C6" />
    </svg>
  );
}

export function NeumorphicSliderScaleIcon({ className = "", size = 26, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="neuScaleTrack" x1="4" y1="14" x2="24" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#060608" />
          <stop offset="100%" stopColor="#161620" />
        </linearGradient>
      </defs>
      {/* Outer Raised Plate */}
      <rect x="2" y="2" width="24" height="24" rx="7" fill="#0F0F14" stroke="rgba(255,255,255,0.05)" />
      {/* Inset Track 1 */}
      <rect x="5" y="9" width="18" height="3" rx="1.5" fill="url(#neuScaleTrack)" />
      <circle cx="11" cy="10.5" r="3.2" fill="#F2B8C6" stroke="#FCE2E9" strokeWidth="1" />
      {/* Inset Track 2 */}
      <rect x="5" y="16" width="18" height="3" rx="1.5" fill="url(#neuScaleTrack)" />
      <circle cx="18" cy="17.5" r="3.2" fill="#A8B5E0" stroke="#FFFFFF" strokeWidth="1" />
    </svg>
  );
}

export function NeumorphicSpikeIcon({ className = "", size = 26, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="neuSpikeBg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A1A22" />
          <stop offset="100%" stopColor="#08080C" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="24" height="24" rx="7" fill="url(#neuSpikeBg)" stroke="rgba(255,255,255,0.05)" />
      {/* Telemetry Sparkline with Anomaly Spike */}
      <path
        d="M5 18 L9 18 L11 15 L14 7 L17 21 L19 16 L23 16"
        stroke="#F2B8C6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Peak Anomaly Circle */}
      <circle cx="14" cy="7" r="2.2" fill="#A8B5E0" stroke="#FFFFFF" strokeWidth="0.8" />
    </svg>
  );
}
