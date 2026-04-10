const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const destPath = path.join(root, "data", "destinations.json");
const ftPath = path.join(root, "data", "flight-times.json");
const outPath = path.join(root, "data", "destinations.normalized.json");

function parseBudget(b) {
  if (!b || typeof b !== "string")
    return { budgetCategory: null, budgetRange: null };
  const m = b.match(/^([^\(\s]+)\s*(?:\(([^\)]+)\))?/);
  if (!m) return { budgetCategory: b.trim(), budgetRange: null };
  return {
    budgetCategory: m[1].trim(),
    budgetRange: m[2] ? m[2].trim() : null,
  };
}

function parseTimeToHours(s) {
  if (!s || typeof s !== "string") return null;
  // e.g. "7시간 10분", "11시간", "24시간"
  const hourMatch = s.match(/(\d+)\s*시간/);
  const minMatch = s.match(/(\d+)\s*분/);
  const h = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const m = minMatch ? parseInt(minMatch[1], 10) : 0;
  const hours = h + m / 60;
  return Math.round(hours * 10) / 10; // one decimal
}

function flightCategory(hours) {
  if (hours === null || typeof hours === "undefined") return null;
  if (hours <= 4) return "단거리";
  if (hours <= 7) return "중거리";
  if (hours <= 12) return "장거리";
  return "울트라 장거리";
}

(function main() {
  const dests = JSON.parse(fs.readFileSync(destPath, "utf8"));
  const fts = fs.existsSync(ftPath)
    ? JSON.parse(fs.readFileSync(ftPath, "utf8"))
    : {};

  const out = dests.map((d) => {
    const copy = Object.assign({}, d);
    const { budgetCategory, budgetRange } = parseBudget(copy.budget);
    copy.budgetCategory = budgetCategory || null;
    copy.budgetRange = budgetRange || null;

    const ftRaw = fts[copy.country];
    const hours = parseTimeToHours(ftRaw);
    copy.flightTimeHours = hours;
    copy.flightTimeCategory = flightCategory(hours);

    return copy;
  });

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log("Wrote normalized destinations to", outPath);
})();
