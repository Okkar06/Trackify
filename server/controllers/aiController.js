const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/httpError');
const { analyzeWorkImage } = require('../services/aiService');

const analyzeWorkImageHandler = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError('Image file is required', 400);

  const employeeName = String(req.body.employeeName || req.body.targetEmployeeName || '').trim();
  if (!employeeName) throw new HttpError('employeeName is required', 400);

  const result = await analyzeWorkImage({
    imageBuffer: req.file.buffer,
    mimeType: req.file.mimetype,
    employeeName,
  });
  res.status(200).json(result);
});

module.exports = {
  analyzeWorkImageHandler,
};
