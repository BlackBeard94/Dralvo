"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowDown, Download, Check, ShieldCheck, ChevronDown,
  ExternalLink, Copy, MessageCircle,
} from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { InstallAppButton } from "@/components/shared/install-app-button";
import { SocialLinks } from "@/components/shared/social-links";
import { NavBar } from "@/components/shared/nav-bar";
import { MainNavActions } from "@/components/shared/site-nav";
import { mainNavLinks } from "@/components/shared/nav-links";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { useLocale } from "@/hooks/use-locale";
import { TIGOLD } from "@/lib/backtest-stats";
import { TIGOLD_COPY } from "@/lib/tigold-copy";
import { LANDING_COPY } from "@/lib/landing-copy";
import { cn } from "@/lib/utils";

const SERIF = "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif";
const GOLD_BRIGHT = "#f0cf5a";
const alpha = (a: number) => `rgba(212,169,45,${a})`;

// Step 1 (account-first) copy — inline, self-contained. Signup returns to /tigold.
const ACCOUNT_COPY: Record<string, { eyebrow: string; title: string; sub: string; desc: string; btn: string; have: string; login: string }> = {
  vi: { eyebrow: "Bắt đầu", title: "Tạo tài khoản Dralvo", sub: "License TiGold sẽ được cấp vào tài khoản Dralvo của bạn.", desc: "Tạo tài khoản Dralvo miễn phí (30 giây) — đây là nơi bạn nhận license key và tải EA. Xong bạn quay lại đúng trang này để tiếp tục.", btn: "Tạo tài khoản Dralvo", have: "Đã có tài khoản?", login: "Đăng nhập" },
  en: { eyebrow: "Start here", title: "Create your Dralvo account", sub: "Your TiGold license is granted into your Dralvo account.", desc: "Create a free Dralvo account (30s) — this is where you'll get your license key and download the EA. Then come back to this page to continue.", btn: "Create Dralvo account", have: "Already have one?", login: "Log in" },
  "pt-BR": { eyebrow: "Comece aqui", title: "Crie sua conta Dralvo", sub: "Sua licença TiGold é concedida na sua conta Dralvo.", desc: "Crie uma conta Dralvo grátis (30s) — é onde você receberá sua chave de licença e baixará o EA. Depois volte a esta página para continuar.", btn: "Criar conta Dralvo", have: "Já tem uma?", login: "Entrar" },
  es: { eyebrow: "Empieza aquí", title: "Crea tu cuenta Dralvo", sub: "Tu licencia TiGold se otorga en tu cuenta Dralvo.", desc: "Crea una cuenta Dralvo gratis (30s) — ahí recibirás tu clave de licencia y descargarás el EA. Luego vuelve a esta página para continuar.", btn: "Crear cuenta Dralvo", have: "¿Ya tienes una?", login: "Iniciar sesión" },
  id: { eyebrow: "Mulai di sini", title: "Buat akun Dralvo", sub: "Lisensi TiGold diberikan ke akun Dralvo Anda.", desc: "Buat akun Dralvo gratis (30 detik) — di sinilah Anda menerima kunci lisensi dan mengunduh EA. Lalu kembali ke halaman ini untuk melanjutkan.", btn: "Buat akun Dralvo", have: "Sudah punya?", login: "Masuk" },
  ar: { eyebrow: "ابدأ من هنا", title: "أنشئ حساب Dralvo", sub: "يُمنح ترخيص TiGold إلى حساب Dralvo الخاص بك.", desc: "أنشئ حساب Dralvo مجانًا (30 ثانية) — هنا تحصل على مفتاح الترخيص وتنزّل الـ EA. ثم عُد إلى هذه الصفحة للمتابعة.", btn: "إنشاء حساب Dralvo", have: "لديك حساب؟", login: "تسجيل الدخول" },
};

/** Hero demo clip — self-hosted (not the YouTube Shorts embed, which pads the
 *  1080x1202 source into a fixed 9:16 canvas and shows player chrome/letterboxing).
 *  Empty string hides the video slot and the hero falls back to a single
 *  centered column. Real encoded size: 720x802 (~9:10). */
