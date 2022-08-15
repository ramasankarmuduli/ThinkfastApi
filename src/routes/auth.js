const express = require('express'); 
const controllers = require('../controllers');
const router = express.Router();

function tmp(req, res) {};

router.post('/signup', controllers.auth.signup);
router.post('/login', controllers.auth.login);
router.post('/super-admin-signup', controllers.auth.superAdminSignup);
router.post('/super-admin-login', controllers.auth.superAdminLogin);
router.post('/velidate-token', controllers.auth.validateJwtToken);
router.post('/logout', tmp);
router.post('/accessToken', tmp);
router.post('/refreshToken', tmp);

module.exports = router;