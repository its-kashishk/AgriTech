import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, InputGroup, Row } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { FaLocationArrow, FaSearch, FaTint, FaWind, FaCompressArrowsAlt } from 'react-icons/fa';
import { Disclaimer, ErrorBox, Loading, PageHeader } from '../components/ui';
import { useT } from '../context/LanguageContext';
import useFetch from '../hooks/useFetch';
import api, { errMsg } from '../services/api';
import { fmtDate, fmtDateTime } from '../utils/format';

export default function Weather() {
  const { t } = useT();
  const [sp] = useSearchParams();
  const farms = useFetch('/farms', { limit: 50 });
  const [city, setCity] = useState('');
  const [farm, setFarm] = useState(sp.get('farm') || '');
  const [state, setState] = useState({ data: null, loading: false, error: '' });

  const lookup = async (params) => {
    setState({ data: null, loading: true, error: '' });
    try { const r = await api.get('/weather', { params }); setState({ data: r.data.data, loading: false, error: '' }); } catch (e) { setState({ data: null, loading: false, error: errMsg(e) }); }
  };
  useEffect(() => { const f = sp.get('farm'); if (f) lookup({ farm: f }); }, [sp]); // eslint-disable-line react-hooks/exhaustive-deps

  const useMyLocation = () => {
    if (!navigator.geolocation) return setState({ data: null, loading: false, error: 'Your browser does not support location. Type a city name instead.' });
    // The browser itself asks the user for permission when this is called.
    navigator.geolocation.getCurrentPosition(
      (pos) => lookup({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setState({ data: null, loading: false, error: 'Location permission was not given. You can type a city name instead.' }),
      { timeout: 10000 }
    );
  };
  const { data: w, loading, error } = state;
  const c = w?.current;

  return (
    <>
      <PageHeader title={t('weather.title')} subtitle="Current weather and a 5-day outlook from OpenWeatherMap." />
      <Card className="mb-4"><Card.Body>
        <Form onSubmit={(e) => { e.preventDefault(); if (city.trim().length >= 2) lookup({ city: city.trim() }); }}>
          <Row className="g-2 align-items-end">
            <Col md={5}><Form.Label htmlFor="city">{t('weather.city')}</Form.Label>
              <InputGroup><Form.Control id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pune" minLength={2} /><Button type="submit" disabled={city.trim().length < 2}><FaSearch aria-hidden="true" /> {t('weather.search')}</Button></InputGroup></Col>
            <Col md={4}><Form.Label htmlFor="farmsel">…or use one of your farms</Form.Label>
              <Form.Select id="farmsel" value={farm} onChange={(e) => { setFarm(e.target.value); if (e.target.value) lookup({ farm: e.target.value }); }}><option value="">Select a farm</option>{farms.data?.map((f) => <option key={f._id} value={f._id}>{f.name} — {f.location}</option>)}</Form.Select></Col>
            <Col md={3}><Button variant="outline-primary" className="w-100" onClick={useMyLocation}><FaLocationArrow aria-hidden="true" /> {t('weather.useLocation')}</Button></Col>
          </Row>
          <Form.Text muted>“Use my location” asks your browser for permission and only sends your coordinates to get the weather. You can always type a place instead. Weather for a farm also checks it against simple alert rules.</Form.Text>
        </Form>
      </Card.Body></Card>

      {loading && <Loading label="Fetching weather…" />}
      <ErrorBox message={error} />
      {!w && !loading && !error && <p className="text-muted">Search for a place to see the weather.</p>}
      {w?.demo && <Alert variant="warning"><strong>Demo data.</strong> The server has no OpenWeatherMap key configured, so these numbers are not real weather.</Alert>}
      {c && (
        <>
          <Card className="weather-hero mb-3"><Card.Body className="p-4">
            <Row className="align-items-center g-3">
              <Col md={6}>
                <div className="opacity-75">{c.location.name}{c.location.country ? `, ${c.location.country}` : ''}</div>
                <div className="display-font" style={{ fontSize: '3.5rem', lineHeight: 1 }}>{Math.round(c.temperature)}°C</div>
                <div className="text-capitalize">{c.description} · feels like {Math.round(c.feelsLike)}°C</div>
              </Col>
              <Col md={6} className="d-flex align-items-center justify-content-md-end gap-3">{c.iconUrl && <img src={c.iconUrl} alt={c.description} width="96" height="96" />}</Col>
            </Row>
          </Card.Body></Card>
          <Row className="g-3 mb-3">
            {[[FaTint, 'Humidity', `${c.humidity}%`], [FaWind, 'Wind', `${c.windSpeed} m/s`], [FaCompressArrowsAlt, 'Pressure', `${c.pressure} hPa`]].map(([Icon, label, val]) => (
              <Col xs={4} key={label}><Card className="stat-card h-100"><Card.Body><div className="text-muted small"><Icon aria-hidden="true" /> {label}</div><div className="value fs-3">{val}</div></Card.Body></Card></Col>))}
          </Row>
          <p className="small text-muted">Source: {w.source}. Observed {fmtDateTime(c.observedAt)} · retrieved {fmtDateTime(w.retrievedAt)}{w.cached ? ' (cached for a few minutes to respect API limits)' : ''}.</p>
          {w.forecast && (
            <>
              <h2 className="h5">Next days</h2>
              <Row className="g-2">{w.forecast.map((d) => (
                <Col xs={6} md key={d.date}><Card className="text-center h-100"><Card.Body className="p-2">
                  <div className="small fw-semibold">{fmtDate(d.date)}</div>{d.iconUrl && <img src={d.iconUrl} alt="" width="48" height="48" />}
                  <div>{Math.round(d.tempMin)}° – {Math.round(d.tempMax)}°C</div><div className="small text-muted text-capitalize">{d.description}</div><div className="small">Rain chance {d.rainChance}%</div>
                </Card.Body></Card></Col>))}</Row>
            </>
          )}
          {w.forecastNote && <p className="small text-muted">Forecast unavailable: {w.forecastNote}</p>}
        </>
      )}
      <Disclaimer>Weather data comes from a third-party provider and may differ from local conditions.</Disclaimer>
    </>
  );
}
