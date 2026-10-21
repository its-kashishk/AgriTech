const WeatherCache = require('../models/WeatherCache');
const ApiError = require('../utils/ApiError');

// BASE can be overridden (OPENWEATHER_BASE_URL) only for local testing with a stand-in provider.
const BASE = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
const TTL_MS = (parseInt(process.env.WEATHER_CACHE_MINUTES, 10) || 15) * 60 * 1000;

async function callProvider(path, params) {
  const key = process.env.OPENWEATHER_API_KEY;
  const url = `${BASE}/${path}?${new URLSearchParams({ ...params, appid: key, units: 'metric' })}`;
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch {
    throw new ApiError(504, 'Weather service is unreachable right now. Please try again shortly');
  }
  if (res.status === 404) throw new ApiError(404, 'Location not found. Check the city name and try again');
  if (res.status === 401) throw new ApiError(502, 'Weather provider rejected the API key. The server administrator must check OPENWEATHER_API_KEY');
  if (res.status === 429) throw new ApiError(503, 'Weather provider rate limit reached. Please try again in a minute');
  if (!res.ok) throw new ApiError(502, 'Weather provider returned an error');
  return res.json();
}

function normalizeCurrent(d) {
  const w = (d.weather && d.weather[0]) || {};
  return {
    location: { name: d.name, country: d.sys && d.sys.country, lat: d.coord && d.coord.lat, lon: d.coord && d.coord.lon },
    temperature: d.main.temp, feelsLike: d.main.feels_like, humidity: d.main.humidity, pressure: d.main.pressure,
    windSpeed: d.wind && d.wind.speed, // metres/second
    description: w.description, icon: w.icon,
    iconUrl: w.icon ? `https://openweathermap.org/img/wn/${w.icon}@2x.png` : null,
    observedAt: new Date(d.dt * 1000).toISOString(),
  };
}

// 5-day / 3-hour forecast → one summary per day (UTC date).
function normalizeForecast(d) {
  const days = {};
  for (const e of d.list || []) {
    const day = e.dt_txt.slice(0, 10);
    const w = (e.weather && e.weather[0]) || {};
    const x = (days[day] ||= { date: day, min: Infinity, max: -Infinity, hum: [], pop: 0, descriptions: {}, icon: w.icon });
    x.min = Math.min(x.min, e.main.temp_min); x.max = Math.max(x.max, e.main.temp_max);
    x.hum.push(e.main.humidity); x.pop = Math.max(x.pop, e.pop || 0);
    x.descriptions[w.description] = (x.descriptions[w.description] || 0) + 1;
    if (e.dt_txt.includes('12:00')) x.icon = w.icon;
  }
  return Object.values(days).map((x) => ({
    date: x.date, tempMin: x.min, tempMax: x.max,
    humidity: Math.round(x.hum.reduce((a, b) => a + b, 0) / x.hum.length),
    rainChance: Math.round(x.pop * 100),
    description: Object.entries(x.descriptions).sort((a, b) => b[1] - a[1])[0][0],
    iconUrl: x.icon ? `https://openweathermap.org/img/wn/${x.icon}@2x.png` : null,
  }));
}

function demoPayload(label) {
  const now = new Date();
  return {
    demo: true,
    current: { location: { name: label || 'Demo location', country: '—' }, temperature: 28, feelsLike: 30, humidity: 82, pressure: 1008, windSpeed: 3.2, description: 'DEMO DATA – not real weather', icon: '03d', iconUrl: null, observedAt: now.toISOString() },
    forecast: Array.from({ length: 5 }, (_, i) => ({ date: new Date(now.getTime() + i * 864e5).toISOString().slice(0, 10), tempMin: 22, tempMax: 31, humidity: 75, rainChance: 20, description: 'demo data', iconUrl: null })),
  };
}

/**
 * Gets current weather + forecast for a city or coordinates. Cached for WEATHER_CACHE_MINUTES.
 * Without an API key it returns 503, unless OPENWEATHER_DEMO=true, in which case clearly-labelled demo data is returned.
 */
exports.getWeather = async ({ city, lat, lon }) => {
  if (!process.env.OPENWEATHER_API_KEY) {
    if (process.env.OPENWEATHER_DEMO === 'true') return { ...demoPayload(city), source: 'demo', cached: false, retrievedAt: new Date().toISOString() };
    throw new ApiError(503, 'Weather is not configured on the server (missing OPENWEATHER_API_KEY)');
  }
  const cacheKey = city ? `city:${city.trim().toLowerCase()}` : `geo:${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}`;
  const cached = await WeatherCache.findOne({ key: cacheKey });
  if (cached && Date.now() - cached.fetchedAt.getTime() < TTL_MS) {
    return { ...cached.payload, cached: true, retrievedAt: cached.fetchedAt.toISOString() };
  }
  const params = city ? { q: city } : { lat, lon };
  const currentRaw = await callProvider('weather', params);
  let forecast = null;
  let forecastNote;
  try { forecast = normalizeForecast(await callProvider('forecast', params)); } catch (e) { forecastNote = e.message; }
  const fetchedAt = new Date();
  const payload = { source: 'OpenWeatherMap', current: normalizeCurrent(currentRaw), forecast, ...(forecastNote ? { forecastNote } : {}) };
  await WeatherCache.findOneAndUpdate({ key: cacheKey }, { key: cacheKey, payload, fetchedAt }, { upsert: true });
  return { ...payload, cached: false, retrievedAt: fetchedAt.toISOString() };
};
