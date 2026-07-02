// Social (Phase 7) + Marketing (Phase 8) kits — LOCALE-AWARE (vi, en, ar-Gulf, pt-BR).
// Reads copy from public/brand/locales/*.json. Handles RTL (Arabic). Latin fonts fall
// back to Segoe UI; Arabic falls back to Segoe UI / Tahoma (shaped by pango/harfbuzz).
// Run: node scripts/gen-brand-social.mjs
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1"), "..");
const BRAND = path.join(ROOT, "public", "brand");
const OFF = path.join(BRAND, "official");
const LOCDIR = path.join(BRAND, "locales");

const DEEP = "#0B0E11", GOLD = "#F0B90B", TXT = "#EAECEF", MID = "#848E9C";
const MONO = "'JetBrains Mono', Consolas, monospace";
const LOCALES = ["vi", "en", "ar", "pt"];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const bg = (W, H) => `<rect width="${W}" height="${H}" fill="${DEEP}"/>
  <defs><radialGradient id="glow" cx="50%" cy="0%" r="70%"><stop offset="0" stop-color="${GOLD}" stop-opacity="0.14"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/><rect width="${W}" height="4" fill="${GOLD}"/>`;

async function logo(name, w, h = null) {
  return sharp(path.join(OFF, name)).trim({ threshold: 12 }).resize(w, h, { fit: "inside" }).png().toBuffer();
}
const render = (W, H, inner) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${bg(W, H)}${inner}</svg>`)).png().toBuffer();
const meta = (b) => sharp(b).metadata();
const place = (base, ov, x, y) => sharp(base).composite([{ input: ov, left: Math.round(x), top: Math.round(y) }]).png().toBuffer();
const T = (x, y, anchor, family, weight, size, fill, s, dir = "ltr") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" direction="${dir}" font-family="${family}" font-weight="${weight}" font-size="${size}" fill="${fill}">${esc(s)}</text>`;

