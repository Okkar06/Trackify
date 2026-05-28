const { getSupabasePublicClient } = require('../config/supabase');
const { HttpError } = require('../utils/httpError');
const { nodeEnv } = require('../config/env');

const getBearerToken = (req) => {
  const header = String(req.headers.authorization || '').trim();
  if (!header) return '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return '';
  return String(match[1] || '').trim();
};

const getMockUserId = (req) => {
  const headerId = String(req.headers['x-user-id'] || '').trim();
  if (headerId) return headerId;
  return String(process.env.MOCK_USER_ID || '').trim();
};

const requireUser = async (req, _res, next) => {
  try {
    const accessToken = getBearerToken(req);
    if (accessToken) {
      const supabase = getSupabasePublicClient();
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (error || !data?.user) {
        throw new HttpError('Unauthorized', 401);
      }

      req.userId = data.user.id;
      req.user = data.user;
      req.accessToken = accessToken;
      return next();
    }

    if (nodeEnv !== 'production') {
      const userId = getMockUserId(req);
      if (userId) {
        req.userId = userId;
        req.user = null;
        req.accessToken = '';
        return next();
      }
    }

    throw new HttpError('Unauthorized', 401);
  } catch (err) {
    return next(err);
  }
};

module.exports = { requireUser };

