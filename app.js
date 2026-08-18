import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsIsSupported } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXwcBSw5DBx-b4Zlu2z0vRuePnXWLE-lY",
  authDomain: "flight-log-b2146.firebaseapp.com",
  projectId: "flight-log-b2146",
  storageBucket: "flight-log-b2146.firebasestorage.app",
  messagingSenderId: "238477280957",
  appId: "1:238477280957:web:1264abefe8c64edf00d9d4",
  measurementId: "G-4SGQC3M7VJ",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

setPersistence(auth, browserLocalPersistence).catch(() => {});
analyticsIsSupported().then((supported) => supported && getAnalytics(firebaseApp)).catch(() => {});

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const byId = (id) => document.getElementById(id);

const INDIA_AIRPORTS = [
  "DEL", "BOM", "BLR", "HYD", "MAA", "CCU", "COK", "GOI", "GOX", "AMD", "PNQ", "JAI", "LKO", "GAU",
  "IXC", "BBI", "TRV", "SXR", "IXB", "VNS", "IDR", "NAG", "PAT", "RPR", "IXE", "ATQ", "UDR", "DED",
];

const AIRLINES = [
  { code: "AI", name: "Air India", group: "India" },
  { code: "6E", name: "IndiGo", group: "India" },
  { code: "IX", name: "Air India Express", group: "India" },
  { code: "QP", name: "Akasa Air", group: "India" },
  { code: "SG", name: "SpiceJet", group: "India" },
  { code: "9I", name: "Alliance Air", group: "India" },
  { code: "S5", name: "Star Air", group: "India" },
  { code: "IC", name: "FLY91", group: "India" },
  { code: "2T", name: "TruJet", group: "India" },
  { code: "EK", name: "Emirates", group: "International" },
  { code: "QR", name: "Qatar Airways", group: "International" },
  { code: "EY", name: "Etihad Airways", group: "International" },
  { code: "SQ", name: "Singapore Airlines", group: "International" },
  { code: "LH", name: "Lufthansa", group: "International" },
  { code: "BA", name: "British Airways", group: "International" },
  { code: "AF", name: "Air France", group: "International" },
  { code: "KL", name: "KLM", group: "International" },
  { code: "LX", name: "SWISS", group: "International" },
  { code: "TK", name: "Turkish Airlines", group: "International" },
  { code: "SV", name: "Saudia", group: "International" },
  { code: "GF", name: "Gulf Air", group: "International" },
  { code: "WY", name: "Oman Air", group: "International" },
  { code: "G9", name: "Air Arabia", group: "International" },
  { code: "FZ", name: "flydubai", group: "International" },
  { code: "UL", name: "SriLankan Airlines", group: "International" },
  { code: "TG", name: "Thai Airways", group: "International" },
  { code: "MH", name: "Malaysia Airlines", group: "International" },
  { code: "AK", name: "AirAsia", group: "International" },
  { code: "CX", name: "Cathay Pacific", group: "International" },
  { code: "NH", name: "ANA", group: "International" },
  { code: "JL", name: "Japan Airlines", group: "International" },
  { code: "KE", name: "Korean Air", group: "International" },
  { code: "QF", name: "Qantas", group: "International" },
  { code: "NZ", name: "Air New Zealand", group: "International" },
  { code: "AA", name: "American Airlines", group: "International" },
  { code: "DL", name: "Delta Air Lines", group: "International" },
  { code: "UA", name: "United Airlines", group: "International" },
  { code: "AC", name: "Air Canada", group: "International" },
  { code: "VS", name: "Virgin Atlantic", group: "International" },
  { code: "IB", name: "Iberia", group: "International" },
  { code: "AY", name: "Finnair", group: "International" },
  { code: "ET", name: "Ethiopian Airlines", group: "International" },
  { code: "KQ", name: "Kenya Airways", group: "International" },
  { code: "MS", name: "EgyptAir", group: "International" },
  { code: "RJ", name: "Royal Jordanian", group: "International" },
  { code: "LO", name: "LOT Polish Airlines", group: "International" },
  { code: "AZ", name: "ITA Airways", group: "International" },
  { code: "VN", name: "Vietnam Airlines", group: "International" },
  { code: "GA", name: "Garuda Indonesia", group: "International" },
  { code: "PR", name: "Philippine Airlines", group: "International" },
];

const AIRLINE_BY_CODE = new Map(AIRLINES.map((airline) => [airline.code, airline]));
const DEFAULT_SETTINGS = {
  displayName: "",
  homeAirport: "",
  currency: "INR",
  motion: !matchMedia("(prefers-reduced-motion: reduce)").matches,
  labels: true,
  indiaFirst: true,
};

const state = {
  user: null,
  journeys: [],
  filteredJourneys: [],
  airports: [],
  airportByIata: new Map(),
  settings: { ...DEFAULT_SETTINGS },
  builderSegments: [],
  editingJourneyId: null,
  activeJourneyId: null,
  authMode: "signin",
  journeysUnsubscribe: null,
  world: null,
  worldReady: false,
  autoRotate: true,
  airportAtlasReady: false,
  securityReady: null,
};

const countryDisplay = typeof Intl.DisplayNames === "function"
  ? new Intl.DisplayNames(["en"], { type: "region" })
  : null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value = "") {
  return String(value).trim().replace(/\s+/g, " ");
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  const date = safeDate(value);
  return date ? new Intl.DateTimeFormat("en-IN", options).format(date) : "Date not set";
}

function formatTime(value) {
  const date = safeDate(value);
  return date ? new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date) : "—";
}

function formatNumber(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits }).format(Number(value) || 0);
}

function formatCurrency(value, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value) || 0);
  } catch {
    return `${currency} ${formatNumber(value)}`;
  }
}

function countryName(code) {
  try { return countryDisplay?.of(code) || code; } catch { return code; }
}

function airportLabel(airport) {
  return airport ? `${airport.iata} · ${airport.city}` : "";
}

function airlineLogo(code, size = 200) {
  return `https://pics.avs.io/${size}/${size}/${encodeURIComponent(code || "XX")}.png`;
}

function airlineName(code, fallback = "") {
  return AIRLINE_BY_CODE.get(code)?.name || fallback || code || "Airline not set";
}

function uidFragment(value = "") {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return Math.abs(hash >>> 0).toString(36).slice(0, 6).toUpperCase().padStart(6, "0");
}

function showDialog(id) {
  const dialog = byId(id);
  if (dialog && !dialog.open) dialog.showModal();
}

function closeDialog(id) {
  const dialog = byId(id);
  if (dialog?.open) dialog.close();
}

function toast(title, message = "", type = "info") {
  const icons = { info: "ph-info", success: "ph-check", error: "ph-warning" };
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.innerHTML = `<i class="ph-bold ${icons[type] || icons.info}"></i><div><b>${escapeHtml(title)}</b>${message ? `<span>${escapeHtml(message)}</span>` : ""}</div>`;
  byId("toast-region").append(item);
  setTimeout(() => {
    item.classList.add("hiding");
    setTimeout(() => item.remove(), 320);
  }, 4300);
}

function requireUser(action = "continue") {
  if (state.user) return true;
  toast("Sign in required", `Sign in to ${action} and sync it to your account.`);
  openAuth("signin");
  return false;
}

function requireSecureCloud(action = "store private data") {
  if (state.securityReady !== false) return true;
  toast("Privacy rules must be deployed", `Flight Log blocked this write to ${action} because the current Firestore rules allow anonymous reads. Deploy firestore.rules first.`, "error");
  return false;
}

function firebaseMessage(error) {
  const messages = {
    "auth/email-already-in-use": "That email already has an account. Try signing in.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/popup-closed-by-user": "Google sign-in was closed before completion.",
    "auth/popup-blocked": "Your browser blocked the sign-in window. Allow popups and try again.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/weak-password": "Use a stronger password with at least 6 characters.",
    "permission-denied": "Firebase denied this action. Deploy the included Firestore rules.",
  };
  return messages[error?.code] || normalizeText(error?.message || "Something went wrong. Please try again.").replace(/^Firebase:\s*/i, "");
}

async function loadAirportAtlas() {
  const response = await fetch("data/airports.json", { cache: "force-cache" });
  if (!response.ok) throw new Error(`Airport atlas returned ${response.status}`);
  const payload = await response.json();
  state.airports = Array.isArray(payload.airports) ? payload.airports : [];
  state.airportByIata = new Map(state.airports.map((airport) => [airport.iata, airport]));
  state.airportAtlasReady = true;
  byId("boot-status").textContent = `${formatNumber(state.airports.length)} airports ready · connecting securely…`;
}

