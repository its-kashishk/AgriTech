import { useState } from 'react';
import { Badge, Card, Col, Form, Row, Tab, Tabs } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { FaBook } from 'react-icons/fa';
import { Disclaimer, EmptyState, ErrorBox, Loading, PageHeader } from '../components/ui';
import { useT } from '../context/LanguageContext';
import useFetch from '../hooks/useFetch';
import { cap } from '../utils/format';
import { CROP_TYPES } from '../utils/options';

export default function CropInfo() {
  const { t } = useT();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  const [type, setType] = useState('');
  const crops = useFetch('/crop-info', { q: q || undefined, type: type || undefined });
  const pests = useFetch('/crop-info/pests', { q: q || undefined });

  return (
    <>
      <PageHeader title="Crop Guide" subtitle="Reference notes on growing conditions, pests and diseases." />
      <Row className="g-2 mb-3">
        <Col md={6}><Form.Control type="search" aria-label="Search crops" placeholder={`${t('common.search')}… e.g. tomato, rabi, cereal`} value={q} onChange={(e) => { setQ(e.target.value); setSp(e.target.value ? { q: e.target.value } : {}); }} /></Col>
        <Col md={3}><Form.Select aria-label="Filter by crop type" value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{CROP_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Form.Select></Col>
      </Row>
      <Tabs defaultActiveKey="crops" className="mb-3">
        <Tab eventKey="crops" title="Crops">
          {crops.loading && <Loading />}<ErrorBox message={crops.error} onRetry={crops.reload} />
          {crops.data?.length === 0 && <EmptyState icon={FaBook} title="No crops match your search" />}
          <Row className="g-3">{crops.data?.map((c) => (
            <Col md={6} lg={4} key={c.slug}><Card className="h-100 product-card"><Card.Body>
              <div className="d-flex justify-content-between"><h2 className="h5">{c.name}</h2><Badge bg="light" text="dark" className="border">{cap(c.type)}</Badge></div>
              <p className="small text-muted mb-1">{c.season} · {c.durationDays} days</p>
              <p className="mb-3">{c.overview}</p><Link to={`/crop-info/${c.slug}`} className="stretched-link">Read guide →</Link>
            </Card.Body></Card></Col>))}</Row>
        </Tab>
        <Tab eventKey="pests" title="Pests & diseases">
          {pests.loading && <Loading />}<ErrorBox message={pests.error} onRetry={pests.reload} />
          <Row className="g-3">{pests.data?.map((p) => (
            <Col md={6} key={`${p.cropSlug}-${p.name}`}><Card className="h-100"><Card.Body>
              <div className="d-flex justify-content-between"><h2 className="h6 mb-1">{p.name}</h2><Badge bg={p.kind === 'disease' ? 'danger' : 'warning'} text={p.kind === 'disease' ? undefined : 'dark'}>{cap(p.kind)}</Badge></div>
              <p className="small text-muted mb-2">Affects <Link to={`/crop-info/${p.cropSlug}`}>{p.crop}</Link></p>
              <p className="mb-1"><strong>Signs:</strong> {p.symptoms}</p><p className="mb-0"><strong>Prevention:</strong> {p.prevention}</p>
            </Card.Body></Card></Col>))}</Row>
        </Tab>
      </Tabs>
      <Disclaimer>{crops.meta?.disclaimer || t('disclaimer.advice')}</Disclaimer>
      {crops.meta?.source && <Disclaimer>Source: {crops.meta.source}</Disclaimer>}
    </>
  );
}
