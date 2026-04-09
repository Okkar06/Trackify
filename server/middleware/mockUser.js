const { HttpError } = require('../utils/httpError');

const getUserId = (req) => {
  const headerId = String(req.headers['x-user-id'] || '').trim();
  if (headerId) return headerId;
  return String(process.env.MOCK_USER_ID || '').trim();
};

const requireMockUser = (req, _res, next) => {
  const userId = getUserId(req);
  if (!userId) {
    throw new HttpError('Unauthorized (mock user not set)', 401);
  }

  req.userId = userId;
  next();
};

module.exports = { requireMockUser };

