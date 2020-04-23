const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;


exports.getProducts = (req, res, next) => {
	const page = +req.query.page || 1;

	Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
		.then(products => {
			Product.countDocuments()
				.then(totalProductsCount => {
					const pagesCount = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
					return {
						totalPages: pagesCount,
						currPage: page,
						hasPrev: page > 1,
						hasNext: page < pagesCount
					};
				})
				.then(pagingData => {
					res.render("shop/product-list", {
						prods: products,
						pageTitle: "All products",
						path: "/products",
						pagination: pagingData
					});
				});
		})
		.catch(err => {
			console.log(page);
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getProduct = (req, res, next) => {
	const prodId = req.params.productId;
	Product.findById(prodId)
		.then(product => {
			res.render('shop/product-detail', {
				product: product,
				pageTitle: product.title,
				path: '/products'
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getIndex = (req, res, next) => {
	const page = +req.query.page || 1;
	let totalItems;

	Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
		.then(products => {
			Product.countDocuments()
				.then(totalProductsCount => {
					const pagesCount = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
					return {
						totalPages: pagesCount,
						currPage: page,
						hasPrev: page > 1,
						hasNext: page < pagesCount
					};
				})
				.then(pagingData => {
					res.render("shop/index", {
						prods: products,
						pageTitle: "Shop",
						path: "/",
						pagination: pagingData
					});
				});
		})
		.catch(err => {
			console.log(page);
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getCart = (req, res, next) => {
	req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then(user => {
			const products = user.cart.items;
			res.render('shop/cart', {
				path: '/cart',
				pageTitle: 'Your Cart',
				products: products
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postCart = (req, res, next) => {
	const prodId = req.body.productId;
	Product.findById(prodId)
		.then(product => {
			return req.user.addToCart(product);
		})
		.then(() => {
			res.redirect('/cart');
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postCartDeleteProduct = (req, res, next) => {
	const prodId = req.body.productId;
	req.user.removeFromCart(prodId)
		.then(() => {
			res.redirect('/cart');
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.createOrder = (req, res, next) => {

	req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then(user => {
			const products = user.cart.items.map(i => {
				return { quantity: i.quantity, product: { ...i.productId._doc } };
			});
			const order = new Order({
				user: {
					email: req.user.email,
					userId: req.user
				},
				orders: products
			});

			return order.save();
		})
		.then(result => {
			return req.user.clearCart();
		}).then(result => {
			res.redirect('/orders');
		}).catch(err => {
			console.log(err);
		});
};

exports.getOrders = (req, res, next) => {
	Order.find({ 'user.userId': req.user._id })
		.then(orders => {
			res.render('shop/orders', {
				path: '/orders',
				pageTitle: 'Your Orders',
				orders: orders
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getInvoice = (req, res, next) => {
	const orderId = req.params.orderId;
	Order.findById(orderId)
		.then(order => {
			if (!order) {
				return next(new Error('No order found!'));
			}

			if (order.user.userId.toString() !== req.user._id.toString()) {
				return next(new Error('Unauthorized'));
			}

			const invoiceName = 'invoice-' + orderId + '.pdf';
			const invoicePath = path.join('data', 'invoices', invoiceName);


			const pdfDoc = new PDFDocument();

			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');

			pdfDoc.pipe(fs.createWriteStream(invoicePath));
			pdfDoc.pipe(res);

			pdfDoc.fontSize(26).text('Invoice');

			pdfDoc.text('------------------------------');
			let totalPrice = 0;
			order.orders.forEach(prod => {
				totalPrice += prod.quantity * prod.product.price;
				pdfDoc.text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
			});
			pdfDoc.text('------------------------------');
			pdfDoc.fontSize(20).text('Total price $' + totalPrice);
			pdfDoc.end();
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};