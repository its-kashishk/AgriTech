import { Alert as BsAlert, Button, Card } from 'react-bootstrap';
import { FaBell } from 'react-icons/fa';
import { Disclaimer, EmptyState, ErrorBox, Loading, PageHeader, StatusBadge } from '../components/ui';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import api, { errMsg } from '../services/api';
import { cap, fmtDateTime } from '../utils/format';

export default function Alerts() {
  const toast = useToast();
  const { data, meta, loading, error, reload } = useFetch('/alerts');
  const read = async (id) => { try { await api.put(`/alerts/${id}/read`); reload(); } catch (e) { toast(errMsg(e), 'danger'); } };
  return (
    <>
      <PageHeader title="Alerts & Advisories" subtitle="Reminders created by simple, published rules from your own records, plus notices from the administrator." />
      <BsAlert variant="light" className="border small">Rule-based alerts are <strong>not AI predictions</strong>. Examples: warm humid weather (≥80% humidity, 15–30 °C) can favour fungal diseases; harvest due within 7 days; soil pH below 5.5 or above 8; moisture below 20%. Weather alerts appear after you check the weather for one of your farms.</BsAlert>
      {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
      {data?.length === 0 && <EmptyState icon={FaBell} title="No alerts right now" text="Add crops and soil records, then check the weather for a farm to receive reminders." />}
      {data?.map((a) => (
        <Card key={a._id} className={`mb-2 ${a.read ? 'opacity-75' : ''}`}><Card.Body className="d-flex justify-content-between gap-3">
          <div>
            <div className="d-flex flex-wrap gap-2 align-items-center mb-1"><StatusBadge value={a.severity} /><strong>{a.title}</strong></div>
            <div>{a.message}</div>
            <div className="small text-muted mt-1">{cap(a.type)} · {a.source === 'admin' ? 'From administrator' : `Rule ${a.rule}`} · {fmtDateTime(a.createdAt)}</div>
          </div>
          {a.user && !a.read && <Button size="sm" variant="outline-secondary" className="align-self-start text-nowrap" onClick={() => read(a._id)}>Mark read</Button>}
        </Card.Body></Card>))}
      <Disclaimer>{meta?.note} Always confirm with your local agriculture officer.</Disclaimer>
    </>
  );
}
