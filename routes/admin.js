const express = require('express');
const ensureAuthenticated = require('../helpers/authenticate');
const ensureAuthorized = require('../helpers/authorize');
const router = express.Router();
const Users = require('../models/User');
const flashMessage = require('../helpers/messenger');
const flash = require('flash');
const Menu = require('../models/Menu');
const fs = require('fs');
const upload = require('../helpers/imageUpload');
const bcrypt = require('bcryptjs');

require('dotenv').config();
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');

function sendEmail(toEmail, url) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const message = {
        to: toEmail,
        from: `South Canteen <${process.env.SENDGRID_SENDER_EMAIL}>`,
        subject: 'Authorize New Admin Account',
        html: `A new account has been registered as an Admin role..<br><br> Please <a href=\"${url}"><strong>authorize</strong></a> the account.`
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
        let user = await Users.findByPk(id);
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

        let result = await Users.update(
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
// router.get('/listAcc', ensureAuthenticated, (req, res) => {
//     Users.findAll({
//         where: { userId: req.user.id },
//         raw: true
//     })
//         .then((user) => {
//             // pass object to listVideos.handlebar 
//             res.render('admin/listAcc', { user });
//         })
//         .catch(err => console.log(err));
// });

router.get('/editAcc/:id', ensureAuthenticated, ensureAuthorized, (req, res) => {
    Users.findByPk(req.params.id)
        .then((users) => {
            res.render('admin/editAcc', { users });
        })
        .catch(err => console.log(err));
});

router.post('/editAcc/:id', ensureAuthenticated, ensureAuthorized, async function (req, res) {
    let name = req.body.name;
    let email = req.body.email;

    try {
        // If all is well, checks if user is already registered
        let user = await Users.findOne({ where: { email: email } });
        if (user) {
            // If user is found, that means email has already been registered
            flashMessage(res, 'error', email + ' is already registered. Please try again.');
            res.render('admin/editAcc', {
                name, email
            });
        }
        else {
            // Create new user record
            Users.update(
                { name, email },
                { where: { id: req.params.id } }
            )
                .then((result) => {
                    console.log(result[0] + ' user updated!');
                    flashMessage(res, 'success', name + '\'s profile has been updated!');
                    res.redirect('/admin/listAcc');
                })
        }
    }
    catch (err) {
        console.log(err);
    }
});

router.get('/deleteAcc/:id', ensureAuthenticated, ensureAuthorized, async function (req, res) {
    try {
        let user = await Users.findByPk(req.params.id);
        if (!user) {
            flashMessage(res, 'error', 'Account not found');
            res.redirect('/admin/listAcc');
            return;
        }
        let result = await Users.destroy({ where: { id: user.id } });
        console.log(result + ' acc deleted');
        res.redirect('/admin/listAcc');
    }
    catch (err) {
        console.log(err);
    }
});

router.get('/listAcc', ensureAuthenticated, ensureAuthorized, (req, res) => {
    Users.findAll({
        raw: true
    })
        .then((users) => {
            // pass object to listVideos.handlebar
            res.render('admin/listAcc', {
                users, status: req.user.status
            });
        })
        .catch(err => console.log(err));
});

router.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// James' Menu Side, localhost:5000/admin/menu/_____ stuff - 24/7/2022

router.get('/listMenus', ensureAuthenticated, ensureAuthorized, (req, res) => {
    Menu.findAll({
        order: [['price']],
        raw: true
    })
        .then((menus) => {
            // pass object to listMenus.handlebar
            res.render('admin/listMenus', { menus });
        })
        .catch(err => console.log(err));
});

router.get('/addMenu', ensureAuthenticated, ensureAuthorized, (req, res) => {
    res.render('admin/addMenu');
});

router.post('/addMenu', ensureAuthenticated, (req, res) => {
    let name = req.body.name;
    let description = req.body.description.slice(0, 1999);
    let price = req.body.price;
    let posterURL = req.body.posterURL;
    let userId = req.user.id;

    Menu.create(
        { name, description, price, posterURL, userId }
    )
        .then((menu) => {
            console.log(menu.toJSON());
            res.redirect('/admin/listMenus');
        })
        .catch(err => console.log(err))
});

router.get('/editMenu/:id', ensureAuthenticated, ensureAuthorized, (req, res) => {
    Menu.findByPk(req.params.id)
        .then((menu) => {
            if (!menu) {
                flashMessage(res, 'error', 'Menu does not exist');
                res.redirect('/admin/listMenus');
                return;
            }
            if (req.user.id != menu.userId) {
                flashMessage(res, 'error', 'Unauthorised access');
                res.redirect('/admin/listMenus');
                return;
            }

            res.render('admin/editMenu', { menu });
        })
        .catch(err => console.log(err));
});

router.post('/editMenu/:id', ensureAuthenticated, ensureAuthorized, (req, res) => {
    let name = req.body.name;
    let description = req.body.description.slice(0, 1999);
    let price = req.body.price;
    let posterURL = req.body.posterURL;

    Menu.update(
        { name, description, price, posterURL },
        { where: { id: req.params.id } }
    )
        .then((result) => {
            console.log(result[0] + ' menu updated');
            res.redirect('/admin/listMenus');
        })
        .catch(err => console.log(err));
});

router.get('/deleteMenu/:id', ensureAuthenticated, ensureAuthorized, async function (req, res) {
    try {
        let menu = await Menu.findByPk(req.params.id);
        if (!menu) {
            flashMessage(res, 'error', 'Menu does not exist');
            res.redirect('/admin/listMenus');
            return;
        }
        if (req.user.id != menu.userId) {
            flashMessage(res, 'error', 'Unauthorised access');
            res.redirect('/admin/listMenus');
            return;
        }

        let result = await Menu.destroy({ where: { id: menu.id } });
        console.log(result + ' menu deleted');
        res.redirect('/admin/listMenus');
    }
    catch (err) {
        console.log(err);
    }
});

router.post('/upload', ensureAuthenticated, ensureAuthorized, (req, res) => {
    // Creates user id directory for upload if not exist
    if (!fs.existsSync('./public/uploads/' + req.user.id)) {
        fs.mkdirSync('./public/uploads/' + req.user.id, { recursive: true });
    }

    upload(req, res, (err) => {
        if (err) {
            // e.g. File too large
            res.json({ file: '/img/no-image.jpg', err: err });
        }
        else {
            res.json({ file: `/uploads/${req.user.id}/${req.file.filename}` });
        }
    });
});

router.get('/registerAdmin', ensureAuthenticated, ensureAuthorized, (req, res) => {
    res.render('admin/registerAdmin');
});

router.post('/registerAdmin', ensureAuthenticated, ensureAuthorized, async function (req, res) {
    let { name, email, password, password2, status, posterURL } = req.body;

    let isValid = true;
    if (password.length < 6) {
        flashMessage(res, 'error', 'Password must be at least 6 characters');
        isValid = false;
    }
    if (password != password2) {
        flashMessage(res, 'error', 'Passwords do not match');
        isValid = false;
    }
    if (!isValid) {
        res.render('admin/registerAdmin', {
            name, email
        });
        return;
    }

    try {
        // If all is well, checks if user is already registered
        let user = await Users.findOne({ where: { email: email } });
        if (user) {
            // If user is found, that means email has already been registered
            flashMessage(res, 'error', email + ' already registered');
            res.render('admin/registerAdmin', {
                name, email
            });
        }
        else {
            // Create new user record 
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password, salt);
            // Use hashed password
            let user = await Users.create({ name, email, status, password: hash, posterURL, verified: 0 });
            // Send email
            let token = jwt.sign(email, process.env.APP_SECRET);
            let url = `${process.env.BASE_URL}:${process.env.PORT}/verify/${user.id}/${token}`;
            sendEmail("donyeozhiwei@gmail.com", url)
                .then(response => {
                    console.log(response);
                    flashMessage(res, 'success', user.email + ' registered successfully');
                    res.redirect('/admin/listAcc');
                })
                .catch(err => {
                    console.log(err);
                    flashMessage(res, 'error', 'Error when sending email to ' + user.email);
                    res.redirect('admin/registerAdmin');
                });
        }
    }
    catch (err) {
        console.log(err);
    }
});

module.exports = router;