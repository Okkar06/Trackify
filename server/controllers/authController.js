const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/httpError');
const { loginUser, logoutUser, registerUser, resetPassword } = require('../services/authService');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const validateEmail = (email) => {
  const value = normalizeEmail(email);
  if (!value) return '';
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return ok ? value : '';
};

const register = asyncHandler(async (req, res) => {
  const email = validateEmail(req.body.email);
  const password = String(req.body.password || '');
  const fullName = String(req.body.fullName || '').trim();

  if (!email) throw new HttpError('Email is required', 400);
  if (!password) throw new HttpError('Password is required', 400);
  if (!fullName) throw new HttpError('Name is required', 400);

  const data = await registerUser({ email, password, fullName });
  res.status(201).json(data);
});

const login = asyncHandler(async (req, res) => {
  const email = validateEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email) throw new HttpError('Email is required', 400);
  if (!password) throw new HttpError('Password is required', 400);

  const data = await loginUser({ email, password });
  res.status(200).json(data);
});

const logout = asyncHandler(async (_req, res) => {
  const data = await logoutUser();
  res.status(200).json(data);
});

const resetPasswordRequest = asyncHandler(async (req, res) => {
  const email = validateEmail(req.body.email);
  const redirectTo = String(req.body.redirectTo || '').trim();

  if (!email) throw new HttpError('Email is required', 400);

  const data = await resetPassword({ email, redirectTo });
  res.status(200).json(data);
});

module.exports = {
  login,
  logout,
  register,
  resetPasswordRequest,
};

