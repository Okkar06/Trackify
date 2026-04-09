require('dotenv').config();

const { app } = require('./app');
const { port, nodeEnv } = require('./config/env');

app.listen(port, () => {
  console.log(`Trackify API listening on port ${port} (${nodeEnv})`);
});

