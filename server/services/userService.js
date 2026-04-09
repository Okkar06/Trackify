const { getSupabaseAdminClient } = require('../config/supabase');
const { HttpError } = require('../utils/httpError');

const toProfile = (row) => {
  if (!row) return null;
  return {
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    profileImageUrl: row.profile_image_url,
  };
};

const getUserProfile = async ({ userId }) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, email, profile_image_url')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new HttpError(error.message, 400);
  }

  if (!data) {
    return { profile: null };
  }

  return { profile: toProfile(data) };
};

const updateUserProfile = async ({ userId, fullName, profileImageUrl }) => {
  const supabase = getSupabaseAdminClient();

  const updates = { user_id: userId };
  if (fullName !== undefined) updates.full_name = fullName;
  if (profileImageUrl !== undefined) updates.profile_image_url = profileImageUrl;

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(updates, { onConflict: 'user_id' })
    .select('user_id, full_name, email, profile_image_url')
    .maybeSingle();

  if (error) {
    throw new HttpError(error.message, 400);
  }

  return { profile: toProfile(data) };
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};

