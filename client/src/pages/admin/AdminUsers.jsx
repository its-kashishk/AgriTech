import { useState } from 'react';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import { ErrorBox, Loading, PageHeader, Pager, StatusBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../hooks/useFetch';
import api, { errMsg } from '../../services/api';
import { fmtDate } from '../../utils/format';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState(''); const [role, setRole] = useState(''); const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch('/admin/users', { q: q || undefined, role: role || undefined, page, limit: 15 });
  const update = async (u, body) => { try { await api.put(`/admin/users/${u._id}`, body); toast('User updated'); reload(); } catch (e) { toast(errMsg(e), 'danger'); } };
  return (
    <>
      <PageHeader title="Users" subtitle="Disable accounts or change roles. Disabled users cannot log in." />
      <Row className="g-2 mb-3"><Col md={5}><Form.Control type="search" aria-label="Search users" placeholder="Search name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></Col>
        <Col md={3}><Form.Select aria-label="Role" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}><option value="">All roles</option><option value="farmer">Farmers</option><option value="admin">Admins</option></Form.Select></Col></Row>
      {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
      {data && <div className="table-responsive card"><Table hover className="mb-0 align-middle">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th /></tr></thead>
        <tbody>{data.map((u) => (
          <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td><StatusBadge value={u.role} /></td><td>{fmtDate(u.createdAt)}</td><td>{u.active ? 'Active' : <span className="text-danger">Disabled</span>}</td>
            <td className="text-end text-nowrap">{u._id !== me._id && <>
              <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => update(u, { role: u.role === 'admin' ? 'farmer' : 'admin' })}>Make {u.role === 'admin' ? 'farmer' : 'admin'}</Button>
              <Button size="sm" variant={u.active ? 'outline-danger' : 'outline-success'} onClick={() => update(u, { active: !u.active })}>{u.active ? 'Disable' : 'Enable'}</Button></>}</td></tr>))}</tbody>
      </Table></div>}
      <Pager meta={meta} onPage={setPage} />
    </>
  );
}
