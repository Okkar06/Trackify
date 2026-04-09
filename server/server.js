require('dotenv').config();

const { app } = require('./app');
const { port, nodeEnv } = require('./config/env');
const { testSupabaseConnection } = require('./services/supabaseHealthService');

app.listen(port, () => {
  console.log(`Trackify API listening on port ${port} (${nodeEnv})`);

  if (nodeEnv !== 'production') {
    testSupabaseConnection()
      .then((result) => {
        if (result.ok) {
          console.log(`Supabase connected (${result.mode}${result.host ? `: ${result.host}` : ''})`);
          return;
        }

        console.log(`Supabase connection failed${result.host ? ` (${result.host})` : ''}: ${result.error}`);
      })
      .catch((err) => {
        console.log(`Supabase connection failed: ${err.message || 'Unknown error'}`);
      });
  }
});
