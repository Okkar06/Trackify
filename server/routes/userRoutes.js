const express = require('express');

const { getProfile, updateProfile } = require('../controllers/userController');
const { requireUser } = require('../middleware/requireUser');

const router = express.Router();

router.use(requireUser);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
