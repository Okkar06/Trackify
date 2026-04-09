const express = require('express');

const { getProfile, updateProfile } = require('../controllers/userController');
const { requireMockUser } = require('../middleware/mockUser');

const router = express.Router();

router.use(requireMockUser);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;

