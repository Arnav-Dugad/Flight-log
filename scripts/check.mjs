import { access, readFile } from "node:fs/promises";

const required = [
  "index.html",
  "styles.css",
  "app.js",
  "data/airports.json",
  "data/LICENSE.airports.txt",
  "firestore.rules",
  "firebase.json",
  "vercel.json",
  "scripts/smoke.mjs",
  "assets/flight-log-mark.svg",
];

await Promise.all(required.map((file) => access(file)));

const [html, app, airportText] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("app.js", "utf8"),
  readFile("data/airports.json", "utf8"),
]);

const airportPayload = JSON.parse(airportText);
if (!Array.isArray(airportPayload.airports) || airportPayload.airports.length < 7000) {
  throw new Error("The worldwide airport atlas is missing or unexpectedly small.");
}

const htmlIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
const duplicateIds = [...html.matchAll(/\sid="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((id, index, ids) => ids.indexOf(id) !== index);
if (duplicateIds.length) throw new Error(`Duplicate HTML ids: ${[...new Set(duplicateIds)].join(", ")}`);

const referencedIds = new Set([...app.matchAll(/byId\("([^"]+)"\)/g)].map((match) => match[1]));
const missingIds = [...referencedIds].filter((id) => !htmlIds.has(id));
if (missingIds.length) throw new Error(`app.js references missing HTML ids: ${missingIds.join(", ")}`);

const forbidden = [
  /window\.allFlights\s*=\s*\[/,
  /Initial Flights Data/i,
  /Bulk delete not implemented/i,
  /©\s*2025/,
  /flight-log-4d48d/,
];
for (const pattern of forbidden) {
  if (pattern.test(html) || pattern.test(app)) throw new Error(`Forbidden legacy pattern found: ${pattern}`);
}

if (!app.includes('projectId: "flight-log-b2146"')) throw new Error("Expected Firebase project is not configured.");
if (!app.includes('byId("footer-year").textContent = new Date().getFullYear()')) throw new Error("Footer year is not dynamic.");

console.log(`Checks passed: ${required.length} required files, ${airportPayload.airports.length.toLocaleString()} airports, ${htmlIds.size} unique UI ids.`);
