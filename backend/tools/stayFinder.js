// ============================================================
//  tools/stayFinder.js
//  OpenStreetMap Nominatim + Overpass API  (100% free, no key)
//
//  Nominatim  → geocode location → lat/lon
//  Overpass   → radius search for hostels / guesthouses / camps
// ============================================================
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';

const OSM_HEADERS = {
  'User-Agent': 'TravelCompanionApp/1.0 (contact@yourapp.com)',
  'Accept-Language': 'en',
};

async function geocodePlace(location) {
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: location, format: 'json', limit: 1 },
    headers: OSM_HEADERS,
    timeout: 8000,
  });
  if (!response.data?.length) return null;
  return { lat: parseFloat(response.data[0].lat), lon: parseFloat(response.data[0].lon) };
}

// Map user-friendly stayType to OSM tourism tags
const STAY_TYPE_MAP = {
  hostel:     'hostel',
  homestay:   'guest_house',
  guesthouse: 'guest_house',
  camp:       'camp_site',
  hotel:      'hotel',
  motel:      'motel',
};

async function fetchAccommodation(lat, lon, stayType, radiusMeters = 8000, limit = 8) {
  // Build amenity filter — if stayType given, prefer it; else fetch all lodging types
  const osmTag = STAY_TYPE_MAP[stayType?.toLowerCase()] || null;
  const tagFilter = osmTag
    ? `["tourism"="${osmTag}"]`
    : `["tourism"~"hostel|guest_house|camp_site|hotel|motel|chalet|alpine_hut"]`;

  const query = `
    [out:json][timeout:15];
    (
      node${tagFilter}(around:${radiusMeters},${lat},${lon});
      way${tagFilter}(around:${radiusMeters},${lat},${lon});
    );
    out body center ${limit};
  `.trim();

  const response = await axios.post(
    'https://overpass-api.de/api/interpreter',
    query,
    { headers: { 'Content-Type': 'text/plain', ...OSM_HEADERS }, timeout: 15000 }
  );

  return response.data.elements || [];
}

function formatStays(elements) {
  return elements
    .filter(el => el.tags?.name)
    .map(el => {
      // Ways return a `center` object instead of direct lat/lon
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;

      return {
        name:     el.tags.name,
        type:     el.tags.tourism || 'accommodation',
        phone:    el.tags.phone    || el.tags['contact:phone'] || null,
        website:  el.tags.website  || el.tags['contact:website'] || null,
        email:    el.tags.email    || el.tags['contact:email'] || null,
        address:  el.tags['addr:street']
                    ? `${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street']}`.trim()
                    : null,
        stars:    el.tags.stars    || null,
        rooms:    el.tags.rooms    || null,
        coords:   lat && lon ? { lat, lng: lon } : null,
        source:   'OpenStreetMap',
      };
    });
}

export const stayFinderTool = tool(
  async ({ location, stayType, maxBudget }) => {
    console.log(`🏠 [StayFinder] OSM search near: "${location}" | type: ${stayType || 'any'}`);

    try {
      const geo = await geocodePlace(location);
      if (!geo) {
        console.warn(`⚠️  [StayFinder] Could not geocode: "${location}"`);
        return JSON.stringify([]);
      }

      console.log(`   📌 Centre: ${geo.lat}, ${geo.lon}`);
      const elements = await fetchAccommodation(geo.lat, geo.lon, stayType, 8000, 8);
      const stays    = formatStays(elements);

      console.log(`✅ [StayFinder] Found ${stays.length} stays via Overpass`);
      return JSON.stringify(stays);

    } catch (err) {
      console.error('❌ [StayFinder]:', err.message);
      return JSON.stringify([]);
    }
  },
  {
    name:        'stay_finder',
    description: 'Find accommodation (homestays, hostels, camps, guesthouses, hotels) near a destination using OpenStreetMap. No API key required.',
    schema: z.object({
      location:  z.string().describe('Location to search near (e.g. "Kaza, Spiti Valley")'),
      stayType:  z.string().optional().describe('Accommodation type: hostel | homestay | guesthouse | camp | hotel'),
      maxBudget: z.number().optional().describe('Max budget per night in INR — used for context only'),
    }),
  }
);
