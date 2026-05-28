const { getSupabasePublicClient } = require('../config/supabase');
const { supabaseUrl } = require('../config/env');

const getSupabaseHost = () => {
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return '';
  }
};

const testSupabaseConnection = async () => {
  const supabase = getSupabasePublicClient();

  const { error } = await supabase.auth.getUser('invalid');
  if (!error) return { ok: true, mode: 'auth', host: getSupabaseHost() };

  const status = Number(error.status) || 0;
  if (status === 401 || status === 403) {
    return { ok: true, mode: 'auth', host: getSupabaseHost() };
  }

  return { ok: false, mode: 'auth', host: getSupabaseHost(), error: error.message };
};

module.exports = { testSupabaseConnection };
