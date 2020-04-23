const express = require('express');
const { check } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/products', adminController.getProducts);

router.post('/add-product', isAuth, [
	check('title', 'Please enter a valid title!')
		.isString()
		.trim()
		.isLength({ min: 3}),
	check('price', 'Please enter a valid price!')
		.isFloat(),
	check('description', 'Please enter a valid description!')
		.trim()
		.isString()
		.isLength({ min: 3})
], adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
	check('title', 'Please enter a valid title!')
		.isString()
		.trim()
		.isLength({ min: 3}),
	check('price', 'Please enter a valid price!')
		.isFloat(),
	check('description', 'Please enter a valid description!')
		.trim()
		.isString()
		.isLength({ min: 3})
], isAuth, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
