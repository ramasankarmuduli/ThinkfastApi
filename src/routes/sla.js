const express = require('express'); 
const controllers = require('../controllers');
const router = express.Router();

router.post('/check-pin', controllers.sla.checkPin);

module.exports = router;