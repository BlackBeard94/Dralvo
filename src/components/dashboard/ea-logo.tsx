/**
 * Hand-drawn SVG logos for each Dralvo EA — original marks, not stock icons.
 *  - GoldMaster: a gold crown (the patient "king" of D1 swings)
 *  - GoldScalp:  a steel lightning bolt (fast M15 momentum)
 *  - TiGold:     an emerald adaptive node / atom (M1 adaptive engine)
 */

export type EaId = "goldmaster" | "goldscalp" | "tigold" | "goldwave";

export function EaLogo({ ea, size = 48 }: { ea: EaId; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    role: "img" as const,
    "aria-hidden": true,
  };

  if (ea === "goldmaster") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="gm-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a2e0e" />
            <stop offset="1" stopColor="#15100a" />
          </linearGradient>
          <linearGradient id="gm-crown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f0c85a" />
            <stop offset="1" stopColor="#c79a26" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="url(#gm-bg)" stroke="#d4a82d" strokeOpacity="0.55" />
        <path
          d="M13 31 L13 19 L18.5 24 L24 15.5 L29.5 24 L35 19 L35 31 Z"
          fill="url(#gm-crown)"
        />
        <rect x="13" y="32" width="22" height="3.4" rx="1.4" fill="#f0c85a" />
        <circle cx="13" cy="19" r="1.7" fill="#fbe7a6" />
        <circle cx="24" cy="15.5" r="1.9" fill="#fbe7a6" />
        <circle cx="35" cy="19" r="1.7" fill="#fbe7a6" />
      </svg>
    );
  }

  if (ea === "goldscalp") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="gs-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#14283a" />
            <stop offset="1" stopColor="#0a1118" />
          </linearGradient>
          <linearGradient id="gs-bolt" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8fd0ff" />
            <stop offset="1" stopColor="#3f8fd0" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="url(#gs-bg)" stroke="#5aa9e6" strokeOpacity="0.55" />
        <path
          d="M27 8 L15 26 L22.5 26 L20 40 L34 20 L26 20 Z"
          fill="url(#gs-bolt)"
        />
        <path d="M12 18 H17" stroke="#5aa9e6" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M11 23 H15" stroke="#5aa9e6" strokeOpacity="0.4" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (ea === "goldwave") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="gw-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#123a5a" />
            <stop offset="1" stopColor="#0a1622" />
          </linearGradient>
          <linearGradient id="gw-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8fd0ff" />
            <stop offset="1" stopColor="#2b7fbf" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="url(#gw-bg)" stroke="#2b7fbf" strokeOpacity="0.55" />
        <path d="M8 26 Q14 16 20 23 T32 23 T40 20" fill="none" stroke="url(#gw-wave)" strokeWidth="2.7" strokeLinecap="round" />
        <path d="M8 33 Q14 24 20 30 T32 30 T40 27" fill="none" stroke="#2b7fbf" strokeOpacity="0.5" strokeWidth="2.1" strokeLinecap="round" />
      </svg>
    );
  }

  // tigold
  return (
    <svg {...common}>
      <defs>
        <linearGradient id="tg-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0e2f24" />
          <stop offset="1" stopColor="#091611" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="url(#tg-bg)" stroke="#00c98d" strokeOpacity="0.55" />
      <polygon
        points="24,12 34,18 34,30 24,36 14,30 14,18"
        fill="none"
        stroke="#00c98d"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <ellipse cx="24" cy="24" rx="11" ry="4.5" fill="none" stroke="#00c98d" strokeOpacity="0.45" strokeWidth="1.4" transform="rotate(-30 24 24)" />
      <circle cx="24" cy="24" r="3.2" fill="#34e0ad" />
      <circle cx="24" cy="12" r="1.8" fill="#34e0ad" />
      <circle cx="34" cy="30" r="1.8" fill="#34e0ad" />
      <circle cx="14" cy="30" r="1.8" fill="#34e0ad" />
    </svg>
  );
}