async function checkFirebaseSecurity() {
  const endpoint = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users?pageSize=1&key=${firebaseConfig.apiKey}`;
  try {
    const response = await fetch(endpoint, { method: "GET", cache: "no-store", credentials: "omit" });
    state.securityReady = !response.ok;
    if (!state.securityReady) {
      updateSyncPill("", "Rules needed");
      toast("Firebase privacy lock engaged", "Anonymous reads are currently allowed, so new private writes are blocked until firestore.rules is deployed.", "error");
    }
  } catch {
    state.securityReady = null;
  }
  return state.securityReady;
}

const securityCheckPromise = checkFirebaseSecurity();

function haversineKm(fromCode, toCode) {
  const from = state.airportByIata.get(fromCode);
  const to = state.airportByIata.get(toCode);
  if (!from || !to) return 0;
  const radians = (degrees) => degrees * Math.PI / 180;
  const deltaLat = radians(to.lat - from.lat);
  const deltaLon = radians(to.lon - from.lon);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function carbonForDistance(distanceKm) {
  if (!distanceKm) return 0;
  const factor = distanceKm < 1500 ? 0.158 : distanceKm < 4000 ? 0.12 : 0.104;
  return Math.round(distanceKm * factor);
}

function timezoneOffsetHours(fromCode, toCode, at = new Date()) {
  const from = state.airportByIata.get(fromCode);
  const to = state.airportByIata.get(toCode);
  if (!from?.tz || !to?.tz) return null;
  const offsetAt = (timeZone) => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).formatToParts(at).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
      return (Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second) - at.getTime()) / 3600000;
    } catch { return null; }
  };
  const fromOffset = offsetAt(from.tz);
  const toOffset = offsetAt(to.tz);
  return fromOffset == null || toOffset == null ? null : toOffset - fromOffset;
}

function waitForGlobe(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (window.Globe) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > timeout) {
        clearInterval(timer);
        reject(new Error("Globe library did not load"));
      }
    }, 80);
  });
}

async function initGlobe() {
  try {
    await waitForGlobe();
    const world = window.Globe()(byId("globeViz"))
      .width(innerWidth)
      .height(innerHeight)
      .backgroundColor("rgba(0,0,0,0)")
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-night.jpg")
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      .showAtmosphere(true)
      .atmosphereColor("#48b9e9")
      .atmosphereAltitude(0.16)
      .arcsData([])
      .arcStartLat("startLat")
      .arcStartLng("startLng")
      .arcEndLat("endLat")
      .arcEndLng("endLng")
      .arcColor("color")
      .arcAltitude("altitude")
      .arcStroke("stroke")
      .arcDashLength(1)
      .arcDashGap(0)
      .arcLabel((arc) => `${escapeHtml(arc.from)} → ${escapeHtml(arc.to)} · ${escapeHtml(arc.airline)}`)
      .onArcClick((arc) => openJourneyDetail(arc.journeyId))
      .pointsData([])
      .pointColor("color")
      .pointAltitude(0.012)
      .pointRadius((point) => point.home ? 0.34 : 0.22)
      .pointLabel((point) => `<b>${escapeHtml(point.iata)}</b><br>${escapeHtml(point.city)}`)
      .ringsData([])
      .ringColor(() => (t) => `rgba(96,241,223,${Math.max(0, 1 - t) * 0.45})`)
      .ringMaxRadius(2.2)
      .ringPropagationSpeed(1.15)
      .ringRepeatPeriod(1300)
      .htmlElementsData([])
      .htmlLat("lat")
      .htmlLng("lon")
      .htmlAltitude(0.014)
      .htmlElement((airport) => {
        const label = document.createElement("button");
        label.type = "button";
        label.className = "globe-airport-label";
        label.textContent = airport.iata;
        label.title = `${airport.city} · ${countryName(airport.country)}`;
        label.addEventListener("click", (event) => {
          event.stopPropagation();
          focusAirport(airport.iata);
        });
        return label;
      });

    world.pointOfView({ lat: 21.3, lng: 78.8, altitude: 2.15 }, 0);
    const controls = world.controls();
    controls.autoRotate = state.settings.motion;
    controls.autoRotateSpeed = 0.32;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    state.world = world;
    state.worldReady = true;
    updateGlobe();
  } catch (error) {
    console.warn(error);
    byId("globeViz").classList.add("globe-fallback");
  }
}

function journeyArcs(journeys = state.filteredJourneys) {
  return journeys.flatMap((journey) => (journey.segments || []).map((segment, index) => {
    const start = state.airportByIata.get(segment.from);
    const end = state.airportByIata.get(segment.to);
    if (!start || !end) return null;
    const distance = haversineKm(segment.from, segment.to);
    return {
      journeyId: journey.id,
      segmentIndex: index,
      from: segment.from,
      to: segment.to,
      airline: airlineName(segment.airlineCode, segment.airlineName),
      status: journey.status,
      startLat: start.lat,
      startLng: start.lon,
      endLat: end.lat,
      endLng: end.lon,
      altitude: Math.min(0.58, Math.max(0.08, distance / 18000)),
      stroke: journey.id === state.activeJourneyId ? 0.72 : 0.38,
      color: journey.id === state.activeJourneyId
        ? ["#8eeaff", "#60f1df"]
        : journey.status === "planned" ? ["#ad8cff", "#66c7ff"] : ["#278bc6", "#60d8db"],
    };
  }).filter(Boolean));
}

function routeAirports(journeys = state.filteredJourneys) {
  const codes = new Set(journeys.flatMap((journey) => (journey.segments || []).flatMap((segment) => [segment.from, segment.to])));
  return [...codes].map((code) => state.airportByIata.get(code)).filter(Boolean).map((airport) => ({
    ...airport,
    home: airport.iata === state.settings.homeAirport,
    color: airport.iata === state.settings.homeAirport ? "#f9c96b" : "#72e7ea",
  }));
}

function updateGlobe() {
  if (!state.worldReady || !state.airportAtlasReady) return;
  const airports = routeAirports();
  state.world
    .arcsData(journeyArcs())
    .pointsData(airports)
    .ringsData([])
    .htmlElementsData(state.settings.labels ? airports : []);
}

function setGlobeMotion(enabled) {
  state.autoRotate = enabled;
  byId("toggle-rotation").classList.toggle("active", enabled);
  if (state.worldReady) state.world.controls().autoRotate = enabled && state.settings.motion;
}

function focusAirport(code) {
  const airport = state.airportByIata.get(code);
  if (airport && state.worldReady) state.world.pointOfView({ lat: airport.lat, lng: airport.lon, altitude: 0.95 }, 900);
}

function fitRoutes() {
  const airports = routeAirports();
  if (!state.worldReady) return;
  if (!airports.length) {
    state.world.pointOfView({ lat: 21.3, lng: 78.8, altitude: 2.15 }, 900);
    return;
  }
  const lat = airports.reduce((sum, airport) => sum + airport.lat, 0) / airports.length;
  const lng = airports.reduce((sum, airport) => sum + airport.lon, 0) / airports.length;
  const altitude = airports.length < 3 ? 1.4 : airports.length < 8 ? 1.8 : 2.3;
  state.world.pointOfView({ lat, lng, altitude }, 1000);
}

function allSegments(journeys = state.journeys) {
  return journeys.flatMap((journey) => (journey.segments || []).map((segment) => ({ ...segment, journey })));
}

function segmentArrivalTime(segment) {
  const explicit = safeDate(segment.arrivalAt);
  if (explicit) return explicit;
  const departure = safeDate(segment.departureAt);
  if (!departure) return null;
  const estimatedMinutes = (haversineKm(segment.from, segment.to) / 800 * 60) + 45;
  return new Date(departure.getTime() + estimatedMinutes * 60000);
}

function connectionMinimumMinutes(previous, next) {
  const hub = state.airportByIata.get(previous.to);
  const previousFrom = state.airportByIata.get(previous.from);
  const nextTo = state.airportByIata.get(next.to);
  const international = previousFrom?.country !== hub?.country || hub?.country !== nextTo?.country;
  let minimum = international ? 105 : 55;
  if (["DEL", "BOM", "BLR", "HYD", "LHR", "JFK", "CDG", "DXB"].includes(previous.to)) minimum += 15;
  if (previous.arrivalTerminal && next.departureTerminal && previous.arrivalTerminal !== next.departureTerminal) minimum += 25;
  if (next.selfTransfer) minimum += 75;
  return minimum;
}

function connectionAnalysis(previous, next, inboundDelayMinutes = 0) {
  const arrival = segmentArrivalTime(previous);
  const departure = safeDate(next.departureAt);
  if (!arrival || !departure) {
    return { airport: previous.to, layoverMinutes: null, minimumMinutes: null, bufferMinutes: null, level: "unknown", label: "Times needed" };
  }
  const layoverMinutes = Math.round((departure - arrival) / 60000) - inboundDelayMinutes;
  const minimumMinutes = connectionMinimumMinutes(previous, next);
  const bufferMinutes = layoverMinutes - minimumMinutes;
  const level = bufferMinutes < 0 ? "risk" : bufferMinutes < 45 ? "tight" : "safe";
  const label = level === "safe" ? "Comfortable" : level === "tight" ? "Watch closely" : "At risk";
  return { airport: previous.to, layoverMinutes, minimumMinutes, bufferMinutes, level, label };
}

function journeyConnections(journey, inboundDelayMinutes = 0) {
  const segments = journey?.segments || [];
  return segments.slice(0, -1).map((segment, index) => connectionAnalysis(segment, segments[index + 1], inboundDelayMinutes));
}

function durationMinutesForSegment(segment) {
  const departure = safeDate(segment.departureAt);
  const arrival = segmentArrivalTime(segment);
  return departure && arrival ? Math.max(0, Math.round((arrival - departure) / 60000)) : 0;
}

function metricsForJourney(journey) {
  const segments = journey?.segments || [];
  const distanceKm = Math.round(segments.reduce((sum, segment) => sum + haversineKm(segment.from, segment.to), 0));
  const carbonKg = segments.reduce((sum, segment) => sum + carbonForDistance(haversineKm(segment.from, segment.to)), 0);
  const airMinutes = segments.reduce((sum, segment) => sum + durationMinutesForSegment(segment), 0);
  const countries = new Set(segments.flatMap((segment) => [
    state.airportByIata.get(segment.from)?.country,
    state.airportByIata.get(segment.to)?.country,
  ]).filter(Boolean));
  const legacyTotal = segments.reduce((sum, segment) => sum + Number(segment.cost || 0), 0);
  const totalCost = Number(journey?.totalCost ?? legacyTotal) || 0;
  const currency = journey?.currency || segments.find((segment) => segment.currency)?.currency || "INR";
  return { distanceKm, carbonKg, airMinutes, countries, totalCost, currency, connections: journeyConnections(journey) };
}

function calculateStats(journeys = state.journeys) {
  const segments = allSegments(journeys);
  const airports = new Set();
  const countries = new Set();
  const cities = new Set();
  const airlines = new Map();
  const airportCounts = new Map();
  let distanceKm = 0;
  let carbonKg = 0;
  let airMinutes = 0;
  const spendCurrency = state.settings.currency || "INR";
  let trackedSpend = 0;
  let connections = 0;
  let clockShifts = 0;
  let indianSegments = 0;

  for (const { journey, ...segment } of segments) {
    const from = state.airportByIata.get(segment.from);
    const to = state.airportByIata.get(segment.to);
    const distance = haversineKm(segment.from, segment.to);
    distanceKm += distance;
    carbonKg += carbonForDistance(distance);
    airMinutes += durationMinutesForSegment(segment);
    if (segment.airlineCode) airlines.set(segment.airlineCode, (airlines.get(segment.airlineCode) || 0) + 1);
    for (const airport of [from, to]) {
      if (!airport) continue;
      airports.add(airport.iata);
      countries.add(airport.country);
      cities.add(`${airport.country}:${airport.city}`);
      airportCounts.set(airport.iata, (airportCounts.get(airport.iata) || 0) + 1);
    }
    if (from?.country === "IN" && to?.country === "IN") indianSegments += 1;
    const shift = timezoneOffsetHours(segment.from, segment.to, safeDate(segment.departureAt) || new Date());
    if (shift && Math.abs(shift) >= 1) clockShifts += 1;
  }

  for (const journey of journeys) {
    const journeyMetrics = metricsForJourney(journey);
    if (journeyMetrics.currency === spendCurrency) trackedSpend += journeyMetrics.totalCost;
  }

  connections = journeys.reduce((sum, journey) => sum + Math.max(0, (journey.segments?.length || 0) - 1), 0);
  const riskyConnections = journeys.flatMap((journey) => journeyConnections(journey)).filter((item) => item.level === "risk").length;
  const safeConnections = journeys.flatMap((journey) => journeyConnections(journey)).filter((item) => item.level === "safe").length;
  const score = segments.length
    ? Math.min(100, Math.round(22 + Math.min(28, segments.length * 3.1) + Math.min(22, countries.size * 3.2) + Math.min(14, distanceKm / 18000) + Math.min(14, connections * 2)))
    : null;
  const persona = !segments.length ? "Awaiting take-off"
    : countries.size >= 12 ? "Borderless Cartographer"
      : connections >= 6 ? "Connection Composer"
        : indianSegments >= Math.max(3, segments.length * 0.65) ? "India Skywalker"
          : distanceKm >= 40000 ? "Orbit Chaser"
            : segments.length >= 8 ? "Runway Regular"
              : "Curious Navigator";

  return {
    journeys: journeys.length,
    segments: segments.length,
    airports,
    airportCounts,
    countries,
    cities,
    airlines,
    distanceKm: Math.round(distanceKm),
    carbonKg,
    airMinutes,
    trackedSpend,
    spendCurrency,
    connections,
    riskyConnections,
    safeConnections,
    clockShifts,
    indianSegments,
    score,
    persona,
  };
}

function routeCodes(journey) {
  const segments = journey?.segments || [];
  if (!segments.length) return [];
  return [segments[0].from, ...segments.map((segment) => segment.to)];
}

function journeyTitle(journey) {
  if (normalizeText(journey.name)) return normalizeText(journey.name);
  const codes = routeCodes(journey);
  const first = state.airportByIata.get(codes[0])?.city || codes[0] || "Journey";
  const last = state.airportByIata.get(codes.at(-1))?.city || codes.at(-1) || "";
  return first === last ? `${first} return` : `${first} to ${last}`;
}

function airlineLogoStack(journey) {
  const uniqueCodes = [...new Set((journey.segments || []).map((segment) => segment.airlineCode).filter(Boolean))].slice(0, 3);
  if (!uniqueCodes.length) return `<span class="airline-fallback" style="width:23px;height:23px;border-radius:7px"><i class="ph ph-airplane"></i></span>`;
  return uniqueCodes.map((code) => `<img src="${airlineLogo(code)}" alt="${escapeHtml(airlineName(code))}" loading="lazy" onerror="this.style.display='none'">`).join("");
}

function renderJourneyList() {
  const list = byId("journey-list");
  const empty = byId("empty-state");
  list.innerHTML = "";

  if (!state.filteredJourneys.length) {
    empty.classList.add("visible");
    if (!state.user) {
      byId("empty-eyebrow").textContent = "PRIVATE CLOUD ATLAS";
      byId("empty-title").textContent = "Sign in to meet your sky.";
      byId("empty-copy").textContent = "Your journeys live in your Firebase account, never as public or dummy data.";
      byId("empty-action").innerHTML = `Sign in or create an account <i class="ph-bold ph-arrow-right"></i>`;
    } else if (state.journeys.length) {
      byId("empty-eyebrow").textContent = "NO MATCHING ROUTES";
      byId("empty-title").textContent = "Try a wider horizon.";
      byId("empty-copy").textContent = "Change the search, year or status filter to reveal more journeys.";
      byId("empty-action").innerHTML = `Clear all filters <i class="ph-bold ph-arrow-counter-clockwise"></i>`;
    } else {
      byId("empty-eyebrow").textContent = "YOUR ATLAS IS PRISTINE";
      byId("empty-title").textContent = "Your first route is waiting.";
      byId("empty-copy").textContent = "Add a single flight or build a multi-city journey with every connection kept together.";
      byId("empty-action").innerHTML = `Log your first journey <i class="ph-bold ph-arrow-right"></i>`;
    }
    return;
  }

  empty.classList.remove("visible");
  state.filteredJourneys.forEach((journey, index) => {
    const metrics = metricsForJourney(journey);
    const codes = routeCodes(journey);
    const from = state.airportByIata.get(codes[0]);
    const to = state.airportByIata.get(codes.at(-1));
    const connections = Math.max(0, (journey.segments?.length || 0) - 1);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "journey-card";
    card.style.animationDelay = `${Math.min(index * 55, 330)}ms`;
    card.dataset.journeyId = journey.id;
    card.innerHTML = `
      <div>
        <div class="journey-card-top">
          <span class="status-chip ${journey.status === "planned" ? "planned" : ""}">${journey.status === "planned" ? "Planned" : "Flown"}</span>
          ${connections ? `<span class="connection-chip"><i class="ph-bold ph-git-branch"></i>${connections} connection${connections > 1 ? "s" : ""}</span>` : ""}
          <h3>${escapeHtml(journeyTitle(journey))}</h3>
        </div>
        <div class="journey-places">
          <strong>${escapeHtml(codes[0] || "—")}</strong>
          <span class="route-line ${connections ? "multi" : ""}">${connections ? `<span class="route-stops">${codes.slice(1, -1).map((code) => `<b title="${escapeHtml(state.airportByIata.get(code)?.city || code)}"></b>`).join("")}</span>` : ""}<i class="ph-fill ph-airplane-tilt"></i></span>
          <strong>${escapeHtml(codes.at(-1) || "—")}</strong>
        </div>
        <div class="journey-meta">
          <span><i class="ph ph-calendar-blank"></i>${escapeHtml(formatDate(journey.departureStart || journey.segments?.[0]?.departureAt, { day: "numeric", month: "short", year: "numeric" }))}</span>
          <span><i class="ph ph-map-pin"></i>${escapeHtml(from?.city || codes[0] || "—")} → ${escapeHtml(to?.city || codes.at(-1) || "—")}</span>
        </div>
      </div>
      <div class="journey-card-side">
        <span class="airline-stack">${airlineLogoStack(journey)}</span>
        <span class="journey-card-numbers"><b>${metrics.totalCost ? escapeHtml(formatCurrency(metrics.totalCost, metrics.currency)) : ""}</b><small>${formatNumber(metrics.distanceKm)} km</small></span>
      </div>`;
    card.addEventListener("click", () => openJourneyDetail(journey.id));
    card.addEventListener("mouseenter", () => {
      state.activeJourneyId = journey.id;
      updateGlobe();
    });
    card.addEventListener("mouseleave", () => {
      state.activeJourneyId = null;
      updateGlobe();
    });
    list.append(card);
  });
}

function populateYearFilter() {
  const selected = byId("year-filter").value || "all";
  const years = [...new Set(state.journeys.map((journey) => safeDate(journey.departureStart || journey.segments?.[0]?.departureAt)?.getFullYear()).filter(Boolean))].sort((a, b) => b - a);
  byId("year-filter").innerHTML = `<option value="all">All years</option>${years.map((year) => `<option value="${year}">${year}</option>`).join("")}`;
  byId("year-filter").value = years.includes(Number(selected)) ? selected : "all";
}

function applyFilters() {
  const search = normalizeText(byId("journey-search").value).toLowerCase();
  const year = byId("year-filter").value;
  const status = byId("status-filter").value;
  state.filteredJourneys = state.journeys.filter((journey) => {
    const journeyYear = safeDate(journey.departureStart || journey.segments?.[0]?.departureAt)?.getFullYear();
    if (year !== "all" && String(journeyYear) !== year) return false;
    if (status !== "all" && journey.status !== status) return false;
    if (!search) return true;
    const haystack = [
      journey.name,
      journey.purpose,
      journey.notes,
      ...(journey.tags || []),
      ...(journey.segments || []).flatMap((segment) => {
        const from = state.airportByIata.get(segment.from);
        const to = state.airportByIata.get(segment.to);
        return [segment.from, segment.to, from?.city, to?.city, from?.name, to?.name, airlineName(segment.airlineCode, segment.airlineName), segment.flightNumber];
      }),
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(search);
  });
  byId("journey-search").closest(".search-box").classList.toggle("has-value", Boolean(search));
  renderJourneyList();
  updateGlobe();
}

function renderMetricsAndIntelligence() {
  const stats = calculateStats();
  byId("metric-journeys").textContent = formatNumber(stats.journeys);
  byId("metric-segments").textContent = `${formatNumber(stats.segments)} flight${stats.segments === 1 ? "" : "s"}`;
  byId("metric-distance").textContent = formatNumber(stats.distanceKm);
  byId("metric-around-world").textContent = stats.distanceKm ? `${(stats.distanceKm / 40075).toFixed(1)}× around Earth` : "Your atlas is ready";
  byId("metric-countries").textContent = formatNumber(stats.countries.size);
  byId("metric-cities").textContent = `${formatNumber(stats.cities.size)} cit${stats.cities.size === 1 ? "y" : "ies"}`;
  byId("metric-score").textContent = stats.score ?? "—";
  byId("metric-score-label").textContent = stats.persona;

  byId("intel-score").textContent = stats.score ?? "—";
  byId("intel-persona").textContent = stats.persona;
  byId("intel-score-copy").textContent = stats.segments
    ? `${stats.airports.size} airports shape a network unique to you.`
    : "Log a journey to reveal the shape of your travel life.";
  byId("intel-hours").textContent = `${formatNumber(stats.airMinutes / 60, 1)}h`;
  byId("intel-connections").textContent = formatNumber(stats.connections);
  byId("intel-carbon").textContent = stats.carbonKg >= 1000 ? `${formatNumber(stats.carbonKg / 1000, 1)} t` : `${formatNumber(stats.carbonKg)} kg`;
  byId("intel-spend").textContent = formatCurrency(stats.trackedSpend, stats.spendCurrency);

  if (!stats.connections) {
    byId("connection-title").textContent = "No connections yet";
    byId("connection-copy").textContent = "Multi-leg journeys receive dynamic buffer analysis.";
  } else if (stats.riskyConnections) {
    byId("connection-title").textContent = `${stats.riskyConnections} connection${stats.riskyConnections > 1 ? "s" : ""} need attention`;
    byId("connection-copy").textContent = "Open the What-if Lab to simulate delays and see which onward flights are exposed.";
  } else {
    byId("connection-title").textContent = `${stats.safeConnections}/${stats.connections} comfortable buffers`;
    byId("connection-copy").textContent = "Your logged connection times currently sit above the estimated minimums.";
  }

  byId("timezone-title").textContent = `${stats.clockShifts} clock shift${stats.clockShifts === 1 ? "" : "s"}`;
  byId("timezone-copy").textContent = stats.clockShifts ? "Your atlas crosses local-time boundaries; each journey preserves arrival context." : "No major timezone crossing logged yet.";

  const topIndiaHub = [...stats.airportCounts.entries()]
    .filter(([code]) => state.airportByIata.get(code)?.country === "IN")
    .sort((a, b) => b[1] - a[1])[0];
  byId("india-title").textContent = topIndiaHub ? `${topIndiaHub[0]} is your India anchor` : "Ready for your first Indian route";
  byId("india-copy").textContent = topIndiaHub
    ? `${stats.indianSegments} domestic India flight${stats.indianSegments === 1 ? "" : "s"}; ${state.airportByIata.get(topIndiaHub[0])?.city} leads your hub activity.`
    : "Domestic coverage and favourite hubs are calculated privately.";

  const topAirlines = [...stats.airlines.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maximum = topAirlines[0]?.[1] || 1;
  byId("network-bars").innerHTML = topAirlines.length
    ? `<p class="eyebrow">AIRLINE CONSTELLATION</p>${topAirlines.map(([code, count]) => `<div class="network-bar"><div><span>${escapeHtml(airlineName(code))}</span><b>${count}</b></div><span><i style="width:${Math.max(12, count / maximum * 100)}%"></i></span></div>`).join("")}`
    : "";

  renderFlightprint(stats);
}

function renderFlightprint(stats = calculateStats()) {
  const name = state.settings.displayName || state.user?.displayName || state.user?.email?.split("@")[0] || "Traveller";
  const topAirline = [...stats.airlines.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostUsedAirports = [...stats.airportCounts.entries()].sort((a, b) => b[1] - a[1]);
  byId("passport-id").textContent = `FL—${uidFragment(state.user?.uid || "traveller")}`;
  byId("passport-name").textContent = name;
  byId("passport-persona").textContent = stats.persona;
  byId("passport-flights").textContent = formatNumber(stats.segments);
  byId("passport-km").textContent = formatNumber(stats.distanceKm);
  byId("passport-countries").textContent = formatNumber(stats.countries.size);
  byId("passport-hours").textContent = formatNumber(stats.airMinutes / 60, 1);
  byId("passport-airline").textContent = topAirline ? `FREQUENTLY ABOARD ${airlineName(topAirline[0]).toUpperCase()}` : "NO FAVOURITE AIRLINE YET";
  byId("passport-date").textContent = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(new Date()).toUpperCase();
  byId("passport-route").innerHTML = `<span>${escapeHtml(mostUsedAirports[0]?.[0] || state.settings.homeAirport || "IND")}</span><i class="ph-fill ph-airplane-tilt"></i><span>${escapeHtml(mostUsedAirports[1]?.[0] || "WORLD")}</span>`;
}

function renderAll() {
  populateYearFilter();
  applyFilters();
  renderMetricsAndIntelligence();
}

function localDateTimeValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function addMinutesToLocal(value, minutes) {
  const date = safeDate(value);
  return date ? localDateTimeValue(new Date(date.getTime() + minutes * 60000)) : "";
}

function blankSegment(seed = {}) {
  return {
    from: "",
    to: "",
    departureAt: "",
    arrivalAt: "",
    airlineCode: "",
    airlineName: "",
    flightNumber: "",
    cabin: "economy",
    seat: "",
    departureTerminal: "",
    arrivalTerminal: "",
    selfTransfer: false,
    checkedBag: false,
    ...seed,
  };
}

function airlineOptions(selectedCode = "") {
  const groups = ["India", "International"];
  return `<option value="">Choose airline</option>${groups.map((group) => `<optgroup label="${group}">${AIRLINES.filter((airline) => airline.group === group).map((airline) => `<option value="${airline.code}" ${airline.code === selectedCode ? "selected" : ""}>${escapeHtml(airline.name)} · ${airline.code}</option>`).join("")}</optgroup>`).join("")}`;
}

function connectionBridgeHtml(previous, current) {
  const connection = connectionAnalysis(previous, current);
  const airport = state.airportByIata.get(previous.to);
  if (connection.layoverMinutes == null) {
    return `<div class="connection-bridge"><span>Connection at <strong>${escapeHtml(previous.to || "next airport")}</strong> · add arrival and departure times for Shield analysis</span></div>`;
  }
  const hours = Math.floor(Math.max(0, connection.layoverMinutes) / 60);
  const minutes = Math.max(0, connection.layoverMinutes) % 60;
  return `<div class="connection-bridge"><span>Connection at <strong>${escapeHtml(airport?.city || previous.to)}</strong> · ${hours ? `${hours}h ` : ""}${minutes}m · <b class="shield-${connection.level}">${connection.label}</b></span></div>`;
}

function segmentCardHtml(segment, index) {
  const from = state.airportByIata.get(segment.from);
  const to = state.airportByIata.get(segment.to);
  const logo = segment.airlineCode ? airlineLogo(segment.airlineCode) : airlineLogo("XX");
  return `
    <article class="segment-card" data-index="${index}" data-leg="LEG ${String(index + 1).padStart(2, "0")}">
      <div class="segment-topline"><span class="segment-number">${index + 1}</span><b>${index ? "Onward flight" : "First flight"}</b>${state.builderSegments.length > 1 ? `<button class="remove-segment" type="button" data-remove-segment="${index}" aria-label="Remove flight ${index + 1}"><i class="ph ph-trash"></i></button>` : ""}</div>
      <div class="segment-route-grid">
        <label class="segment-field"><span>From</span><div class="airport-field"><input class="airport-input segment-from" type="text" autocomplete="off" placeholder="City or IATA" value="${escapeHtml(airportLabel(from))}" data-code="${escapeHtml(segment.from)}" /><span class="airport-code-hint">${escapeHtml(segment.from)}</span><div class="airport-results"></div></div></label>
        <button class="swap-airports" type="button" data-swap="${index}" aria-label="Swap departure and arrival airports"><i class="ph ph-arrows-left-right"></i></button>
        <label class="segment-field"><span>To</span><div class="airport-field"><input class="airport-input segment-to" type="text" autocomplete="off" placeholder="City or IATA" value="${escapeHtml(airportLabel(to))}" data-code="${escapeHtml(segment.to)}" /><span class="airport-code-hint">${escapeHtml(segment.to)}</span><div class="airport-results"></div></div></label>
      </div>
      <div class="segment-details-grid">
        <label class="segment-field date-field"><span>Departure</span><input class="segment-departure" type="datetime-local" value="${escapeHtml(segment.departureAt)}" /></label>
        <label class="segment-field date-field"><span>Arrival <small>Local time</small></span><input class="segment-arrival" type="datetime-local" value="${escapeHtml(segment.arrivalAt)}" /></label>
        <label class="segment-field airline-field"><span>Airline</span><div class="airline-select-wrap"><img class="airline-preview ${segment.airlineCode ? "" : "hidden"}" src="${logo}" alt="" onerror="this.classList.add('hidden')" /><select class="segment-airline">${airlineOptions(segment.airlineCode)}</select></div></label>
        <label class="segment-field flight-number-field"><span>Flight number</span><input class="segment-flight-number" type="text" maxlength="10" value="${escapeHtml(segment.flightNumber)}" placeholder="AI 202" /></label>
        <label class="segment-field cabin-field"><span>Cabin</span><select class="segment-cabin"><option value="economy" ${segment.cabin === "economy" ? "selected" : ""}>Economy</option><option value="premium-economy" ${segment.cabin === "premium-economy" ? "selected" : ""}>Premium economy</option><option value="business" ${segment.cabin === "business" ? "selected" : ""}>Business</option><option value="first" ${segment.cabin === "first" ? "selected" : ""}>First</option></select></label>
        <label class="segment-field seat-field"><span>Seat <small>Optional</small></span><input class="segment-seat" type="text" maxlength="5" value="${escapeHtml(segment.seat)}" placeholder="12A" /></label>
        <label class="segment-field terminal-field"><span>Depart terminal</span><input class="segment-departure-terminal" type="text" maxlength="8" value="${escapeHtml(segment.departureTerminal)}" placeholder="T3" /></label>
        <label class="segment-field terminal-field"><span>Arrive terminal</span><input class="segment-arrival-terminal" type="text" maxlength="8" value="${escapeHtml(segment.arrivalTerminal)}" placeholder="T2" /></label>
      </div>
      <div class="segment-options">
        <label class="mini-check"><input class="segment-self-transfer" type="checkbox" ${segment.selfTransfer ? "checked" : ""} /> Self-transfer / separate ticket</label>
        <label class="mini-check"><input class="segment-checked-bag" type="checkbox" ${segment.checkedBag ? "checked" : ""} /> Checked baggage</label>
      </div>
    </article>`;
}

function syncBuilderSegmentsFromDom() {
  state.builderSegments = $$(".segment-card", byId("segment-list")).map((card) => {
    const airlineCode = $(".segment-airline", card).value;
    return blankSegment({
      from: $(".segment-from", card).dataset.code || "",
      to: $(".segment-to", card).dataset.code || "",
      departureAt: $(".segment-departure", card).value,
      arrivalAt: $(".segment-arrival", card).value,
      airlineCode,
      airlineName: airlineName(airlineCode, ""),
      flightNumber: normalizeText($(".segment-flight-number", card).value).toUpperCase(),
      cabin: $(".segment-cabin", card).value,
      seat: normalizeText($(".segment-seat", card).value).toUpperCase(),
      departureTerminal: normalizeText($(".segment-departure-terminal", card).value).toUpperCase(),
      arrivalTerminal: normalizeText($(".segment-arrival-terminal", card).value).toUpperCase(),
      selfTransfer: $(".segment-self-transfer", card).checked,
      checkedBag: $(".segment-checked-bag", card).checked,
    });
  });
  return state.builderSegments;
}

function searchAirports(queryText) {
  const queryValue = normalizeText(queryText).toLowerCase();
  const home = state.settings.homeAirport;
  if (!queryValue) {
    const priority = [home, ...INDIA_AIRPORTS].filter(Boolean);
    return [...new Set(priority)].map((code) => state.airportByIata.get(code)).filter(Boolean).slice(0, 10);
  }
  const exactCode = queryValue.toUpperCase();
  return state.airports
    .map((airport) => {
      const iata = airport.iata.toLowerCase();
      const city = airport.city.toLowerCase();
      const name = airport.name.toLowerCase();
      const country = countryName(airport.country).toLowerCase();
      let score = 0;
      if (iata === queryValue) score += 500;
      else if (iata.startsWith(queryValue)) score += 250;
      if (city === queryValue) score += 220;
      else if (city.startsWith(queryValue)) score += 150;
      else if (city.includes(queryValue)) score += 85;
      if (name.startsWith(queryValue)) score += 70;
      else if (name.includes(queryValue)) score += 35;
      if (country.startsWith(queryValue)) score += 50;
      if (state.settings.indiaFirst && airport.country === "IN") score += 22;
      if (airport.iata === home) score += 25;
      if (airport.iata === exactCode) score += 500;
      return { airport, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.airport.city.localeCompare(b.airport.city))
    .slice(0, 10)
    .map((result) => result.airport);
}

function renderAirportResults(input) {
  const results = $(".airport-results", input.closest(".airport-field"));
  const airports = searchAirports(input.value);
  results.innerHTML = airports.length ? airports.map((airport, index) => `
    <button class="airport-option ${index === 0 ? "active" : ""}" type="button" data-airport-code="${airport.iata}">
      <strong>${airport.iata}</strong><span><b>${escapeHtml(airport.city)}</b><small>${escapeHtml(airport.name)}</small></span><small>${escapeHtml(countryName(airport.country))}</small>
    </button>`).join("") : `<div class="airport-option"><span><b>No airport found</b><small>Try a city, airport name, IATA or country.</small></span></div>`;
  results.classList.add("open");
  $$('[data-airport-code]', results).forEach((option) => {
    option.addEventListener("mousedown", (event) => event.preventDefault());
    option.addEventListener("click", () => selectAirport(input, option.dataset.airportCode));
  });
}

function selectAirport(input, code) {
  const airport = state.airportByIata.get(code);
  if (!airport) return;
  input.dataset.code = code;
  input.value = airportLabel(airport);
  input.classList.remove("invalid");
  const field = input.closest(".airport-field");
  $(".airport-code-hint", field)?.replaceChildren(document.createTextNode(code));
  $(".airport-results", field)?.classList.remove("open");
  syncBuilderSegmentsFromDom();
  updateBuilderPreview();
}

function attachAirportAutocomplete(root = document) {
  $$(".airport-input", root).forEach((input) => {
    if (input.dataset.autocompleteReady) return;
    input.dataset.autocompleteReady = "true";
    input.addEventListener("focus", () => renderAirportResults(input));
    input.addEventListener("input", () => {
      input.dataset.code = "";
      const hint = $(".airport-code-hint", input.closest(".airport-field"));
      if (hint) hint.textContent = "";
      renderAirportResults(input);
    });
    input.addEventListener("keydown", (event) => {
      const results = $(".airport-results", input.closest(".airport-field"));
      const options = $$("[data-airport-code]", results);
      if (event.key === "Escape") results.classList.remove("open");
      if (event.key === "Enter" && results.classList.contains("open") && options.length) {
        event.preventDefault();
        const active = $(".airport-option.active", results) || options[0];
        selectAirport(input, active.dataset.airportCode);
      }
      if (["ArrowDown", "ArrowUp"].includes(event.key) && options.length) {
        event.preventDefault();
        const current = Math.max(0, options.findIndex((option) => option.classList.contains("active")));
        const next = event.key === "ArrowDown" ? (current + 1) % options.length : (current - 1 + options.length) % options.length;
        options.forEach((option, index) => option.classList.toggle("active", index === next));
        options[next].scrollIntoView({ block: "nearest" });
      }
    });
    input.addEventListener("blur", () => {
      setTimeout(() => $(".airport-results", input.closest(".airport-field"))?.classList.remove("open"), 120);
      if (!input.dataset.code) {
        const typedCode = normalizeText(input.value).split(/\s|·|-/)[0].toUpperCase();
        if (state.airportByIata.has(typedCode)) selectAirport(input, typedCode);
      }
    });
  });
}

function renderBuilderSegments() {
  const container = byId("segment-list");
  container.innerHTML = state.builderSegments.map((segment, index) => `${index ? connectionBridgeHtml(state.builderSegments[index - 1], segment) : ""}${segmentCardHtml(segment, index)}`).join("");
  byId("segment-count").textContent = `${state.builderSegments.length} flight${state.builderSegments.length === 1 ? "" : "s"}`;
  attachAirportAutocomplete(container);

  $$('[data-remove-segment]', container).forEach((button) => button.addEventListener("click", () => {
    syncBuilderSegmentsFromDom();
    state.builderSegments.splice(Number(button.dataset.removeSegment), 1);
    renderBuilderSegments();
  }));
  $$('[data-swap]', container).forEach((button) => button.addEventListener("click", () => {
    syncBuilderSegmentsFromDom();
    const segment = state.builderSegments[Number(button.dataset.swap)];
    [segment.from, segment.to] = [segment.to, segment.from];
    renderBuilderSegments();
  }));
  $$("input, select", container).forEach((input) => input.addEventListener("change", () => {
    if (input.classList.contains("segment-airline")) {
      const preview = $(".airline-preview", input.closest(".airline-field"));
      if (input.value) {
        preview.src = airlineLogo(input.value);
        preview.classList.remove("hidden");
      } else preview.classList.add("hidden");
    }
    syncBuilderSegmentsFromDom();
    updateBuilderPreview();
  }));
  $$(".segment-flight-number", container).forEach((input) => input.addEventListener("input", () => {
    const normalized = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const match = [...AIRLINE_BY_CODE.keys()].sort((a, b) => b.length - a.length).find((code) => normalized.startsWith(code));
    if (match) {
      const select = $(".segment-airline", input.closest(".segment-card"));
      if (select.value !== match) {
        select.value = match;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }));
  updateBuilderPreview();
}

function updateBuilderPreview() {
  const segments = state.builderSegments;
  const first = segments[0];
  const last = segments.at(-1);
  const totalCost = Number(byId("journey-total-price")?.value || 0);
  const currency = byId("journey-currency")?.value || state.settings.currency || "INR";
  const temporary = { segments, totalCost, currency };
  const metrics = metricsForJourney(temporary);
  const shift = first && last ? timezoneOffsetHours(first.from, last.to, safeDate(first.departureAt) || new Date()) : null;
  byId("builder-route").innerHTML = `<span>${escapeHtml(first?.from || "FROM")}</span><i class="ph-fill ph-airplane-tilt"></i><span>${escapeHtml(last?.to || "TO")}</span>`;
  byId("builder-distance").textContent = metrics.distanceKm ? `${formatNumber(metrics.distanceKm)} km` : "—";
  byId("builder-connections").textContent = segments.length > 1 ? `${segments.length - 1} connection${segments.length > 2 ? "s" : ""}` : "Direct";
  byId("builder-price").textContent = totalCost ? formatCurrency(totalCost, currency) : "Not entered";
  byId("builder-value").textContent = totalCost && metrics.distanceKm ? `${formatCurrency(totalCost / metrics.distanceKm, currency)} / km` : "—";
  byId("builder-timezone").textContent = shift == null || !first?.from || !last?.to ? "—" : `${shift > 0 ? "+" : ""}${formatNumber(shift, 1)}h`;
  byId("builder-carbon").textContent = metrics.carbonKg ? `~${formatNumber(metrics.carbonKg)} kg` : "—";
  const signal = byId("builder-signal");
  const completeRoutes = segments.filter((segment) => state.airportByIata.has(segment.from) && state.airportByIata.has(segment.to)).length;
  const timedFlights = segments.filter((segment) => safeDate(segment.departureAt)).length;
  const riskyConnections = journeyConnections(temporary).filter((connection) => connection.level === "risk").length;
  signal.className = `journey-signal ${riskyConnections ? "attention" : completeRoutes === segments.length && timedFlights === segments.length ? "excellent" : ""}`;
  signal.innerHTML = riskyConnections
    ? `<span>JOURNEY SIGNAL</span><strong>Connection attention needed</strong><small>${riskyConnections} onward flight${riskyConnections > 1 ? "s have" : " has"} less than the estimated transfer buffer.</small>`
    : completeRoutes === segments.length && timedFlights === segments.length
      ? `<span>JOURNEY SIGNAL</span><strong>Flight plan looks coherent</strong><small>${segments.length} flight${segments.length > 1 ? "s" : ""}, ${formatNumber(metrics.distanceKm)} km and no route conflicts detected.</small>`
      : `<span>JOURNEY SIGNAL</span><strong>Ready to compose</strong><small>Add valid airports and departure times to activate the live quality model.</small>`;
  const shield = byId("builder-shield");
  shield.className = "connection-preview";
  if (segments.length < 2) {
    shield.innerHTML = `<i class="ph-duotone ph-shield-chevron"></i><div><span>Connection Shield</span><strong>Add another flight to activate</strong></div>`;
    return;
  }
  const connections = journeyConnections(temporary);
  const risky = connections.filter((item) => item.level === "risk").length;
  const tight = connections.filter((item) => item.level === "tight").length;
  shield.classList.add(risky ? "risk" : "safe");
  shield.innerHTML = `<i class="ph-duotone ${risky ? "ph-warning-diamond" : "ph-shield-check"}"></i><div><span>Connection Shield</span><strong>${risky ? `${risky} onward flight${risky > 1 ? "s" : ""} at risk` : tight ? `${tight} tight connection${tight > 1 ? "s" : ""}; review the buffer` : "All timed connections look comfortable"}</strong></div>`;
}

function openJourneyBuilder(journey = null) {
  if (!requireUser("save a journey")) return;
  state.editingJourneyId = journey?.id || null;
  state.builderSegments = journey?.segments?.length ? journey.segments.map((segment) => blankSegment(segment)) : [blankSegment()];
  byId("builder-eyebrow").textContent = journey ? "EDIT JOURNEY" : "NEW JOURNEY";
  byId("builder-title").textContent = journey ? "Refine your route" : "Compose your route";
  byId("journey-name").value = journey?.name || "";
  byId("journey-status").value = journey?.status || "flown";
  byId("journey-purpose").value = journey?.purpose || "leisure";
  const existingMetrics = metricsForJourney(journey || { segments: [] });
  byId("journey-total-price").value = existingMetrics.totalCost || "";
  byId("journey-currency").value = journey ? (journey.currency || existingMetrics.currency || "INR") : (state.settings.currency || "INR");
  byId("journey-booking-reference").value = journey?.bookingReference || "";
  byId("journey-rating").value = String(journey?.rating || 0);
  byId("journey-notes").value = journey?.notes || "";
  byId("journey-tags").value = (journey?.tags || []).join(", ");
  byId("itinerary-text").value = "";
  byId("save-journey").querySelector("span").textContent = journey ? "Update journey" : "Save journey";
  renderBuilderSegments();
  showDialog("journey-modal");
}

function addConnectingSegment() {
  syncBuilderSegmentsFromDom();
  const previous = state.builderSegments.at(-1);
  const departureAt = previous?.arrivalAt ? addMinutesToLocal(previous.arrivalAt, 120) : "";
  state.builderSegments.push(blankSegment({ from: previous?.to || "", departureAt }));
  renderBuilderSegments();
  requestAnimationFrame(() => {
    const card = $$(".segment-card", byId("segment-list")).at(-1);
    card?.scrollIntoView({ behavior: state.settings.motion ? "smooth" : "auto", block: "center" });
    $(".segment-to", card)?.focus();
  });
}

function validateBuilder(segments) {
  let firstInvalid = null;
  const totalPriceField = byId("journey-total-price");
  const totalPriceValid = !totalPriceField.value || Number(totalPriceField.value) >= 0;
  totalPriceField.classList.toggle("invalid", !totalPriceValid);
  if (!totalPriceValid) firstInvalid = totalPriceField;
  $$(".segment-card", byId("segment-list")).forEach((card, index) => {
    const segment = segments[index];
    const fields = [
      [$(".segment-from", card), state.airportByIata.has(segment.from)],
      [$(".segment-to", card), state.airportByIata.has(segment.to)],
      [$(".segment-departure", card), Boolean(safeDate(segment.departureAt))],
    ];
    for (const [field, valid] of fields) {
      field.classList.toggle("invalid", !valid);
      if (!valid && !firstInvalid) firstInvalid = field;
    }
    if (segment.from && segment.from === segment.to) {
      $(".segment-to", card).classList.add("invalid");
      firstInvalid ||= $(".segment-to", card);
    }
    if (segment.arrivalAt && safeDate(segment.arrivalAt) <= safeDate(segment.departureAt)) {
      $(".segment-arrival", card).classList.add("invalid");
      firstInvalid ||= $(".segment-arrival", card);
    }
  });
  if (firstInvalid) {
    firstInvalid.focus();
    toast("Complete the flight plan", "Review highlighted fields, valid airports, departure times and the journey total.", "error");
    return false;
  }
  return true;
}

async function saveJourney(event) {
  event.preventDefault();
  if (!requireUser("save this journey")) return;
  if (!requireSecureCloud("save this journey")) return;
  const segments = syncBuilderSegmentsFromDom();
  if (!validateBuilder(segments)) return;
  const saveButton = byId("save-journey");
  saveButton.disabled = true;
  saveButton.querySelector("span").textContent = "Saving…";
  const title = normalizeText(byId("journey-name").value);
  const cleanSegments = segments.map((segment) => ({
    from: segment.from,
    to: segment.to,
    departureAt: segment.departureAt,
    arrivalAt: segment.arrivalAt,
    airlineCode: segment.airlineCode,
    airlineName: segment.airlineCode ? airlineName(segment.airlineCode) : "",
    flightNumber: segment.flightNumber,
    cabin: segment.cabin,
    seat: segment.seat,
    departureTerminal: segment.departureTerminal,
    arrivalTerminal: segment.arrivalTerminal,
    selfTransfer: Boolean(segment.selfTransfer),
    checkedBag: Boolean(segment.checkedBag),
  }));
  const metrics = metricsForJourney({ segments: cleanSegments });
  const payload = {
    schemaVersion: 3,
    name: title,
    status: byId("journey-status").value,
    purpose: byId("journey-purpose").value,
    notes: normalizeText(byId("journey-notes").value),
    tags: byId("journey-tags").value.split(",").map(normalizeText).filter(Boolean).slice(0, 12),
    totalCost: Number(byId("journey-total-price").value || 0),
    currency: byId("journey-currency").value,
    bookingReference: normalizeText(byId("journey-booking-reference").value).toUpperCase(),
    rating: Number(byId("journey-rating").value || 0),
    segments: cleanSegments,
    departureStart: cleanSegments[0].departureAt,
    arrivalEnd: cleanSegments.at(-1).arrivalAt || "",
    distanceKm: metrics.distanceKm,
    carbonEstimateKg: metrics.carbonKg,
    updatedAt: serverTimestamp(),
  };
  try {
    if (state.editingJourneyId) {
      await setDoc(doc(db, "users", state.user.uid, "journeys", state.editingJourneyId), payload, { merge: true });
      toast("Journey updated", "Your connected itinerary is synced.", "success");
    } else {
      await addDoc(collection(db, "users", state.user.uid, "journeys"), { ...payload, createdAt: serverTimestamp() });
      toast("Journey added", cleanSegments.length > 1 ? `${cleanSegments.length} flights are now one connected story.` : "Your new route is now part of the atlas.", "success");
    }
    closeDialog("journey-modal");
  } catch (error) {
    toast("Could not save journey", firebaseMessage(error), "error");
  } finally {
    saveButton.disabled = false;
    saveButton.querySelector("span").textContent = state.editingJourneyId ? "Update journey" : "Save journey";
  }
}

function parseItineraryText() {
  const text = byId("itinerary-text").value.toUpperCase();
  const lines = text.split(/\r?\n/).map(normalizeText).filter(Boolean);
  const parsed = [];
  const airlineCodes = [...AIRLINE_BY_CODE.keys()].sort((a, b) => b.length - a.length).join("|");
  for (const line of lines) {
    const codes = [...line.matchAll(/\b[A-Z0-9]{3}\b/g)].map((match) => match[0]).filter((code) => state.airportByIata.has(code));
    if (codes.length < 2) continue;
    const flightMatch = line.match(new RegExp(`\\b(${airlineCodes})\\s*[- ]?(\\d{1,4}[A-Z]?)\\b`));
    const dateMatch = line.match(/\b(20\d{2})[-\/]([01]?\d)[-\/]([0-3]?\d)\b/) || line.match(/\b([0-3]?\d)[-\/]([01]?\d)[-\/](20\d{2})\b/);
    const times = [...line.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)].map((match) => `${match[1].padStart(2, "0")}:${match[2]}`);
    let datePart = "";
    if (dateMatch) {
      if (dateMatch[1].length === 4) datePart = `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`;
      else datePart = `${dateMatch[3]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[1].padStart(2, "0")}`;
    }
    const departureAt = datePart && times[0] ? `${datePart}T${times[0]}` : "";
    let arrivalAt = datePart && times[1] ? `${datePart}T${times[1]}` : "";
    if (departureAt && arrivalAt && safeDate(arrivalAt) <= safeDate(departureAt)) arrivalAt = addMinutesToLocal(arrivalAt, 1440);
    parsed.push(blankSegment({
      from: codes[0],
      to: codes[1],
      departureAt,
      arrivalAt,
      airlineCode: flightMatch?.[1] || "",
      airlineName: flightMatch ? airlineName(flightMatch[1]) : "",
      flightNumber: flightMatch ? `${flightMatch[1]} ${flightMatch[2]}` : "",
    }));
  }
  if (!parsed.length) {
    toast("No flights recognised", "Use one flight per line with two IATA codes, for example: AI 202 · DEL → BOM.", "error");
    return;
  }
  state.builderSegments = parsed;
  renderBuilderSegments();
  toast("Itinerary composed", `${parsed.length} flight${parsed.length > 1 ? "s" : ""} found. Review the details before saving.`, "success");
}

function detailTimelineHtml(journey) {
  const segments = journey.segments || [];
  return segments.map((segment, index) => {
    const from = state.airportByIata.get(segment.from);
    const to = state.airportByIata.get(segment.to);
    const connection = index < segments.length - 1 ? connectionAnalysis(segment, segments[index + 1]) : null;
    const date = safeDate(segment.departureAt);
    const duration = durationMinutesForSegment(segment);
    const extras = [
      segment.cabin ? segment.cabin.replace("-", " ") : "",
      segment.seat ? `Seat ${segment.seat}` : "",
      segment.departureTerminal ? `From ${segment.departureTerminal}` : "",
      segment.arrivalTerminal ? `To ${segment.arrivalTerminal}` : "",
      segment.checkedBag ? "Checked bag" : "",
    ].filter(Boolean);
    const layoverText = connection?.layoverMinutes == null
      ? "Connection time unavailable"
      : `${Math.floor(Math.max(0, connection.layoverMinutes) / 60)}h ${Math.max(0, connection.layoverMinutes) % 60}m at ${connection.airport} · ${connection.label}`;
    return `
      <div class="timeline-leg">
        <div class="timeline-date">${escapeHtml(date ? formatDate(date, { day: "2-digit", month: "short" }).toUpperCase() : "DATE TBC")}<br>${escapeHtml(formatTime(segment.departureAt))}</div>
        <span class="timeline-dot"></span>
        <div class="timeline-flight">
          <div class="timeline-flight-top">
            ${segment.airlineCode ? `<img src="${airlineLogo(segment.airlineCode)}" alt="${escapeHtml(airlineName(segment.airlineCode))}" onerror="this.style.display='none'">` : ""}
            <div><b>${escapeHtml(airlineName(segment.airlineCode, segment.airlineName))}</b><span>${escapeHtml(segment.flightNumber || "Flight number not added")} · ${duration ? `${Math.floor(duration / 60)}h ${duration % 60}m` : "duration estimated"}</span></div>
          </div>
          <div class="timeline-route"><strong>${escapeHtml(segment.from)}</strong><i class="ph-fill ph-airplane-tilt"></i><strong>${escapeHtml(segment.to)}</strong><span>${escapeHtml(from?.city || "")} → ${escapeHtml(to?.city || "")}</span></div>
          ${extras.length ? `<div class="timeline-extra">${extras.map((extra) => `<span>${escapeHtml(extra)}</span>`).join("")}</div>` : ""}
        </div>
      </div>
      ${connection ? `<div class="timeline-connection"><i class="ph ph-git-branch"></i> ${escapeHtml(layoverText)}</div>` : ""}`;
  }).join("");
}

function renderDelayLab(journey, delayMinutes = 0) {
  const connections = journeyConnections(journey, delayMinutes);
  const lab = byId("delay-lab");
  lab.classList.toggle("hidden", !connections.length);
  byId("delay-value").textContent = `${delayMinutes} min`;
  byId("delay-results").innerHTML = connections.map((connection) => {
    const remaining = connection.layoverMinutes == null ? "Times needed" : `${Math.max(0, connection.layoverMinutes)} min left`;
    return `<div class="delay-result"><span>${escapeHtml(connection.airport)} onward</span><strong class="${connection.level}">${escapeHtml(remaining)} · ${escapeHtml(connection.label)}</strong></div>`;
  }).join("");
}

function openJourneyDetail(journeyId) {
  const journey = state.journeys.find((item) => item.id === journeyId);
  if (!journey) return;
  state.activeJourneyId = journeyId;
  updateGlobe();
  const metrics = metricsForJourney(journey);
  const codes = routeCodes(journey);
  const from = state.airportByIata.get(codes[0]);
  const to = state.airportByIata.get(codes.at(-1));
  const dateRange = `${formatDate(journey.departureStart || journey.segments?.[0]?.departureAt)}${journey.arrivalEnd && formatDate(journey.arrivalEnd) !== formatDate(journey.departureStart) ? ` — ${formatDate(journey.arrivalEnd)}` : ""}`;
  byId("detail-eyebrow").textContent = `${journey.status === "planned" ? "PLANNED" : "FLOWN"} / ${(journey.purpose || "journey").toUpperCase()}`;
  byId("detail-title").textContent = journeyTitle(journey);
  byId("detail-subtitle").textContent = `${dateRange} · ${journey.segments.length} flight${journey.segments.length > 1 ? "s" : ""}`;
  byId("detail-route").innerHTML = `
    <div class="detail-airport"><strong>${escapeHtml(codes[0])}</strong><span>${escapeHtml(from?.city || "")}</span></div>
    <div class="detail-route-line"><span>${journey.segments.length > 1 ? `${journey.segments.length - 1} connection${journey.segments.length > 2 ? "s" : ""}` : "DIRECT"}</span><i class="ph-fill ph-airplane-tilt"></i></div>
    <div class="detail-airport"><strong>${escapeHtml(codes.at(-1))}</strong><span>${escapeHtml(to?.city || "")}</span></div>`;
  byId("detail-metrics").innerHTML = `
    <div><strong>${formatNumber(metrics.distanceKm)} km</strong><span>Distance</span></div>
    <div><strong>${formatNumber(metrics.airMinutes / 60, 1)}h</strong><span>Air time</span></div>
    <div><strong>${metrics.countries.size}</strong><span>Countries</span></div>
    <div><strong>~${formatNumber(metrics.carbonKg)} kg</strong><span>CO₂ estimate</span></div>
    ${metrics.totalCost ? `<div><strong>${escapeHtml(formatCurrency(metrics.totalCost, metrics.currency))}</strong><span>Total journey price</span></div>` : ""}
    ${journey.rating ? `<div><strong>${"★".repeat(journey.rating)}${"☆".repeat(5 - journey.rating)}</strong><span>Experience</span></div>` : ""}`;
  byId("detail-flight-count").textContent = `${journey.segments.length} flight${journey.segments.length > 1 ? "s" : ""}`;
  byId("detail-timeline").innerHTML = detailTimelineHtml(journey);
  byId("detail-notes").textContent = journey.notes || "No note added.";
  byId("detail-tags").innerHTML = (journey.tags || []).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("");
  byId("delay-slider").value = "0";
  renderDelayLab(journey, 0);
  showDialog("detail-modal");
  const firstAirport = state.airportByIata.get(codes[0]);
  const lastAirport = state.airportByIata.get(codes.at(-1));
  if (state.worldReady && firstAirport && lastAirport) {
    state.world.pointOfView({ lat: (firstAirport.lat + lastAirport.lat) / 2, lng: (firstAirport.lon + lastAirport.lon) / 2, altitude: 1.4 }, 850);
  }
}

async function deleteActiveJourney() {
  const journey = state.journeys.find((item) => item.id === state.activeJourneyId);
  if (!journey || !state.user) return;
  if (!confirm(`Delete “${journeyTitle(journey)}”? This removes it from your Firebase account.`)) return;
  try {
    await deleteDoc(doc(db, "users", state.user.uid, "journeys", journey.id));
    closeDialog("detail-modal");
    toast("Journey deleted", "The route has been removed from your atlas.", "success");
  } catch (error) {
    toast("Could not delete journey", firebaseMessage(error), "error");
  }
}

async function duplicateActiveJourney() {
  const journey = state.journeys.find((item) => item.id === state.activeJourneyId);
  if (!journey || !requireUser("duplicate this journey")) return;
  if (!requireSecureCloud("duplicate this journey")) return;
  try {
    const { id, createdAt, updatedAt, ...copy } = journey;
    const journeyMetrics = metricsForJourney(journey);
    const cleanSegments = (journey.segments || []).map((rawSegment) => {
      const { cost, currency, ...segment } = rawSegment;
      return segment;
    });
    await addDoc(collection(db, "users", state.user.uid, "journeys"), {
      ...copy,
      schemaVersion: 3,
      name: `${journeyTitle(journey)} — copy`,
      status: "planned",
      segments: cleanSegments,
      totalCost: journeyMetrics.totalCost,
      currency: journeyMetrics.currency,
      bookingReference: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    closeDialog("detail-modal");
    toast("Journey duplicated", "A planned copy is ready for your edits.", "success");
  } catch (error) {
    toast("Could not duplicate journey", firebaseMessage(error), "error");
  }
}

async function downloadFlightprint() {
  if (!window.html2canvas) {
    toast("Image renderer unavailable", "Try again after the page finishes loading.", "error");
    return;
  }
  const button = byId("download-flightprint");
  button.disabled = true;
  try {
    const canvas = await window.html2canvas(byId("flightprint-capture"), {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `flight-log-flightprint-${new Date().getFullYear()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast("Flightprint downloaded", "Your share card contains totals, not private itinerary details.", "success");
  } catch (error) {
    toast("Could not render Flightprint", "A remote airline image may have blocked export. Try again in a moment.", "error");
  } finally {
    button.disabled = false;
  }
}

