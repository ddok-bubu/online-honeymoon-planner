const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const ftPath = path.join(root, "data", "flight-times.json");
const destPath = path.join(root, "data", "destinations.json");

function normalizeTimeStr(s) {
  if (!s || typeof s !== "string") return "정보 없음";
  s = s.trim();
  const hourMatch = s.match(/(\d+)\s*시간/);
  const minuteMatch = s.match(/(\d+)\s*분/);
  const h = hourMatch ? parseInt(hourMatch[1], 10) : null;
  const m = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
  if (h === null) return s; // leave as-is if no hours
  const mm = (m || 0).toString().padStart(2, "0");
  return `${h}시간 ${mm}분`;
}

(function main() {
  const ftRaw = fs.existsSync(ftPath)
    ? JSON.parse(fs.readFileSync(ftPath, "utf8"))
    : {};
  const dests = fs.existsSync(destPath)
    ? JSON.parse(fs.readFileSync(destPath, "utf8"))
    : [];

  const out = {};

  // Start with existing entries, normalized
  for (const k of Object.keys(ftRaw)) {
    out[k] = normalizeTimeStr(ftRaw[k]);
  }

  // Ensure all countries from destinations.json are present
  for (const d of dests) {
    const country = d.country;
    if (!country) continue;
    if (!out[country]) {
      out[country] = "정보 없음";
    }
  }

  // Sort keys for readability
  const sortedKeys = Object.keys(out).sort((a, b) => a.localeCompare(b, "ko"));
  const sorted = {};
  for (const k of sortedKeys) sorted[k] = out[k];

  fs.writeFileSync(ftPath, JSON.stringify(sorted, null, 2), "utf8");
  console.log("Normalized flight-times.json — entries:", sortedKeys.length);
})();
