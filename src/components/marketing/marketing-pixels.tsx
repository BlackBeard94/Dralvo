"use client";

/**
 * Client pixel loader. Fetches the resolved pixel ids for this request from
 * /api/marketing/pixels (Dralvo's own + the active partner's, if any) and
 * injects the platform scripts. Doing this client-side keeps the root layout
 * statically renderable — the cookie/DB lookup lives behind the API instead of
 * forcing every page to render dynamically.
 *
 * All ids were validated server-side before storage, so inlining them here is
 * safe. Multiple ids per platform → one base load, one init/config per id;
 * fbq/ttq Purchase events fan out to every inited pixel automatically.
 */
import { useEffect, useRef, useState } from "react";
import Script from "next/script";

/**
 * Inject a raw HTML snippet (e.g. a full GTM / Hotjar install code) into a
 * target node, RE-CREATING any <script> elements so they actually execute —
 * innerHTML-inserted scripts do not run. Handles <noscript>/<iframe> too.
 */
function injectSnippet(html: string, target: HTMLElement) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  tpl.content.querySelectorAll("script").forEach((old) => {
    const s = document.createElement("script");
    for (const attr of Array.from(old.attributes)) s.setAttribute(attr.name, attr.value);
    s.textContent = old.textContent;
    old.replaceWith(s);
  });
  target.appendChild(tpl.content);
}

type PixelConfig = {
  gtagIds: string[];
  metaIds: string[];
  tiktokIds: string[];
  customHead: string;
  customBody: string;
};

export function MarketingPixels() {
  const [cfg, setCfg] = useState<PixelConfig | null>(null);
  const injected = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/marketing/pixels")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data) setCfg(data as PixelConfig);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Raw custom snippets (Dralvo super-admin authored) — full HTML allowed
  // (GTM, Hotjar, etc.). Injected once, scripts re-created so they execute.
  useEffect(() => {
    if (!cfg || injected.current) return;
    injected.current = true;
    if (cfg.customHead) injectSnippet(cfg.customHead, document.head);
    if (cfg.customBody) injectSnippet(cfg.customBody, document.body);
  }, [cfg]);

  if (!cfg) return null;

  return (
    <>
      {cfg.gtagIds.length > 0 && (
        <>
          <Script
            id="gtag-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${cfg.gtagIds[0]}`}
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              ${cfg.gtagIds.map((id) => `gtag('config', '${id}');`).join("\n")}
            `}
          </Script>
        </>
      )}

      {cfg.metaIds.length > 0 && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            ${cfg.metaIds.map((id) => `fbq('init', '${id}');`).join("\n")}
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {cfg.tiktokIds.length > 0 && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
              ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
              ${cfg.tiktokIds.map((id) => `ttq.load('${id}');`).join("\n")}
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {/* Raw custom snippets are injected imperatively (see effect above) so
          full HTML/<script> install codes execute correctly. */}
    </>
  );
}
