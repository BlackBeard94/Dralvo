// Regenerate every raster brand asset from the vector mark.
// Source of truth: public/brand/svg/*.svg. Run: node scripts/gen-brand-assets.mjs
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1"), "..");
const BRAND = path.join(ROOT, "public", "brand");
const PUB = path.join(ROOT, "public");

const GOLD = "#F0B90B";
const GOLD_BRIGHT = "#FCD535";
const GOLD_DIM = "#8B6914";
const DEEP = "#0B0E11";
const DISC = "#15181E";
const TEXT = "#EAECEF";
const TEXT_MID = "#848E9C";
const TEXT_MUTED = "#5E6673";
const LG_RING = "#B8860B"; // light-bg gold ring
const LG_D = "#9A7400"; // light-bg gold D

// The D monogram (outer + counter), 64 grid, evenodd fill.
const D_PATH = "M14 10 H30 A22 22 0 0 1 30 54 H14 Z M22 18 H30 A14 14 0 0 1 30 46 H22 Z";
const FACET_DEFS = `<defs><clipPath id="dtl"><polygon points="0,0 76,0 0,76"/></clipPath></defs>`;

// Coin emblem + faceted D (full detail) for large use.
function coinFull(disc = DISC, ring = GOLD, rim = GOLD_DIM, dFill = GOLD, dLit = GOLD_BRIGHT, lit = true) {
  const litLayer = lit ? `<path d="${D_PATH}" fill="${dLit}" fill-rule="evenodd" clip-path="url(#dtl)"/>` : "";
  return `${FACET_DEFS}
  <circle cx="32" cy="32" r="30" fill="${disc}"/>
  <circle cx="32" cy="32" r="29.3" fill="none" stroke="${rim}" stroke-width="1.2"/>
  <circle cx="32" cy="32" r="25.8" fill="none" stroke="${ring}" stroke-width="2.6"/>
  <g transform="translate(11.5 11.5) scale(0.64)">
    <path d="${D_PATH}" fill="${dFill}" fill-rule="evenodd"/>${litLayer}
  </g>`;
}
const markFull = coinFull();
const markFullLight = `
  <circle cx="32" cy="32" r="29.3" fill="none" stroke="${LG_RING}" stroke-width="2.6"/>
  <g transform="translate(11.5 11.5) scale(0.64)"><path d="${D_PATH}" fill="${LG_D}" fill-rule="evenodd"/></g>`;

// Coin with a bold bright D (favicon 32/48).
const markMed = `
  <circle cx="32" cy="32" r="31" fill="${DISC}"/>
  <circle cx="32" cy="32" r="28.5" fill="none" stroke="${GOLD}" stroke-width="3"/>
  <g transform="translate(9 9) scale(0.72)"><path d="${D_PATH}" fill="${GOLD_BRIGHT}" fill-rule="evenodd"/></g>`;

// Bold D only on a rounded tile (favicon 16) — crisp at tiny sizes.
const tinyTile = `<rect width="64" height="64" rx="14" fill="${DEEP}"/>
  <g transform="translate(3 3) scale(0.90)"><path d="${D_PATH}" fill="${GOLD_BRIGHT}" fill-rule="evenodd"/></g>`;

const svg64 = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">${inner}</svg>`;

// Full-bleed app icon: deep bg + coin at ~82% (maskable-safe).
const appIconFull = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${DEEP}"/>
  <g transform="translate(46 46) scale(6.56)">${markFull}</g>
</svg>`;

// Horizontal lockup inner (coin + wordmark), reused for PNG lockups + hero.
function lockupInner(light) {
  const mark = light ? markFullLight : markFull;
  const fill = light ? "#1E2329" : TEXT;
  const lAccent = light ? LG_D : GOLD;
  return `<g transform="translate(6 12)">${mark}</g>
  <text x="86" y="58" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-weight="700" font-size="40" letter-spacing="4.5" fill="${fill}">DRA<tspan fill="${lAccent}">L</tspan>VO</text>`;
}
const lockupSvg = (light) => `<svg xmlns="http://www.w3.org/2000/svg" width="318" height="88" viewBox="0 0 318 88">${lockupInner(light)}</svg>`;
const HERO = `<svg xmlns="http://www.w3.org/2000/svg" width="1272" height="352" viewBox="0 0 1272 352">
  <rect width="1272" height="352" fill="${DEEP}"/>
  <rect x="0" y="0" width="1272" height="4" fill="${GOLD}"/>
  <g transform="translate(150 46) scale(3)">${lockupInner(false)}</g>
