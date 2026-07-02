// Trace the official raster logo into clean VECTOR masters (scalable, 1-colour).
// Produces mono (currentColor) + flat-gold gradient variants. Run: node scripts/gen-brand-vector.mjs
import sharp from "sharp";
import potrace from "potrace";
import { promises as fs } from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1"), "..");
const OFF = path.join(ROOT, "public", "brand", "official");
const SVG = path.join(ROOT, "public", "brand", "svg");

const GOLD_DEFS = `<defs><linearGradient id="g" x1="0" y1="0" x2="0.12" y2="1"><stop offset="0" stop-color="#FDE9A8"/><stop offset="0.3" stop-color="#F0C24A"/><stop offset="0.52" stop-color="#B8860B"/><stop offset="0.72" stop-color="#F0C24A"/><stop offset="1" stop-color="#7A5C0C"/></linearGradient></defs>`;

const traceSvg = (buf, opts) => new Promise((res, rej) => potrace.trace(buf, opts, (e, s) => (e ? rej(e) : res(s))));

// Black-on-white silhouette from a gold-on-transparent PNG (uses the alpha channel).
async function silhouetteFromAlpha(buf) {
  // alpha: opaque logo = 255; negate → logo = 0 (black) on 255 (white). Trace with blackOnWhite:true.
  return sharp(buf).trim({ threshold: 12 }).ensureAlpha().extractChannel(3).negate().png().toBuffer();
}

function parse(svg) {
  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 100 100";
  const ds = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  return { vb, d: ds.join(" ") };
}
const monoSvg = (vb, d, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}"><title>${label}</title><path d="${d}" fill="currentColor" fill-rule="evenodd"/></svg>\n`;
const goldSvg = (vb, d, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}"><title>${label}</title>${GOLD_DEFS}<path d="${d}" fill="url(#g)" fill-rule="evenodd"/></svg>\n`;

async function main() {
  const opts = { threshold: 128, blackOnWhite: true, turdSize: 40, turnPolicy: "minority", optCurve: true, optTolerance: 0.25, color: "#000", background: "transparent" };

  // 1) Monogram DA (from alpha silhouette)
  const monoBmp = await silhouetteFromAlpha(await fs.readFile(path.join(OFF, "dralvo-monogram.png")));
  const m1 = parse(await traceSvg(monoBmp, { ...opts, turdSize: 30 }));
  await fs.writeFile(path.join(SVG, "dralvo-mark-vector.svg"), monoSvg(m1.vb, m1.d, "Dralvo"));
  await fs.writeFile(path.join(SVG, "dralvo-mark-gold.svg"), goldSvg(m1.vb, m1.d, "Dralvo"));

  // 2) Favicon mark — crop to the D core (left part), simpler at tiny sizes
  const trimmed = await sharp(await fs.readFile(path.join(OFF, "dralvo-monogram.png"))).trim({ threshold: 12 }).png().toBuffer();
  const md = await sharp(trimmed).metadata();
  const dCrop = await sharp(trimmed).extract({ left: 0, top: 0, width: Math.round(md.width * 0.56), height: md.height }).png().toBuffer();
  const fbBmp = await silhouetteFromAlpha(dCrop);
  const fv = parse(await traceSvg(fbBmp, { ...opts, turdSize: 60 }));
  await fs.writeFile(path.join(SVG, "dralvo-favicon-mark.svg"), goldSvg(fv.vb, fv.d, "Dralvo D"));

  // 3) Full lockup (black-on-white source → trace directly)
  const lkBmp = await sharp(await fs.readFile(path.join(OFF, "dralvo-lockup-black.png"))).trim({ threshold: 12 }).flatten({ background: "#ffffff" }).grayscale().png().toBuffer();
  const lk = parse(await traceSvg(lkBmp, { ...opts, turdSize: 25 }));
  await fs.writeFile(path.join(SVG, "dralvo-logo-vector.svg"), monoSvg(lk.vb, lk.d, "Dralvo"));
  await fs.writeFile(path.join(SVG, "dralvo-logo-vector-gold.svg"), goldSvg(lk.vb, lk.d, "Dralvo"));

  console.log("Vector masters →", path.relative(ROOT, SVG));
  console.log("  dralvo-mark-vector.svg / -gold.svg   (monogram, viewBox " + m1.vb + ")");
  console.log("  dralvo-favicon-mark.svg              (D core)");
  console.log("  dralvo-logo-vector.svg / -gold.svg   (full lockup)");
}
main().catch((e) => { console.error(e); process.exit(1); });
