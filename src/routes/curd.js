const express = require('express'); 
const controllers = require('../controllers');
const router = express.Router();
const validateToken = require("../middleware/auth");

router.post('/doc', validateToken, controllers.common.saveDoc);
router.get('/doc', validateToken, controllers.common.fetchDoc);
router.get('/doc/:id', validateToken, controllers.common.fetchDocById);
router.put('/doc', validateToken, controllers.common.updateDoc);
router.delete('/doc/:id', validateToken, controllers.common.deleteDocById);

router.post('/doc-with-condition', controllers.common.fetchDocWithCondition);

router.post('/store/doc', controllers.common.saveDoc);
router.get('/store/doc', controllers.common.fetchDoc);
router.get('/store/doc/:id', controllers.common.fetchDocById);
router.put('/store/doc', controllers.common.updateDoc);
router.delete('/store/doc/:id', controllers.common.deleteDocById);

router.post('/store/customer/type', controllers.store.checkExistingCustomer);
router.post('/sink-wirehouse', controllers.store.sinkWirehouse);
router.post('/cart', controllers.store.createCart);
router.post('/edit-cart', controllers.store.updateCart);
router.post('/cart-checkout-url', controllers.store.retrieveCheckoutURL);
router.post('/cart-discount', controllers.store.updateCartDiscount);

router.post('/discount-code', controllers.store.getDiscountCodes);

module.exports = router;