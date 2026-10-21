import { useState } from 'react';
import { Alert, Badge, Button, Card, Form } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import FormModal, { toInitial } from '../components/FormModal';
import { ConfirmModal, ErrorBox, Loading, PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import api, { errMsg } from '../services/api';
import { cap, fmtDateTime } from '../utils/format';
import { postFields } from './Community';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const { data: post, loading, error, reload } = useFetch(`/community/${id}`);
  const [comment, setComment] = useState('');
  const [cerr, setCerr] = useState('');
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(null); // {type:'post'} | {type:'comment', id}

  if (loading) return <Loading />;
  if (error) return <><ErrorBox message={error} /><Link to="/community">← Back to community</Link></>;
  const mine = post.author?._id === user._id;
  const canDelete = mine || user.role === 'admin';

  const addComment = async (e) => {
    e.preventDefault(); setCerr('');
    try { await api.post(`/community/${id}/comments`, { body: comment }); setComment(''); reload(); } catch (err) { setCerr(errMsg(err)); }
  };
  const doDelete = async () => {
    try {
      if (confirm.type === 'post') { await api.delete(`/community/${id}`); toast('Post deleted'); nav('/community'); } else { await api.delete(`/community/${id}/comments/${confirm.id}`); toast('Comment deleted'); reload(); }
    } catch (e) { toast(errMsg(e), 'danger'); }
    setConfirm(null);
  };
  const save = async (payload) => { await api.put(`/community/${id}`, payload); toast('Post updated'); setEditing(false); reload(); };

  return (
    <>
      <PageHeader title={post.title} subtitle={`${post.author?.name} · ${fmtDateTime(post.createdAt)}`}
        actions={<><Link to="/community" className="btn btn-outline-secondary">Back</Link>{mine && <Button variant="outline-primary" onClick={() => setEditing(true)}>Edit</Button>}{canDelete && <Button variant="outline-danger" onClick={() => setConfirm({ type: 'post' })}>Delete</Button>}</>} />
      <Card className="mb-4"><Card.Body>
        <div className="mb-2"><Badge bg="light" text="dark" className="border me-2">{cap(post.category)}</Badge>{post.tags.map((t) => <span key={t} className="stage-pill me-1">#{t}</span>)}</div>
        <p className="post-body mb-0">{post.body}</p>
      </Card.Body></Card>
      <h2 className="h5">{post.comments.length} comment{post.comments.length === 1 ? '' : 's'}</h2>
      {post.comments.map((c) => (
        <Card key={c._id} className="mb-2"><Card.Body className="py-2 d-flex justify-content-between gap-2">
          <div><strong>{c.author?.name}</strong> <span className="small text-muted">{fmtDateTime(c.createdAt)}</span><div className="post-body">{c.body}</div></div>
          {(c.author?._id === user._id || user.role === 'admin') && <Button size="sm" variant="link" className="text-danger align-self-start" onClick={() => setConfirm({ type: 'comment', id: c._id })}>Delete</Button>}
        </Card.Body></Card>))}
      <Form onSubmit={addComment} className="mt-3">
        {cerr && <Alert variant="danger">{cerr}</Alert>}
        <Form.Group controlId="comment"><Form.Label>Add a comment</Form.Label><Form.Control as="textarea" rows={3} required maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} /></Form.Group>
        <Button type="submit" className="mt-2" disabled={!comment.trim()}>Post comment</Button>
      </Form>
      {editing && <FormModal show title="Edit post" fields={postFields} initial={toInitial(post, postFields)} onSubmit={save} onClose={() => setEditing(false)} />}
      <ConfirmModal show={!!confirm} body={confirm?.type === 'post' ? 'Delete this post and all its comments?' : 'Delete this comment?'} onConfirm={doDelete} onCancel={() => setConfirm(null)} />
    </>
  );
}
