import { Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBook, FaChartLine, FaCloudSun, FaFlask, FaSeedling, FaShoppingBasket, FaTools, FaTractor } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const features = [
  [FaTractor, 'Farm & crop records', 'Keep every farm, plot and crop in one place with sowing dates, growth stages and harvest reminders.'],
  [FaCloudSun, 'Weather for your farm', 'Current weather and a 5-day outlook for your village or city, powered by OpenWeatherMap.'],
  [FaFlask, 'Soil records', 'Note pH, moisture and nutrient values from your soil test card and see how they change over time.'],
  [FaBook, 'Crop guide & pest notes', 'A searchable library of crops with growing conditions, common pests and diseases.'],
  [FaShoppingBasket, 'Buy farm resources', 'Browse seeds, fertilisers and tools, and place demo orders with live stock checks.'],
  [FaTools, 'Book services', 'Request equipment rental or expert consultation slots and track their status.'],
];

function FieldArt() {
  return (
    <svg className="hero-art" viewBox="0 0 640 380" role="img" aria-label="Illustration of crop rows under a rising sun">
      <circle cx="470" cy="110" r="64" fill="#d9a441" opacity="0.9" /><circle cx="470" cy="110" r="92" fill="#d9a441" opacity="0.18" />
      <path d="M0 210 Q160 150 320 200 T640 180 V380 H0Z" fill="#a9c79f" />
      <path d="M0 250 Q180 200 340 245 T640 230 V380 H0Z" fill="#6fa070" />
      <path d="M0 300 Q200 255 360 292 T640 280 V380 H0Z" fill="#3f7a4e" />
      {[...Array(9)].map((_, i) => (<path key={i} d={`M${-40 + i * 90} 380 L${130 + i * 62} 262`} stroke="#2f5d3a" strokeWidth="3" opacity="0.55" />))}
      {[...Array(7)].map((_, i) => (<g key={i} transform={`translate(${70 + i * 88} ${222 + (i % 2) * 10})`} stroke="#1c3a28" strokeWidth="3" fill="none" strokeLinecap="round"><path d="M0 34V4" /><path d="M0 14c-9 0-14-6-14-14 9 0 14 6 14 14z" /><path d="M0 22c9 0 14-6 14-14-9 0-14 6-14 14z" /></g>))}
    </svg>
  );
}

export default function Landing() {
  const { user } = useAuth();
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="pb-4">
            <span className="stage-pill mb-3 d-inline-block">Digital tools for every farmer</span>
            <h1 className="mb-3">Grow smarter, one season at a time.</h1>
            <p className="lead mb-4">AgriTech brings your farm records, weather, soil notes, crop guidance, shopping and service bookings into one simple, mobile-friendly place — in English and Hindi.</p>
            <div className="d-flex gap-2 flex-wrap">
              {user ? <Link to="/dashboard" className="btn btn-primary btn-lg">Open my dashboard</Link> : (
                <><Link to="/register" className="btn btn-primary btn-lg">Create free account</Link><Link to="/login" className="btn btn-outline-primary btn-lg">Log in</Link></>
              )}
            </div>
          </div>
          <FieldArt />
        </div>
      </section>
      <Container className="py-5">
        <h2 className="h3 text-center mb-4">Everything a small farm needs</h2>
        <Row className="g-3">
          {features.map(([Icon, title, text]) => (
            <Col md={6} lg={4} key={title}><div className="feature"><div className="icon"><Icon aria-hidden="true" /></div><h3 className="h5">{title}</h3><p className="text-muted mb-0">{text}</p></div></Col>
          ))}
        </Row>
        <Row className="g-4 mt-4 align-items-center">
          <Col md={6}>
            <h2 className="h3">How it works</h2>
            <ol className="text-muted ps-3 mb-0">
              <li className="mb-2">Register as a farmer (free).</li>
              <li className="mb-2">Add your farm and the crops you are growing.</li>
              <li className="mb-2">Check the weather, record soil readings and read the crop guide.</li>
              <li>Order inputs or book a service when you need them.</li>
            </ol>
          </Col>
          <Col md={6}>
            <div className="feature"><FaChartLine className="mb-2" size={24} aria-hidden="true" /><h3 className="h5">Honest by design</h3>
              <p className="text-muted mb-0">Alerts are simple, published rules — not AI predictions. Soil values are the numbers you enter, not sensor readings. Checkout is a demo with no real payment. Always confirm advice with your local agriculture officer.</p></div>
          </Col>
        </Row>
        <p className="text-center mt-5"><FaSeedling className="text-success" aria-hidden="true" /> Built as a MERN-stack capstone project.</p>
      </Container>
    </>
  );
}
