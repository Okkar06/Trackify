const { getSupabaseAdminClient, getSupabasePublicClient } = require('../config/supabase');
const { supabaseServiceRoleKey } = require('../config/env');
const { HttpError } = require('../utils/httpError');

const registerUser = async ({ email, password, fullName }) => {
  const supabase = getSupabasePublicClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw new HttpError(error.message, 400);

  const user = data.user;
  if (user) {
    await upsertUserProfileIfPossible({ userId: user.id, email, fullName });
  }

  return { user: data.user, session: data.session };
};

const loginUser = async ({ email, password }) => {
  const supabase = getSupabasePublicClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new HttpError(error.message, 401);
  return { user: data.user, session: data.session };
};

const resetPassword = async ({ email, redirectTo }) => {
  const supabase = getSupabasePublicClient();

  const options = {};
  if (redirectTo) options.redirectTo = redirectTo;

  const { error } = await supabase.auth.resetPasswordForEmail(email, options);
  if (error) throw new HttpError(error.message, 400);

  return { ok: true };
};

const logoutUser = async () => {
  return { ok: true };
};

const upsertUserProfileIfPossible = async ({ userId, email, fullName }) => {
  const hasServiceRole = Boolean(String(supabaseServiceRoleKey || '').trim());
  if (!hasServiceRole) return { ok: false, skipped: true, reason: 'Missing SUPABASE_SERVICE_ROLE_KEY' };

  try {
    const admin = getSupabaseAdminClient();

    const { error } = await admin.from('user_profiles').upsert(
      {
        user_id: userId,
        full_name: fullName,
        email,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      return { ok: false, skipped: true, reason: error.message };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, skipped: true, reason: err.message || 'Unknown error' };
  }
};

module.exports = {
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
};

