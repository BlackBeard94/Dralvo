import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoGoldGrad" x1="128" y1="0" x2="128" y2="256" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0C85A" />
          <stop offset="35%" stopColor="#D4A843" />
          <stop offset="65%" stopColor="#C49A3C" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="128" cy="128" r="120" fill="#0C0C14" stroke="#1A1A2A" strokeWidth="2" />
      <circle cx="128" cy="128" r="116" fill="none" stroke="#D4A843" strokeWidth="1" opacity="0.15" />
      {/* Outer hexagon — drill bit silhouette */}
      <polygon
        points="128,36 188,96 172,96 172,172 188,172 128,228 68,172 84,172 84,96 68,96"
        fill="none"
        stroke="url(#logoGoldGrad)"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Inner hexagon — filled */}
      <polygon
        points="128,68 164,104 156,104 156,156 164,156 128,196 92,156 100,156 100,104 92,104"
        fill="rgba(212,168,67,0.15)"
        stroke="#D4A843"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Center vertical line */}
      <line x1="128" y1="68" x2="128" y2="196" stroke="#F0C85A" strokeWidth="2" opacity="0.7" />
      {/* Top and bottom drill shaft */}
      <line x1="128" y1="20" x2="128" y2="68" stroke="url(#logoGoldGrad)" strokeWidth="5" strokeLinecap="round" />
      <line x1="128" y1="196" x2="128" y2="236" stroke="url(#logoGoldGrad)" strokeWidth="5" strokeLinecap="round" />
      {/* Horizontal cross lines */}
      <line x1="100" y1="120" x2="156" y2="120" stroke="#F0C85A" strokeWidth="1" opacity="0.3" />
      <line x1="104" y1="140" x2="152" y2="140" stroke="#F0C85A" strokeWidth="1" opacity="0.2" />
      <line x1="108" y1="160" x2="148" y2="160" stroke="#F0C85A" strokeWidth="1" opacity="0.15" />
      {/* Corner dots */}
      <circle cx="68" cy="96" r="2" fill="#F0C85A" opacity="0.6" />
      <circle cx="188" cy="96" r="2" fill="#F0C85A" opacity="0.6" />
      <circle cx="128" cy="36" r="2.5" fill="#F0C85A" opacity="0.8" />
    </svg>
  );
}

export function DralvoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display tracking-[-0.01em] text-text-primary", className)}>
      Dral<span className="text-gold italic">vo</span>
    </span>
  );
}

export function BrandLink({
  className,
  logoSize = 36,
  wordmarkClassName = "text-xl transition-colors group-hover:text-text-primary",
}: {
  className?: string;
  logoSize?: number;
  wordmarkClassName?: string;
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-3 no-underline group", className)}>
      <LogoMark size={logoSize} />
      <DralvoWordmark className={wordmarkClassName} />
      <span className="sr-only">Dralvo home</span>
    </Link>
  );
}