async function copyFlightprintSummary() {
  const stats = calculateStats();
  const summary = `My Flight Log: ${stats.segments} flights · ${formatNumber(stats.distanceKm)} km · ${stats.countries.size} countries · ${stats.persona}.`;
  try {
    await navigator.clipboard.writeText(summary);
    toast("Summary copied", "Ready to share wherever you choose.", "success");
  } catch {
    toast("Copy unavailable", summary);
  }
}

function openAuth(mode = "signin") {
  state.authMode = mode;
  const signup = mode === "signup";
  byId("auth-eyebrow").textContent = signup ? "BEGIN YOUR ATLAS" : "WELCOME BACK";
  byId("auth-title").textContent = signup ? "Create your Flight Log" : "Sign in to Flight Log";
  byId("auth-copy").textContent = signup ? "Your private, cloud-synced aviation atlas starts here." : "Your atlas will appear the moment you sign in.";
  byId("auth-submit").querySelector("span").textContent = signup ? "Create account" : "Sign in";
  byId("toggle-auth-mode").textContent = signup ? "I already have an account" : "Create an account";
  byId("auth-password").autocomplete = signup ? "new-password" : "current-password";
  byId("auth-error").textContent = "";
  showDialog("auth-modal");
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const email = normalizeText(byId("auth-email").value);
  const password = byId("auth-password").value;
  const submit = byId("auth-submit");
  const errorField = byId("auth-error");
  errorField.textContent = "";
  submit.disabled = true;
  submit.querySelector("span").textContent = state.authMode === "signup" ? "Creating account…" : "Signing in…";
  try {
    if (state.authMode === "signup") await createUserWithEmailAndPassword(auth, email, password);
    else await signInWithEmailAndPassword(auth, email, password);
    closeDialog("auth-modal");
    toast(state.authMode === "signup" ? "Atlas created" : "Welcome back", "Your private journeys are syncing now.", "success");
  } catch (error) {
    errorField.textContent = firebaseMessage(error);
  } finally {
    submit.disabled = false;
    submit.querySelector("span").textContent = state.authMode === "signup" ? "Create account" : "Sign in";
  }
}

