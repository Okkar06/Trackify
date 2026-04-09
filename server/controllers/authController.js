const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/httpError');
const { loginWithEmailPassword, registerWithEmailPassword } = require('../services/authService');

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
  const profileImageUrl = String(req.body.profileImageUrl || '').trim();

  if (!email) throw new HttpError('Valid email is required', 400);
  if (!password || password.length < 6) throw new HttpError('Password must be at least 6 characters', 400);
  if (!fullName) throw new HttpError('Full name is required', 400);

  const payload = await registerWithEmailPassword({ email, password, fullName, profileImageUrl });
  res.status(201).json(payload);
});

const login = asyncHandler(async (req, res) => {
  const email = validateEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email) throw new HttpError('Valid email is required', 400);
  if (!password) throw new HttpError('Password is required', 400);

  const payload = await loginWithEmailPassword({ email, password });
  res.status(200).json(payload);
});

module.exports = {
  login,
  register,
};

