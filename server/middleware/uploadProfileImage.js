const multer = require('multer');

const { HttpError } = require('../utils/httpError');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new HttpError('Only image files are allowed (jpg, png, webp, gif)', 400));
    }
    return cb(null, true);
  },
});

module.exports = { upload };

