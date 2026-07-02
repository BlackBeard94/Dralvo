import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

export function LogoMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/brand/dralvo-mark-512.png"
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      className={cn("shrink-0 rounded-[22%] object-cover", className)}
      // When a responsive size className is supplied, let it drive the rendered
      // size; otherwise fall back to the fixed inline size (unchanged behavior).
      style={className ? undefined : { width: size, height: size }}
    />
  );
}

export function DralvoWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display uppercase tracking-[0.12em] text-text-primary",
        className,
      )}
    >
      DRA<span className="text-gold">L</span>VO
    </span>
  );
}

export function BrandLink({
  className,
  logoSize = 72,
  logoClassName,
  wordmarkClassName = "text-2xl transition-colors group-hover:text-text-primary",
}: {
  className?: string;
  logoSize?: number;
  /** Responsive size classes for the logo (e.g. "h-11 w-11 sm:h-[72px] sm:w-[72px]"). */
  logoClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-4 no-underline", className)}
      aria-label="Dralvo home"
    >
      <LogoMark size={logoSize} className={logoClassName} />
      <DralvoWordmark className={wordmarkClassName} />
    </Link>
  );
}
