import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/brand/dralvo-mark-512.png"
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0 rounded-[22%] object-cover"
      style={{ width: size, height: size }}
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
  logoSize = 36,
  wordmarkClassName = "text-xl transition-colors group-hover:text-text-primary",
}: {
  className?: string;
  logoSize?: number;
  wordmarkClassName?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-3 no-underline", className)}
      aria-label="Dralvo home"
    >
      <LogoMark size={logoSize} />
      <DralvoWordmark className={wordmarkClassName} />
    </Link>
  );
}
