#!/usr/bin/env node

/**
 * MCP Weather API Server
 *
 * A practical example demonstrating external API integration with MCP.
 * This server shows:
 * - Making external API calls
 * - Caching API responses
 * - Error handling for network requests
 * - Data transformation and formatting
 * - Rate limiting considerations
 *
 * Uses Open-Meteo API (free, no API key required)
 * https://open-meteo.com/
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch";

// API Configuration
const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

// Simple cache to avoid excessive API calls
const cache = new Map();
const CACHE_TTL = 600000; // 10 minutes

/**
 * Geocoding: Convert city name to coordinates
 */
async function geocodeCity(city) {
  const cacheKey = `geocode:${city.toLowerCase()}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const url = `${GEOCODING_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`City not found: ${city}`);
  }

  const location = {
    name: data.results[0].name,
    country: data.results[0].country,
    latitude: data.results[0].latitude,
    longitude: data.results[0].longitude,
  };

  cache.set(cacheKey, { data: location, timestamp: Date.now() });
  return location;
}

/**
 * Fetch current weather for coordinates
 */
async function getCurrentWeather(latitude, longitude) {
  const cacheKey = `weather:${latitude},${longitude}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
  });

  const url = `${WEATHER_API}?${params}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API failed: ${response.statusText}`);
  }

  const data = await response.json();

  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

/**
 * Fetch weather forecast
 */
async function getForecast(latitude, longitude, days = 7) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    forecast_days: days.toString(),
  });

  const url = `${WEATHER_API}?${params}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Forecast API failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Convert weather code to description
 */
function getWeatherDescription(code) {
  const descriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };

  return descriptions[code] || "Unknown";
}

/**
 * Format current weather data
 */
function formatCurrentWeather(location, data) {
  const current = data.current;

  return `Weather for ${location.name}, ${location.country}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Temperature: ${current.temperature_2m}°C
Feels like: ${current.apparent_temperature}°C
Humidity: ${current.relative_humidity_2m}%
Wind Speed: ${current.wind_speed_10m} km/h
Precipitation: ${current.precipitation} mm
Conditions: ${getWeatherDescription(current.weather_code)}

Last updated: ${current.time}`;
}

/**
 * Format forecast data
 */
function formatForecast(location, data) {
  const daily = data.daily;
  let output = `${data.daily.time.length}-Day Forecast for ${location.name}, ${location.country}\n`;
  output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  for (let i = 0; i < daily.time.length; i++) {
    output += `${daily.time[i]}:\n`;
    output += `  ${getWeatherDescription(daily.weather_code[i])}\n`;
    output += `  High: ${daily.temperature_2m_max[i]}°C, Low: ${daily.temperature_2m_min[i]}°C\n`;
    output += `  Precipitation: ${daily.precipitation_sum[i]} mm\n`;
    output += `  Max Wind: ${daily.wind_speed_10m_max[i]} km/h\n\n`;
  }

  return output;
}

// Create the MCP server
const server = new Server(
  {
    name: "weather-api-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * List available resources (recent weather queries)
 */
server.setRequestHandler("resources/list", async () => {
  const resources = [];

  for (const [key, value] of cache.entries()) {
    if (key.startsWith("weather:")) {
      const coords = key.slice(8);
      resources.push({
        uri: `weather://current/${coords}`,
        name: `Weather for ${coords}`,
        mimeType: "application/json",
        description: "Cached weather data",
      });
    }
  }

  return { resources };
});

/**
 * Read a resource (cached weather data)
 */
server.setRequestHandler("resources/read", async (request) => {
  const uri = request.params.uri;

  if (!uri.startsWith("weather://")) {
    throw new Error(`Unsupported URI scheme: ${uri}`);
  }

  const cacheKey = uri.replace("weather://current/", "weather:");
  const cached = cache.get(cacheKey);

  if (!cached) {
    throw new Error("Weather data not found in cache");
  }

  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(cached.data, null, 2),
      },
    ],
  };
});

/**
 * List available tools
 */
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "get_current_weather",
        description: "Get current weather for a city",
        inputSchema: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "City name (e.g., 'London', 'New York')",
            },
          },
          required: ["city"],
        },
      },
      {
        name: "get_forecast",
        description: "Get weather forecast for a city",
        inputSchema: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "City name",
            },
            days: {
              type: "number",
              description: "Number of days (1-16)",
              minimum: 1,
              maximum: 16,
              default: 7,
            },
          },
          required: ["city"],
        },
      },
      {
        name: "get_weather_by_coordinates",
        description: "Get weather for specific coordinates",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude",
            },
            longitude: {
              type: "number",
              description: "Longitude",
            },
          },
          required: ["latitude", "longitude"],
        },
      },
      {
        name: "search_location",
        description: "Search for a location to get its coordinates",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Location name to search",
            },
          },
          required: ["query"],
        },
      },
    ],
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_current_weather":
        return await handleGetCurrentWeather(args);
      case "get_forecast":
        return await handleGetForecast(args);
      case "get_weather_by_coordinates":
        return await handleGetWeatherByCoordinates(args);
      case "search_location":
        return await handleSearchLocation(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Tool Handlers
 */

async function handleGetCurrentWeather(args) {
  const location = await geocodeCity(args.city);
  const weather = await getCurrentWeather(location.latitude, location.longitude);

  const formatted = formatCurrentWeather(location, weather);

  return {
    content: [
      {
        type: "text",
        text: formatted,
      },
    ],
  };
}

async function handleGetForecast(args) {
  const location = await geocodeCity(args.city);
  const days = args.days || 7;
  const forecast = await getForecast(location.latitude, location.longitude, days);

  const formatted = formatForecast(location, forecast);

  return {
    content: [
      {
        type: "text",
        text: formatted,
      },
    ],
  };
}

async function handleGetWeatherByCoordinates(args) {
  const weather = await getCurrentWeather(args.latitude, args.longitude);

  const location = {
    name: `${args.latitude}, ${args.longitude}`,
    country: "",
  };

  const formatted = formatCurrentWeather(location, weather);

  return {
    content: [
      {
        type: "text",
        text: formatted,
      },
    ],
  };
}

async function handleSearchLocation(args) {
  const url = `${GEOCODING_API}?name=${encodeURIComponent(args.query)}&count=5&language=en&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No locations found for: ${args.query}`,
        },
      ],
    };
  }

  const results = data.results.map(
    (r) =>
      `${r.name}, ${r.admin1 || ""} ${r.country} (${r.latitude}, ${r.longitude})`
  );

  return {
    content: [
      {
        type: "text",
        text: `Found ${results.length} location(s):\n\n${results.join("\n")}`,
      },
    ],
  };
}

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Weather API MCP server running on stdio");
  console.error("Using Open-Meteo API (https://open-meteo.com/)");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
