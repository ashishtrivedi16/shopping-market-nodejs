const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth');

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', [
	check('email').isEmail().withMessage('Please enter a valid email!').normalizeEmail()
], authController.postLogin);

router.post('/signup', [
	check('email')
		.isEmail()
		.withMessage('Please enter a valid email!')
		.custom((value, { req }) => {
			return User.findOne({ email: value })
				.then((userDoc) => {
					return Promise.reject('Email already exists! Please pick a different one.');
				})
		})
		.normalizeEmail(),
	check('password', 'Please enter an alphanumeric password which is atleast 5 characters long!')
		.isLength({ min: 5 }).
		isAlphanumeric().trim(),
	check('confirmPassword').trim().custom((value, { req }) => {
		if (value !== req.body.password) {
			throw new Error('Passwords have to match!');
		}
		return true;
	})
], authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
