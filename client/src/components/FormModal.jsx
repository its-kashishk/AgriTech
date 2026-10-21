import { useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { errMsg } from '../services/api';

/*
 * Generic form dialog. `fields` describe the inputs:
 *  { name, label, type: text|number|date|select|textarea|checkbox|list, options:[{value,label}], required, step, min, max, help, col }
 * Names like "coordinates.lat" become nested objects. `onSubmit(payload)` must return a promise.
 * Server-side validation messages are shown at the top of the dialog.
 */
function build(fields, values) {
  const out = {};
  for (const f of fields) {
    let v = values[f.name];
    if (f.type === 'checkbox') v = !!v;
    else if (f.type === 'list') v = String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (v === '' || v === undefined || v === null) { if (f.type === 'text' || f.type === 'textarea') v = f.clearable ? '' : undefined; else v = undefined; }
    if (v === undefined) continue;
    if (f.type === 'list' && v.length === 0) continue;
    const parts = f.name.split('.');
    let o = out;
    parts.slice(0, -1).forEach((p) => { o = o[p] ||= {}; });
    o[parts[parts.length - 1]] = v;
  }
  // coordinates need both values or none
  if (out.coordinates && (out.coordinates.lat === undefined || out.coordinates.lon === undefined)) delete out.coordinates;
  return out;
}

export default function FormModal({ show, title, fields, initial = {}, submitLabel = 'Save', onSubmit, onClose, size = 'lg' }) {
  const [values, setValues] = useState(() => ({ ...initial }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (name, v) => setValues((cur) => ({ ...cur, [name]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await onSubmit(build(fields, values)); } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <Modal show={show} onHide={onClose} size={size} centered backdrop="static" scrollable>
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title as="h2" className="h5">{title}</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" role="alert">{error}</Alert>}
          <Row className="g-3">
            {fields.map((f) => {
              const id = `f-${f.name}`;
              const val = values[f.name] ?? '';
              return (
                <Col key={f.name} md={f.col || (f.type === 'textarea' ? 12 : 6)}>
                  {f.type === 'checkbox' ? (
                    <Form.Check id={id} type="switch" label={f.label} checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} />
                  ) : (
                    <Form.Group controlId={id}>
                      <Form.Label>{f.label}{f.required && <span className="text-danger" aria-hidden="true"> *</span>}</Form.Label>
                      {f.type === 'select' ? (
                        <Form.Select value={val} required={f.required} onChange={(e) => set(f.name, e.target.value)}>
                          {!f.required && <option value="">— select —</option>}
                          {f.required && val === '' && <option value="">— select —</option>}
                          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </Form.Select>
                      ) : f.type === 'textarea' ? (
                        <Form.Control as="textarea" rows={3} value={val} required={f.required} maxLength={f.max} onChange={(e) => set(f.name, e.target.value)} />
                      ) : (
                        <Form.Control
                          type={f.type === 'list' ? 'text' : f.type || 'text'} value={val} required={f.required} step={f.step}
                          min={f.min} max={f.max} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)}
                        />
                      )}
                      {f.help && <Form.Text muted>{f.help}</Form.Text>}
                    </Form.Group>
                  )}
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : submitLabel}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// Helper to prefill a form from an API record (dates -> yyyy-mm-dd, nested coordinates, arrays -> comma text).
export function toInitial(record, fields) {
  const out = {};
  for (const f of fields) {
    let v = f.name.split('.').reduce((o, k) => (o ? o[k] : undefined), record);
    if (f.type === 'date' && v) v = new Date(v).toISOString().slice(0, 10);
    if (f.type === 'list' && Array.isArray(v)) v = v.join(', ');
    if (f.type === 'select' && v && typeof v === 'object') v = v._id;
    if (v !== undefined && v !== null) out[f.name] = v;
  }
  return out;
}
