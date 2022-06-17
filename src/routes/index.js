const express = require('express'); 
const router = express.Router();
const authRouter = require('./auth');
const curdRouter = require('./curd');

router.use('/auth', authRouter);
router.use('/curd', curdRouter);

module.exports = router;