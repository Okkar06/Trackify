const crypto = require('crypto');
const path = require('path');

const { getSupabaseAdminClient } = require('../config/supabase');
const { HttpError } = require('../utils/httpError');

const PROFILE_BUCKET = 'profile-images';
let bucketEnsured = false;

const ensureProfileBucket = async () => {
  if (bucketEnsured) return;
  const supabase = getSupabaseAdminClient();

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new HttpError(error.message, 500);

  const exists = Array.isArray(buckets) && buckets.some((b) => b.name === PROFILE_BUCKET);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(PROFILE_BUCKET, {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });

    if (createError) throw new HttpError(createError.message, 500);
  }

  bucketEnsured = true;
};

const getExtension = ({ originalname, mimetype }) => {
  const extFromName = path.extname(String(originalname || '')).toLowerCase();
  if (extFromName && extFromName.length <= 5) return extFromName;

  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return map[String(mimetype || '')] || '';
};

const uploadProfileImage = async ({ userId, file }) => {
  if (!file || !file.buffer) throw new HttpError('File is required', 400);
  await ensureProfileBucket();

  const ext = getExtension(file);
  const filename = `${crypto.randomUUID()}${ext}`;
  const objectPath = `${userId}/${filename}`;

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.storage.from(PROFILE_BUCKET).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    upsert: true,
  });

  if (error) throw new HttpError(error.message, 400);

  const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(objectPath);
  const publicUrl = data?.publicUrl;

  if (!publicUrl) throw new HttpError('Failed to generate public URL', 500);
  return { bucket: PROFILE_BUCKET, path: objectPath, publicUrl };
};

module.exports = {
  uploadProfileImage,
};

