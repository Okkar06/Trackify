const express = require('express');

const { login, logout, register, resetPasswordRequest } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/reset-password', resetPasswordRequest);

module.exports = router;

