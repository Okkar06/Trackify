const asString = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const toPublicUser = (supabaseUser) => {
  if (!supabaseUser) return null;

  const metadata = supabaseUser.user_metadata || {};

  return {
    id: supabaseUser.id,
    email: asString(supabaseUser.email),
    fullName: asString(metadata.full_name || metadata.fullName),
    profileImageUrl: asString(metadata.profile_image_url || metadata.profileImageUrl),
  };
};

module.exports = { toPublicUser };

