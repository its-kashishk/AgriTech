import { useState } from 'react';
import { Form, Table } from 'react-bootstrap';
import { ErrorBox, Loading, PageHeader, Pager, StatusBadge } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../hooks/useFetch';
import api, { errMsg } from '../../services/api';
import { cap, fmtDate, inr } from '../../utils/format';

const NEXT = { pending: ['confirmed', 'rejected', 'cancelled'], confirmed: ['completed', 'cancelled'], completed: [], cancelled: [], rejected: [] };

export default function AdminBookings() {
  const toast = useToast();
  const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch('/bookings/admin/all', { status: status || undefined, page, limit: 15 });
  const move = async (b, next) => { if (!next) return; try { await api.put(`/bookings/${b._id}/status`, { status: next }); toast(`Booking marked ${next}`); } catch (e) { toast(errMsg(e), 'danger'); } reload(); };
  return (
    <>
      <PageHeader title="Bookings" subtitle="Confirm, reject or complete service bookings." />
      <Form.Select className="mb-3" style={{ maxWidth: 240 }} aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
        <option value="">All statuses</option>{Object.keys(NEXT).map((s) => <option key={s} value={s}>{cap(s)}</option>)}</Form.Select>
      {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
      {data?.length === 0 && <p className="text-muted">No bookings found.</p>}
      {data?.length > 0 && <div className="table-responsive card"><Table hover className="mb-0 align-middle">
        <thead><tr><th>Service</th><th>Farmer</th><th>Date</th><th>Slot</th><th>Price</th><th>Status</th><th>Update</th></tr></thead>
        <tbody>{data.map((b) => (
          <tr key={b._id}><td>{b.service?.name}</td><td>{b.user?.name}<div className="small text-muted">{b.user?.email}</div></td><td>{fmtDate(b.date)}</td><td>{b.slot}</td><td>{inr(b.price)}</td><td><StatusBadge value={b.status} /></td>
            <td style={{ minWidth: 140 }}>{NEXT[b.status].length ? <Form.Select size="sm" aria-label="Update booking status" value="" onChange={(e) => move(b, e.target.value)}><option value="">Change…</option>{NEXT[b.status].map((s) => <option key={s} value={s}>{cap(s)}</option>)}</Form.Select> : <span className="text-muted small">Final</span>}</td></tr>))}</tbody>
      </Table></div>}
      <Pager meta={meta} onPage={setPage} />
    </>
  );
}
