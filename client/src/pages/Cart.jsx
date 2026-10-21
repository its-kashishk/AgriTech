import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaTrash } from 'react-icons/fa';
import { EmptyState, PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useT } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import api, { errMsg } from '../services/api';
import { inr } from '../utils/format';

export default function Cart() {
  const { t } = useT();
  const cart = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [address, setAddress] = useState(user.location || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const place = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api.post('/orders', { items: cart.items.map((i) => ({ product: i._id, quantity: i.quantity })), shippingAddress: address, paymentMethod: 'demo' });
      cart.clear(); toast('Demo order placed!'); nav('/orders');
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  if (cart.items.length === 0) return (<><PageHeader title={t('cart.title')} /><EmptyState icon={FaShoppingCart} title="Your cart is empty" action={<Link to="/marketplace" className="btn btn-primary">Browse the marketplace</Link>} /></>);
  return (
    <>
      <PageHeader title={t('cart.title')} />
      <Row className="g-3">
        <Col lg={8}><div className="table-responsive card"><Table className="mb-0 align-middle">
          <thead><tr><th>Product</th><th>Price</th><th style={{ width: 110 }}>Qty</th><th className="text-end">Subtotal</th><th /></tr></thead>
          <tbody>{cart.items.map((i) => (
            <tr key={i._id}><td>{i.name}</td><td>{inr(i.price)}</td>
              <td><Form.Control size="sm" type="number" min={1} max={i.stock} aria-label={`Quantity for ${i.name}`} value={i.quantity} onChange={(e) => cart.setQty(i._id, parseInt(e.target.value, 10) || 1)} /></td>
              <td className="text-end">{inr(i.price * i.quantity)}</td>
              <td className="text-end"><Button size="sm" variant="outline-danger" onClick={() => cart.remove(i._id)} aria-label={`Remove ${i.name}`}><FaTrash aria-hidden="true" /></Button></td></tr>))}</tbody>
        </Table></div></Col>
        <Col lg={4}><Card><Card.Body>
          <h2 className="h5">Order summary</h2>
          <div className="d-flex justify-content-between fs-5 mb-3"><span>Total</span><strong>{inr(cart.total)}</strong></div>
          <p className="small text-muted">Final prices and stock are confirmed by the server when you place the order.</p>
          <Alert variant="warning" className="small py-2">{t('demo.payment')}</Alert>
          {error && <Alert variant="danger" role="alert">{error}</Alert>}
          <Form onSubmit={place}>
            <Form.Group className="mb-3" controlId="addr"><Form.Label>Delivery address</Form.Label><Form.Control as="textarea" rows={3} required minLength={5} maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)} /></Form.Group>
            <Button type="submit" className="w-100" disabled={busy}>{busy ? t('common.loading') : t('cart.checkout')}</Button>
          </Form>
        </Card.Body></Card></Col>
      </Row>
    </>
  );
}
