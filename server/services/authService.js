const { getSupabasePublicClient } = require('../config/supabaseClient');
const { toPublicUser } = require('../models/userModel');
const { HttpError } = require('../utils/httpError');

const registerWithEmailPassword = async ({ email, password, fullName, profileImageUrl }) => {
  const supabase = getSupabasePublicClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        profile_image_url: profileImageUrl,
      },
    },
  });

  if (error) throw new HttpError(error.message, 400);

  return {
    user: toPublicUser(data.user),
    session: data.session,
  };
};

const loginWithEmailPassword = async ({ email, password }) => {
  const supabase = getSupabasePublicClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new HttpError(error.message, 401);

  return {
    user: toPublicUser(data.user),
    session: data.session,
  };
};

module.exports = {
  loginWithEmailPassword,
  registerWithEmailPassword,
};

