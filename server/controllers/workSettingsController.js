const { asyncHandler } = require('../utils/asyncHandler');
const { getWorkSettings, updateWorkSettings } = require('../services/workSettingsService');

const getWorkSettingsHandler = asyncHandler(async (req, res) => {
  const data = await getWorkSettings({ userId: req.userId });
  res.status(200).json(data);
});

const updateWorkSettingsHandler = asyncHandler(async (req, res) => {
  const data = await updateWorkSettings({ userId: req.userId, input: req.body });
  res.status(200).json(data);
});

module.exports = {
  getWorkSettingsHandler,
  updateWorkSettingsHandler,
};
