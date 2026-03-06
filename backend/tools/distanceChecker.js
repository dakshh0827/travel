// ============================================================
//  tools/distanceChecker.js
//  OpenStreetMap Nominatim + OSRM  (100% free, no key)
//
//  Nominatim  → geocode origin & destination → lat/lon pairs
//  OSRM       → open-source routing engine → distance + duration
//
//  OSRM public demo: router.project-osrm.org (no key needed)
// ============================================================
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';

const OSM_HEADERS = {
  'User-Agent': 'TravelCompanionApp/1.0 (contact@yourapp.com)',
  'Accept-Language': 'en',
};

// Geocode a place name → { lat, lon, displayName }
async function geocodePlace(placeName) {
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: {
      q:              `${placeName}, India`,   // Bias to India for this use-case
      format:         'json',
      limit:          1,
      addressdetails: 0,
    },
    headers: OSM_HEADERS,
    timeout: 8000,
  });

  if (!response.data?.length) return null;

  const r = response.data[0];
  return {
    lat:         parseFloat(r.lat),
    lon:         parseFloat(r.lon),
    displayName: r.display_name.split(',').slice(0, 3).join(',').trim(),
  };
}

// Haversine formula: straight-line distance in km between two lat/lon points
function haversineKm(lat1, lon1, lat2, lon2) {
  const R  = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dG = ((lon2 - lon1) * Math.PI) / 180;
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Format seconds → human-readable string
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

// Format meters → human-readable string
function formatDistance(meters) {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(0)} km`
    : `${meters} m`;
}

// OSRM routing: get road distance + duration between two coordinates
async function osrmRoute(originCoords, destCoords) {
  const { lat: olat, lon: olon } = originCoords;
  const { lat: dlat, lon: dlon } = destCoords;

  // OSRM URL format: /route/v1/{profile}/{lon1},{lat1};{lon2},{lat2}
  const url = `https://router.project-osrm.org/route/v1/driving/${olon},${olat};${dlon},${dlat}`;

  const response = await axios.get(url, {
    params: { overview: 'false', annotations: 'false' },
    headers: OSM_HEADERS,
    timeout: 12000,
  });

  if (response.data.code !== 'Ok' || !response.data.routes?.length) {
    return null;
  }

  const route = response.data.routes[0];
  return {
    distanceText: formatDistance(route.distance),
    distanceKm:   Math.round(route.distance / 1000),
    durationText: formatDuration(route.duration),
    durationHrs:  route.duration / 3600,
  };
}

// Estimate driving speed based on distance (mountain roads are slower)
function estimateDriveHours(km) {
  // India average speeds: highways ~70 km/h, mountain roads ~30-40 km/h
  const avgSpeed = km > 500 ? 65 : km > 200 ? 50 : 40;
  return km / avgSpeed;
}

export const distanceCheckerTool = tool(
  async ({ origin, destination }) => {
    console.log(`🚌 [DistanceChecker] ${origin} → ${destination}`);

    try {
      // Geocode both locations in parallel
      const [originGeo, destGeo] = await Promise.all([
        geocodePlace(origin),
        geocodePlace(destination),
      ]);

      if (!originGeo) {
        return JSON.stringify({ error: `Could not geocode origin: "${origin}"`, origin, destination });
      }
      if (!destGeo) {
        return JSON.stringify({ error: `Could not geocode destination: "${destination}"`, origin, destination });
      }

      console.log(`   📌 Origin: ${originGeo.displayName}`);
      console.log(`   📌 Dest:   ${destGeo.displayName}`);

      // Try OSRM for road routing first
      let routeData = null;
      try {
        routeData = await osrmRoute(originGeo, destGeo);
      } catch (osrmErr) {
        console.warn(`⚠️  [DistanceChecker] OSRM failed (${osrmErr.message}), falling back to Haversine`);
      }

      let result;

      if (routeData) {
        // OSRM success — real road distance
        result = {
          origin:           originGeo.displayName,
          destination:      destGeo.displayName,
          distance:         routeData.distanceText,
          distanceKm:       routeData.distanceKm,
          duration:         routeData.durationText,
          durationHrs:      parseFloat(routeData.durationHrs.toFixed(1)),
          mode:             'driving',
          routingEngine:    'OSRM (OpenStreetMap)',
          tip:              buildTravelTip(routeData.distanceKm, routeData.durationHrs),
        };
      } else {
        // Haversine fallback — straight-line with estimated drive time
        const straightKm  = haversineKm(originGeo.lat, originGeo.lon, destGeo.lat, destGeo.lon);
        const roadKm      = Math.round(straightKm * 1.35);  // ~35% longer by road
        const estimatedHrs = estimateDriveHours(roadKm);

        result = {
          origin:        originGeo.displayName,
          destination:   destGeo.displayName,
          distance:      `~${roadKm} km (estimated)`,
          distanceKm:    roadKm,
          duration:      `~${formatDuration(estimatedHrs * 3600)} (estimated)`,
          durationHrs:   parseFloat(estimatedHrs.toFixed(1)),
          mode:          'driving',
          routingEngine: 'Haversine estimate (road routing unavailable)',
          tip:           buildTravelTip(roadKm, estimatedHrs),
        };
      }

      console.log(`✅ [DistanceChecker] ${result.distance} | ${result.duration}`);
      return JSON.stringify(result);

    } catch (err) {
      console.error('❌ [DistanceChecker]:', err.message);
      return JSON.stringify({
        origin,
        destination,
        error:   err.message,
        tip:     'Verify travel time on Google Maps or Rome2rio before your trip.',
      });
    }
  },
  {
    name:        'distance_checker',
    description: 'Calculate road distance and travel time between two locations using OpenStreetMap and OSRM routing. No API key required.',
    schema: z.object({
      origin:      z.string().describe('Starting city or location (e.g. "Delhi", "Mumbai", "Chandigarh")'),
      destination: z.string().describe('Destination city or location (e.g. "Kaza Spiti Valley", "Jaisalmer")'),
    }),
  }
);

function buildTravelTip(km, hrs) {
  if (hrs > 12) return `Long drive (${Math.round(hrs)} hrs) — consider an overnight stop or take a flight to the nearest city first.`;
  if (hrs > 8)  return `Full-day drive (${Math.round(hrs)} hrs) — start early (5-6 AM) and plan a meal stop midway.`;
  if (hrs > 4)  return `Half-day drive (${Math.round(hrs)} hrs) — comfortable if you start by 8 AM.`;
  return `Short drive (~${Math.round(hrs)} hrs) — easy day trip distance.`;
}
