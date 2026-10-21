import { useState } from 'react';
import { Badge, Button, Card, Col, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaTools } from 'react-icons/fa';
import FormModal from '../components/FormModal';
import { DemoBadge, Disclaimer, EmptyState, ErrorBox, Loading, PageHeader } from '../components/ui';
import { useT } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import api from '../services/api';
import { cap, inr, today } from '../utils/format';
import { farmOptions } from '../utils/options';

export default function Services() {
  const { t } = useT();
  const toast = useToast();
  const nav = useNavigate();
  const { data, loading, error, reload } = useFetch('/services');
  const farms = useFetch('/farms', { limit: 50 });
  const [booking, setBooking] = useState(null);

  const fields = booking ? [
    { name: 'date', label: 'Date', type: 'date', required: true, min: today() },
    { name: 'slot', label: 'Time slot', type: 'select', required: true, options: booking.slots.map((s) => ({ value: s, label: s })) },
    { name: 'farm', label: 'Farm (optional)', type: 'select', options: farmOptions(farms.data) },
    { name: 'notes', label: 'Notes for the provider', type: 'textarea', max: 500 },
  ] : [];
  const save = async (payload) => { await api.post('/bookings', { ...payload, service: booking._id }); toast('Booking requested'); setBooking(null); nav('/bookings'); };

  return (
    <>
      <PageHeader title={t('services.title')} subtitle="Rent equipment or request an expert consultation. Bookings start as “pending” until an administrator confirms them." />
      {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
      {data?.length === 0 && <EmptyState icon={FaTools} title="No services available" text="The administrator has not published any services yet." />}
      <Row className="g-3">{data?.map((s) => (
        <Col md={6} lg={4} key={s._id}><Card className="h-100"><Card.Body className="d-flex flex-column">
          <div className="d-flex justify-content-between"><Badge bg="light" text="dark" className="border">{cap(s.category)}</Badge>{s.isDemo && <DemoBadge />}</div>
          <h2 className="h5 mt-2">{s.name}</h2><p className="text-muted">{s.description}</p>
          <p className="small mb-2">Slots: {s.slots.join(', ')}</p>
          <div className="mt-auto d-flex justify-content-between align-items-center"><span className="fw-bold fs-5">{inr(s.price)} <span className="small fw-normal text-muted">{s.priceUnit}</span></span><Button onClick={() => setBooking(s)}>Book</Button></div>
        </Card.Body></Card></Col>))}</Row>
      <Disclaimer>Availability model: each date and time slot accepts a limited number of active bookings per service. Payment is not collected in this demo.</Disclaimer>
      {booking && <FormModal show size="md" title={`Book: ${booking.name}`} fields={fields} initial={{ slot: booking.slots[0] }} submitLabel="Request booking" onSubmit={save} onClose={() => setBooking(null)} />}
    </>
  );
}
