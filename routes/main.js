const express = require('express');
const router = express.Router();
const flashMessage = require('../helpers/messenger');
const passport = require('passport');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const upload = require('../helpers/imageUpload');

// Required for email verification
require('dotenv').config();
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');

function sendEmail(toEmail, url) {
	sgMail.setApiKey(process.env.SENDGRID_API_KEY);
	const message = {
		to: toEmail,
		from: `South Canteen <${process.env.SENDGRID_SENDER_EMAIL}>`,
		subject: 'Verify South Canteen Account',
		html: `Thank you registering with South Canteen.<br><br> Please <a href=\"${url}"><strong>verify</strong></a> your account.`
	};

	// Returns the promise from SendGrid to the calling function
	return new Promise((resolve, reject) => {
		sgMail.send(message)
			.then(response => resolve(response))
			.catch(err => reject(err));
	});
}

router.get('/verify/:userId/:token', async function (req, res) {
	let id = req.params.userId;
	let token = req.params.token;

	try {
		// Check if user is found
		let user = await User.findByPk(id);
		if (!user) {
			flashMessage(res, 'error', 'User not found');
			res.redirect('/login');
			return;
		}
		// Check if user has been verified
		if (user.verified) {
			flashMessage(res, 'info', 'User already verified');
			res.redirect('/login');
			return;
		}
		// Verify JWT token sent via URL 
		let authData = jwt.verify(token, process.env.APP_SECRET);
		if (authData != user.email) {
			flashMessage(res, 'error', 'Unauthorised Access');
			res.redirect('/login');
			return;
		}

		let result = await User.update(
			{ verified: 1 },
			{ where: { id: user.id } });
		console.log(result[0] + ' user updated');
		flashMessage(res, 'success', user.email + ' verified. Please login');
		res.redirect('/login');
	}
	catch (err) {
		console.log(err);
	}
});

router.get('/', (req, res) => {
	const title = 'Video Jotter';
	// renders views/index.handlebars, passing title as an object
	res.render('index', { title: title })
});

router.get('/about', (req, res) => {
	const author = 'Your Name';
	res.render('about', { author });
});

router.get('/login', (req, res) => {
	res.render('login');
});

router.get('/register', (req, res) => {
	res.render('register');
});

router.post('/register', async function (req, res) {
	let { name, email, password, password2, status, posterURL } = req.body;

	let isValid = true;
	if (password.length < 6) {
		flashMessage(res, 'error', 'Password must be at least 6 char-acters');
		isValid = false;
	}
	if (password != password2) {
		flashMessage(res, 'error', 'Passwords do not match');
		isValid = false;
	}
	if (!isValid) {
		res.render('register', {
			name, email
		});
		return;
	}

	try {
		// If all is well, checks if user is already registered
		let user = await User.findOne({ where: { email: email } });
		if (user) {
			// If user is found, that means email has already been registered
			flashMessage(res, 'error', email + ' already registered');
			res.render('register', {
				name, email
			});
		}
		else {
			// Create new user record 
			var salt = bcrypt.genSaltSync(10);
			var hash = bcrypt.hashSync(password, salt);
			// Use hashed password
			let user = await User.create({ name, email, status, password: hash, posterURL, verified: 0 });
			// Send email
			let token = jwt.sign(email, process.env.APP_SECRET);
			let url = `${process.env.BASE_URL}:${process.env.PORT}/verify/${user.id}/${token}`;
			sendEmail(user.email, url)
				.then(response => {
					console.log(response);
					flashMessage(res, 'success', user.email + ' registered successfully');
					res.redirect('/login');
				})
				.catch(err => {
					console.log(err);
					flashMessage(res, 'error', 'Error when sending email to ' + user.email);
					res.redirect('/');
				});
		}
	}
	catch (err) {
		console.log(err);
	}
});

router.post('/login', passport.authenticate('local', {
	failureRedirect: '/login',
	failureFlash: true
}), (req, res) => {
	if (!req.user.status) {
		res.redirect('/user/home');
	}
	else {
		res.redirect('/admin/listAcc');
	}
});

router.post('/flash', (req, res) => {
	const message = 'This is an important message';
	const error = 'This is an error message';
	const error2 = 'This is the second error message';

	// req.flash('message', message);
	// req.flash('error', error);
	// req.flash('error', error2);

	flashMessage(res, 'success', message);
	flashMessage(res, 'info', message);
	flashMessage(res, 'error', error);
	flashMessage(res, 'error', error2, 'fas fa-sign-in-alt', true);

	res.redirect('/about');
});

router.get('/logout', (req, res, next) => {
	req.logout(function (err) {
		if (err) { return next(err); }
		res.redirect('/');
	});
});

// router.post('/upload', (req, res) => {
//     // Creates user id directory for upload if not exist
//     if (!fs.existsSync('./public/uploads/' + req.user.id)) {
//         fs.mkdirSync('./public/uploads/' + req.user.id, { recursive: true });
//     }

//     upload(req, res, (err) => {
//         if (err) {
//             // e.g. File too large
//             res.json({ file: '/img/no-image.jpg', err: err });
//         }
//         else {
//             res.json({ file: `/uploads/${req.user.id}/${req.file.filename}` });
//         }
//     });
// });

module.exports = router;
