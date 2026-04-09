const express = require('express');

const authRoutes = require('./authRoutes');
const healthRoutes = require('./healthRoutes');
const userRoutes = require('./userRoutes');
const workEntryRoutes = require('./workEntryRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/work', workEntryRoutes);

module.exports = router;
