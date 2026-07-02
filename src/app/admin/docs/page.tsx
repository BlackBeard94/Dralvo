import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/admin/auth";
import { renderMarkdown } from "@/lib/blog/markdown";
import { DOC_GROUPS, DOC_SECTIONS } from "@/lib/admin/docs-content";
import { DocsScrollSpy } from "@/components/admin/docs-scroll-spy";

export const metadata = { title: "Tài liệu — Backoffice", robots: { index: false, follow: false } };

// The active TOC item "lights up" (gold glow + lit indicator bar + a pulse) as
// you scroll to its section. The content card just gets a subtle border.
const GLOW_CSS = `
.doc-card { transition: border-color .45s ease; }
.doc-card.is-active { border-color: rgba(240,200,90,.4); }

[data-toc-link] {
  position: relative;
  transition: color .3s ease, background-color .3s ease, box-shadow .35s ease;
}
[data-toc-link].is-active {
  color: var(--gold-bright, #F0C85A);
  background: rgba(212,168,67,.12);
  font-weight: 600;
  box-shadow: 0 0 0 1px rgba(240,200,90,.35), 0 0 18px -2px rgba(240,200,90,.5);
  animation: tocGlowPulse .7s ease-out;
}
[data-toc-link].is-active::before {
  content: "";
  position: absolute;
  left: 0; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 62%;
  border-radius: 0 3px 3px 0;
  background: var(--gold-bright, #F0C85A);
  box-shadow: 0 0 9px 1px rgba(240,200,90,.85);
}
@keyframes tocGlowPulse {
  0%   { box-shadow: 0 0 0 1px rgba(240,200,90,.35), 0 0 0 0 rgba(240,200,90,0); }
  45%  { box-shadow: 0 0 0 1px rgba(240,200,90,.65), 0 0 28px 2px rgba(240,200,90,.7); }
  100% { box-shadow: 0 0 0 1px rgba(240,200,90,.35), 0 0 18px -2px rgba(240,200,90,.5); }
}
@media (prefers-reduced-motion: reduce) { [data-toc-link].is-active { animation: none; } }
`;

export default async function AdminDocsPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/dashboard");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-start">
      <style dangerouslySetInnerHTML={{ __html: GLOW_CSS }} />
      <DocsScrollSpy />

      {/* TOC */}
      <nav className="lg:sticky lg:top-4 lg:w-56 lg:shrink-0" aria-label="Mục lục">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Mục lục</p>
        <div className="space-y-3">
          {DOC_GROUPS.map((group) => (
            <div key={group}>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-text-muted">{group}</p>
              <ul className="space-y-0.5">
                {DOC_SECTIONS.filter((s) => s.group === group).map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      data-toc-link={s.id}
                      className="block rounded px-2 py-1 text-[13px] text-text-secondary no-underline hover:bg-gold/5 hover:text-gold"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-10">
        <header>
          <h1 className="text-2xl font-semibold text-text-primary">Tài liệu Backoffice</h1>
          <p className="mt-1 text-sm text-text-muted">
            Hướng dẫn API cho agent/dev và cách vận hành từng chức năng trong admin panel.
          </p>
        </header>

        {DOC_GROUPS.map((group) => (
          <section key={group} className="space-y-8">
            <h2 className="border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold">
              {group}
            </h2>
            {DOC_SECTIONS.filter((s) => s.group === group).map((s) => (
              <article
                key={s.id}
                id={s.id}
                className="doc-card scroll-mt-20 rounded-lg border border-border bg-card p-5"
              >
                <h3 className="mb-3 text-lg font-semibold text-text-primary">{s.title}</h3>
                <div
                  className="prose-blog max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(s.body) }}
                />
              </article>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
