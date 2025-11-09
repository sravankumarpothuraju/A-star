# Weather API MCP Server

An MCP server demonstrating external API integration using the Open-Meteo weather API.

## Features

### Tools
1. **get_current_weather** - Get current weather for a city
2. **get_forecast** - Get multi-day weather forecast
3. **get_weather_by_coordinates** - Get weather for specific GPS coordinates
4. **search_location** - Search for locations and get coordinates

### Resources
- Access cached weather data
- View recent weather queries

## API Provider

This server uses [Open-Meteo](https://open-meteo.com/), a free weather API:
- **No API key required**
- Free for non-commercial use
- High-quality weather data
- Global coverage

## Installation

```bash
cd examples/03-weather-api-server
npm install
```

## Usage

### Running Standalone

```bash
npm start
```

### Connecting to Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/absolute/path/to/examples/03-weather-api-server/index.js"]
    }
  }
}
```

## Example Interactions

### Current Weather

```
User: What's the weather like in London?
Claude: [Uses get_current_weather tool]

Response:
Weather for London, United Kingdom
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Temperature: 15°C
Feels like: 13°C
Humidity: 72%
Wind Speed: 18 km/h
Precipitation: 0 mm
Conditions: Partly cloudy
```

### Weather Forecast

```
User: Give me a 5-day forecast for Tokyo
Claude: [Uses get_forecast with city="Tokyo", days=5]
```

### Location Search

```
User: Find locations named Springfield
Claude: [Uses search_location]
```

### Coordinates-Based Query

```
User: What's the weather at latitude 40.7128, longitude -74.0060?
Claude: [Uses get_weather_by_coordinates]
```

## Features Demonstrated

### 1. External API Integration
- Making HTTP requests to third-party APIs
- Handling API responses and errors
- Parsing JSON data

### 2. Response Caching
- Simple in-memory cache with TTL
- Reduces API calls
- Improves response times

### 3. Data Transformation
- Converting API responses to user-friendly formats
- Weather code to description mapping
- Coordinate-based and city-based queries

### 4. Error Handling
- Network error handling
- Invalid city/location handling
- API rate limit awareness

## Code Structure

```
index.js
├── API Configuration
├── Cache Management
├── API Functions
│   ├── geocodeCity
│   ├── getCurrentWeather
│   └── getForecast
├── Formatting Functions
│   ├── formatCurrentWeather
│   ├── formatForecast
│   └── getWeatherDescription
└── Tool Handlers
    ├── handleGetCurrentWeather
    ├── handleGetForecast
    ├── handleGetWeatherByCoordinates
    └── handleSearchLocation
```

## Weather Data Provided

### Current Weather
- Temperature (actual and feels-like)
- Humidity
- Wind speed
- Precipitation
- Weather conditions

### Forecast
- Daily high/low temperatures
- Weather conditions
- Precipitation totals
- Maximum wind speeds

## Learning Points

1. **API Integration**: How to integrate external REST APIs
2. **Async Operations**: Handling asynchronous API calls
3. **Caching Strategy**: Implementing simple caching
4. **Data Formatting**: Converting raw data to readable formats
5. **Error Handling**: Gracefully handling API failures

## Extending This Example

Ideas for enhancements:

1. **Additional Data Points**:
   - UV index
   - Air quality
   - Sunrise/sunset times
   - Moon phases

2. **Advanced Features**:
   - Historical weather data
   - Weather alerts
   - Multiple location comparisons
   - Severe weather notifications

3. **Other Weather APIs**:
   - OpenWeatherMap
   - WeatherAPI.com
   - Tomorrow.io
   - NOAA (US weather)

4. **Caching Improvements**:
   - Persistent cache (file or database)
   - Configurable TTL
   - Cache invalidation strategies

5. **User Preferences**:
   - Temperature units (Celsius/Fahrenheit)
   - Wind speed units
   - Language selection

## API Limits

Open-Meteo free tier:
- 10,000 API calls per day
- No authentication required
- Commercial use requires attribution

The built-in cache helps stay within limits by:
- Caching geocoding results (10 min TTL)
- Caching weather data (10 min TTL)
- Reusing recent queries

## Troubleshooting

**Network errors:**
- Check internet connection
- Verify firewall settings
- API may be temporarily unavailable

**City not found:**
- Try different spelling
- Use search_location to find exact name
- Try with country name (e.g., "London, UK")

**Outdated data:**
- Clear cache (restart server)
- Check cache TTL settings

## Privacy & Data

This server:
- Only queries weather data
- Does not store personal information
- Caches data temporarily in memory
- Makes requests to Open-Meteo API

## Next Steps

1. Try getting weather for different cities
2. Compare forecasts across locations
3. Build a weather monitoring tool
4. Integrate with the Task Manager server (example 4)
5. Experiment with other weather APIs

## Additional Resources

- [Open-Meteo Documentation](https://open-meteo.com/en/docs)
- [Open-Meteo API Playground](https://open-meteo.com/en/docs/geocoding-api)
- [Weather Code Definitions](https://open-meteo.com/en/docs)
