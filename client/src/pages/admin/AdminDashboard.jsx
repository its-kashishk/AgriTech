import { Card, Col, Row, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ErrorBox, Loading, PageHeader } from '../../components/ui';
import useFetch from '../../hooks/useFetch';
import { cap, inr } from '../../utils/format';

const COLORS = ['#2f5d3a', '#d9a441', '#b5603a', '#4f8a5b', '#7a8f6a', '#8c6d3f'];
const Stat = ({ label, value, cls = '' }) => <Card className={`stat-card h-100 ${cls}`}><Card.Body><div className="text-muted small">{label}</div><div className="value mt-1">{value}</div></Card.Body></Card>;

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch('/admin/stats');
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { totals: t, ordersByStatus, bookingsByStatus, cropsByType, lowStock } = data;
  const named = (rows) => rows.map((r) => ({ ...r, name: cap(r.name) }));
  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Live totals from the database." />
      <Row className="g-3 mb-4">
        {[['Farmers', t.farmers], ['Farms', t.farms], ['Crop records', t.crops], ['Active products', t.products], ['Orders', t.orders], ['Bookings', t.bookings], ['Community posts', t.posts], ['Order value (excl. cancelled)', inr(t.revenue)]].map(([l, v], i) => (
          <Col xs={6} md={3} key={l}><Stat label={l} value={v} cls={i % 3 === 1 ? 'accent' : i % 3 === 2 ? 'clay' : ''} /></Col>))}
      </Row>
      <Row className="g-3">
        <Col lg={6}><Card className="h-100"><Card.Body><h2 className="h5">Orders by status</h2>
          {ordersByStatus.length === 0 ? <p className="text-muted">No orders yet.</p> : <div style={{ height: 240 }}><ResponsiveContainer><BarChart data={named(ordersByStatus)} margin={{ left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2dccb" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="count" name="Orders" fill="#2f5d3a" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>}
        </Card.Body></Card></Col>
        <Col lg={6}><Card className="h-100"><Card.Body><h2 className="h5">Bookings by status</h2>
          {bookingsByStatus.length === 0 ? <p className="text-muted">No bookings yet.</p> : <div style={{ height: 240 }}><ResponsiveContainer><BarChart data={named(bookingsByStatus)} margin={{ left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2dccb" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="count" name="Bookings" fill="#d9a441" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>}
        </Card.Body></Card></Col>
        <Col lg={6}><Card className="h-100"><Card.Body><h2 className="h5">Crop records by type</h2>
          {cropsByType.length === 0 ? <p className="text-muted">No crops recorded yet.</p> : <div style={{ height: 240 }}><ResponsiveContainer><PieChart><Pie data={named(cropsByType)} dataKey="count" nameKey="name" outerRadius={85} label={(e) => `${e.name} (${e.count})`}>{cropsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>}
        </Card.Body></Card></Col>
        <Col lg={6}><Card className="h-100"><Card.Body><h2 className="h5">Low stock (10 or fewer)</h2>
          {lowStock.length === 0 ? <p className="text-muted mb-0">All products are well stocked.</p> : <Table size="sm" className="mb-0"><tbody>{lowStock.map((p) => <tr key={p._id}><td>{p.name}</td><td className="text-end">{p.stock} {p.unit}</td></tr>)}</tbody></Table>}
        </Card.Body></Card></Col>
      </Row>
    </>
  );
}