async function handleGoogleAuth() {
  const errorField = byId("auth-error");
  errorField.textContent = "";
  try {
    await signInWithPopup(auth, googleProvider);
    closeDialog("auth-modal");
    toast("Welcome aboard", "Your Google account is now connected to Flight Log.", "success");
  } catch (error) {
    errorField.textContent = firebaseMessage(error);
  }
}

async function handlePasswordReset() {
  const email = normalizeText(byId("auth-email").value);
  if (!email) {
    byId("auth-error").textContent = "Enter your email address first.";
    byId("auth-email").focus();
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    toast("Reset email sent", "Check your inbox for a secure password reset link.", "success");
  } catch (error) {
    byId("auth-error").textContent = firebaseMessage(error);
  }
}

function updateSyncPill(mode, label) {
  const pill = byId("sync-pill");
  pill.className = `sync-pill ${mode || ""}`;
  $("b", pill).textContent = label;
}

async function loadUserProfile(user) {
  try {
    const profileRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(profileRef);
    const cloudSettings = snapshot.exists() ? snapshot.data().settings : null;
    state.settings = { ...DEFAULT_SETTINGS, ...(cloudSettings || {}) };
    if (!state.settings.displayName) state.settings.displayName = user.displayName || "";
    if (state.securityReady !== false) {
      await setDoc(profileRef, {
        email: user.email || "",
        displayName: state.settings.displayName || user.displayName || "",
        settings: state.settings,
        lastActiveAt: serverTimestamp(),
        appVersion: 2,
      }, { merge: true });
    }
  } catch (error) {
    console.warn("Profile sync failed", error);
    state.settings = { ...DEFAULT_SETTINGS, displayName: user.displayName || "" };
    toast("Profile settings unavailable", firebaseMessage(error), "error");
  }
  applySettings();
}

