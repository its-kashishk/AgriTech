import { useState } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import FormModal, { toInitial } from '../../components/FormModal';
import { ConfirmModal, DemoBadge, ErrorBox, Loading, PageHeader, Pager } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../hooks/useFetch';
import api, { errMsg } from '../../services/api';
import { cap, inr } from '../../utils/format';
import { PRODUCT_CATEGORIES } from '../../utils/options';

const FIELDS = [
  { name: 'name', label: 'Product name', required: true, col: 12 },
  { name: 'category', label: 'Category', type: 'select', required: true, options: PRODUCT_CATEGORIES },
  { name: 'unit', label: 'Unit', placeholder: 'bag, kg, piece…' },
  { name: 'price', label: 'Price (₹)', type: 'number', step: '0.01', min: 0, required: true },
  { name: 'stock', label: 'Stock (whole number)', type: 'number', step: '1', min: 0, required: true },
  { name: 'imageUrl', label: 'Image URL (optional)', col: 12 },
  { name: 'description', label: 'Description', type: 'textarea', max: 800, clearable: true },
  { name: 'active', label: 'Visible in the shop', type: 'checkbox' },
];

export default function AdminProducts() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch('/products', { all: true, page, limit: 20 });
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);

  const save = async (payload) => {
    if (editing._id) await api.put(`/products/${editing._id}`, payload); else await api.post('/products', payload);
    toast('Product saved'); setEditing(null); reload();
  };
  const quickStock = async (p, stock) => { try { await api.put(`/products/${p._id}`, { stock }); toast('Stock updated'); reload(); } catch (e) { toast(errMsg(e), 'danger'); } };
  const remove = async () => { try { await api.delete(`/products/${removing._id}`); toast('Product hidden from shop'); } catch (e) { toast(errMsg(e), 'danger'); } setRemoving(null); reload(); };

  return (
    <>
      <PageHeader title="Products & inventory" subtitle="Add products, adjust stock and prices. Removing hides a product but keeps order history." actions={<Button onClick={() => setEditing({ active: true, unit: 'unit', stock: 0 })}><FaPlus className="me-1" aria-hidden="true" />Add product</Button>} />
      {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
      {data && <div className="table-responsive card"><Table hover className="mb-0 align-middle">
        <thead><tr><th>Name</th><th>Category</th><th>Price</th><th style={{ width: 130 }}>Stock</th><th>Status</th><th /></tr></thead>
        <tbody>{data.map((p) => (
          <tr key={p._id}><td>{p.name} {p.isDemo && <DemoBadge />}</td><td>{cap(p.category)}</td><td>{inr(p.price)} / {p.unit}</td>
            <td><Form.Control size="sm" type="number" min={0} step={1} aria-label={`Stock for ${p.name}`} defaultValue={p.stock} key={p.stock} onBlur={(e) => { const v = parseInt(e.target.value, 10); if (!Number.isNaN(v) && v !== p.stock) quickStock(p, v); }} /></td>
            <td>{p.active ? 'Visible' : <span className="text-muted">Hidden</span>}</td>
            <td className="text-end text-nowrap"><Button size="sm" variant="outline-secondary" className="me-1" onClick={() => setEditing(p)}>Edit</Button>{p.active && <Button size="sm" variant="outline-danger" onClick={() => setRemoving(p)}>Remove</Button>}</td></tr>))}</tbody>
      </Table></div>}
      <Pager meta={meta} onPage={setPage} />
      {editing && <FormModal show title={editing._id ? 'Edit product' : 'Add product'} fields={FIELDS} initial={toInitial(editing, FIELDS)} onSubmit={save} onClose={() => setEditing(null)} />}
      <ConfirmModal show={!!removing} title="Remove product?" body={<>Hide <strong>{removing?.name}</strong> from the shop? Past orders keep their record.</>} confirmLabel="Remove" onConfirm={remove} onCancel={() => setRemoving(null)} />
    </>
  );
}
