import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const source = process.argv[2] ?? ".airports-source/airports.json";
const destination = process.argv[3] ?? "data/airports.json";

const raw = JSON.parse(await readFile(source, "utf8"));
const byIata = new Map();

for (const airport of Object.values(raw)) {
  const iata = String(airport.iata ?? "").trim().toUpperCase();
  const city = String(airport.city ?? "").trim();
  const lat = Number(airport.lat);
  const lon = Number(airport.lon);

  if (!/^[A-Z0-9]{3}$/.test(iata) || !city || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;

  const candidate = {
    iata,
    icao: String(airport.icao ?? "").trim().toUpperCase(),
    name: String(airport.name ?? "").trim(),
    city,
    state: String(airport.state ?? "").trim(),
    country: String(airport.country ?? "").trim().toUpperCase(),
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
    tz: String(airport.tz ?? "").trim(),
  };

  const existing = byIata.get(iata);
  const quality = (item) =>
    Number(Boolean(item.tz)) + Number(Boolean(item.name)) + Number(Boolean(item.icao)) + Number(Boolean(item.state));

  if (!existing || quality(candidate) > quality(existing)) byIata.set(iata, candidate);
}

const airports = [...byIata.values()].sort((a, b) =>
  a.country.localeCompare(b.country) || a.city.localeCompare(b.city) || a.iata.localeCompare(b.iata),
);

const payload = {
  meta: {
    source: "mwgg/Airports",
    license: "MIT",
    generatedAt: new Date().toISOString(),
    count: airports.length,
  },
  airports,
};

await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, JSON.stringify(payload), "utf8");
console.log(`Wrote ${airports.length.toLocaleString()} IATA airports to ${destination}`);
