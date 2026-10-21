import { useState } from 'react';
import { Button, Table } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import FormModal, { toInitial } from '../../components/FormModal';
import { ConfirmModal, DemoBadge, ErrorBox, Loading, PageHeader } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../hooks/useFetch';
import api, { errMsg } from '../../services/api';
import { cap, inr } from '../../utils/format';
import { SERVICE_CATEGORIES } from '../../utils/options';

const FIELDS = [
  { name: 'name', label: 'Service name', required: true, col: 12 },
  { name: 'category', label: 'Category', type: 'select', required: true, options: SERVICE_CATEGORIES },
  { name: 'price', label: 'Price (₹)', type: 'number', step: '0.01', min: 0, required: true },
  { name: 'priceUnit', label: 'Price unit', placeholder: 'per hour, per day…' },
  { name: 'capacityPerSlot', label: 'Bookings allowed per slot', type: 'number', step: '1', min: 1 },
  { name: 'slots', label: 'Time slots (comma separated)', type: 'list', required: true, placeholder: '09:00-12:00, 14:00-17:00', col: 12 },
  { name: 'description', label: 'Description', type: 'textarea', max: 800, clearable: true },
  { name: 'active', label: 'Available for booking', type: 'checkbox' },
];

export default function AdminServices() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/services', { all: true });
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const save = async (payload) => {
    if (editing._id) await api.put(`/services/${editing._id}`, payload); else await api.post('/services', payload);
    toast('Service saved'); setEditing(null); reload();
  };
  const remove = async () => { try { await api.delete(`/services/${removing._id}`); toast('Service deleted'); } catch (e) { toast(errMsg(e), 'danger'); } setRemoving(null); reload(); };
  return (
    <>
      <PageHeader title="Services" subtitle="Equipment rental, consultations and other farm services." actions={<Button onClick={() => setEditing({ active: true, slots: ['09:00-12:00', '14:00-17:00'], capacityPerSlot: 1 })}><FaPlus className="me-1" aria-hidden="true" />Add service</Button>} />
      {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
      {data && <div className="table-responsive card"><Table hover className="mb-0 align-middle">
        <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Slots</th><th>Status</th><th /></tr></thead>
        <tbody>{data.map((s) => (
          <tr key={s._id}><td>{s.name} {s.isDemo && <DemoBadge />}</td><td>{cap(s.category)}</td><td>{inr(s.price)} {s.priceUnit}</td><td>{s.slots.join(', ')} (×{s.capacityPerSlot})</td><td>{s.active ? 'Active' : 'Inactive'}</td>
            <td className="text-end text-nowrap"><Button size="sm" variant="outline-secondary" className="me-1" onClick={() => setEditing(s)}>Edit</Button><Button size="sm" variant="outline-danger" onClick={() => setRemoving(s)}>Delete</Button></td></tr>))}</tbody>
      </Table></div>}
      {editing && <FormModal show title={editing._id ? 'Edit service' : 'Add service'} fields={FIELDS} initial={toInitial(editing, FIELDS)} onSubmit={save} onClose={() => setEditing(null)} />}
      <ConfirmModal show={!!removing} body={<>Delete <strong>{removing?.name}</strong>? Services with open bookings cannot be deleted — deactivate them instead.</>} onConfirm={remove} onCancel={() => setRemoving(null)} />
    </>
  );
}
