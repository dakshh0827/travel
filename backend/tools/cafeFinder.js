// ============================================================
//  tools/cafeFinder.js
//  OpenStreetMap Nominatim + Overpass API  (100% free, no key)
//
//  Nominatim  → geocode location name → lat/lon centre point
//  Overpass   → radius search for cafes/restaurants around it
// ============================================================
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';

const OSM_HEADERS = {
  'User-Agent': 'TravelCompanionApp/1.0 (contact@yourapp.com)',
  'Accept-Language': 'en',
};

// Geocode a place name → { lat, lon }
async function geocodePlace(location) {
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: location, format: 'json', limit: 1 },
    headers: OSM_HEADERS,
    timeout: 8000,
  });

  if (!response.data?.length) return null;
  return { lat: parseFloat(response.data[0].lat), lon: parseFloat(response.data[0].lon) };
}

// Overpass radius search for cafes/restaurants/food spots
async function fetchFoodSpots(lat, lon, radiusMeters = 5000, limit = 8) {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"~"cafe|restaurant|fast_food|bar|food_court|ice_cream"]
          (around:${radiusMeters},${lat},${lon});
      node["tourism"="hotel"]["amenity"="restaurant"]
          (around:${radiusMeters},${lat},${lon});
    );
    out body ${limit};
  `.trim();

  const response = await axios.post(
    'https://overpass-api.de/api/interpreter',
    query,
    { headers: { 'Content-Type': 'text/plain', ...OSM_HEADERS }, timeout: 15000 }
  );

  return response.data.elements || [];
}

function formatFoodSpots(elements) {
  return elements
    .filter(el => el.tags?.name)
    .map(el => ({
      name:     el.tags.name,
      type:     el.tags.amenity || 'cafe',
      cuisine:  el.tags.cuisine  || null,
      address:  el.tags['addr:street']
                  ? `${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street']}`.trim()
                  : null,
      openingHours: el.tags.opening_hours || null,
      coords:   { lat: el.lat, lng: el.lon },
      source:   'OpenStreetMap',
    }));
}

export const cafeFinderTool = tool(
  async ({ location, vibe }) => {
    console.log(`☕ [CafeFinder] OSM search near: "${location}"`);

    try {
      const geo = await geocodePlace(location);
      if (!geo) {
        console.warn(`⚠️  [CafeFinder] Could not geocode: "${location}"`);
        return JSON.stringify([]);
      }

      console.log(`   📌 Centre: ${geo.lat}, ${geo.lon}`);
      const elements = await fetchFoodSpots(geo.lat, geo.lon, 5000, 8);
      const spots    = formatFoodSpots(elements);

      console.log(`✅ [CafeFinder] Found ${spots.length} food spots via Overpass`);
      return JSON.stringify(spots);

    } catch (err) {
      console.error('❌ [CafeFinder]:', err.message);
      return JSON.stringify([]);
    }
  },
  {
    name:        'cafe_finder',
    description: 'Find cafes, restaurants, and local food spots near a travel destination using OpenStreetMap. No API key required.',
    schema: z.object({
      location: z.string().describe('Location to search near (e.g. "Kaza, Spiti Valley" or "Manali, Himachal Pradesh")'),
      vibe:     z.string().optional().describe('Vibe context — e.g. "cozy local food", "street food"'),
    }),
  }
);
