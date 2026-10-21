import { useState } from 'react';
import { Button, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCalendarCheck } from 'react-icons/fa';
import FormModal from '../components/FormModal';
import { ConfirmModal, EmptyState, ErrorBox, Loading, PageHeader, Pager, StatusBadge } from '../components/ui';
import { useT } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import api, { errMsg } from '../services/api';
import { dateInput, fmtDate, inr, today } from '../utils/format';

export default function Bookings() {
  const { t } = useT();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch('/bookings', { page, limit: 15 });
  const [editing, setEditing] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const fields = editing ? [
    { name: 'date', label: 'New date', type: 'date', required: true, min: today() },
    { name: 'slot', label: 'Time slot', type: 'select', required: true, options: (editing.service?.slots || []).map((s) => ({ value: s, label: s })) },
    { name: 'notes', label: 'Notes', type: 'textarea', max: 500, clearable: true },
  ] : [];
  const save = async (payload) => { await api.put(`/bookings/${editing._id}`, payload); toast('Booking updated'); setEditing(null); reload(); };
  const cancel = async () => { try { await api.put(`/bookings/${cancelling._id}/cancel`); toast('Booking cancelled'); } catch (e) { toast(errMsg(e), 'danger'); } setCancelling(null); reload(); };

  return (
    <>
      <PageHeader title={t('bookings.title')} subtitle="Pending bookings can be rescheduled. Pending or confirmed bookings can be cancelled." actions={<Link to="/services" className="btn btn-primary">New booking</Link>} />
      {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
      {data?.length === 0 && <EmptyState icon={FaCalendarCheck} title="No bookings yet" action={<Link to="/services" className="btn btn-primary">Browse services</Link>} />}
      {data?.length > 0 && (
        <div className="table-responsive card"><Table hover className="mb-0 align-middle">
          <thead><tr><th>Service</th><th>Date</th><th>Slot</th><th>Farm</th><th>Price</th><th>Status</th><th /></tr></thead>
          <tbody>{data.map((b) => (
            <tr key={b._id}><td>{b.service?.name}</td><td>{fmtDate(b.date)}</td><td>{b.slot}</td><td>{b.farm?.name || '—'}</td><td>{inr(b.price)}</td><td><StatusBadge value={b.status} /></td>
              <td className="text-end text-nowrap">
                {b.status === 'pending' && <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => setEditing({ ...b, date: dateInput(b.date) })}>Reschedule</Button>}
                {['pending', 'confirmed'].includes(b.status) && <Button size="sm" variant="outline-danger" onClick={() => setCancelling(b)}>Cancel</Button>}
              </td></tr>))}</tbody>
        </Table></div>)}
      <Pager meta={meta} onPage={setPage} />
      {editing && <FormModal show size="md" title="Reschedule booking" fields={fields} initial={{ date: editing.date, slot: editing.slot, notes: editing.notes || '' }} onSubmit={save} onClose={() => setEditing(null)} />}
      <ConfirmModal show={!!cancelling} title="Cancel booking?" body="The slot will be released." confirmLabel="Cancel booking" onConfirm={cancel} onCancel={() => setCancelling(null)} />
    </>
  );
}
