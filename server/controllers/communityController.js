const Post = require('../models/Post');
const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const { ok, pageParams, meta, escapeRegex } = require('../utils/respond');

const canModify = (req, doc) => req.user.role === 'admin' || String(doc.author) === req.user.id;

exports.list = async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.tag) filter.tags = String(req.query.tag).toLowerCase();
  if (req.query.q) filter.title = { $regex: escapeRegex(req.query.q), $options: 'i' };
  const { page, limit, skip } = pageParams(req.query);
  const [posts, total] = await Promise.all([Post.find(filter).populate('author', 'name').sort('-createdAt').skip(skip).limit(limit), Post.countDocuments(filter)]);
  const counts = await Comment.aggregate([{ $match: { post: { $in: posts.map((p) => p._id) } } }, { $group: { _id: '$post', n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  ok(res, posts.map((p) => ({ ...p.toJSON(), commentCount: map[String(p._id)] || 0 })), 200, meta(page, limit, total));
};
exports.get = async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', 'name');
  if (!post) throw new ApiError(404, 'Post not found');
  const comments = await Comment.find({ post: post._id }).populate('author', 'name').sort('createdAt');
  ok(res, { ...post.toJSON(), comments });
};
exports.create = async (req, res) => ok(res, await Post.create({ ...req.body, author: req.user.id }), 201, { message: 'Post published' });
exports.update = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');
  if (String(post.author) !== req.user.id) throw new ApiError(403, 'You can only edit your own posts');
  post.set(req.body); await post.save();
  ok(res, post, 200, { message: 'Post updated' });
};
exports.remove = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');
  if (!canModify(req, post)) throw new ApiError(403, 'You can only delete your own posts');
  await Promise.all([post.deleteOne(), Comment.deleteMany({ post: post._id })]);
  ok(res, { id: post.id }, 200, { message: 'Post deleted' });
};
exports.addComment = async (req, res) => {
  if (!(await Post.exists({ _id: req.params.id }))) throw new ApiError(404, 'Post not found');
  const c = await Comment.create({ post: req.params.id, author: req.user.id, body: req.body.body });
  ok(res, await c.populate('author', 'name'), 201, { message: 'Comment added' });
};
exports.removeComment = async (req, res) => {
  const c = await Comment.findOne({ _id: req.params.commentId, post: req.params.id });
  if (!c) throw new ApiError(404, 'Comment not found');
  if (!canModify(req, c)) throw new ApiError(403, 'You can only delete your own comments');
  await c.deleteOne();
  ok(res, { id: c.id }, 200, { message: 'Comment deleted' });
};
