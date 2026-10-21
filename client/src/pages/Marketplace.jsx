import { useState } from 'react';
import { Badge, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCartPlus, FaLeaf, FaShoppingBasket } from 'react-icons/fa';
import { DemoBadge, EmptyState, ErrorBox, Loading, PageHeader, Pager } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useT } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import { cap, inr } from '../utils/format';
import { PRODUCT_CATEGORIES } from '../utils/options';

export default function Marketplace() {
  const { t } = useT();
  const cart = useCart();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [inStock, setInStock] = useState(false);
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch('/products', { q: q || undefined, category: category || undefined, inStock: inStock || undefined, page, limit: 12 });

  const add = (p) => {
    const inCart = cart.items.find((i) => i._id === p._id)?.quantity || 0;
    if (inCart >= p.stock) return toast('You already have all available stock in your cart', 'warning');
    cart.add(p); toast(`${p.name} added to cart`);
  };

  return (
    <>
      <PageHeader title={t('market.title')} subtitle="Seeds, fertilisers, crop-protection products and tools." actions={<Link to="/cart" className="btn btn-outline-primary">{t('nav.cart')} ({cart.count})</Link>} />
      <Row className="g-2 mb-3 align-items-center">
        <Col md={5}><Form.Control type="search" aria-label="Search products" placeholder={`${t('common.search')}…`} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></Col>
        <Col md={3}><Form.Select aria-label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}><option value="">All categories</option>{PRODUCT_CATEGORIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Form.Select></Col>
        <Col md={4}><Form.Check type="switch" id="instock" label="In stock only" checked={inStock} onChange={(e) => { setInStock(e.target.checked); setPage(1); }} /></Col>
      </Row>
      {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
      {data?.length === 0 && <EmptyState icon={FaShoppingBasket} title="No products found" text="Try a different search or category. If the shop is empty, the administrator has not added products yet." />}
      <Row className="g-3">{data?.map((p) => (
        <Col sm={6} lg={4} xl={3} key={p._id}><Card className="h-100 product-card">
          <div className="product-thumb">{p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" /> : <FaLeaf size={36} aria-hidden="true" />}</div>
          <Card.Body className="d-flex flex-column">
            <div className="d-flex justify-content-between gap-2"><Badge bg="light" text="dark" className="border align-self-start">{cap(p.category)}</Badge>{p.isDemo && <DemoBadge />}</div>
            <h2 className="h6 mt-2">{p.name}</h2>
            {p.description && <p className="small text-muted">{p.description}</p>}
            <div className="mt-auto"><div className="fw-bold fs-5">{inr(p.price)} <span className="small text-muted fw-normal">/ {p.unit}</span></div>
              <div className={`small mb-2 ${p.stock === 0 ? 'text-danger' : p.stock <= 10 ? 'text-warning-emphasis' : 'text-muted'}`}>{p.stock === 0 ? 'Out of stock' : p.stock <= 10 ? `Only ${p.stock} left` : `${p.stock} in stock`}</div>
              <Button size="sm" className="w-100" disabled={p.stock === 0} onClick={() => add(p)}><FaCartPlus aria-hidden="true" /> {t('market.addToCart')}</Button></div>
          </Card.Body></Card></Col>))}</Row>
      <Pager meta={meta} onPage={setPage} />
    </>
  );
}
