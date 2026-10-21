import { useState } from 'react';
import { Button, Card, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCloudSun, FaPen, FaPlus, FaSeedling, FaTractor, FaTrash } from 'react-icons/fa';
import FormModal, { toInitial } from '../components/FormModal';
import { ConfirmModal, EmptyState, ErrorBox, Loading, PageHeader } from '../components/ui';
import { useT } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import api, { errMsg } from '../services/api';
import { cap } from '../utils/format';
import { IRRIGATION, SOIL_TYPES } from '../utils/options';

const FIELDS = [
  { name: 'name', label: 'Farm name', required: true },
  { name: 'location', label: 'Location (village / city, state)', required: true, help: 'Used to look up weather.' },
  { name: 'size', label: 'Size', type: 'number', step: '0.01', min: 0.01, required: true, col: 4 },
  { name: 'sizeUnit', label: 'Unit', type: 'select', required: true, options: [{ value: 'acre', label: 'Acre' }, { value: 'hectare', label: 'Hectare' }], col: 4 },
  { name: 'soilType', label: 'Soil type', type: 'select', options: SOIL_TYPES, col: 4 },
  { name: 'irrigation', label: 'Irrigation', type: 'select', options: IRRIGATION },
  { name: 'coordinates.lat', label: 'Latitude (optional)', type: 'number', step: 'any', min: -90, max: 90, col: 3 },
  { name: 'coordinates.lon', label: 'Longitude (optional)', type: 'number', step: 'any', min: -180, max: 180, col: 3 },
  { name: 'description', label: 'Notes', type: 'textarea', max: 500 },
];

export default function Farms() {
  const { t } = useT();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/farms', { limit: 50 });
  const [editing, setEditing] = useState(null); // {} for new, record for edit
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async (payload) => {
    if (editing._id) await api.put(`/farms/${editing._id}`, payload); else await api.post('/farms', payload);
    toast(editing._id ? 'Farm updated' : 'Farm added'); setEditing(null); reload();
  };
  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/farms/${deleting._id}`); toast('Farm deleted'); setDeleting(null); reload(); } catch (e) { toast(errMsg(e), 'danger'); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title={t('farms.title')} subtitle="Your farm profiles. Crops, soil records and activities are linked to a farm." actions={<Button onClick={() => setEditing({ sizeUnit: 'acre' })}><FaPlus className="me-1" aria-hidden="true" />{t('farms.add')}</Button>} />
      {loading && <Loading />}
      <ErrorBox message={error} onRetry={reload} />
      {data && data.length === 0 && <EmptyState icon={FaTractor} title="No farms yet" text="Add your first farm to start tracking crops." action={<Button onClick={() => setEditing({ sizeUnit: 'acre' })}>{t('farms.add')}</Button>} />}
      <Row className="g-3">
        {(data || []).map((f) => (
          <Col md={6} xl={4} key={f._id}>
            <Card className="h-100"><Card.Body className="d-flex flex-column">
              <h2 className="h5 mb-1">{f.name}</h2>
              <p className="text-muted mb-2">{f.location}</p>
              <p className="mb-2"><strong>{f.size} {f.sizeUnit}{f.size === 1 ? '' : 's'}</strong> · {cap(f.soilType)} soil · {cap(f.irrigation)}</p>
              {f.description && <p className="small text-muted">{f.description}</p>}
              <div className="mt-auto d-flex flex-wrap gap-2 pt-2">
                <Link className="btn btn-sm btn-outline-primary" to={`/crops?farm=${f._id}`}><FaSeedling aria-hidden="true" /> Crops</Link>
                <Link className="btn btn-sm btn-outline-primary" to={`/weather?farm=${f._id}`}><FaCloudSun aria-hidden="true" /> Weather</Link>
                <Button size="sm" variant="outline-secondary" onClick={() => setEditing(f)} aria-label={`Edit ${f.name}`}><FaPen aria-hidden="true" /></Button>
                <Button size="sm" variant="outline-danger" onClick={() => setDeleting(f)} aria-label={`Delete ${f.name}`}><FaTrash aria-hidden="true" /></Button>
              </div>
            </Card.Body></Card>
          </Col>
        ))}
      </Row>
      {editing && <FormModal show title={editing._id ? 'Edit farm' : t('farms.add')} fields={FIELDS} initial={toInitial(editing, FIELDS)} onSubmit={save} onClose={() => setEditing(null)} />}
      <ConfirmModal show={!!deleting} body={<>Delete <strong>{deleting?.name}</strong>? Its crops, soil records and activities will be deleted too. This cannot be undone.</>} onConfirm={remove} onCancel={() => setDeleting(null)} busy={busy} />
    </>
  );
}
