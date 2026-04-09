const { asyncHandler } = require('../utils/asyncHandler');
const { getWorkSettings, updateWorkSettings } = require('../services/workSettingsService');

const getWorkDefaults = asyncHandler(async (req, res) => {
  const data = await getWorkSettings({ userId: req.userId });
  res.status(200).json(data);
});

const updateWorkDefaults = asyncHandler(async (req, res) => {
  const data = await updateWorkSettings({ userId: req.userId, input: req.body });
  res.status(200).json(data);
});

module.exports = {
  getWorkDefaults,
  updateWorkDefaults,
};