async function genLocale(loc) {
  const t = JSON.parse(await fs.readFile(path.join(LOCDIR, `${loc}.json`), "utf8"));
  const UI = t.fontUI, DISP = t.fontDisp, rtl = t.dir === "rtl";
  const SOCIAL = path.join(BRAND, "social", loc), MKT = path.join(BRAND, "marketing", loc);
  await fs.mkdir(SOCIAL, { recursive: true }); await fs.mkdir(MKT, { recursive: true });
  const I = t.img;

  // ---- IG post 1080x1080 (centered — RTL neutral) ----
  {
    const W = 1080, H = 1080;
    const inner = `
      ${T(W/2, 470, "middle", MONO, 400, 26, MID, t.tagline)}
      ${T(W/2, 590, "middle", DISP, 800, 76, TXT, I.ig.h[0])}
      ${T(W/2, 675, "middle", DISP, 800, 76, GOLD, I.ig.h[1])}
      ${T(W/2, 770, "middle", UI, 400, 30, MID, I.ig.stats)}
      <rect x="${W/2-160}" y="840" width="320" height="66" rx="10" fill="${GOLD}"/>
      ${T(W/2, 883, "middle", UI, 700, 26, "#3d2f00", t.cta.free)}
      ${T(W/2, 1030, "middle", UI, 400, 19, "#5E6673", t.disclaimer)}`;
    let img = await render(W, H, inner);
    const lg = await logo("dralvo-lockup-gold.png", 520); const m = await meta(lg);
    await fs.writeFile(path.join(SOCIAL, "ig-post.png"), await place(img, lg, (W - m.width) / 2, 150));
  }
  // ---- IG story 1080x1920 ----
  {
    const W = 1080, H = 1920;
    const inner = `
      ${T(W/2, 900, "middle", MONO, 400, 26, MID, t.img.emailTag)}
      ${T(W/2, 1020, "middle", DISP, 800, 88, TXT, I.story.h[0])}
      ${T(W/2, 1120, "middle", DISP, 800, 88, GOLD, I.story.h[1])}
      ${T(W/2, 1230, "middle", UI, 400, 34, MID, I.story.sub)}
      <rect x="${W/2-210}" y="1330" width="420" height="82" rx="12" fill="${GOLD}"/>
      ${T(W/2, 1384, "middle", UI, 700, 32, "#3d2f00", t.cta.free)}
      ${T(W/2, 1820, "middle", UI, 400, 22, "#5E6673", t.disclaimer)}`;
    let img = await render(W, H, inner);
    const lg = await logo("dralvo-lockup-gold.png", 560); const m = await meta(lg);
    await fs.writeFile(path.join(SOCIAL, "ig-story.png"), await place(img, lg, (W - m.width) / 2, 480));
  }
  // ---- X / FB cover 1500x500 (logo one side, text other) ----
  {
    const W = 1500, H = 500, lw = 300;
    const lg = await logo("dralvo-monogram.png", lw); const m = await meta(lg);
    const lx = rtl ? W - m.width - 180 : 180;
    const tx = rtl ? lx - 60 : lx + m.width + 60;
    const inner = `
      ${T(tx, 235, "start", DISP, 800, 58, TXT, I.cover.h, t.dir)}
      ${T(tx, 300, "start", UI, 400, 26, MID, I.cover.sub, t.dir)}
      ${T(tx, 345, "start", MONO, 400, 20, "#5E6673", t.site + " · @dralvoea", t.dir)}`;
    let img = await render(W, H, inner);
    await fs.writeFile(path.join(SOCIAL, "x-cover.png"), await place(img, lg, lx, (H - m.height) / 2));
  }
  // ---- YouTube thumb 1280x720 ----
  {
    const W = 1280, H = 720, lw = 380;
    const lg = await logo("dralvo-monogram.png", lw); const m = await meta(lg);
    const lx = rtl ? 80 : W - m.width - 80;
    const tx = rtl ? W - 70 : 70;
    const inner = `
      ${T(tx, 360, "start", DISP, 800, 92, TXT, I.yt.h[0], t.dir)}
      ${T(tx, 460, "start", DISP, 800, 92, GOLD, I.yt.h[1], t.dir)}
      ${T(tx, 540, "start", MONO, 400, 30, MID, I.yt.sub, t.dir)}`;
    let img = await render(W, H, inner);
    await fs.writeFile(path.join(SOCIAL, "yt-thumb.png"), await place(img, lg, lx, (H - m.height) / 2));
  }
  // ---- Quote card 1200x630 (centered) ----
  {
    const W = 1200, H = 630;
    const inner = `
      ${T(W/2, 300, "middle", DISP, 700, 52, TXT, I.quote.a)}
      ${T(W/2, 370, "middle", DISP, 700, 52, GOLD, I.quote.b)}
      ${T(W/2, 450, "middle", MONO, 400, 24, MID, I.quote.attr)}`;
    let img = await render(W, H, inner);
    const lg = await logo("dralvo-lockup-gold.png", 300); const m = await meta(lg);
    await fs.writeFile(path.join(SOCIAL, "quote-card.png"), await place(img, lg, (W - m.width) / 2, 90));
  }

  // ---- Marketing banners ----
  const banner = async (file, W, H, ad, vertical) => {
    let img, lg, m;
    if (vertical) {
      const narrow = W < 200;
      lg = await logo("dralvo-monogram.png", Math.round(W*(narrow?0.66:0.5)), Math.round(H*(narrow?0.3:0.34))); m = await meta(lg);
      const hF = narrow ? 20 : 26, sF = narrow ? 12 : 15;
      const hy = 24 + m.height + (narrow ? 46 : 48);
      const heads = ad.h.split("|");
      const hLines = heads.map((ln, i) => T(W/2, hy + i*(hF*1.15), "middle", DISP, 800, hF, TXT, ln.trim())).join("");
      const inner = `${hLines}
        ${T(W/2, hy + (heads.length-1)*hF*1.15 + 28, "middle", UI, 400, sF, MID, ad.s)}
        <rect x="${W/2-60}" y="${H-58}" width="120" height="36" rx="8" fill="${GOLD}"/>
        ${T(W/2, H-34, "middle", UI, 700, 14, "#3d2f00", t.cta.try)}`;
      img = await place(await render(W, H, inner), lg, (W - m.width) / 2, 24);
    } else {
      const showBtn = W >= 420;
      lg = await logo("dralvo-monogram.png", null, Math.round(H*0.66)); m = await meta(lg);
      const lx = rtl ? W - m.width - 16 : 16;
      const tx = rtl ? lx - 30 : m.width + 30;
      const hF = Math.min(26, H*0.32);
      const btn = showBtn ? (rtl
        ? `<rect x="22" y="${H/2-20}" width="116" height="40" rx="8" fill="${GOLD}"/>${T(80, H/2+7, "middle", UI, 700, 15, "#3d2f00", t.cta.start, t.dir)}`
        : `<rect x="${W-138}" y="${H/2-20}" width="116" height="40" rx="8" fill="${GOLD}"/>${T(W-80, H/2+7, "middle", UI, 700, 15, "#3d2f00", t.cta.start)}`) : "";
      const inner = `${T(tx, H*0.46, "start", DISP, 800, hF, TXT, ad.h, t.dir)}${T(tx, H*0.72, "start", UI, 400, Math.min(15,H*0.17), MID, ad.s, t.dir)}${btn}`;
      img = await place(await render(W, H, inner), lg, lx, (H - m.height) / 2);
    }
    await fs.writeFile(path.join(MKT, file), img);
  };
  await banner("ad-leaderboard-728x90.png", 728, 90, I.ads.leaderboard, false);
  await banner("ad-rectangle-300x250.png", 300, 250, I.ads.rectangle, true);
  await banner("ad-skyscraper-160x600.png", 160, 600, I.ads.skyscraper, true);
  await banner("ad-mobile-320x100.png", 320, 100, I.ads.mobile, false);
  // Email header 600x200
  {
    const W = 600, H = 200;
    let img = await render(W, H, T(W/2, H-30, "middle", MONO, 400, 14, MID, t.img.emailTag));
    const lg = await logo("dralvo-lockup-gold.png", 320); const m = await meta(lg);
    await fs.writeFile(path.join(MKT, "email-header-600x200.png"), await place(img, lg, (W - m.width) / 2, 40));
  }
}

async function main() {
  for (const loc of LOCALES) { await genLocale(loc); console.log("  ✓", loc); }
  console.log("Localized social + marketing kits → public/brand/{social,marketing}/{vi,en,ar,pt}/");
}
main().catch((e) => { console.error(e); process.exit(1); });