</svg>`;

const OG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${DEEP}"/>
  <rect x="0" y="0" width="1200" height="4" fill="${GOLD}"/>
  <g transform="translate(504 116) scale(3)">${markFull}</g>
  <text x="600" y="400" text-anchor="middle" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-weight="700" font-size="92" letter-spacing="10" fill="${TEXT}">DRA<tspan fill="${GOLD}">L</tspan>VO</text>
  <text x="600" y="458" text-anchor="middle" font-family="'JetBrains Mono', Consolas, monospace" font-size="26" letter-spacing="7" fill="${TEXT_MID}">DRILL INTO GOLD &#183; NO FAKE DATA</text>
  <text x="600" y="504" text-anchor="middle" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="24" fill="${TEXT_MUTED}">Automated XAUUSD gold trading robots for MetaTrader 5</text>
</svg>`;

async function pngSquare(svg, size) {
  return sharp(Buffer.from(svg), { density: 384 }).resize(size, size, { fit: "contain" }).png().toBuffer();
}

function pngToIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  const dir = Buffer.alloc(16 * frames.length);
  let offset = 6 + 16 * frames.length;
  const bodies = [];
  frames.forEach((f, i) => {
    const b = f.buf;
    dir.writeUInt8(f.size >= 256 ? 0 : f.size, i * 16 + 0);
    dir.writeUInt8(f.size >= 256 ? 0 : f.size, i * 16 + 1);
    dir.writeUInt16LE(1, i * 16 + 4);
    dir.writeUInt16LE(32, i * 16 + 6);
    dir.writeUInt32LE(b.length, i * 16 + 8);
    dir.writeUInt32LE(offset, i * 16 + 12);
    offset += b.length;
    bodies.push(b);
  });
  return Buffer.concat([header, dir, ...bodies]);
}

async function main() {
  const write = (name, buf) => fs.writeFile(path.join(BRAND, name), buf);
  const raster = (svg, density) => sharp(Buffer.from(svg), { density }).png().toBuffer();

  // Maskable / apple / nav — full-bleed coin.
  await write("dralvo-icon-512.png", await pngSquare(appIconFull, 512));
  await write("dralvo-icon-192.png", await pngSquare(appIconFull, 192));
  await write("dralvo-icon-180.png", await pngSquare(appIconFull, 180));
  await write("dralvo-mark-512.png", await pngSquare(appIconFull, 512));

  // Favicons — coin (32/48), bold D tile (16).
  const coinSvg = svg64(markMed);
  await write("dralvo-icon-48.png", await pngSquare(coinSvg, 48));
  await write("dralvo-icon-32.png", await pngSquare(coinSvg, 32));

  // Horizontal lockups + hero.
  await write("dralvo-logo-dark.png", await raster(lockupSvg(false), 216));
  await write("dralvo-logo-light.png", await raster(lockupSvg(true), 216));
  await write("dralvo-hero-logo.png", await raster(HERO, 96));

  // Social share card.
  await write("dralvo-og.png", await raster(OG, 192));

  // favicon.ico — 16 (bold D) + 32/48 (coin).
  const frames = [
    { size: 16, buf: await pngSquare(svg64(tinyTile), 16) },
    { size: 32, buf: await pngSquare(coinSvg, 32) },
    { size: 48, buf: await pngSquare(coinSvg, 48) },
  ];
  await fs.writeFile(path.join(PUB, "favicon.ico"), pngToIco(frames));

  console.log("Brand assets regenerated (coin emblem).");
}

main().catch((e) => { console.error(e); process.exit(1); });
