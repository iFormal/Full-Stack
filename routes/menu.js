const express = require('express');
const router = express.Router();
const moment = require('moment');
const Menu = require('../models/Menu');
const ensureAuthenticated = require('../helpers/auth');
const flashMessage = require('../helpers/messenger');
require('dotenv').config();
const fetch = require('node-fetch');
// Required for file upload 
const fs = require('fs');
const upload = require('../helpers/imageUpload');

router.get('/listMenus', (req, res) => {
    Menu.findAll({
        order: [['price']],
        raw: true
    })
        .then((menus) => {
            // pass object to listMenus.handlebar
            res.render('menu/listMenus', { menus });
        })
        .catch(err => console.log(err));
});

router.get('/listMenus2', (req, res) => {
    Menu.findAll({
        order: [['price']],
        raw: true
    })
        .then((menus) => {
            // pass object to listMenus.handlebar
            res.render('menu/listMenus2', { menus });
        })
        .catch(err => console.log(err));
});

router.get('/addMenu', ensureAuthenticated, (req, res) => {
    res.render('menu/addMenu');
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
            res.redirect('/menu/listMenus');
        })
        .catch(err => console.log(err))
});

router.get('/editMenu/:id', ensureAuthenticated, (req, res) => {
    Menu.findByPk(req.params.id)
        .then((menu) => {
            if (!menu) {
                flashMessage(res, 'error', 'Menu does not exist');
                res.redirect('/menu/listMenus');
                return;
            }
            if (req.user.id != menu.userId) {
                flashMessage(res, 'error', 'Unauthorised access');
                res.redirect('/menu/listMenus');
                return;
            }

            res.render('menu/editMenu', { menu });
        })
        .catch(err => console.log(err));
});

router.post('/editMenu/:id', ensureAuthenticated, (req, res) => {
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
            res.redirect('/menu/listMenus');
        })
        .catch(err => console.log(err));
});

router.get('/deleteMenu/:id', ensureAuthenticated, async function (req, res) {
    try {
        let menu = await Menu.findByPk(req.params.id);
        if (!menu) {
            flashMessage(res, 'error', 'Menu does not exist');
            res.redirect('/menu/listMenus');
            return;
        }
        if (req.user.id != menu.userId) {
            flashMessage(res, 'error', 'Unauthorised access');
            res.redirect('/menu/listMenus');
            return;
        }

        let result = await Menu.destroy({ where: { id: menu.id } });
        console.log(result + ' menu deleted');
        res.redirect('/menu/listMenus');
    }
    catch (err) {
        console.log(err);
    }
});

router.post('/upload', ensureAuthenticated, (req, res) => {
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