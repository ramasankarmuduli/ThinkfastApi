const express = require('express'); 
const router = express.Router();
const authRouter = require('./auth');
const curdRouter = require('./curd');
const slaRouter = require('./sla');

router.use('/auth', authRouter);
router.use('/curd', curdRouter);
router.use('/sla', slaRouter);

module.exports = router;