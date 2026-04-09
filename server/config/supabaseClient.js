const { createClient } = require('@supabase/supabase-js');

const { requireEnv, supabaseServiceRoleKey, supabaseUrl } = require('./env');

let cachedClient;

const getSupabaseAdminClient = () => {
  if (cachedClient) return cachedClient;

  const url = requireEnv('SUPABASE_URL', supabaseUrl);
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey);

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
};

module.exports = { getSupabaseAdminClient };

