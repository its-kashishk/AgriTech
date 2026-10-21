// LOCAL STAND-IN for OpenWeatherMap used only for the sandbox E2E run (the real API is not reachable here).
const http = require('http');
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); res.setHeader('content-type', 'application/json');
  const q = u.searchParams.get('q');
  if (q && /nowhere/i.test(q)) { res.statusCode = 404; return res.end('{"cod":"404"}'); }
  if (u.pathname.endsWith('/forecast')) {
    const list = []; for (let d = 0; d < 5; d++) for (const h of ['00', '06', '12', '18']) { const dt = new Date(Date.now() + d * 864e5).toISOString().slice(0, 10); list.push({ dt_txt: `${dt} ${h}:00:00`, main: { temp_min: 22, temp_max: 31, humidity: 78, temp: 27 }, pop: d === 1 ? 0.7 : 0.1, weather: [{ description: d === 1 ? 'light rain' : 'scattered clouds', icon: d === 1 ? '10d' : '03d' }] }); }
    return res.end(JSON.stringify({ list }));
  }
  res.end(JSON.stringify({ name: q || 'Pune', sys: { country: 'IN' }, coord: { lat: 18.52, lon: 73.85 }, main: { temp: 27.4, feels_like: 30.1, humidity: 84, pressure: 1008 }, wind: { speed: 3.4 }, weather: [{ description: 'broken clouds', icon: '04d' }], dt: Math.floor(Date.now() / 1000) }));
}).listen(9100);
