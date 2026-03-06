// ============================================================
//  tools/weatherChecker.js — OpenWeatherMap Tool
// ============================================================
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';

export const weatherCheckerTool = tool(
  async ({ location }) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey || apiKey === 'your-openweather-key-here') {
      console.log('⚠️  [WeatherChecker] No API key — using mock data');
      return getMockWeather(location);
    }

    try {
      const response = await axios.get(
        'https://api.openweathermap.org/data/2.5/weather',
        {
          params: {
            q: location,
            appid: apiKey,
            units: 'metric',
          },
          timeout: 6000,
        }
      );

      const data = response.data;
      return JSON.stringify({
        location: data.name,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        condition: data.weather[0].description,
        humidity: data.main.humidity,
        wind: `${Math.round(data.wind.speed * 3.6)} km/h`,
        visibility: `${(data.visibility / 1000).toFixed(1)} km`,
        packingTip: getPackingTip(data.main.temp, data.weather[0].main),
      });
    } catch (err) {
      console.error('❌ [WeatherChecker] API error:', err.message);
      return getMockWeather(location);
    }
  },
  {
    name: 'weather_checker',
    description: 'Check current weather conditions at a travel destination',
    schema: z.object({
      location: z.string().describe('Location to check weather for (e.g. "Kaza, India")'),
    }),
  }
);

function getPackingTip(temp, condition) {
  if (temp < 0) return 'Pack heavy thermals, down jacket, gloves, and snow boots — it\'s proper cold';
  if (temp < 10) return 'Fleece + windproof jacket essential. Layers are your best friend';
  if (temp < 20) return 'Light jacket for evenings. Days are comfortable';
  if (condition === 'Rain' || condition === 'Drizzle') return 'Rain jacket and waterproof shoes — mandatory';
  return 'Light clothes, sunscreen. Comfortable travel weather';
}

function getMockWeather(location) {
  // Seasonal approximations for common destinations
  const isHimachal = location?.toLowerCase().includes('spiti') || location?.toLowerCase().includes('himachal');
  const isDesert = location?.toLowerCase().includes('jaisalmer') || location?.toLowerCase().includes('rajasthan');

  if (isHimachal) {
    return JSON.stringify({
      location,
      temperature: -3,
      feelsLike: -8,
      condition: 'Clear sky with possible snow',
      humidity: 45,
      wind: '15 km/h',
      visibility: '10 km',
      packingTip: 'Pack heavy thermals, down jacket, gloves, and snow boots — it\'s proper cold',
    });
  }

  if (isDesert) {
    return JSON.stringify({
      location,
      temperature: 28,
      feelsLike: 32,
      condition: 'Sunny and dry',
      humidity: 20,
      wind: '10 km/h',
      visibility: '15 km',
      packingTip: 'Light cotton clothes, sunscreen SPF 50+, and a scarf for the sand',
    });
  }

  return JSON.stringify({
    location,
    temperature: 18,
    feelsLike: 16,
    condition: 'Partly cloudy',
    humidity: 60,
    wind: '12 km/h',
    visibility: '8 km',
    packingTip: 'Layer up — mornings and evenings get chilly',
  });
}
