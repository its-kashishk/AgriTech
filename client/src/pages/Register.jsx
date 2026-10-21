import { useState } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LanguageContext';
import { errMsg } from '../services/api';

export default function Register() {
  const { register } = useAuth();
  const { t, lang } = useT();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', location: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    const body = { name: form.name, email: form.email, password: form.password, language: lang };
    if (form.phone.trim()) body.phone = form.phone.trim();
    if (form.location.trim()) body.location = form.location.trim();
    try { await register(body); nav('/dashboard', { replace: true }); } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <div className="auth-wrap">
      <Card className="auth-card"><Card.Body className="p-4">
        <h1 className="h3 mb-3">{t('auth.registerTitle')}</h1>
        {error && <Alert variant="danger" role="alert">{error}</Alert>}
        <Form onSubmit={submit}>
          <Form.Group className="mb-3" controlId="name"><Form.Label>{t('auth.name')}</Form.Label><Form.Control required minLength={2} autoComplete="name" value={form.name} onChange={set('name')} /></Form.Group>
          <Form.Group className="mb-3" controlId="email"><Form.Label>{t('auth.email')}</Form.Label><Form.Control type="email" required autoComplete="email" value={form.email} onChange={set('email')} /></Form.Group>
          <Form.Group className="mb-3" controlId="password"><Form.Label>{t('auth.password')}</Form.Label>
            <Form.Control type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} aria-describedby="pwhelp" />
            <Form.Text id="pwhelp" muted>At least 8 characters with a letter and a number.</Form.Text></Form.Group>
          <Form.Group className="mb-3" controlId="phone"><Form.Label>{t('auth.phone')}</Form.Label><Form.Control type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} /></Form.Group>
          <Form.Group className="mb-3" controlId="location"><Form.Label>{t('auth.location')}</Form.Label><Form.Control value={form.location} onChange={set('location')} /></Form.Group>
          <Button type="submit" className="w-100" disabled={busy}>{busy ? t('common.loading') : t('nav.register')}</Button>
        </Form>
        <p className="text-center text-muted mt-3 mb-0">{t('auth.haveAccount')} <Link to="/login">{t('nav.login')}</Link></p>
      </Card.Body></Card>
    </div>
  );
}
