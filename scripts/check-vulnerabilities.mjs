import { execFileSync } from "node:child_process";

let stdout = "";

try {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    throw new Error("npm_execpath is unavailable");
  }
  stdout = execFileSync(process.execPath, [npmCli, "audit", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (error) {
  stdout = error.stdout?.toString() ?? "";
}

if (!stdout.trim()) {
  console.error("Unable to read npm audit JSON output.");
  process.exit(1);
}

let report;
try {
  report = JSON.parse(stdout);
} catch (error) {
  console.error("Unable to parse npm audit JSON output.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const counts = report.metadata?.vulnerabilities ?? {};
const high = counts.high ?? 0;
const critical = counts.critical ?? 0;
const moderate = counts.moderate ?? 0;
const low = counts.low ?? 0;

if (high > 0 || critical > 0) {
  console.error(
    `High/critical vulnerability audit failed: critical=${critical}, high=${high}, moderate=${moderate}, low=${low}`,
  );
  process.exit(1);
}

console.log(
  `High/critical vulnerability audit passed: critical=${critical}, high=${high}, moderate=${moderate}, low=${low}`,
);