function subscribeToJourneys(user) {
  state.journeysUnsubscribe?.();
  const journeysQuery = query(collection(db, "users", user.uid, "journeys"), orderBy("departureStart", "desc"));
  state.journeysUnsubscribe = onSnapshot(journeysQuery, { includeMetadataChanges: true }, (snapshot) => {
    state.journeys = snapshot.docs.map((journeyDoc) => ({ id: journeyDoc.id, ...journeyDoc.data() }));
    if (state.securityReady === false) updateSyncPill("", "Rules needed");
    else updateSyncPill(snapshot.metadata.hasPendingWrites ? "syncing" : "online", snapshot.metadata.hasPendingWrites ? "Syncing…" : "Cloud synced");
    renderAll();
  }, (error) => {
    updateSyncPill("", "Sync blocked");
    toast("Firebase sync is blocked", firebaseMessage(error), "error");
  });
}

function renderUserState() {
  if (state.user) {
    updateSyncPill(state.securityReady === false ? "" : "online", state.securityReady === false ? "Rules needed" : "Cloud synced");
    byId("settings-sync-note").textContent = `Signed in as ${state.user.email || "your account"}`;
    byId("builder-save-note").innerHTML = `<i class="ph-fill ph-cloud-check"></i> Saved privately to ${escapeHtml(state.user.email || "your Firebase account")}`;
  } else {
    updateSyncPill("", "Sign in");
    byId("settings-sync-note").textContent = "Sign in to sync settings.";
    byId("builder-save-note").innerHTML = `<i class="ph-fill ph-cloud"></i> Sign in to save journeys`;
  }
  renderAll();
}