const TIGOLD_VIDEO_SRC = "/videos/tigold-demo.mp4";
const TIGOLD_VIDEO_ASPECT = "720 / 802";

/** Account types — ids/refs are data; display name/desc come from i18n (t.acc[key]). */
const ACCOUNT_TYPES = [
  { id: "gtc-usd", key: "usd", ref: "hc8B8eNC" },
  { id: "gtc-cent", key: "cent", ref: "ADWMQMDP" },
] as const;

function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.1) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal(0.12);
  return (
    <div ref={ref} className={cn("transition-all duration-700 ease-out", className)}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-[0.18em] uppercase font-medium border border-border text-text-muted bg-deep/40">{children}</div>;
}

export default function TiGoldPage() {
  const { locale } = useLocale();
  const ac = ACCOUNT_COPY[locale] ?? ACCOUNT_COPY.en;
  const t = TIGOLD_COPY[locale];
  const lc = LANDING_COPY[locale];

  const [accountType, setAccountType] = useState("");
  const [account, setAccount] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [downloads, setDownloads] = useState<{ ex5: string; set: string; guide: string } | null>(null);
  const [copyOk, setCopyOk] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openInstall, setOpenInstall] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const selectedType = ACCOUNT_TYPES.find((x) => x.id === accountType);
  const selectedName = selectedType ? t.acc[selectedType.key].name : "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const verify = async () => {
    setError("");
    setVerifying(true);
    try {
      const res = await fetch("/api/ib/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account, broker: accountType }) });
      const data = await res.json();
      if (res.ok && data.verified) { setVerified(true); setDownloads(data.downloads); }
      else { setError(data.error || t.s2.errFail); }
    } catch { setError(t.s2.errConn); }
    setVerifying(false);
  };

  const copyIB = () => {
    if (selectedType) {
      navigator.clipboard.writeText(`https://web.mygtc.app/login/register?ref=${selectedType.ref}`);
      setCopyOk(true); setTimeout(() => setCopyOk(false), 2000);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden antialiased bg-deep text-text-primary">
      <div className="gold-veins" aria-hidden="true"><div className="v1" /><div className="v2" /><div className="v3" /><div className="h1" /><div className="h2" /></div>

      {/* Nav */}
      <NavBar
        navClassName={cn("transition-all duration-500", scrolled ? "bg-deep/85 backdrop-blur-xl border-b border-border" : "bg-transparent")}
        containerClassName="max-w-[1180px] mx-auto px-6"
        links={mainNavLinks(locale, "/tigold")}
        actions={<MainNavActions locale={locale} />}
      />

      <main style={{ fontFamily: "'Inter', system-ui, sans-serif" }} className="pt-16">
        {/* Hero */}
        <section className="relative pt-28 pb-16 px-6 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[800px] h-[600px] -top-60 -right-32 opacity-50" />
          <GlowOrb className="w-[400px] h-[400px] bottom-0 left-0 opacity-30" />
          <div className={cn(
            "mx-auto relative z-10 grid gap-12 items-center",
            TIGOLD_VIDEO_SRC ? "max-w-[1320px] lg:grid-cols-2 text-center lg:text-left" : "max-w-[900px] text-center"
          )}>
            <div>
              <Reveal><Eyebrow>{t.heroEyebrow}</Eyebrow></Reveal>
              <Reveal delay={80}>
                <h1 className="text-[2.8rem] sm:text-6xl font-normal leading-[1.04] tracking-[-0.02em] mt-6 mb-5 text-balance" style={{ fontFamily: SERIF }}>
                  Dralvo <span style={{ color: GOLD_BRIGHT }}>TiGold</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className={cn("text-base sm:text-lg leading-relaxed max-w-[560px] mb-8 text-text-secondary", TIGOLD_VIDEO_SRC ? "mx-auto lg:mx-0" : "mx-auto")}>
                  {t.heroSub1}<br />{t.heroSub2}
                </p>
              </Reveal>
              <Reveal delay={160}>
                <div className={cn("inline-flex flex-wrap items-center gap-2 mb-6", TIGOLD_VIDEO_SRC ? "justify-center lg:justify-start" : "justify-center")}>
                  {TIGOLD.headline.map((kpi, i) => (
                    <span key={i} className={cn("px-4 py-2 rounded-lg border font-mono text-sm font-semibold",
                      kpi.tone === "good" ? "border-green/20 bg-green/5 text-green" :
                      kpi.tone === "bad" ? "border-red/20 bg-red/5 text-red" :
                      "border-gold/20 bg-gold/5 text-gold-bright")}>{kpi.value}</span>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={200}>
                <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-text-muted", TIGOLD_VIDEO_SRC ? "justify-center lg:justify-start" : "justify-center")}>
                  <span className="text-gold">M1</span><span>·</span>
                  <span>6mo real-tick</span><span>·</span>
                  <span>GTC · 100% ticks</span><span>·</span>
                  <span>1,105 trades</span>
                </div>
              </Reveal>
            </div>

            {TIGOLD_VIDEO_SRC && (
              <Reveal delay={120}>
                {/* Self-hosted at its real encoded ratio — no YouTube player
                 *  chrome/letterboxing to work around. */}
                <div
                  className="relative mx-auto lg:mx-0 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_0_rgba(212,169,45,0.08)_inset]"
                  style={{ maxWidth: 600, aspectRatio: TIGOLD_VIDEO_ASPECT }}
                >
                  <video
                    className="absolute inset-0 h-full w-full object-cover"
                    src={TIGOLD_VIDEO_SRC}
                    aria-label={t.heroVideoLabel}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                  />
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {/* Step 1: create Dralvo account (account-first) */}
        <section className="relative py-16 px-6">
          <div className="max-w-[960px] mx-auto">
            <Reveal className="text-center mb-8">
              <Eyebrow>{ac.eyebrow}</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3 text-balance" style={{ fontFamily: SERIF }}>{ac.title}</h2>
              <p className="text-text-secondary max-w-[560px] mx-auto">{ac.sub}</p>
            </Reveal>
            <Reveal delay={60}>
              <div className="rounded-2xl border p-7 flex flex-col sm:flex-row sm:items-center gap-5" style={{ borderColor: alpha(0.25), background: `linear-gradient(168deg, ${alpha(0.06)}, var(--bg-card) 55%)` }}>
                <p className="flex-1 text-sm text-text-secondary leading-relaxed">{ac.desc}</p>
                <a href="/signup?redirect=/tigold" className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-[#060609] no-underline transition-transform duration-200 hover:scale-[1.03]" style={{ background: GOLD_BRIGHT }}>
                  {ac.btn} <ArrowRight size={15} />
                </a>
              </div>
              <p className="mt-4 text-center text-[12px] text-text-muted">
                {ac.have}{" "}
                <a href="/login?redirect=/tigold" className="text-gold hover:underline">{ac.login}</a>
              </p>
              <div className="flex justify-center mt-5"><ArrowDown className="h-5 w-5 text-gold/50 animate-bounce" aria-hidden /></div>
            </Reveal>
          </div>
        </section>

        {/* Step 2: open GTC account */}
        <section className="relative py-20 px-6 bg-surface overflow-hidden">
          <GlowOrb className="w-[500px] h-[400px] -bottom-32 right-0 opacity-25" />
          <div className="max-w-[960px] mx-auto relative z-10">
            <Reveal className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-bold tracking-[0.06em] uppercase border-2" style={{ borderColor: alpha(0.5), color: GOLD_BRIGHT, background: alpha(0.1) }}>
                {t.s1.eyebrow}
              </div>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3 text-balance" style={{ fontFamily: SERIF }}>{t.s1.title}</h2>
              <p className="text-text-secondary max-w-[520px] mx-auto">{t.s1.sub}</p>
            </Reveal>

            <Reveal delay={60}>
              <p className="text-center text-sm font-semibold mb-4 flex items-center justify-center gap-1.5" style={{ color: GOLD_BRIGHT }}>
                <ArrowDown size={14} />
                {t.s1.selectHint}
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-6 max-w-[580px] mx-auto">
                {ACCOUNT_TYPES.map((at) => (
                  <button key={at.id} type="button" onClick={() => { setAccountType(at.id); setVerified(false); setError(""); }}
                    className={cn("lift group relative rounded-2xl border-2 p-5 text-left transition-all duration-300 cursor-pointer",
                      accountType === at.id ? "border-gold/50 bg-gold/5" : "border-border bg-card hover:border-gold/25")}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn("font-semibold text-sm", accountType === at.id ? "text-gold-bright" : "text-text-primary")}>{t.acc[at.key].name}</span>
                      {accountType === at.id ? (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: GOLD_BRIGHT }}>
                          <Check size={12} className="text-[#060609]" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border border-gold/30 text-gold bg-gold/5">GTC</span>
                      )}
                    </div>
                    <p className="text-[12px] text-text-muted leading-relaxed">{t.acc[at.key].desc}</p>
                  </button>
                ))}
              </div>
            </Reveal>

            {selectedType && (
              <Reveal delay={80}>
                <div className="rounded-2xl border p-5 max-w-[580px] mx-auto" style={{ borderColor: alpha(0.25), background: alpha(0.04) }}>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-text-muted mb-3 font-semibold">Broker: GTC · {selectedName}</div>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <code className="text-xs text-text-secondary break-all bg-deep/50 px-3 py-1.5 rounded-md">web.mygtc.app/register?ref={selectedType.ref}</code>
                    <div className="flex gap-2">
                      <button type="button" onClick={copyIB} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold border border-border text-text-secondary hover:text-gold transition-colors cursor-pointer">
                        {copyOk ? <><Check size={13} />{t.s1.copied}</> : <><Copy size={13} />{t.s1.copy}</>}
                      </button>
                      <a href={`https://web.mygtc.app/login/register?ref=${selectedType.ref}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-md text-xs font-semibold text-[#060609] no-underline transition-all duration-200 hover:scale-[1.03]"
                        style={{ background: GOLD_BRIGHT }}>
                        {t.s1.open} <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {/* Step 2: verify */}
        <section className="relative py-20 px-6 overflow-hidden">
          <GlowOrb className="w-[400px] h-[400px] -top-20 -left-20 opacity-20" />
          <div className="max-w-[580px] mx-auto relative z-10">
            <Reveal className="text-center mb-10">
              <Eyebrow>{t.s2.eyebrow}</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3 text-balance" style={{ fontFamily: SERIF }}>
                {verified ? t.s2.titleVerified : t.s2.titleDefault}
              </h2>
              <p className="text-text-secondary">{t.s2.sub}</p>
            </Reveal>

            <Reveal delay={60}>
              {!verified ? (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="text" value={account} onChange={(e) => { setAccount(e.target.value); setError(""); }}
                      placeholder={t.s2.placeholder}
                      disabled={!selectedType}
                      className="flex-1 px-4 py-3 rounded-lg border border-border bg-deep text-text-primary text-sm font-mono outline-none focus:border-gold/40 transition-colors disabled:opacity-40" />
                    <button type="button" onClick={verify} disabled={!account || verifying || !selectedType}
                      className="px-7 py-3 rounded-lg text-sm font-semibold text-[#060609] transition-all duration-200 hover:scale-[1.02] disabled:opacity-40 cursor-pointer"
                      style={{ background: GOLD_BRIGHT }}>
                      {verifying ? t.s2.verifying : t.s2.verify}
                    </button>
                  </div>
                  {error && <p className="text-red text-xs mt-3">{error}</p>}
                  {!selectedType && <p className="text-text-muted text-xs mt-3">{t.s2.selectFirst}</p>}
                </div>
              ) : (
                <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ borderColor: alpha(0.3), background: alpha(0.04) }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: alpha(0.15) }}><Check size={20} style={{ color: GOLD_BRIGHT }} /></div>
                  <div>
                    <div className="font-semibold text-text-primary">{t.s2.account} #{account} — GTC · {selectedName}</div>
                    <div className="text-xs text-text-muted">{t.s2.via}</div>
                  </div>
                </div>
              )}
            </Reveal>
          </div>
        </section>

        {/* Step 3: license (must happen before EA install — the key gets typed into the EA during setup) */}
        <section className="relative py-20 px-6 bg-surface overflow-hidden">
          <GlowOrb className="w-[500px] h-[400px] -top-16 right-0 opacity-25" />
          <div className="max-w-[720px] mx-auto relative z-10">
            <Reveal className="text-center mb-10">
              <Eyebrow>{t.s4.eyebrow}</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3 text-balance" style={{ fontFamily: SERIF }}>{t.s4.title}</h2>
              <p className="text-text-secondary">{t.s4.sub}</p>
            </Reveal>

            <Reveal delay={60}>
              <div className="rounded-2xl border p-7" style={{ borderColor: alpha(0.25), background: `linear-gradient(168deg, ${alpha(0.06)}, var(--bg-card) 55%)` }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: alpha(0.12) }}>
                    <MessageCircle size={28} style={{ color: GOLD_BRIGHT }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary mb-3">{t.s4.cardHeading}</h3>
                    <ol className="space-y-2 text-[13px] text-text-secondary leading-relaxed">
                      <li>1. {t.s4.l1} <code className="font-mono text-gold bg-deep/60 px-1.5 py-0.5 rounded text-[11px]">@dralvo_bot</code></li>
                      <li dangerouslySetInnerHTML={{ __html: `2. ${t.s4.l2}` }} />
                      <li>3. {t.s4.l3}</li>
                      <li>4. {t.s4.l4}</li>
                    </ol>
                  </div>
                  <a href="https://t.me/dralvo_bot?start=tigold" target="_blank" rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-[#060609] no-underline transition-all duration-200 hover:scale-[1.03]"
                    style={{ background: GOLD_BRIGHT }}>
                    {t.s4.open} <ExternalLink size={15} />
                  </a>
                </div>
                <p className="mt-5 text-[11px] text-text-muted border-t border-border pt-4">{t.s4.note}</p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Step 4: download & install */}
        <section className="relative py-20 px-6 overflow-hidden">
          <GlowOrb className="w-[500px] h-[400px] -bottom-24 right-0 opacity-25" />
          <div className="max-w-[860px] mx-auto relative z-10">
            <Reveal className="text-center mb-10">
              <Eyebrow>{t.s3.eyebrow}</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3 text-balance" style={{ fontFamily: SERIF }}>{t.s3.title}</h2>
              <p className="text-text-secondary">{t.s3.sub}</p>
            </Reveal>

            <Reveal delay={60}>
              {verified && downloads ? (
                <div className="grid sm:grid-cols-3 gap-4 mb-14">
                  {[
                    { label: t.s3.ea, href: downloads.ex5, desc: "Dralvo TiGold.ex5" },
                    { label: t.s3.preset, href: downloads.set, desc: "Dralvo tigold v1.set" },
                    { label: t.s3.guide, href: downloads.guide, desc: t.s3.guideDesc },
                  ].map((f) => (
                    <a key={f.label} href={f.href} download
                      className="lift group flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card text-center no-underline transition-all duration-300 hover:border-gold/30 cursor-pointer"
                      style={{ boxShadow: `0 1px 0 ${alpha(0.08)} inset` }}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: alpha(0.1) }}>
                        <Download size={22} style={{ color: GOLD_BRIGHT }} />
                      </div>
                      <span className="text-sm font-semibold text-text-primary">{f.label}</span>
                      <span className="text-[10px] text-text-muted font-mono">{f.desc}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center mb-14">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <Download size={22} className="text-text-muted" />
                  </div>
                  <p className="text-text-muted text-sm">{t.s3.locked}</p>
                </div>
              )}
            </Reveal>

            <Reveal delay={80}>
              <h3 className="text-lg font-semibold text-text-primary mb-5 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full inline-block" style={{ background: GOLD_BRIGHT }} />
                {t.s3.installHeading}
              </h3>
              <div className="space-y-2">
                {t.install.map((step, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card overflow-hidden transition-colors duration-300 hover:border-gold/15">
                    <button type="button" onClick={() => setOpenInstall(openInstall === i ? null : i)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: alpha(0.12), color: GOLD_BRIGHT }}>{i + 1}</span>
                      <span className="text-sm font-medium text-text-primary flex-1">{step.title}</span>
                      <ChevronDown size={16} className={cn("text-text-muted transition-transform duration-300", openInstall === i && "rotate-180")} />
                    </button>
                    <div className={cn("grid transition-all duration-300", openInstall === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                      <div className="overflow-hidden">
                        <p className="px-5 pb-4 pl-16 text-[13px] leading-relaxed text-text-secondary"
                          dangerouslySetInnerHTML={{ __html: step.body.replace(/<code>(.+?)<\/code>/g, '<code class="font-mono text-gold bg-deep/60 px-1.5 py-0.5 rounded text-[11px]">$1</code>') }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Backtest */}
        <section className="relative py-20 px-6 bg-surface overflow-hidden">
          <GlowOrb className="w-[600px] h-[500px] -bottom-40 left-1/2 -translate-x-1/2 opacity-20" />
          <div className="max-w-[860px] mx-auto relative z-10">
            <Reveal className="text-center mb-10">
              <Eyebrow>{t.bt.eyebrow}</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3 text-balance" style={{ fontFamily: SERIF }}>{t.bt.title}</h2>
              <p className="text-text-secondary max-w-[500px] mx-auto">{t.bt.sub}</p>
            </Reveal>

            <Reveal delay={60}>
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-deep/40 flex items-center gap-2.5">
                  <ShieldCheck size={15} style={{ color: GOLD_BRIGHT }} />
                  <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-gold">{t.bt.profile}</span>
                </div>

                <div className="grid grid-cols-1  grid-cols-2 sm:grid-cols-4 gap-px bg-border">
                  {[
                    { v: TIGOLD.headline[0].value, l: t.bt.kNet, t: "good" },
                    { v: TIGOLD.headline[1].value, l: t.bt.kPf, t: "neutral" },
                    { v: TIGOLD.headline[2].value, l: t.bt.kWin, t: "neutral" },
                    { v: TIGOLD.headline[3].value, l: t.bt.kDd, t: "bad" },
                  ].map((k) => (
                    <div key={k.l} className="bg-card p-5">
                      <div className={cn("font-mono text-2xl font-bold tracking-tight", k.t === "good" ? "text-green" : k.t === "bad" ? "text-red" : "text-text-primary")}>{k.v}</div>
                      <div className="text-[10px] uppercase tracking-[0.06em] text-text-muted mt-1.5">{k.l}</div>
                    </div>
                  ))}
                </div>

                <div className="p-6 grid sm:grid-cols-3 gap-x-8 gap-y-3">
                  {TIGOLD.tradeStats.map((s) => (
                    <div key={s.key} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                      <span className="text-[11px] uppercase tracking-[0.04em] text-text-muted">
                        {s.key === "trades" ? t.bt.sTrades : s.key === "winRate" ? t.bt.sWin : s.key === "avgWin" ? t.bt.sAvgWin : s.key === "avgLoss" ? t.bt.sAvgLoss : s.key === "rr" ? t.bt.sRr : t.bt.sStreak}
                      </span>
                      <span className="font-mono text-sm text-text-primary">{s.value}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border px-6 py-4 bg-deep/20 flex items-center justify-between">
                  <span className="text-[11px] text-text-muted uppercase tracking-[0.06em]">{t.bt.final}</span>
                  <span className="font-mono text-lg font-bold text-green">{TIGOLD.finalBalance}</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="max-w-[720px] mx-auto">
            <Reveal className="text-center mb-10">
              <Eyebrow>{t.faqEyebrow}</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3" style={{ fontFamily: SERIF }}>{t.faqTitle}</h2>
            </Reveal>
            <Reveal delay={60}>
              <div className="space-y-3">
                {t.faq.map(([q, a], i) => (
                  <div key={i} className="rounded-xl border transition-colors duration-300" style={{ borderColor: openFaq === i ? alpha(0.3) : "var(--border)", background: openFaq === i ? alpha(0.04) : "transparent" }}>
                    <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer">
                      <span className="text-sm font-medium text-text-primary">{q}</span>
                      <span className="shrink-0 text-base font-light text-gold transition-transform duration-300" style={{ transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                    </button>
                    <div className={cn("grid transition-all duration-300", openFaq === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                      <div className="overflow-hidden"><p className="px-5 pb-4 text-[13px] leading-relaxed text-text-secondary">{a}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 px-6 bg-surface overflow-hidden">
          <GlowOrb className="w-[700px] h-[500px] top-0 left-1/2 -translate-x-1/2 opacity-35" />
          <GridPattern />
          <div className="max-w-[720px] mx-auto relative z-10 text-center">
            <Reveal>
              <div className="rounded-3xl border border-gold/20 p-10 sm:p-14" style={{ background: `linear-gradient(168deg, ${alpha(0.08)}, var(--bg-card) 60%)`, boxShadow: "0 40px 90px -60px rgba(240,200,90,0.4)" }}>
                <Eyebrow>{t.cta.eyebrow}</Eyebrow>
                <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-4 text-balance" style={{ fontFamily: SERIF }}>{t.cta.title}</h2>
                <p className="text-text-secondary mb-8 leading-relaxed max-w-[480px] mx-auto">{t.cta.body}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href="#step1" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-[15px] font-semibold text-[#060609] no-underline transition-all duration-200 hover:scale-[1.03]"
                    style={{ background: GOLD_BRIGHT, boxShadow: "0 0 40px rgba(240,200,90,0.15)" }}>
                    {t.cta.primary} <ArrowRight size={18} />
                  </a>
                  <a href="https://t.me/dralvoea" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-[15px] font-semibold border border-border text-text-primary no-underline transition-colors hover:border-gold/30 hover:text-gold">
                    {t.cta.secondary} <MessageCircle size={17} />
                  </a>
                </div>
                <p className="mt-6 font-mono text-[11px] tracking-[0.04em] text-text-muted">{t.cta.guarantee}</p>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/50">
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div>
              <BrandLink logoSize={28} wordmarkClassName="text-lg" />
              <p className="text-sm text-text-muted leading-relaxed max-w-[220px] mt-4">{lc.footer.tagline}</p>
              <div className="mt-4 flex flex-nowrap items-center gap-3">
                <InstallAppButton locale={locale} compact />
                <SocialLinks />
              </div>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.15em] uppercase text-text-muted font-semibold mb-4">{lc.footer.product}</div>
              <div className="flex flex-col gap-2.5">
                <Link href="/#products" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{lc.footer.goldmaster}</Link>
                <Link href="/#products" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{lc.footer.scalp}</Link>
                <span className="text-sm font-medium" style={{ color: GOLD_BRIGHT }}>{lc.footer.tigold}</span>
                <Link href="/tools/calculator" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{lc.footer.tools}</Link>
              </div>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.15em] uppercase text-text-muted font-semibold mb-4">{lc.footer.company}</div>
              <div className="flex flex-col gap-2.5">
                <a href="https://t.me/dralvoea" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{lc.footer.telegram}</a>
                <Link href="/#pricing" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{lc.nav.pricing}</Link>
                <Link href="/login" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{lc.footer.login}</Link>
              </div>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.15em] uppercase text-text-muted font-semibold mb-4">{lc.footer.legal}</div>
              <div className="flex flex-col gap-2.5">
                <Link href="/privacy" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{lc.footer.privacy}</Link>
                <Link href="/terms" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{lc.footer.terms}</Link>
                <Link href="/disclaimer" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{lc.footer.disclaimer}</Link>
              </div>
            </div>
          </div>
          <div className="pt-7 border-t border-border">
            <p className="text-[11px] text-text-muted">{lc.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
