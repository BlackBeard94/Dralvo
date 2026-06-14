import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const includeExt = new Set([
  ".css",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".tsx",
]);

const skipDirs = new Set([
  ".git",
  ".next",
  ".vercel",
  "archive",
  "node_modules",
]);

const skipFiles = new Set(["package-lock.json"]);

const mojibakeChecks = [
  { label: "replacement character", re: /\ufffd/ },
  { label: "latin1 mojibake prefix A-circumflex", re: /\u00c2[\u0080-\u00bf\u00a0-\u00ff]/ },
  { label: "latin1 mojibake prefix A-tilde", re: /\u00c3[\u0080-\u00bf\u00a0-\u00ff]/ },
  { label: "utf8 punctuation mojibake", re: /\u00e2[\u0080-\u00bf\u20ac]/ },
  { label: "utf8 box/punctuation mojibake", re: /\u00e2[\u2018-\u203a\u20ac]/ },
  { label: "broken Vietnamese phrase", re: /ti\u00eang|kh\u00f4n g/i },
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const rel = path.relative(root, fullPath);

    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) {
        files.push(...await walk(fullPath));
      }
      continue;
    }

    if (!entry.isFile()) continue;
    if (skipFiles.has(entry.name)) continue;
    if (rel.startsWith(".env")) continue;
    if (!includeExt.has(path.extname(entry.name))) continue;

    files.push(fullPath);
  }

  return files;
}

const files = await walk(root);
const failures = [];

for (const file of files) {
  const text = await readFile(file, "utf8");
  for (const check of mojibakeChecks) {
    if (check.re.test(text)) {
      failures.push(`${path.relative(root, file)}: ${check.label}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Encoding audit failed. Possible mojibake found:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Encoding audit passed (${files.length} files checked).`);
