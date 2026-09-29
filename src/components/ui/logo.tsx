import React from "react";

export function ParinaamLogo({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 overflow-hidden rounded-xl shadow-xs transition-transform ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF7ED" />
            <stop offset="30%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F0FDF4" />
          </linearGradient>
          <linearGradient id="orangeGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
          <linearGradient id="greenGrad" x1="20" y1="20" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>

        {/* Card Background */}
        <rect
          x="1"
          y="1"
          width="70"
          height="70"
          rx="18"
          fill="url(#bgGrad)"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />

        {/* Top-left Orange Arch */}
        <path
          d="M14 36 C14 22 22 14 36 14 C30 18 24 24 22 34 Z"
          fill="url(#orangeGrad)"
        />

        {/* Bottom-right Green Arch */}
        <path
          d="M26 58 C44 58 58 44 58 26 C58 38 46 54 26 58 Z"
          fill="url(#greenGrad)"
        />

        {/* Center Test Tube & Leaf */}
        {/* Test Tube Body */}
        <path
          d="M32 24 L32 44 C32 48.4 35.6 52 40 52 C44.4 52 48 48.4 48 44 L48 24 Z"
          fill="#15803D"
        />
        {/* Test Tube Liquid / Inner */}
        <path
          d="M34 32 L34 44 C34 47.3 36.7 50 40 50 C43.3 50 46 47.3 46 44 L46 32 Z"
          fill="#DCFCE7"
        />
        {/* Chemical Liquid level */}
        <path
          d="M35 38 L35 44 C35 46.8 37.2 49 40 49 C42.8 49 45 46.8 45 44 L45 38 Z"
          fill="#F59E0B"
        />
        {/* Test Tube Cap Lip */}
        <rect x="30" y="22" width="20" height="4" rx="2" fill="#15803D" />

        {/* Bubbles inside tube */}
        <circle cx="40" cy="42" r="1.5" fill="#FFFFFF" />
        <circle cx="38" cy="45" r="1" fill="#FFFFFF" />

        {/* Sprouting Leaf */}
        <path
          d="M44 22 C48 16 56 16 54 22 C52 28 46 26 44 22 Z"
          fill="#16A34A"
        />
      </svg>
    </div>
  );
}

export function ParinaamBrandLockup({
  size = 40,
  className = "",
  showSubtitle = true,
}: {
  size?: number;
  className?: string;
  showSubtitle?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <ParinaamLogo size={size} />
      <div className="flex flex-col">
        <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">
          PARINAAM
        </span>
        {showSubtitle && (
          <span className="text-[10.5px] uppercase tracking-wider font-medium text-slate-500">
            Forensic Assays · Central Review Portal
          </span>
        )}
      </div>
    </div>
  );
}
