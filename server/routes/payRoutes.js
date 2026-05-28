const express = require('express');

const { monthly, yearly } = require('../controllers/payController');
const { requireUser } = require('../middleware/requireUser');

const router = express.Router();

router.use(requireUser);

router.get('/monthly', monthly);
router.get('/yearly', yearly);

module.exports = router;
