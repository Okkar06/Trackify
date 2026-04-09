const { createClient } = require('@supabase/supabase-js');

const { requireEnv, supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } = require('./env');

let cachedAdminClient;
let cachedPublicClient;

const getSupabaseAdminClient = () => {
  if (cachedAdminClient) return cachedAdminClient;

  const url = requireEnv('SUPABASE_URL', supabaseUrl);
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey);

  cachedAdminClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedAdminClient;
};

const getSupabasePublicClient = () => {
  if (cachedPublicClient) return cachedPublicClient;

  const url = requireEnv('SUPABASE_URL', supabaseUrl);
  const anonKey = requireEnv('SUPABASE_ANON_KEY', supabaseAnonKey);

  cachedPublicClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedPublicClient;
};

module.exports = { getSupabaseAdminClient, getSupabasePublicClient };
