import { useState } from 'react';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { FaPlus, FaSeedling } from 'react-icons/fa';
import FormModal, { toInitial } from '../components/FormModal';
import { EmptyState, ErrorBox, Loading, PageHeader, Pager, StatusBadge } from '../components/ui';
import { useT } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import api from '../services/api';
import { cap, fmtDate } from '../utils/format';
import { CROP_STATUS, CROP_TYPES, farmOptions, STAGE_OPTS } from '../utils/options';

export default function Crops() {
  const { t } = useT();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const [page, setPage] = useState(1);
  const filters = { farm: sp.get('farm') || '', status: sp.get('status') || '', stage: sp.get('stage') || '' };
  const farms = useFetch('/farms', { limit: 50 });
  const { data, meta, loading, error, reload } = useFetch('/crops', { ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page, limit: 15 });
  const [editing, setEditing] = useState(null);

  const setFilter = (k) => (e) => { const n = new URLSearchParams(sp); if (e.target.value) n.set(k, e.target.value); else n.delete(k); setSp(n); setPage(1); };

  const fields = [
    { name: 'farm', label: 'Farm', type: 'select', options: farmOptions(farms.data), required: true },
    { name: 'name', label: 'Crop name', required: true, placeholder: 'e.g. Wheat' },
    { name: 'variety', label: 'Variety (optional)' },
    { name: 'type', label: 'Crop type', type: 'select', options: CROP_TYPES },
    { name: 'plot', label: 'Field / plot (optional)', placeholder: 'e.g. North plot' },
    { name: 'stage', label: 'Growth stage', type: 'select', options: STAGE_OPTS, required: true },
    { name: 'sowingDate', label: 'Sowing date', type: 'date', required: true },
    { name: 'expectedHarvestDate', label: 'Expected harvest date', type: 'date', required: true },
    { name: 'status', label: 'Status', type: 'select', options: CROP_STATUS, required: true },
    { name: 'healthNotes', label: 'Crop health notes', type: 'textarea', max: 1000, clearable: true },
  ];
  const save = async (payload) => {
    if (editing._id) await api.put(`/crops/${editing._id}`, payload); else await api.post('/crops', payload);
    toast(editing._id ? 'Crop updated' : 'Crop added'); setEditing(null); reload();
  };
  const noFarms = farms.data && farms.data.length === 0;

  return (
    <>
      <PageHeader title={t('crops.title')} subtitle="Track sowing, growth stage and expected harvest for each crop." actions={!noFarms && <Button onClick={() => setEditing({ stage: 'sowing', status: 'active', farm: filters.farm })}><FaPlus className="me-1" aria-hidden="true" />{t('crops.add')}</Button>} />
      {noFarms ? <EmptyState icon={FaSeedling} title="Add a farm first" text="Crops belong to a farm." action={<Link className="btn btn-primary" to="/farms">{t('farms.add')}</Link>} /> : (
        <>
          <Row className="g-2 mb-3">
            <Col sm={4}><Form.Select aria-label="Filter by farm" value={filters.farm} onChange={setFilter('farm')}><option value="">All farms</option>{farmOptions(farms.data).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Form.Select></Col>
            <Col sm={4}><Form.Select aria-label="Filter by status" value={filters.status} onChange={setFilter('status')}><option value="">All statuses</option>{CROP_STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Form.Select></Col>
            <Col sm={4}><Form.Select aria-label="Filter by growth stage" value={filters.stage} onChange={setFilter('stage')}><option value="">All stages</option>{STAGE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Form.Select></Col>
          </Row>
          {loading && <Loading />}
          <ErrorBox message={error} onRetry={reload} />
          {data && data.length === 0 && <EmptyState icon={FaSeedling} title="No crops found" text="Add a crop or change the filters." />}
          {data && data.length > 0 && (
            <div className="table-responsive card"><Table hover className="mb-0 align-middle">
              <thead><tr><th>Crop</th><th>Farm</th><th>Stage</th><th>Sown</th><th>Harvest</th><th>Status</th><th /></tr></thead>
              <tbody>{data.map((c) => (
                <tr key={c._id}>
                  <td><Link to={`/crops/${c._id}`} className="fw-semibold">{c.name}</Link>{c.variety && <span className="text-muted small"> · {c.variety}</span>}</td>
                  <td>{c.farm?.name}</td><td><span className="stage-pill">{cap(c.stage)}</span></td><td>{fmtDate(c.sowingDate)}</td><td>{fmtDate(c.expectedHarvestDate)}</td>
                  <td><StatusBadge value={c.status} /></td>
                  <td className="text-end"><Button size="sm" variant="outline-secondary" onClick={() => setEditing(c)}>{t('common.edit')}</Button></td>
                </tr>))}</tbody>
            </Table></div>
          )}
          <Pager meta={meta} onPage={setPage} />
        </>
      )}
      {editing && <FormModal show title={editing._id ? 'Edit crop' : t('crops.add')} fields={fields} initial={toInitial(editing, fields)} onSubmit={save} onClose={() => setEditing(null)} />}
    </>
  );
}
