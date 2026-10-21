import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import api, { errMsg } from '../services/api';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { t, setLang } = useT();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', location: user.location || '', language: user.language || 'en' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [err, setErr] = useState(''); const [perr, setPerr] = useState('');

  const save = async (e) => {
    e.preventDefault(); setErr('');
    try { const r = await api.put('/users/me', form); setUser(r.data.data); setLang(form.language); toast('Profile updated'); } catch (x) { setErr(errMsg(x)); }
  };
  const changePw = async (e) => {
    e.preventDefault(); setPerr('');
    try { await api.put('/users/me/password', pw); setPw({ currentPassword: '', newPassword: '' }); toast('Password changed'); } catch (x) { setPerr(errMsg(x)); }
  };
  return (
    <>
      <PageHeader title={t('profile.title')} subtitle={`${user.email} · ${user.role}`} />
      <Row className="g-3">
        <Col lg={6}><Card><Card.Body>
          <h2 className="h5">Details</h2>{err && <Alert variant="danger">{err}</Alert>}
          <Form onSubmit={save}>
            <Form.Group className="mb-3" controlId="pname"><Form.Label>{t('auth.name')}</Form.Label><Form.Control required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3" controlId="pphone"><Form.Label>{t('auth.phone')}</Form.Label><Form.Control type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3" controlId="ploc"><Form.Label>{t('auth.location')}</Form.Label><Form.Control value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3" controlId="plang"><Form.Label>{t('common.language')}</Form.Label><Form.Select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}><option value="en">English</option><option value="hi">हिन्दी</option></Form.Select></Form.Group>
            <Button type="submit">{t('common.save')}</Button>
          </Form>
        </Card.Body></Card></Col>
        <Col lg={6}><Card><Card.Body>
          <h2 className="h5">Change password</h2>{perr && <Alert variant="danger">{perr}</Alert>}
          <Form onSubmit={changePw}>
            <Form.Group className="mb-3" controlId="cpw"><Form.Label>Current password</Form.Label><Form.Control type="password" autoComplete="current-password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3" controlId="npw"><Form.Label>New password</Form.Label><Form.Control type="password" autoComplete="new-password" required minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /><Form.Text muted>At least 8 characters with a letter and a number.</Form.Text></Form.Group>
            <Button type="submit" variant="outline-primary">Update password</Button>
          </Form>
        </Card.Body></Card></Col>
      </Row>
    </>
  );
}
