import { useState } from 'react';
import { Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FaFlask, FaPlus } from 'react-icons/fa';
import FormModal, { toInitial } from '../components/FormModal';
import { ConfirmModal, Disclaimer, EmptyState, ErrorBox, Loading, PageHeader } from '../components/ui';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import api, { errMsg } from '../services/api';
import { fmtDate, today } from '../utils/format';
import { farmOptions } from '../utils/options';

export default function Soil() {
  const toast = useToast();
  const [farm, setFarm] = useState('');
  const farms = useFetch('/farms', { limit: 50 });
  const { data, loading, error, reload } = useFetch('/soil', { ...(farm ? { farm } : {}), limit: 50 });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [guide, setGuide] = useState(null);

  const num = (name, label) => ({ name, label, type: 'number', step: 'any', min: 0, col: 4 });
  const fields = [
    { name: 'farm', label: 'Farm', type: 'select', required: true, options: farmOptions(farms.data) },
    { name: 'observedAt', label: 'Date of observation / test', type: 'date', required: true },
    { name: 'ph', label: 'Soil pH (0–14)', type: 'number', step: '0.1', min: 0, max: 14, col: 6 },
    { name: 'moisture', label: 'Moisture % (0–100)', type: 'number', step: '0.1', min: 0, max: 100, col: 6 },
    num('nitrogen', 'Nitrogen (kg/ha)'), num('phosphorus', 'Phosphorus (kg/ha)'), num('potassium', 'Potassium (kg/ha)'),
    { name: 'notes', label: 'Notes (e.g. lab name, sampling depth)', type: 'textarea', max: 500, clearable: true },
  ];
  const save = async (payload) => {
    if (editing._id) await api.put(`/soil/${editing._id}`, payload); else await api.post('/soil', payload);
    toast('Soil record saved'); setEditing(null); reload();
  };
  const remove = async () => { try { await api.delete(`/soil/${deleting._id}`); toast('Record deleted'); setDeleting(null); reload(); } catch (e) { toast(errMsg(e), 'danger'); } };
  const showGuide = async (r) => { try { const res = await api.get(`/soil/${r._id}/guidance`); setGuide(res.data.data); } catch (e) { toast(errMsg(e), 'danger'); } };
  const noFarms = farms.data && farms.data.length === 0;
  const series = [...(data || [])].reverse().map((r) => ({ date: fmtDate(r.observedAt), pH: r.ph, 'Moisture %': r.moisture }));

  return (
    <>
      <PageHeader title="Soil Records" subtitle="Enter values from your soil test card or your own field observations. AgriTech does not measure soil." actions={!noFarms && <Button onClick={() => setEditing({ observedAt: today(), farm })}><FaPlus className="me-1" aria-hidden="true" />Add soil record</Button>} />
      {noFarms ? <EmptyState icon={FaFlask} title="Add a farm first" action={<Link className="btn btn-primary" to="/farms">Add farm</Link>} /> : (
        <>
          <Row className="mb-3"><Col sm={4}><Form.Select aria-label="Filter by farm" value={farm} onChange={(e) => setFarm(e.target.value)}><option value="">All farms</option>{farmOptions(farms.data).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Form.Select></Col></Row>
          {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
          {data?.length === 0 && <EmptyState icon={FaFlask} title="No soil records yet" text="Add your first reading to see a trend chart and general guidance." />}
          {data?.length > 1 && (
            <Card className="mb-3"><Card.Body><h2 className="h5">pH and moisture over time</h2>
              <div style={{ height: 240 }}><ResponsiveContainer><LineChart data={series} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2dccb" /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend />
                <Line type="monotone" dataKey="pH" stroke="#2f5d3a" strokeWidth={2} dot connectNulls /><Line type="monotone" dataKey="Moisture %" stroke="#b5603a" strokeWidth={2} strokeDasharray="5 4" dot connectNulls />
              </LineChart></ResponsiveContainer></div></Card.Body></Card>)}
          {data?.length > 0 && (
            <div className="table-responsive card"><Table hover className="mb-0 align-middle">
              <thead><tr><th>Date</th><th>Farm</th><th>pH</th><th>Moisture</th><th>N / P / K (kg/ha)</th><th /></tr></thead>
              <tbody>{data.map((r) => (
                <tr key={r._id}><td>{fmtDate(r.observedAt)}</td><td>{r.farm?.name}</td><td>{r.ph ?? '—'}</td><td>{r.moisture != null ? `${r.moisture}%` : '—'}</td><td>{[r.nitrogen, r.phosphorus, r.potassium].map((v) => v ?? '—').join(' / ')}</td>
                  <td className="text-end text-nowrap"><Button size="sm" variant="outline-primary" className="me-1" onClick={() => showGuide(r)}>Guidance</Button><Button size="sm" variant="outline-secondary" className="me-1" onClick={() => setEditing(r)}>Edit</Button><Button size="sm" variant="outline-danger" onClick={() => setDeleting(r)}>Delete</Button></td></tr>))}</tbody>
            </Table></div>)}
          <Disclaimer>Values are entered by you. Guidance is general and is not a laboratory diagnosis — use an accredited soil-testing lab or your local KVK for fertiliser recommendations.</Disclaimer>
        </>
      )}
      {editing && <FormModal show title={editing._id ? 'Edit soil record' : 'Add soil record'} fields={fields} initial={toInitial(editing, fields)} onSubmit={save} onClose={() => setEditing(null)} />}
      <ConfirmModal show={!!deleting} body="Delete this soil record?" onConfirm={remove} onCancel={() => setDeleting(null)} />
      <Modal show={!!guide} onHide={() => setGuide(null)} centered>
        <Modal.Header closeButton><Modal.Title as="h2" className="h5">General guidance</Modal.Title></Modal.Header>
        <Modal.Body><ul className="mb-0">{guide?.guidance.map((g) => <li key={g} className="mb-2">{g}</li>)}</ul></Modal.Body>
      </Modal>
    </>
  );
}
