import { useState } from 'react';
import { Button, Card, Col, Row } from 'react-bootstrap';
import FormModal from '../../components/FormModal';
import { ConfirmModal, EmptyState, ErrorBox, Loading, PageHeader, StatusBadge } from '../../components/ui';
import { FaBullhorn } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../hooks/useFetch';
import api, { errMsg } from '../../services/api';
import { cap, fmtDateTime } from '../../utils/format';

const FIELDS = [
  { name: 'title', label: 'Title', required: true, col: 12 },
  { name: 'type', label: 'Type', type: 'select', required: true, options: ['pest-disease', 'weather', 'harvest', 'soil', 'general'].map((v) => ({ value: v, label: cap(v) })) },
  { name: 'severity', label: 'Severity', type: 'select', required: true, options: ['info', 'warning', 'critical'].map((v) => ({ value: v, label: cap(v) })) },
  { name: 'message', label: 'Message to all farmers', type: 'textarea', required: true, max: 600 },
];

export default function AdminAlerts() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/alerts');
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState(null);
  const broadcasts = (data || []).filter((a) => a.source === 'admin');
  const save = async (payload) => { await api.post('/alerts/broadcast', payload); toast('Advisory published to all farmers'); setCreating(false); reload(); };
  const remove = async () => { try { await api.delete(`/alerts/broadcast/${removing._id}`); toast('Advisory deleted'); } catch (e) { toast(errMsg(e), 'danger'); } setRemoving(null); reload(); };
  return (
    <>
      <PageHeader title="Advisories" subtitle="Publish notices (for example a regional pest warning) that every farmer sees under Alerts." actions={<Button onClick={() => setCreating(true)}>New advisory</Button>} />
      {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
      {data && broadcasts.length === 0 && <EmptyState icon={FaBullhorn} title="No advisories published" text="Only share information from reliable sources such as your state agriculture department." />}
      <Row className="g-3">{broadcasts.map((a) => (
        <Col md={6} key={a._id}><Card><Card.Body>
          <div className="d-flex justify-content-between"><StatusBadge value={a.severity} /><span className="small text-muted">{fmtDateTime(a.createdAt)}</span></div>
          <h2 className="h6 mt-2">{a.title}</h2><p>{a.message}</p><Button size="sm" variant="outline-danger" onClick={() => setRemoving(a)}>Delete</Button>
        </Card.Body></Card></Col>))}</Row>
      {creating && <FormModal show title="New advisory" fields={FIELDS} initial={{ type: 'pest-disease', severity: 'info' }} submitLabel="Publish" onSubmit={save} onClose={() => setCreating(false)} />}
      <ConfirmModal show={!!removing} body="Delete this advisory for everyone?" onConfirm={remove} onCancel={() => setRemoving(null)} />
    </>
  );
}
