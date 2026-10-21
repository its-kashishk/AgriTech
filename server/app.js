const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const routes = require('./routes');
const { sanitizeBody } = require('./middleware/validate');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(cors({ origin: origins })); // Bearer tokens are sent in a header, so no cookies/credentials needed
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeBody);

app.get('/', (req, res) => res.json({ message: 'AgriTech API is running!', docs: '/api/health' }));
app.get('/api/db-status', (req, res) => res.json({ connected: mongoose.connection.readyState === 1 }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
