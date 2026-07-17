const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController')

/**
 * @route  POST /api/auth/login/
 * @desc   Route requests straight to the controller
*/

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/register', authController.register);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword', authController.resetPassword);
router.get('/verifyEmail', authController.verifyEmail);

module.exports = router;
