const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/httpError');
const { uploadProfileImage } = require('../services/storageService');
const { getUserProfile, updateUserProfile } = require('../services/userService');

const getProfile = asyncHandler(async (req, res) => {
  const data = await getUserProfile({ userId: req.userId });
  res.status(200).json(data);
});

const updateProfile = asyncHandler(async (req, res) => {
  const fullName = req.body.fullName !== undefined ? String(req.body.fullName || '').trim() : undefined;
  const profileImageUrl =
    req.body.profileImageUrl !== undefined ? String(req.body.profileImageUrl || '').trim() : undefined;

  if (fullName !== undefined && !fullName) throw new HttpError('Full name is required', 400);

  const data = await updateUserProfile({
    userId: req.userId,
    fullName,
    profileImageUrl,
  });

  res.status(200).json(data);
});

const uploadProfileImageHandler = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError('Image file is required', 400);

  const uploaded = await uploadProfileImage({ userId: req.userId, file: req.file });
  const data = await updateUserProfile({ userId: req.userId, profileImageUrl: uploaded.publicUrl });

  res.status(200).json({
    profileImageUrl: uploaded.publicUrl,
    profile: data.profile,
  });
});

module.exports = {
  getProfile,
  uploadProfileImageHandler,
  updateProfile,
};
