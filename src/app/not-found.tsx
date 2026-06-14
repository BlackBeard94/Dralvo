import Link from "next/link";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";

export default function NotFound() {
  return (
    <div className="min-h-screen overflow-hidden bg-deep text-text-primary">
      <nav className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-6">
          <BrandLink />
        </div>
      </nav>
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center">
        <GridPattern />
        <GlowOrb className="h-[600px] w-[600px] -right-40 -top-40" />
        <div className="relative z-10 mx-auto w-full max-w-[900px] px-6 py-24">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
            Error 404
          </div>
          <h1 className="mt-6 max-w-[700px] font-display text-[clamp(48px,8vw,88px)] leading-[1.02] tracking-[-0.03em]">
            This evidence trail ends here.
          </h1>
          <p className="mt-6 max-w-[540px] text-lg leading-relaxed text-text-secondary">
            The page may have moved, or the address is incomplete. Return to
            the gold thesis or review how Dralvo builds it.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-deep no-underline transition-colors hover:bg-gold-bright"
            >
              Return home
            </Link>
            <Link
              href="/methodology"
              className="rounded-lg border border-border-gold px-6 py-3 text-sm font-semibold text-gold no-underline transition-colors hover:bg-gold/10"
            >
              View methodology
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
