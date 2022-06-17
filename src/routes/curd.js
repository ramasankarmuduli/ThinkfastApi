const express = require('express'); 
const controllers = require('../controllers');
const router = express.Router();
const validateToken = require("../middleware/auth");

router.post('/saveDoc', validateToken, controllers.common.saveDoc);
router.get('/fetchDoc', validateToken, controllers.common.fetchDoc);
router.get('/fetchDoc/:id', validateToken, controllers.common.fetchDocById);

module.exports = router;