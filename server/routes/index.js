const express = require('express');

const authRoutes = require('./authRoutes');
const healthRoutes = require('./healthRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/users', userRoutes);

module.exports = router;
