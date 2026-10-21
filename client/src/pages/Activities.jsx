import { useState } from 'react';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaClipboardList, FaPlus } from 'react-icons/fa';
import FormModal, { toInitial } from '../components/FormModal';
import { ConfirmModal, EmptyState, ErrorBox, Loading, PageHeader, Pager } from '../components/ui';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import api, { errMsg } from '../services/api';
import { cap, fmtDate, today } from '../utils/format';
import { ACTIVITY_TYPES, farmOptions } from '../utils/options';

export default function Activities() {
  const toast = useToast();
  const [farm, setFarm] = useState('');
  const [page, setPage] = useState(1);
  const farms = useFetch('/farms', { limit: 50 });
  const { data, meta, loading, error, reload } = useFetch('/activities', { ...(farm ? { farm } : {}), page, limit: 15 });
  const crops = useFetch('/crops', { limit: 50 });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fields = [
    { name: 'farm', label: 'Farm', type: 'select', required: true, options: farmOptions(farms.data) },
    { name: 'crop', label: 'Crop (optional)', type: 'select', options: (crops.data || []).map((c) => ({ value: c._id, label: `${c.name} (${c.farm?.name})` })), help: 'Must be a crop on the selected farm.' },
    { name: 'type', label: 'Activity', type: 'select', required: true, options: ACTIVITY_TYPES },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'quantity', label: 'Quantity / amount (optional)', placeholder: 'e.g. 2 hours, 20 kg' },
    { name: 'notes', label: 'Notes', type: 'textarea', max: 500, clearable: true },
  ];
  const save = async (payload) => {
    if (editing._id) await api.put(`/activities/${editing._id}`, payload); else await api.post('/activities', payload);
    toast(editing._id ? 'Activity updated' : 'Activity logged'); setEditing(null); reload();
  };
  const remove = async () => { try { await api.delete(`/activities/${deleting._id}`); toast('Activity deleted'); setDeleting(null); reload(); } catch (e) { toast(errMsg(e), 'danger'); } };
  const noFarms = farms.data && farms.data.length === 0;

  return (
    <>
      <PageHeader title="Farm Activities" subtitle="A simple log of what you did and when — sowing, irrigation, fertilising, spraying, harvesting."
        actions={!noFarms && <Button onClick={() => setEditing({ date: today(), farm })}><FaPlus className="me-1" aria-hidden="true" />Log activity</Button>} />
      {noFarms ? <EmptyState icon={FaClipboardList} title="Add a farm first" action={<Link className="btn btn-primary" to="/farms">Add farm</Link>} /> : (
        <>
          <Row className="mb-3"><Col sm={4}><Form.Select aria-label="Filter by farm" value={farm} onChange={(e) => { setFarm(e.target.value); setPage(1); }}><option value="">All farms</option>{farmOptions(farms.data).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Form.Select></Col></Row>
          {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
          {data?.length === 0 && <EmptyState icon={FaClipboardList} title="No activities logged yet" text="Record your first activity to build a farm history." />}
          {data?.length > 0 && (
            <div className="table-responsive card"><Table hover className="mb-0 align-middle">
              <thead><tr><th>Date</th><th>Activity</th><th>Farm</th><th>Crop</th><th>Details</th><th /></tr></thead>
              <tbody>{data.map((a) => (
                <tr key={a._id}><td>{fmtDate(a.date)}</td><td>{cap(a.type)}</td><td>{a.farm?.name}</td><td>{a.crop?.name || '—'}</td><td>{[a.quantity, a.notes].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="text-end text-nowrap"><Button size="sm" variant="outline-secondary" className="me-1" onClick={() => setEditing(a)}>Edit</Button><Button size="sm" variant="outline-danger" onClick={() => setDeleting(a)}>Delete</Button></td></tr>))}</tbody>
            </Table></div>)}
          <Pager meta={meta} onPage={setPage} />
        </>
      )}
      {editing && <FormModal show title={editing._id ? 'Edit activity' : 'Log activity'} fields={fields} initial={toInitial(editing, fields)} onSubmit={save} onClose={() => setEditing(null)} />}
      <ConfirmModal show={!!deleting} body="Delete this activity record?" onConfirm={remove} onCancel={() => setDeleting(null)} />
    </>
  );
}
