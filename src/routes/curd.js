const express = require('express'); 
const controllers = require('../controllers');
const router = express.Router();
const validateToken = require("../middleware/auth");

router.post('/doc', validateToken, controllers.common.saveDoc);
router.get('/doc', validateToken, controllers.common.fetchDoc);
router.get('/doc/:id', validateToken, controllers.common.fetchDocById);
router.put('/doc', validateToken, controllers.common.updateDoc);
router.delete('/doc/:id', validateToken, controllers.common.deleteDocById);

module.exports = router;