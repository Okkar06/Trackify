const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

require('./config/loadEnv');

const { corsOrigin, nodeEnv } = require('./config/env');
const apiRoutes = require('./routes');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

const parseCorsOrigins = (value) => {
  const text = String(value || '').trim();
  if (!text) return [];
  if (text === '*') return ['*'];
  return text
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
};

const allowedOrigins = parseCorsOrigins(corsOrigin);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes('*')) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: !allowedOrigins.includes('*'),
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev'));

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
