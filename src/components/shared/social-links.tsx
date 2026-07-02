/** Official brand logomarks (real platform colors), inline so no icon-library
 *  dependency is needed for just 3 icons. Facebook/YouTube always render in
 *  their fixed brand color; X's mark is intentionally monochrome per its own
 *  brand guidelines, set to white here since the footer background is dark. */
function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.008 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function YoutubeGlyph() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
      <path
        fill="#FF0000"
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
      />
      <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
      <path
        fill="#fff"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { href: "https://www.facebook.com/dralvo.ea/", label: "Facebook", Glyph: FacebookGlyph, bg: "bg-[#1877F2]/10 hover:bg-[#1877F2]/20" },
  { href: "https://www.youtube.com/@dralvo-ea", label: "YouTube", Glyph: YoutubeGlyph, bg: "bg-[#FF0000]/10 hover:bg-[#FF0000]/20" },
  { href: "https://x.com/dralvo_ea", label: "X (Twitter)", Glyph: XGlyph, bg: "bg-white/10 hover:bg-white/20" },
] as const;

/** Social icon row — Facebook / YouTube / X, real brand logomarks + colors.
 *  Same URLs as the Organization JSON-LD `sameAs` (src/app/page.tsx) so SEO
 *  metadata and the visible buttons never drift apart. */
export function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={className ?? "flex items-center gap-3"}>
      {SOCIAL_LINKS.map(({ href, label, Glyph, bg }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-border transition-all hover:scale-105 hover:border-transparent ${bg}`}
        >
          <Glyph />
        </a>
      ))}
    </div>
  );
}