onAuthStateChanged(auth, async (user) => {
  await securityCheckPromise;
  state.user = user;
  if (user) {
    await loadUserProfile(user);
    subscribeToJourneys(user);
  } else {
    state.journeysUnsubscribe?.();
    state.journeysUnsubscribe = null;
    state.journeys = [];
    state.filteredJourneys = [];
    state.settings = { ...DEFAULT_SETTINGS };
    applySettings();
  }
  renderUserState();
});

function populateSettingsForm() {
  byId("setting-name").value = state.settings.displayName || state.user?.displayName || "";
  const home = state.airportByIata.get(state.settings.homeAirport);
  byId("setting-home-airport").value = airportLabel(home);
  byId("setting-home-airport").dataset.code = home?.iata || "";
  byId("setting-currency").value = state.settings.currency || "INR";
  byId("setting-motion").checked = Boolean(state.settings.motion);
  byId("setting-labels").checked = Boolean(state.settings.labels);
  byId("setting-india-first").checked = Boolean(state.settings.indiaFirst);
  attachAirportAutocomplete(byId("settings-modal"));
}

function applySettings() {
  document.body.classList.toggle("motion-off", !state.settings.motion);
  setGlobeMotion(Boolean(state.settings.motion));
  updateGlobe();
}

async function saveSettings(event) {
  event.preventDefault();
  if (!requireUser("sync settings")) return;
  if (!requireSecureCloud("sync settings")) return;
  const displayName = normalizeText(byId("setting-name").value);
  state.settings = {
    displayName,
    homeAirport: byId("setting-home-airport").dataset.code || "",
    currency: byId("setting-currency").value,
    motion: byId("setting-motion").checked,
    labels: byId("setting-labels").checked,
    indiaFirst: byId("setting-india-first").checked,
  };
  try {
    await setDoc(doc(db, "users", state.user.uid), {
      displayName,
      settings: state.settings,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    if (displayName !== state.user.displayName) await updateProfile(state.user, { displayName });
    applySettings();
    renderMetricsAndIntelligence();
    closeDialog("settings-modal");
    toast("Settings synced", "Your preferences now follow your account.", "success");
  } catch (error) {
    toast("Could not save settings", firebaseMessage(error), "error");
  }
}

function exportJourneyData() {
  if (!requireUser("export your data")) return;
  const payload = {
    format: "flight-log",
    schemaVersion: 3,
    exportedAt: new Date().toISOString(),
    account: { email: state.user.email || "", displayName: state.settings.displayName || "" },
    settings: state.settings,
    journeys: state.journeys.map(({ id, createdAt, updatedAt, ...journey }) => ({ id, ...journey })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `flight-log-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Backup exported", `${state.journeys.length} journey${state.journeys.length === 1 ? "" : "s"} saved to JSON.`, "success");
}

function legacyFlightToJourney(flight) {
  const departureAt = flight.date ? `${flight.date}T${flight.time || "00:00"}` : "";
  const matchedAirline = AIRLINES.find((airline) => airline.name.toLowerCase() === String(flight.airline || "").toLowerCase());
  return {
    schemaVersion: 3,
    name: "",
    status: "flown",
    purpose: "other",
    notes: "",
    tags: [],
    totalCost: Number(flight.cost || 0),
    currency: "INR",
    bookingReference: "",
    rating: 0,
    departureStart: departureAt,
    arrivalEnd: "",
    segments: [blankSegment({
      from: String(flight.from || "").toUpperCase(),
      to: String(flight.to || "").toUpperCase(),
      departureAt,
      airlineCode: matchedAirline?.code || "",
      airlineName: flight.airline || matchedAirline?.name || "",
      flightNumber: flight.flightNum || "",
    })],
  };
}

function sanitizeImportedJourney(raw) {
  const legacyTotal = Array.isArray(raw.segments) ? raw.segments.reduce((sum, segment) => sum + Number(segment.cost || 0), 0) : 0;
  const legacyCurrency = Array.isArray(raw.segments) ? raw.segments.find((segment) => segment.currency)?.currency : "";
  const segments = Array.isArray(raw.segments) ? raw.segments.map((rawSegment) => {
    const { cost, currency, ...segment } = rawSegment;
    return blankSegment({
      ...segment,
      from: String(segment.from || "").toUpperCase(),
      to: String(segment.to || "").toUpperCase(),
    });
  }) : [];
  if (!segments.length || segments.some((segment) => !state.airportByIata.has(segment.from) || !state.airportByIata.has(segment.to) || !safeDate(segment.departureAt))) return null;
  const metrics = metricsForJourney({ segments });
  return {
    schemaVersion: 3,
    name: normalizeText(raw.name || ""),
    status: raw.status === "planned" ? "planned" : "flown",
    purpose: ["leisure", "business", "family", "education", "other"].includes(raw.purpose) ? raw.purpose : "other",
    notes: normalizeText(raw.notes || "").slice(0, 1000),
    tags: Array.isArray(raw.tags) ? raw.tags.map(normalizeText).filter(Boolean).slice(0, 12) : [],
    totalCost: Math.max(0, Number(raw.totalCost ?? legacyTotal) || 0),
    currency: raw.currency || legacyCurrency || state.settings.currency || "INR",
    bookingReference: normalizeText(raw.bookingReference || "").toUpperCase().slice(0, 16),
    rating: Math.max(0, Math.min(5, Number(raw.rating || 0))),
    segments,
    departureStart: segments[0].departureAt,
    arrivalEnd: segments.at(-1).arrivalAt || "",
    distanceKm: metrics.distanceKm,
    carbonEstimateKg: metrics.carbonKg,
  };
}

async function importJourneyData(file) {
  if (!file || !requireUser("import journeys")) return;
  if (!requireSecureCloud("import journeys")) return;
  try {
    const parsed = JSON.parse(await file.text());
    const rawJourneys = Array.isArray(parsed)
      ? parsed.map((item) => item.segments ? item : legacyFlightToJourney(item))
      : Array.isArray(parsed.journeys) ? parsed.journeys : [];
    const journeys = rawJourneys.map(sanitizeImportedJourney).filter(Boolean);
    if (!journeys.length) throw new Error("No valid journeys were found in this file.");
    for (let start = 0; start < journeys.length; start += 400) {
      const batch = writeBatch(db);
      for (const journey of journeys.slice(start, start + 400)) {
        const journeyRef = doc(collection(db, "users", state.user.uid, "journeys"));
        batch.set(journeyRef, { ...journey, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      await batch.commit();
    }
    toast("Import complete", `${journeys.length} journey${journeys.length === 1 ? "" : "s"} added to your Firebase account.`, "success");
  } catch (error) {
    toast("Import failed", firebaseMessage(error), "error");
  } finally {
    byId("import-data").value = "";
  }
}

async function clearCloudData() {
  if (!requireUser("delete your journeys")) return;
  if (!state.journeys.length) {
    toast("Atlas already empty", "There are no journeys to delete.");
    return;
  }
  const phrase = prompt(`This will permanently delete ${state.journeys.length} journey${state.journeys.length === 1 ? "" : "s"} from Firebase. Type DELETE to continue.`);
  if (phrase !== "DELETE") return;
  try {
    const snapshot = await getDocs(collection(db, "users", state.user.uid, "journeys"));
    for (let start = 0; start < snapshot.docs.length; start += 400) {
      const batch = writeBatch(db);
      snapshot.docs.slice(start, start + 400).forEach((journeyDoc) => batch.delete(journeyDoc.ref));
      await batch.commit();
    }
    closeDialog("settings-modal");
    toast("All journeys deleted", "Your Firebase journey collection is now empty.", "success");
  } catch (error) {
    toast("Could not clear data", firebaseMessage(error), "error");
  }
}

function openSettings() {
  populateSettingsForm();
  byId("sign-out-button").classList.toggle("hidden", !state.user);
  byId("clear-cloud-data").disabled = !state.user;
  byId("export-data").disabled = !state.user;
  showDialog("settings-modal");
}

function toggleIntelligence(force) {
  const panel = byId("intelligence-panel");
  panel.classList.toggle("open", typeof force === "boolean" ? force : !panel.classList.contains("open"));
}

function toggleSidebar(force) {
  const sidebar = byId("sidebar");
  sidebar.classList.toggle("collapsed", typeof force === "boolean" ? !force : !sidebar.classList.contains("collapsed"));
  byId("sidebar-reveal").classList.toggle("visible", sidebar.classList.contains("collapsed"));
}

function clearFilters() {
  byId("journey-search").value = "";
  byId("year-filter").value = "all";
  byId("status-filter").value = "all";
  applyFilters();
}

function attachEvents() {
  $$('[data-close]').forEach((button) => button.addEventListener("click", () => closeDialog(button.dataset.close)));
  $$("dialog.modal").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      const rect = dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) dialog.close();
    });
  });

  byId("new-journey-button").addEventListener("click", () => openJourneyBuilder());
  byId("empty-action").addEventListener("click", () => {
    if (!state.user) openAuth("signin");
    else if (state.journeys.length && !state.filteredJourneys.length) clearFilters();
    else openJourneyBuilder();
  });
  byId("journey-form").addEventListener("submit", saveJourney);
  byId("add-segment").addEventListener("click", addConnectingSegment);
  byId("parse-itinerary").addEventListener("click", parseItineraryText);
  byId("journey-total-price").addEventListener("input", updateBuilderPreview);
  byId("journey-currency").addEventListener("change", updateBuilderPreview);

  byId("journey-search").addEventListener("input", applyFilters);
  byId("year-filter").addEventListener("change", applyFilters);
  byId("status-filter").addEventListener("change", applyFilters);
  byId("clear-search").addEventListener("click", () => {
    byId("journey-search").value = "";
    applyFilters();
    byId("journey-search").focus();
  });

  byId("sync-pill").addEventListener("click", () => state.user ? openSettings() : openAuth("signin"));
  byId("auth-form").addEventListener("submit", handleAuthSubmit);
  byId("google-auth").addEventListener("click", handleGoogleAuth);
  byId("toggle-auth-mode").addEventListener("click", () => openAuth(state.authMode === "signin" ? "signup" : "signin"));
  byId("forgot-password").addEventListener("click", handlePasswordReset);

  byId("collapse-sidebar").addEventListener("click", () => toggleSidebar(false));
  byId("sidebar-reveal").addEventListener("click", () => toggleSidebar(true));
  byId("brand-button").addEventListener("click", () => {
    state.activeJourneyId = null;
    fitRoutes();
    updateGlobe();
  });

  byId("open-intelligence").addEventListener("click", () => toggleIntelligence());
  byId("open-intelligence-mobile").addEventListener("click", () => toggleIntelligence(true));
  byId("close-intelligence").addEventListener("click", () => toggleIntelligence(false));
  byId("locate-india").addEventListener("click", () => state.worldReady && state.world.pointOfView({ lat: 21.3, lng: 78.8, altitude: 1.65 }, 900));
  byId("fit-routes").addEventListener("click", fitRoutes);
  byId("toggle-rotation").addEventListener("click", () => setGlobeMotion(!state.autoRotate));

  byId("detail-modal").addEventListener("close", () => {
    state.activeJourneyId = null;
    updateGlobe();
  });
  byId("delay-slider").addEventListener("input", () => {
    const journey = state.journeys.find((item) => item.id === state.activeJourneyId);
    if (journey) renderDelayLab(journey, Number(byId("delay-slider").value));
  });
  byId("delete-journey").addEventListener("click", deleteActiveJourney);
  byId("duplicate-journey").addEventListener("click", duplicateActiveJourney);
  byId("edit-journey").addEventListener("click", () => {
    const journey = state.journeys.find((item) => item.id === state.activeJourneyId);
    closeDialog("detail-modal");
    if (journey) setTimeout(() => openJourneyBuilder(journey), 120);
  });

  byId("open-passport").addEventListener("click", () => {
    if (!requireUser("open your Flightprint")) return;
    renderFlightprint();
    showDialog("passport-modal");
  });
  byId("download-flightprint").addEventListener("click", downloadFlightprint);
  byId("copy-summary").addEventListener("click", copyFlightprintSummary);

  byId("settings-button").addEventListener("click", openSettings);
  byId("settings-form").addEventListener("submit", saveSettings);
  byId("export-data").addEventListener("click", exportJourneyData);
  byId("import-data").addEventListener("change", (event) => importJourneyData(event.target.files?.[0]));
  byId("clear-cloud-data").addEventListener("click", clearCloudData);
  byId("sign-out-button").addEventListener("click", async () => {
    await signOut(auth);
    closeDialog("settings-modal");
    toast("Signed out", "Your cloud atlas has been removed from this screen.", "success");
  });
  byId("privacy-button").addEventListener("click", () => showDialog("privacy-modal"));

  addEventListener("resize", () => {
    if (state.worldReady) state.world.width(innerWidth).height(innerHeight);
  });
  addEventListener("online", () => state.user && updateSyncPill("syncing", "Reconnecting…"));
  addEventListener("offline", () => state.user && updateSyncPill("syncing", "Offline queue"));
  document.addEventListener("visibilitychange", () => {
    if (state.worldReady) state.world.controls().autoRotate = !document.hidden && state.autoRotate && state.settings.motion;
  });
  document.addEventListener("keydown", (event) => {
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
    const modalOpen = $("dialog[open]");
    if (!typing && !modalOpen && event.key.toLowerCase() === "n") {
      event.preventDefault();
      openJourneyBuilder();
    }
  });

  $$(".magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      if (!state.settings.motion) return;
      const rect = button.getBoundingClientRect();
      button.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * 0.035}px, ${(event.clientY - rect.top - rect.height / 2) * 0.06}px)`;
    });
    button.addEventListener("pointerleave", () => { button.style.transform = ""; });
  });
}

async function initialize() {
  byId("footer-year").textContent = new Date().getFullYear();
  attachEvents();
  const results = await Promise.allSettled([loadAirportAtlas(), initGlobe(), securityCheckPromise]);
  const airportResult = results[0];
  if (airportResult.status === "rejected") {
    byId("boot-status").textContent = "The airport atlas could not be loaded.";
    toast("Airport atlas unavailable", "Reload the page or check that data/airports.json was deployed.", "error");
  } else {
    attachAirportAutocomplete(document);
    renderAll();
    updateGlobe();
  }
  setTimeout(() => byId("boot-screen").classList.add("ready"), 380);
}

initialize();
