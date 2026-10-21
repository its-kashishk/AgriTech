import { useState } from 'react';
import { Form, Table } from 'react-bootstrap';
import { ErrorBox, Loading, PageHeader, Pager, StatusBadge } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../hooks/useFetch';
import api, { errMsg } from '../../services/api';
import { cap, fmtDateTime, inr } from '../../utils/format';

const NEXT = { pending: ['confirmed', 'cancelled'], confirmed: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };

export default function AdminOrders() {
  const toast = useToast();
  const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch('/orders/admin/all', { status: status || undefined, page, limit: 15 });
  const move = async (o, next) => { if (!next) return; try { await api.put(`/orders/${o._id}/status`, { status: next }); toast(`Order marked ${next}`); } catch (e) { toast(errMsg(e), 'danger'); } reload(); };
  return (
    <>
      <PageHeader title="Orders" subtitle="Move orders through pending → confirmed → shipped → delivered. Cancelling returns stock." />
      <Form.Select className="mb-3" style={{ maxWidth: 240 }} aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
        <option value="">All statuses</option>{Object.keys(NEXT).map((s) => <option key={s} value={s}>{cap(s)}</option>)}</Form.Select>
      {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
      {data?.length === 0 && <p className="text-muted">No orders found.</p>}
      {data?.length > 0 && <div className="table-responsive card"><Table hover className="mb-0 align-middle">
        <thead><tr><th>Order</th><th>Farmer</th><th>Items</th><th>Total</th><th>Placed</th><th>Status</th><th>Update</th></tr></thead>
        <tbody>{data.map((o) => (
          <tr key={o._id}><td>#{o._id.slice(-6).toUpperCase()}</td><td>{o.user?.name}<div className="small text-muted">{o.user?.email}</div></td><td>{o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}</td><td>{inr(o.total)}</td><td>{fmtDateTime(o.createdAt)}</td><td><StatusBadge value={o.status} /></td>
            <td style={{ minWidth: 140 }}>{NEXT[o.status].length ? <Form.Select size="sm" aria-label={`Update status of order ${o._id.slice(-6)}`} value="" onChange={(e) => move(o, e.target.value)}><option value="">Change…</option>{NEXT[o.status].map((s) => <option key={s} value={s}>{cap(s)}</option>)}</Form.Select> : <span className="text-muted small">Final</span>}</td></tr>))}</tbody>
      </Table></div>}
      <Pager meta={meta} onPage={setPage} />
    </>
  );
}
