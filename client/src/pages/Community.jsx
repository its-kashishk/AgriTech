import { useState } from 'react';
import { Badge, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaComments, FaPlus } from 'react-icons/fa';
import FormModal from '../components/FormModal';
import { EmptyState, ErrorBox, Loading, PageHeader, Pager } from '../components/ui';
import { useT } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import api from '../services/api';
import { cap, fmtDate } from '../utils/format';

export const POST_CATEGORIES = ['question', 'tip', 'discussion', 'pest-disease'].map((v) => ({ value: v, label: cap(v) }));
export const postFields = [
  { name: 'title', label: 'Title', required: true, col: 12 },
  { name: 'category', label: 'Category', type: 'select', required: true, options: POST_CATEGORIES },
  { name: 'tags', label: 'Tags (comma separated, max 5)', type: 'list', placeholder: 'tomato, blight' },
  { name: 'body', label: 'Your post', type: 'textarea', required: true, max: 3000 },
];

export default function Community() {
  const { t } = useT();
  const toast = useToast();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const { data, meta, loading, error, reload } = useFetch('/community', { q: q || undefined, category: category || undefined, page, limit: 10 });
  const create = async (payload) => { const r = await api.post('/community', payload); toast('Post published'); setCreating(false); nav(`/community/${r.data.data._id}`); };

  return (
    <>
      <PageHeader title={t('community.title')} subtitle="Ask questions and share experience with other farmers. Please be respectful — administrators can remove inappropriate posts." actions={<Button onClick={() => setCreating(true)}><FaPlus className="me-1" aria-hidden="true" />New post</Button>} />
      <Row className="g-2 mb-3">
        <Col md={6}><Form.Control type="search" aria-label="Search posts by title" placeholder={`${t('common.search')}…`} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></Col>
        <Col md={3}><Form.Select aria-label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}><option value="">All categories</option>{POST_CATEGORIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Form.Select></Col>
      </Row>
      {loading && <Loading />}<ErrorBox message={error} onRetry={reload} />
      {data?.length === 0 && <EmptyState icon={FaComments} title="No posts yet" text="Start the conversation." action={<Button onClick={() => setCreating(true)}>New post</Button>} />}
      {data?.map((p) => (
        <Card key={p._id} className="mb-2"><Card.Body>
          <div className="d-flex flex-wrap gap-2 align-items-center mb-1"><Badge bg="light" text="dark" className="border">{cap(p.category)}</Badge>{p.tags.map((tg) => <span key={tg} className="stage-pill">#{tg}</span>)}</div>
          <h2 className="h5 mb-1"><Link to={`/community/${p._id}`}>{p.title}</Link></h2>
          <div className="small text-muted">{p.author?.name} · {fmtDate(p.createdAt)} · {p.commentCount} comment{p.commentCount === 1 ? '' : 's'}</div>
        </Card.Body></Card>))}
      <Pager meta={meta} onPage={setPage} />
      {creating && <FormModal show title="New post" fields={postFields} initial={{ category: 'discussion' }} submitLabel="Publish" onSubmit={create} onClose={() => setCreating(false)} />}
    </>
  );
}
