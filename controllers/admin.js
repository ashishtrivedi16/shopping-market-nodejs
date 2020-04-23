const { validationResult } = require('express-validator');

const Product = require('../models/product');
const fileHelper = require('../util/file');

const ITEMS_PER_PAGE = 2;

exports.getAddProduct = (req, res, next) => {
	if (!req.session.isLoggedIn) {
		res.redirect('/login');
	}
	res.render('admin/edit-product', {
		pageTitle: 'Edit Product',
		path: '/admin/edit-product',
		editing: false,
		hasError: false,
		errorMessage: null,
		validationErrors: []
	});
};

exports.postAddProduct = (req, res, next) => {
	const title = req.body.title;
	const price = req.body.price;
	const description = req.body.description;
	const image = req.file;
	if (!image) {
		console.log(image);
		return res.status(422).render('admin/edit-product', {
			pageTitle: 'Add Product',
			path: '/admin/add-product',
			editing: false,
			hasError: true,
			product: {
				title: title,
				price: price,
				description: description
			},
			errorMessage: 'Attached file is not a valid image!',
			validationErrors: []
		});
	}

	const imageUrl = image.path;
	const userId = req.user // or use req.user._id
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(422).render('admin/add-product', {
			pageTitle: 'Add Product',
			path: '/admin/add-product',
			editing: false,
			hasError: true,
			product: {
				title: title,
				price: price,
				description: description,
				imageUrl: imageUrl
			},
			errorMessage: errors.array()[0].msg,
			validationErrors: errors.array()
		});
	}

	const product = new Product({
		title: title,
		price: price,
		description: description,
		imageUrl: imageUrl,
		userId: userId
	});
	product
		.save()
		.then(() => {
			console.log('Created Product');
			res.redirect('/admin/products');
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getEditProduct = (req, res, next) => {
	const editMode = req.query.edit;
	if (!editMode) {
		return res.redirect('/');
	}
	const prodId = req.params.productId;
	Product.findById(prodId)
		.then(product => {
			if (!product) {
				return res.redirect('/');
			}
			res.render('admin/edit-product', {
				pageTitle: 'Edit Product',
				path: '/admin/edit-product',
				editing: editMode,
				product: product,
				hasError: false,
				errorMessage: null,
				validationErrors: []
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postEditProduct = (req, res, next) => {
	const prodId = req.body.productId;
	const title = req.body.title;
	const price = req.body.price;
	const image = req.file;
	const description = req.body.description;
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(422).render('admin/edit-product', {
			pageTitle: 'Edit Product',
			path: '/admin/edit-product',
			editing: true,
			hasError: true,
			product: {
				title: title,
				price: price,
				description: description,
				_id: prodId
			},
			errorMessage: errors.array()[0].msg,
			validationErrors: errors.array()
		});
	}

	Product.findById(prodId)
		.then(product => {
			if (product.userId.toString() !== req.user._id.toString()) {
				return res.redirect('/');
			}
			product.title = title;
			product.price = price;
			product.description = description;
			if (image) {
				fileHelper.deletFile(product.imageUrl);
				product.imageUrl = image.path;
			}
			return product.save()
				.then(() => {
					console.log('Updated product!');
					res.redirect('/admin/products');
				});
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getProducts = (req, res, next) => {

	Product.find({ userId: req.user._id })
		.then(products => {
			res.render("admin/products", {
				prods: products,
				pageTitle: "Admin products",
				path: "/admin/products"
			});
		})
		.catch(err => {
			console.log(page);
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.deleteProduct = (req, res, next) => {
	const prodId = req.params.productId;

	Product.findById(prodId)
		.then(product => {
			if (!product) {
				next(new Error('Product not found!'));
			}
			fileHelper.deletFile(product.imageUrl);
			return Product.deleteOne({ _id: prodId, userId: req.user._id });
		})
		.then(() => {
			console.log('Product deleted');
			// res.redirect('/admin/products');
			res.status(200).json({
				"message": "Successfully deleted product"
			});
		})
		.catch(err => {
			// const error = new Error(err);
			// error.httpStatusCode = 500;
			// return next(error);
			res.status(500).json({
				"message": "Deleteing product failed"
			});
		});
};
