import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const SKIP_DIRS = new Set([
  ".git",
  ".next",
  ".vercel",
  "node_modules",
  "archive",
]);

const SKIP_FILES = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  "package-lock.json",
]);

const TEXT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yml",
  ".yaml",
]);

const SECRET_PATTERNS = [
  { name: "Stripe secret key", regex: /sk_(live|test)_[A-Za-z0-9]{16,}/ },
  { name: "Stripe webhook secret", regex: /whsec_[A-Za-z0-9]{16,}/ },
  { name: "Supabase JWT/API token", regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
  { name: "Telegram bot token", regex: /\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/ },
  { name: "n8n public API key", regex: /N8N_API_KEY\s*=\s*\S+/ },
  { name: "SMTP password assignment", regex: /SMTP_PASS\s*=\s*\S+/ },
  { name: "Cron secret assignment", regex: /CRON_SECRET\s*=\s*\S+/ },
  { name: "SePay API token assignment", regex: /SEPAY_API_TOKEN\s*=\s*\S+/ },
  { name: "SePay webhook key assignment", regex: /SEPAY_WEBHOOK_API_KEY\s*=\s*\S+/ },
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        files.push(...walk(path.join(dir, entry.name)));
      }
      continue;
    }

    if (!entry.isFile()) continue;
    if (SKIP_FILES.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const ext = path.extname(entry.name).toLowerCase();
    if (TEXT_EXTENSIONS.has(ext)) files.push(fullPath);
  }

  return files;
}

const findings = [];

for (const file of walk(ROOT)) {
  const relative = path.relative(ROOT, file);
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (relative === ".env.example" && /=\s*$/.test(line)) return;

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(line)) {
        findings.push(`${relative}:${index + 1} ${pattern.name}`);
      }
    }
  });
}

if (findings.length > 0) {
  console.error("Potential secret leaks detected:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("Secret audit passed.");
