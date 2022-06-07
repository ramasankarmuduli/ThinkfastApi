const express = require('express'); 
const controllers = require('../controllers');
const router = express.Router();

function tmp(req, res) {};

router.post('/signup', controllers.auth.signup);
router.post('/login', controllers.auth.login);
router.post('/logout', tmp);
router.post('/accessToken', tmp);
router.post('/refreshToken', tmp);

module.exports = router;