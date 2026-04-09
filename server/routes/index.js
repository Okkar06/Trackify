const express = require('express');

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const healthRoutes = require('./healthRoutes');
const payRoutes = require('./payRoutes');
const userRoutes = require('./userRoutes');
const workEntryRoutes = require('./workEntryRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/health', healthRoutes);
router.use('/pay', payRoutes);
router.use('/users', userRoutes);
router.use('/work', workEntryRoutes);

module.exports = router;
