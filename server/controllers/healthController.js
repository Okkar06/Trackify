const { getHealth } = require('../services/healthService');
const { asyncHandler } = require('../utils/asyncHandler');

const healthCheck = asyncHandler(async (_req, res) => {
  const payload = getHealth();
  res.status(200).json(payload);
});

module.exports = { healthCheck };

