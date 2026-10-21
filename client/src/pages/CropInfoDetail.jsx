import { Badge, Card, Col, Row } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { Disclaimer, ErrorBox, Loading, PageHeader } from '../components/ui';
import useFetch from '../hooks/useFetch';
import { cap } from '../utils/format';

const Block = ({ title, children }) => <div className="mb-3"><h3 className="h6 text-uppercase text-muted">{title}</h3><div>{children}</div></div>;

export default function CropInfoDetail() {
  const { slug } = useParams();
  const { data: c, meta, loading, error, reload } = useFetch(`/crop-info/${slug}`);
  if (loading) return <Loading />;
  if (error) return <><ErrorBox message={error} onRetry={reload} /><Link to="/crop-info">← Back to crop guide</Link></>;
  return (
    <>
      <PageHeader title={c.name} subtitle={`${cap(c.type)} · ${c.season} · about ${c.durationDays} days`} actions={<Link to="/crop-info" className="btn btn-outline-secondary">Back</Link>} />
      <Row className="g-3">
        <Col lg={8}><Card><Card.Body>
          <p className="lead">{c.overview}</p>
          <Block title="Climate">{c.climate}</Block><Block title="Soil">{c.soil}</Block><Block title="Irrigation">{c.irrigation}</Block>
          <Block title="Planting">{c.planting}</Block><Block title="Harvest">{c.harvest}</Block>
          <Block title="Care tips"><ul className="mb-0">{c.care.map((x) => <li key={x}>{x}</li>)}</ul></Block>
        </Card.Body></Card></Col>
        <Col lg={4}>
          <Card className="mb-3"><Card.Body><h2 className="h5">Growth stages</h2>
            <ol className="mb-0 ps-3">{c.stages.map((s) => <li key={s}>{s}</li>)}</ol></Card.Body></Card>
          <Card><Card.Body><h2 className="h5">Common pests & diseases</h2>
            {c.pests.map((p) => (<div key={p.name} className="mb-3"><strong>{p.name}</strong> <Badge bg={p.kind === 'disease' ? 'danger' : 'warning'} text={p.kind === 'disease' ? undefined : 'dark'}>{cap(p.kind)}</Badge>
              <div className="small"><strong>Signs:</strong> {p.symptoms}</div><div className="small"><strong>Prevention:</strong> {p.prevention}</div></div>))}
          </Card.Body></Card>
        </Col>
      </Row>
      <Disclaimer>{meta?.disclaimer}</Disclaimer>
    </>
  );
}
