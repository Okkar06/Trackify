const express = require('express');

const { calendar, dateDetails, monthlySummary } = require('../controllers/dashboardController');
const { requireMockUser } = require('../middleware/mockUser');

const router = express.Router();

router.use(requireMockUser);

router.get('/monthly-summary', monthlySummary);
router.get('/calendar', calendar);
router.get('/date/:date', dateDetails);

module.exports = router;

