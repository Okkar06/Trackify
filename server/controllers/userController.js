const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/httpError');
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

module.exports = {
  getProfile,
  updateProfile,
};

