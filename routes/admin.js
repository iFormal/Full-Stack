const express = require('express');
const ensureAuthenticated = require('../helpers/auth');
const ensureAuthorized = require('../helpers/auth');
const router = express.Router();
const Users = require('../models/User');
const flashMessage = require('../helpers/messenger');
const flash = require('flash');
const Menu = require('../models/Menu');
const fs = require('fs');
const upload = require('../helpers/imageUpload');
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

module.exports = router;