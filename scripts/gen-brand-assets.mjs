// Regenerate every derived brand raster from the OFFICIAL Dralvo logo art.
// Source of truth: public/brand/official/*.png (the gold DA monogram + lockups).
// Run: node scripts/gen-brand-assets.mjs
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1"), "..");
const BRAND = path.join(ROOT, "public", "brand");
const OFFICIAL = path.join(BRAND, "official");
const PUB = path.join(ROOT, "public");

const DEEP = "#0B0E11";
const GOLD = "#F0B90B";

const src = (n) => path.join(OFFICIAL, n);
const out = (n) => path.join(BRAND, n);

// Monogram trimmed to its bounding box (reused for every square icon).
async function monogramTrimmed() {
  return sharp(src("dralvo-monogram.png")).trim({ threshold: 12 }).png().toBuffer();
}

// Square icon: monogram centered on the deep tile at `scale` of the square.
async function squareIcon(mono, size, scale, bg = DEEP) {
  const inner = Math.round(size * scale);
  const fitted = await sharp(mono).resize(inner, inner, { fit: "inside" }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: fitted, gravity: "center" }])
    .png()
    .toBuffer();
}

// Horizontal lockup centered on a canvas.
async function lockupOn(srcName, W, H, bg, marginX = 0.14, topRule = false) {
  const lk = await sharp(src(srcName)).trim({ threshold: 12 }).png().toBuffer();
  const maxW = Math.round(W * (1 - marginX * 2));
  const maxH = Math.round(H * 0.62);
  const fitted = await sharp(lk).resize(maxW, maxH, { fit: "inside" }).png().toBuffer();
  const layers = [{ input: fitted, gravity: "center" }];
  if (topRule) layers.unshift({ input: { create: { width: W, height: 4, channels: 4, background: GOLD } }, top: 0, left: 0 });
  return sharp({ create: { width: W, height: H, channels: 4, background: bg } }).composite(layers).png().toBuffer();
}

function pngToIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(frames.length, 4);
  const dir = Buffer.alloc(16 * frames.length);
  let offset = 6 + 16 * frames.length;
  const bodies = [];
  frames.forEach((f, i) => {
    dir.writeUInt8(f.size >= 256 ? 0 : f.size, i * 16); dir.writeUInt8(f.size >= 256 ? 0 : f.size, i * 16 + 1);
    dir.writeUInt16LE(1, i * 16 + 4); dir.writeUInt16LE(32, i * 16 + 6);
    dir.writeUInt32LE(f.buf.length, i * 16 + 8); dir.writeUInt32LE(offset, i * 16 + 12);
    offset += f.buf.length; bodies.push(f.buf);
  });
  return Buffer.concat([header, dir, ...bodies]);
}

async function main() {
  const mono = await monogramTrimmed();

  // Nav mark + maskable/apple icons — monogram on deep tile (~76% safe zone).
  await fs.writeFile(out("dralvo-mark-512.png"), await squareIcon(mono, 512, 0.78));
  await fs.writeFile(out("dralvo-icon-512.png"), await squareIcon(mono, 512, 0.72));
  await fs.writeFile(out("dralvo-icon-192.png"), await squareIcon(mono, 192, 0.72));
  await fs.writeFile(out("dralvo-icon-180.png"), await squareIcon(mono, 180, 0.72));
  await fs.writeFile(out("dralvo-icon-48.png"), await squareIcon(mono, 48, 0.84));
  await fs.writeFile(out("dralvo-icon-32.png"), await squareIcon(mono, 32, 0.88));

  // favicon.ico (16/32/48) + a valid square favicon.svg (embeds a 64px tile).
  const ico = await pngToIco([
    { size: 16, buf: await squareIcon(mono, 16, 0.94) },
    { size: 32, buf: await squareIcon(mono, 32, 0.88) },
    { size: 48, buf: await squareIcon(mono, 48, 0.84) },
  ]);
  await fs.writeFile(path.join(PUB, "favicon.ico"), ico);
  const tile64 = await squareIcon(mono, 64, 0.86);
  await fs.writeFile(path.join(PUB, "favicon.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><image width="64" height="64" href="data:image/png;base64,${tile64.toString("base64")}"/></svg>\n`);

  // Social share card + hero banner + lockups.
  await fs.writeFile(out("dralvo-og.png"), await lockupOn("dralvo-lockup-gold.png", 1200, 630, DEEP, 0.16, true));
  await fs.writeFile(out("dralvo-hero-logo.png"), await lockupOn("dralvo-lockup-gold.png", 1248, 352, DEEP, 0.12, true));
  await fs.writeFile(out("dralvo-logo-dark.png"), await sharp(src("dralvo-lockup-gold.png")).trim({ threshold: 12 }).resize(960, null, { fit: "inside" }).png().toBuffer());
  await fs.writeFile(out("dralvo-logo-light.png"), await sharp(src("dralvo-lockup-black.png")).trim({ threshold: 12 }).resize(960, null, { fit: "inside" }).png().toBuffer());
  await fs.writeFile(out("dralvo-logo-white.png"), await sharp(src("dralvo-lockup-white.png")).trim({ threshold: 12 }).resize(960, null, { fit: "inside" }).png().toBuffer());

  // Social avatars (square, ready for Telegram/FB/X).
  await fs.writeFile(out("dralvo-avatar-telegram.png"), await sharp(src("dralvo-avatar-telegram.png")).resize(512, 512, { fit: "cover" }).png().toBuffer());
  await fs.writeFile(out("dralvo-avatar-vip.png"), await sharp(src("dralvo-avatar-vip.png")).resize(512, 512, { fit: "cover" }).png().toBuffer());

  console.log("Brand assets regenerated from official logo art.");
}

main().catch((e) => { console.error(e); process.exit(1); });
