// ============================================================
//  tools/destinationFinder.js
//  OpenStreetMap Nominatim + Overpass API  (100% free, no key)
//
//  Nominatim  → geocode region name → lat/lon bounding box
//  Overpass   → query tourist attractions inside that bbox
// ============================================================
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';

const OSM_HEADERS = {
  'User-Agent': 'TravelCompanionApp/1.0 (contact@yourapp.com)',
  'Accept-Language': 'en',
};

// Geocode a region name → bounding box via Nominatim
async function geocodeRegion(region) {
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: region, format: 'json', limit: 1, addressdetails: 1 },
    headers: OSM_HEADERS,
    timeout: 8000,
  });

  if (!response.data?.length) return null;

  const place = response.data[0];
  const [south, north, west, east] = place.boundingbox.map(Number);
  return {
    lat:  parseFloat(place.lat),
    lon:  parseFloat(place.lon),
    bbox: { south, north, west, east },
    name: place.display_name,
  };
}

// Query Overpass for tourist attractions inside a bounding box
async function fetchTouristAttractions(bbox, limit = 10) {
  const query = `
    [out:json][timeout:15];
    (
      node["tourism"~"attraction|viewpoint|museum|artwork|alpine_hut|camp_site|hostel|guest_house"]
          (${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      node["natural"~"peak|waterfall|glacier|lake"]
          (${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      node["historic"]
          (${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      node["leisure"~"nature_reserve|park"]
          (${bbox.south},${bbox.west},${bbox.north},${bbox.east});
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

function formatPlaces(elements, regionName) {
  return elements
    .filter(el => el.tags?.name)
    .slice(0, 8)
    .map(el => ({
      name:    el.tags.name,
      address: [el.tags['addr:city'], el.tags['addr:state'], regionName].filter(Boolean).join(', ') || regionName,
      type:    el.tags.tourism || el.tags.natural || el.tags.historic || 'attraction',
      coords:  { lat: el.lat, lng: el.lon },
      source:  'OpenStreetMap',
    }));
}

export const destinationFinderTool = tool(
  async ({ region }) => {
    console.log(`📍 [DestinationFinder] OSM search for: "${region}"`);

    try {
      const geo = await geocodeRegion(region);
      if (!geo) {
        return JSON.stringify([{ name: region, address: 'India', coords: { lat: 20.0, lng: 77.0 }, source: 'fallback' }]);
      }

      console.log(`   📌 bbox: ${JSON.stringify(geo.bbox)}`);
      const elements = await fetchTouristAttractions(geo.bbox, 10);
      const places   = formatPlaces(elements, region);

      if (places.length === 0) {
        return JSON.stringify([{
          name:    region,
          address: geo.name.split(',').slice(0, 3).join(','),
          coords:  { lat: geo.lat, lng: geo.lon },
          source:  'OpenStreetMap (geocode only)',
        }]);
      }

      console.log(`✅ [DestinationFinder] ${places.length} places via OSM/Overpass`);
      return JSON.stringify(places);

    } catch (err) {
      console.error('❌ [DestinationFinder]:', err.message);
      try {
        const geo = await geocodeRegion(region);
        if (geo) return JSON.stringify([{ name: region, address: geo.name.split(',').slice(0,3).join(','), coords: { lat: geo.lat, lng: geo.lon }, source: 'OSM geocode fallback' }]);
      } catch { /* ignore */ }
      return JSON.stringify([{ name: region, address: 'India', coords: { lat: 20.0, lng: 77.0 }, source: 'fallback' }]);
    }
  },
  {
    name:        'destination_finder',
    description: 'Find tourist attractions and points of interest in a region using OpenStreetMap and Overpass API. No API key required.',
    schema: z.object({
      region: z.string().describe('Geographic region or place name (e.g. "Spiti Valley", "Rajasthan", "Coorg Karnataka")'),
      vibes:  z.array(z.string()).optional().describe('Travel vibe keywords for context'),
    }),
  }
);
