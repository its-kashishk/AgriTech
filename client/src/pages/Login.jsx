import { useState } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LanguageContext';
import { errMsg } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const { t } = useT();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const u = await login(form);
      nav(loc.state?.from || (u.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <div className="auth-wrap">
      <Card className="auth-card"><Card.Body className="p-4">
        <h1 className="h3 mb-3">{t('auth.loginTitle')}</h1>
        {error && <Alert variant="danger" role="alert">{error}</Alert>}
        <Form onSubmit={submit}>
          <Form.Group className="mb-3" controlId="email"><Form.Label>{t('auth.email')}</Form.Label>
            <Form.Control type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Form.Group>
          <Form.Group className="mb-3" controlId="password"><Form.Label>{t('auth.password')}</Form.Label>
            <Form.Control type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Form.Group>
          <Button type="submit" className="w-100" disabled={busy}>{busy ? t('common.loading') : t('nav.login')}</Button>
        </Form>
        <p className="text-center text-muted mt-3 mb-0">{t('auth.noAccount')} <Link to="/register">{t('nav.register')}</Link></p>
      </Card.Body></Card>
    </div>
  );
}
