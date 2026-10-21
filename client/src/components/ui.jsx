import { Alert, Badge, Button, Modal, Pagination as BsPagination, Spinner } from 'react-bootstrap';
import { cap } from '../utils/format';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div>
        <h1 className="h3 mb-1">{title}</h1>
        {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
      </div>
      {actions && <div className="d-flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="text-center text-muted py-5" role="status" aria-live="polite">
      <Spinner animation="border" size="sm" className="me-2" />{label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null;
  return (
    <Alert variant="danger" className="d-flex justify-content-between align-items-center" role="alert">
      <span>{message}</span>
      {onRetry && <Button size="sm" variant="outline-danger" onClick={onRetry}>Try again</Button>}
    </Alert>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state text-center p-4 p-md-5">
      {Icon && <Icon size={36} className="mb-3" aria-hidden="true" />}
      <h2 className="h5">{title}</h2>
      {text && <p className="text-muted mb-3">{text}</p>}
      {action}
    </div>
  );
}

const STATUS_COLORS = {
  pending: 'warning', confirmed: 'info', shipped: 'primary', delivered: 'success', completed: 'success', cancelled: 'secondary', rejected: 'danger',
  active: 'success', harvested: 'secondary', failed: 'danger', info: 'info', warning: 'warning', critical: 'danger', admin: 'dark', farmer: 'success',
};
export const StatusBadge = ({ value }) => <Badge bg={STATUS_COLORS[value] || 'secondary'} className={value === 'warning' || value === 'pending' ? 'text-dark' : ''}>{cap(value)}</Badge>;

export const DemoBadge = () => <Badge bg="warning" text="dark" title="Seeded sample data for the capstone demo">Demo</Badge>;

export function ConfirmModal({ show, title = 'Are you sure?', body, confirmLabel = 'Delete', variant = 'danger', onConfirm, onCancel, busy }) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton><Modal.Title as="h2" className="h5">{title}</Modal.Title></Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</Button>
      </Modal.Footer>
    </Modal>
  );
}

export function Pager({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <BsPagination className="justify-content-center mt-3">
      <BsPagination.Prev disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} />
      <BsPagination.Item active>{meta.page} / {meta.pages}</BsPagination.Item>
      <BsPagination.Next disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)} />
    </BsPagination>
  );
}

export const Disclaimer = ({ children }) => <p className="small text-muted fst-italic mt-3 mb-0">{children}</p>;
