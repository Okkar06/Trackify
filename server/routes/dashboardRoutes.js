const express = require('express');

const { calendar, dateDetails, monthlySummary } = require('../controllers/dashboardController');
const { requireUser } = require('../middleware/requireUser');

const router = express.Router();

router.use(requireUser);

router.get('/monthly-summary', monthlySummary);
router.get('/calendar', calendar);
router.get('/date/:date', dateDetails);

module.exports = router;
