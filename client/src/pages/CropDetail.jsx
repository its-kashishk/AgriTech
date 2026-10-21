import { useState } from 'react';
import { Button, Card, Col, Row } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConfirmModal, ErrorBox, Loading, PageHeader, StatusBadge } from '../components/ui';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import api, { errMsg } from '../services/api';
import { cap, daysUntil, fmtDate } from '../utils/format';
import { STAGES } from '../utils/options';

export default function CropDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { data: crop, loading, error, reload } = useFetch(`/crops/${id}`);
  const acts = useFetch('/activities', { crop: id, limit: 10 });
  const [confirm, setConfirm] = useState(false);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const total = new Date(crop.expectedHarvestDate) - new Date(crop.sowingDate);
  const elapsed = Math.min(Math.max(Date.now() - new Date(crop.sowingDate), 0), total);
  const pct = crop.status === 'harvested' ? 100 : Math.round((elapsed / total) * 100);
  const left = daysUntil(crop.expectedHarvestDate);
  const stageIdx = STAGES.indexOf(crop.stage);

  const setStage = async (stage) => {
    try { await api.put(`/crops/${id}`, { stage, ...(stage === 'harvested' ? { status: 'harvested' } : {}) }); toast('Growth stage updated'); reload(); } catch (e) { toast(errMsg(e), 'danger'); }
  };
  const remove = async () => {
    try { await api.delete(`/crops/${id}`); toast('Crop deleted'); nav('/crops'); } catch (e) { toast(errMsg(e), 'danger'); }
  };

  return (
    <>
      <PageHeader title={crop.name} subtitle={`${crop.farm?.name || ''}${crop.variety ? ` · ${crop.variety}` : ''}${crop.plot ? ` · ${crop.plot}` : ''}`}
        actions={<><Link to="/crops" className="btn btn-outline-secondary">Back</Link><Link className="btn btn-outline-primary" to={`/crop-info?q=${encodeURIComponent(crop.name)}`}>Crop guide</Link><Button variant="outline-danger" onClick={() => setConfirm(true)}>Delete</Button></>} />
      <Row className="g-3">
        <Col lg={8}>
          <Card className="mb-3"><Card.Body>
            <div className="d-flex justify-content-between mb-2"><h2 className="h5 mb-0">Season progress</h2><StatusBadge value={crop.status} /></div>
            <div className="progress-track mb-2" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100" aria-label="Season progress"><span style={{ width: `${pct}%` }} /></div>
            <div className="d-flex justify-content-between small text-muted"><span>Sown {fmtDate(crop.sowingDate)}</span><span>{crop.status === 'active' ? (left >= 0 ? `${left} day(s) to expected harvest` : `${-left} day(s) past expected harvest`) : cap(crop.status)}</span><span>Harvest {fmtDate(crop.expectedHarvestDate)}</span></div>
          </Card.Body></Card>
          <Card className="mb-3"><Card.Body>
            <h2 className="h5">Growth stage</h2>
            <div className="d-flex flex-wrap gap-2" role="group" aria-label="Set growth stage">
              {STAGES.map((s, i) => <Button key={s} size="sm" variant={s === crop.stage ? 'primary' : i < stageIdx ? 'outline-primary' : 'outline-secondary'} aria-pressed={s === crop.stage} onClick={() => s !== crop.stage && setStage(s)}>{cap(s)}</Button>)}
            </div>
            <p className="small text-muted mt-2 mb-0">Tap a stage to update it. Choosing “Harvested” also marks the crop as harvested.</p>
          </Card.Body></Card>
          <Card><Card.Body>
            <h2 className="h5">Health notes</h2>
            <p className="mb-0 post-body">{crop.healthNotes || <span className="text-muted">No notes yet. Use Edit on the crops page to add observations.</span>}</p>
          </Card.Body></Card>
        </Col>
        <Col lg={4}>
          <Card><Card.Body>
            <h2 className="h5">Recent activities</h2>
            {acts.loading ? <Loading /> : acts.data?.length ? <ul className="list-unstyled mb-2">{acts.data.map((a) => <li key={a._id} className="py-1 border-bottom">{cap(a.type)}<div className="small text-muted">{fmtDate(a.date)}{a.notes ? ` · ${a.notes}` : ''}</div></li>)}</ul> : <p className="text-muted">No activities linked to this crop.</p>}
            <Link to="/activities">Log an activity →</Link>
          </Card.Body></Card>
        </Col>
      </Row>
      <ConfirmModal show={confirm} body={<>Delete crop <strong>{crop.name}</strong>?</>} onConfirm={remove} onCancel={() => setConfirm(false)} />
    </>
  );
}
