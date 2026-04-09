const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

require('./config/loadEnv');

const { corsOrigin, nodeEnv } = require('./config/env');
const apiRoutes = require('./routes');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev'));

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
