import { useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBoxOpen } from 'react-icons/fa';
import { ConfirmModal, EmptyState, ErrorBox, Loading, PageHeader, Pager, StatusBadge } from '../components/ui';
import { useT } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import api, { errMsg } from '../services/api';
import { fmtDateTime, inr } from '../utils/format';

const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function Orders() {
  const { t } = useT();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch('/orders', { page, limit: 10 });
  const [cancelling, setCancelling] = useState(null);
  const cancel = async () => { try { await api.put(`/orders/${cancelling._id}/cancel`); toast('Order cancelled'); setCancelling(null); reload(); } catch (e) { toast(errMsg(e), 'danger'); setCancelling(null); } };

  return (
    <>
      <PageHeader title={t('orders.title')} subtitle="Track the status of your demo orders." />
      {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
      {data?.length === 0 && <EmptyState icon={FaBoxOpen} title="No orders yet" action={<Link to="/marketplace" className="btn btn-primary">Go shopping</Link>} />}
      {data?.map((o) => (
        <Card key={o._id} className="mb-3"><Card.Body>
          <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
            <div><strong>Order #{o._id.slice(-6).toUpperCase()}</strong><div className="small text-muted">{fmtDateTime(o.createdAt)} · demo payment (simulated)</div></div>
            <div className="text-end"><StatusBadge value={o.status} /><div className="fw-bold">{inr(o.total)}</div></div>
          </div>
          {o.status !== 'cancelled' && (
            <ol className="list-inline small mb-2" aria-label="Order progress">{STEPS.map((s) => <li key={s} className={`list-inline-item ${STEPS.indexOf(s) <= STEPS.indexOf(o.status) ? 'fw-semibold text-success' : 'text-muted'}`}>{STEPS.indexOf(s) <= STEPS.indexOf(o.status) ? '●' : '○'} {s}</li>)}</ol>)}
          <ul className="mb-2 ps-3">{o.items.map((i) => <li key={i.product}>{i.name} × {i.quantity} — {inr(i.lineTotal)}</li>)}</ul>
          <div className="small text-muted">Deliver to: {o.shippingAddress}</div>
          {o.status === 'pending' && <Button size="sm" variant="outline-danger" className="mt-2" onClick={() => setCancelling(o)}>Cancel order</Button>}
        </Card.Body></Card>))}
      <Pager meta={meta} onPage={setPage} />
      <ConfirmModal show={!!cancelling} title="Cancel this order?" body="Items will be returned to stock." confirmLabel="Cancel order" onConfirm={cancel} onCancel={() => setCancelling(null)} />
    </>
  );
}
