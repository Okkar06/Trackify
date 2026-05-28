const express = require('express');

const { analyzeWorkImageHandler } = require('../controllers/aiController');
const { requireUser } = require('../middleware/requireUser');
const { upload } = require('../middleware/uploadAiImage');

const router = express.Router();

router.use(requireUser);
router.post('/analyze-work-image', upload.single('image'), analyzeWorkImageHandler);

module.exports = router;

