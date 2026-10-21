import { Button, Card, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FaTractor } from 'react-icons/fa';
import { EmptyState, ErrorBox, Loading, PageHeader, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LanguageContext';
import useFetch from '../hooks/useFetch';
import { cap, daysUntil, fmtDate, inr } from '../utils/format';

const Stat = ({ label, value, to, cls = '' }) => (
  <Card className={`stat-card h-100 ${cls}`}><Card.Body>
    <div className="text-muted small">{label}</div><div className="value my-1">{value}</div>
    {to && <Link to={to} className="small">View →</Link>}
  </Card.Body></Card>
);

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useT();
  const { data, loading, error, reload } = useFetch('/dashboard');
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { counts, upcomingHarvests, recentActivities, recentOrders, upcomingBookings, cropsByStage } = data;
  const isNew = counts.farms === 0;

  return (
    <>
      <PageHeader title={`${t('dash.title')}`} subtitle={`Namaste, ${user.name.split(' ')[0]}.`} actions={<Link to="/weather" className="btn btn-outline-primary">{t('nav.weather')}</Link>} />
      {isNew && (
        <EmptyState icon={FaTractor} title="Let's set up your first farm" text="Add a farm, then record the crops you are growing. Your dashboard fills up from your own records."
          action={<Link to="/farms" className="btn btn-primary">{t('farms.add')}</Link>} />
      )}
      {!isNew && (
        <>
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}><Stat label={t('dash.farms')} value={counts.farms} to="/farms" /></Col>
            <Col xs={6} md={3}><Stat label={t('dash.crops')} value={counts.activeCrops} to="/crops" cls="accent" /></Col>
            <Col xs={6} md={3}><Stat label={t('dash.alerts')} value={counts.unreadAlerts} to="/alerts" cls="clay" /></Col>
            <Col xs={6} md={3}><Stat label={t('dash.harvests')} value={upcomingHarvests.length} to="/crops" /></Col>
          </Row>
          <Row className="g-3">
            <Col lg={7}>
              <Card className="h-100"><Card.Body>
                <h2 className="h5">Active crops by growth stage</h2>
                {cropsByStage.length === 0 ? <p className="text-muted">No active crops yet. <Link to="/crops">Add a crop</Link>.</p> : (
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer><BarChart data={cropsByStage.map((s) => ({ ...s, name: cap(s.name) }))} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2dccb" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip /><Bar dataKey="count" name="Crops" fill="#4f8a5b" radius={[6, 6, 0, 0]} />
                    </BarChart></ResponsiveContainer>
                  </div>)}
              </Card.Body></Card>
            </Col>
            <Col lg={5}>
              <Card className="h-100"><Card.Body>
                <h2 className="h5">{t('dash.harvests')}</h2>
                {upcomingHarvests.length === 0 ? <p className="text-muted mb-0">Nothing due in the next 30 days.</p> : (
                  <ul className="list-unstyled mb-0">{upcomingHarvests.map((c) => (
                    <li key={c._id} className="d-flex justify-content-between py-2 border-bottom">
                      <Link to={`/crops/${c._id}`}>{c.name}<span className="text-muted small"> · {c.farm?.name}</span></Link>
                      <span className={daysUntil(c.expectedHarvestDate) < 0 ? 'text-danger' : ''}>{fmtDate(c.expectedHarvestDate)}</span>
                    </li>))}</ul>)}
              </Card.Body></Card>
            </Col>
            <Col md={6} lg={4}><Card className="h-100"><Card.Body>
              <h2 className="h5">{t('dash.activities')}</h2>
              {recentActivities.length === 0 ? <p className="text-muted mb-0">No activities logged. <Link to="/activities">Log one</Link>.</p> : (
                <ul className="list-unstyled mb-0">{recentActivities.map((a) => <li key={a._id} className="py-1">{cap(a.type)} <span className="text-muted small">· {a.farm?.name} · {fmtDate(a.date)}</span></li>)}</ul>)}
            </Card.Body></Card></Col>
            <Col md={6} lg={4}><Card className="h-100"><Card.Body>
              <h2 className="h5">{t('dash.orders')}</h2>
              {recentOrders.length === 0 ? <p className="text-muted mb-0">No orders yet. <Link to="/marketplace">Browse the marketplace</Link>.</p> : (
                <ul className="list-unstyled mb-0">{recentOrders.map((o) => <li key={o._id} className="d-flex justify-content-between py-1"><span>{inr(o.total)} · {fmtDate(o.createdAt)}</span><StatusBadge value={o.status} /></li>)}</ul>)}
            </Card.Body></Card></Col>
            <Col md={12} lg={4}><Card className="h-100"><Card.Body>
              <h2 className="h5">{t('dash.bookings')}</h2>
              {upcomingBookings.length === 0 ? <p className="text-muted mb-0">No upcoming bookings. <Link to="/services">See services</Link>.</p> : (
                <ul className="list-unstyled mb-0">{upcomingBookings.map((b) => <li key={b._id} className="d-flex justify-content-between py-1"><span>{b.service?.name} · {fmtDate(b.date)}</span><StatusBadge value={b.status} /></li>)}</ul>)}
            </Card.Body></Card></Col>
          </Row>
        </>
      )}
      <div className="mt-4"><Button as={Link} to="/crop-info" variant="link" className="p-0">Read the crop guide →</Button></div>
    </>
  );
}
