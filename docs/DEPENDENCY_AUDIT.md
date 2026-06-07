# Dependency Audit — 2026-06-07

## Summary

`npm audit` reports **2 moderate vulnerabilities**, both related to PostCSS < 8.5.10 bundled inside Next.js.

| Package | Severity | Advisory | Status |
|---------|----------|----------|--------|
| postcss (via next) | moderate | GHSA-qx2v-qp2m-jg93 — XSS via unescaped `</style>` in CSS stringify output | **Accepted risk** |
| next | moderate | Inherited from postcss | **Accepted risk** |

## Analysis

- **CVSS 6.1** — requires user interaction and is only exploitable if an attacker controls CSS input processed by PostCSS on the server.
- Dralvo does **not** accept user-submitted CSS. All styles are authored in source code.
- The fix requires downgrading Next.js to 9.3.3 (major version rollback), which is not viable.
- Next.js 16.2.7 bundles its own PostCSS. A fix will arrive when Next.js updates its internal PostCSS dependency.

## Decision

**Accepted risk. Monitor for Next.js update that bumps internal PostCSS to ≥ 8.5.10.**

## Action

- Re-run `npm audit` monthly.
- Do NOT run `npm audit fix --force` — it will break the dependency tree.
- If a Next.js patch release addresses this, upgrade immediately.
