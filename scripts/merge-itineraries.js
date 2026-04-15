const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "index.html");
const itinerariesPath = path.join(root, "data", "itineraries.json");

function extractTripDurations(html) {
  const startToken = "const tripDurations =";
  const startIdx = html.indexOf(startToken);
  if (startIdx === -1) throw new Error("tripDurations not found in index.html");
  const braceIdx = html.indexOf("{", startIdx);
  if (braceIdx === -1)
    throw new Error("Opening brace for tripDurations not found");

  // find matching closing brace by scanning
  let depth = 0;
  let endIdx = -1;
  for (let i = braceIdx; i < html.length; i++) {
    const ch = html[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  if (endIdx === -1)
    throw new Error("Matching closing brace for tripDurations not found");

  const objText = html.slice(braceIdx, endIdx + 1);
  return objText;
}

function parseObject(jsObjectText) {
  // Wrap in parentheses to allow object literal parsing
  const wrapped = "(" + jsObjectText + ")";
  // Use vm to safely evaluate in a fresh context
  const script = new vm.Script(wrapped, { timeout: 1000 });
  const sandbox = {}; // no globals
  const result = script.runInNewContext(sandbox);
  return result;
}

(async function main() {
  try {
    const html = fs.readFileSync(htmlPath, "utf8");
    let tripDurations = {};
    try {
      const objText = extractTripDurations(html);
      tripDurations = parseObject(objText);
    } catch (e) {
      // If embedded tripDurations is not present (we now prefer data/itineraries.json),
      // fall back to empty object and continue without failing.
      console.warn(
        "No embedded tripDurations found in index.html, skipping extraction.",
      );
      tripDurations = {};
    }

    let existing = {};
    if (fs.existsSync(itinerariesPath)) {
      existing = JSON.parse(fs.readFileSync(itinerariesPath, "utf8"));
    }

    // Merge: keep existing entries when present, otherwise use tripDurations
    const merged = Object.assign({}, tripDurations, existing);

    // Ensure output directory exists
    fs.mkdirSync(path.dirname(itinerariesPath), { recursive: true });
    fs.writeFileSync(itinerariesPath, JSON.stringify(merged, null, 2), "utf8");
    console.log("Merged tripDurations into", itinerariesPath);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
