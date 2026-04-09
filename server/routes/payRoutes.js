const express = require('express');

const { monthly, yearly } = require('../controllers/payController');
const { requireMockUser } = require('../middleware/mockUser');

const router = express.Router();

router.use(requireMockUser);

router.get('/monthly', monthly);
router.get('/yearly', yearly);

module.exports = router;

