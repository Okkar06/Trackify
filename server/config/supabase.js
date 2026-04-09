const { createClient } = require('@supabase/supabase-js');

const { requireEnv, supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } = require('./env');

let cachedClient;

const getSupabaseKey = () => {
  const serviceRoleKey = String(supabaseServiceRoleKey || '').trim();
  if (serviceRoleKey) return serviceRoleKey;
  return requireEnv('SUPABASE_ANON_KEY', supabaseAnonKey);
};

const getSupabaseClient = () => {
  if (cachedClient) return cachedClient;

  const url = requireEnv('SUPABASE_URL', supabaseUrl);
  const key = getSupabaseKey();

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
};

module.exports = { getSupabaseClient };

