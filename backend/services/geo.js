/**
 * Geo Service
 * Uses Google Maps APIs if key set, else derives signals from coordinates
 */

const fetch = require('node-fetch');

// ── Known India city profiles (lat/lng bands → urban density) ─
const CITY_PROFILES = [
  { name: 'Mumbai',    lat: 19.08, lng: 72.88, density: 0.92, competition: 0.78, footfall: 0.88 },
  { name: 'Delhi',     lat: 28.65, lng: 77.22, density: 0.88, competition: 0.75, footfall: 0.84 },
  { name: 'Bengaluru', lat: 12.97, lng: 77.59, density: 0.82, competition: 0.70, footfall: 0.80 },
  { name: 'Hyderabad', lat: 17.38, lng: 78.47, density: 0.78, competition: 0.66, footfall: 0.76 },
  { name: 'Chennai',   lat: 13.08, lng: 80.27, density: 0.80, competition: 0.68, footfall: 0.78 },
  { name: 'Kolkata',   lat: 22.57, lng: 88.36, density: 0.85, competition: 0.72, footfall: 0.82 },
  { name: 'Pune',      lat: 18.52, lng: 73.85, density: 0.75, competition: 0.64, footfall: 0.74 },
  { name: 'Ahmedabad', lat: 23.03, lng: 72.58, density: 0.74, competition: 0.63, footfall: 0.73 },
  { name: 'Surat',     lat: 21.17, lng: 72.83, density: 0.72, competition: 0.62, footfall: 0.72 },
  { name: 'Jaipur',    lat: 26.91, lng: 75.79, density: 0.68, competition: 0.58, footfall: 0.68 },
  { name: 'Lucknow',   lat: 26.85, lng: 80.95, density: 0.66, competition: 0.56, footfall: 0.66 },
  { name: 'Nagpur',    lat: 21.15, lng: 79.08, density: 0.62, competition: 0.54, footfall: 0.63 },
];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getNearestCity(lat, lng) {
  let best = null, bestDist = Infinity;
  for (const city of CITY_PROFILES) {
    const d = haversineKm(lat, lng, city.lat, city.lng);
    if (isFinite(d) && d < bestDist) { bestDist = d; best = { ...city, distanceKm: d }; }
  }
  // Fallback to Mumbai profile if nothing found
  if (!best) best = { ...CITY_PROFILES[0], distanceKm: 30 };
  return best;
}

// ── Geo simulation ───────────────────────────────────────────
function simulateGeoSignals(lat, lng) {
  const city = getNearestCity(lat, lng);

  // Distance decay: further from city center = lower density
  const decayFactor = Math.max(0, 1 - city.distanceKm / 60);

  // Micro-variation based on lat/lng decimal parts (deterministic noise)
  const microSeed = ((lat % 1) + (lng % 1)) / 2;
  const microVariation = (microSeed - 0.5) * 0.12;

  const catchmentDensity    = clamp(city.density * decayFactor + microVariation, 0.20, 0.98);
  const footfallProxyIndex  = clamp(city.footfall * decayFactor + microVariation * 0.8, 0.15, 0.95);
  const competitionDensity  = clamp(city.competition * (0.8 + decayFactor * 0.2) + microVariation, 0.10, 0.92);

  // Estimate competitor count (5km radius proxy)
  const competitorCount = Math.floor(clamp(competitionDensity * 80, 5, 120));

  // Road type proxy: high footfall = arterial
  const roadType = footfallProxyIndex > 0.7 ? 'Arterial' : footfallProxyIndex > 0.45 ? 'Secondary' : 'Internal Lane';

  // POIs proxy
  const poiScore = clamp((catchmentDensity + footfallProxyIndex) / 2, 0.1, 1.0);

  return {
    source: 'simulation',
    nearestCity: city.name,
    distanceToCityKm: round2(city.distanceKm),
    catchmentDensityScore: round2(catchmentDensity),
    footfallProxyIndex: round2(footfallProxyIndex),
    competitionDensityScore: round2(competitionDensity),
    estimatedCompetitorCount: competitorCount,
    roadType,
    poiProximityScore: round2(poiScore),
    catchmentPopEstimate: Math.floor(catchmentDensity * 18000 + 2000),
  };
}

// ── Google Maps APIs ─────────────────────────────────────────
async function callPlacesNearby(lat, lng, type, radius = 1000) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function callGeocodingReverse(lat, lng) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results?.[0] || null;
}

async function fetchGoogleGeoSignals(lat, lng) {
  const [competitors, schools, transport, geocode] = await Promise.all([
    callPlacesNearby(lat, lng, 'grocery_or_supermarket', 1000),
    callPlacesNearby(lat, lng, 'school', 800),
    callPlacesNearby(lat, lng, 'transit_station', 500),
    callGeocodingReverse(lat, lng),
  ]);

  const competitorCount = competitors.length;
  const schoolCount = schools.length;
  const transitCount = transport.length;

  // Derive signals
  const footfallProxyIndex = clamp(
    0.3 + (schoolCount / 10) + (transitCount / 5) + (competitorCount > 3 ? 0.1 : 0),
    0.1, 0.95
  );
  const competitionDensityScore = clamp(competitorCount / 25, 0.05, 0.92);
  const catchmentDensityScore = clamp(footfallProxyIndex * 0.9 + 0.05, 0.1, 0.95);

  const addressComponents = geocode?.address_components || [];
  const locality = addressComponents.find(c => c.types.includes('sublocality'))?.long_name ||
                   addressComponents.find(c => c.types.includes('locality'))?.long_name || 'Unknown';

  return {
    source: 'google_maps',
    locality,
    catchmentDensityScore: round2(catchmentDensityScore),
    footfallProxyIndex: round2(footfallProxyIndex),
    competitionDensityScore: round2(competitionDensityScore),
    estimatedCompetitorCount: competitorCount,
    nearbySchools: schoolCount,
    nearbyTransit: transitCount,
    roadType: transitCount > 2 ? 'Arterial' : 'Secondary',
    poiProximityScore: round2((schoolCount + transitCount) / 20),
    catchmentPopEstimate: Math.floor(catchmentDensityScore * 18000 + 2000),
  };
}

// ── Main export ──────────────────────────────────────────────
async function getGeoSignals(lat, lng) {
  if (process.env.GOOGLE_MAPS_API_KEY) {
    try {
      return await fetchGoogleGeoSignals(lat, lng);
    } catch (err) {
      console.warn('Google Maps API failed, falling back to simulation:', err.message);
    }
  }
  return simulateGeoSignals(lat, lng);
}

function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
function round2(n) { return Math.round(n * 100) / 100; }

module.exports = { getGeoSignals };
