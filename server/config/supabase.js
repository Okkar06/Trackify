const { createClient } = require('@supabase/supabase-js');

const { requireEnv, supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } = require('./env');

let cachedPublicClient;
let cachedAdminClient;

const commonOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

const getSupabasePublicClient = () => {
  if (cachedPublicClient) return cachedPublicClient;

  const url = requireEnv('SUPABASE_URL', supabaseUrl);
  const anonKey = requireEnv(
    'SUPABASE_ANON_KEY',
    supabaseAnonKey ||
      String(process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY || '').trim() ||
      String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim() ||
      String(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '').trim()
  );

  cachedPublicClient = createClient(url, anonKey, commonOptions);
  return cachedPublicClient;
};

const getSupabaseAdminClient = () => {
  if (cachedAdminClient) return cachedAdminClient;

  const url = requireEnv('SUPABASE_URL', supabaseUrl);
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey);

  cachedAdminClient = createClient(url, serviceRoleKey, commonOptions);
  return cachedAdminClient;
};

module.exports = {
  getSupabaseAdminClient,
  getSupabasePublicClient,
};
