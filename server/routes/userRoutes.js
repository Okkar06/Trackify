const express = require('express');

const { getProfile, updateProfile, uploadProfileImageHandler } = require('../controllers/userController');
const { getWorkDefaults, updateWorkDefaults } = require('../controllers/workSettingsController');
const { requireUser } = require('../middleware/requireUser');
const { upload } = require('../middleware/uploadProfileImage');

const router = express.Router();

router.use(requireUser);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/image', upload.single('image'), uploadProfileImageHandler);

router.get('/work-settings', getWorkDefaults);
router.put('/work-settings', updateWorkDefaults);

module.exports = router;
