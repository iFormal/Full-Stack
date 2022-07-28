const express = require('express');
const router = express.Router();
const User = require('../models/User');
const moment = require('moment');
const Promotion = require('../models/Promotion');
const ensureAuthenticated = require('../helpers/authenticate');
const flashMessage = require('../helpers/messenger');
require('dotenv').config();
const fetch = require('node-fetch');
// Required for file upload
const fs = require('fs');
const upload = require('../helpers/imageUpload');

router.get('/listPromotions', ensureAuthenticated, (req, res) => {
    Promotion.findAll({
        where: { userId: req.user.id },
        order: [['dateRelease', 'DESC']],
        raw: true
    })
        .then((promotions) => {
            // pass object to listPromotions.handlebar
            res.render('promotion/listPromotions', { promotions });
        })
        .catch(err => console.log(err));
});

router.get('/addPromotion', ensureAuthenticated, (req, res) => {
    res.render('promotion/addPromotion');
});

router.post('/addPromotion', (req, res) => {
    let title = req.body.title;
    let description = req.body.description.slice(0, 1999);
    let storeowner = req.body.storeowner;
    let posterURL = req.body.posterURL;
    let dateRelease = moment(req.body.dateRelease, 'DD/MM/YYYY');
    let userId = req.user.id;
    Promotion.create(
        {
            title, description, storeowner, posterURL, dateRelease, userId
        }
    )
        .then((promotion) => {
            console.log(promotion.toJSON());
            res.redirect('/promotion/listPromotions');
        })
        .catch(err => console.log(err))
});

router.get('/userInterface', (req, res) => {
    Promotion.findAll({
        order: [['dateRelease', 'DESC']],
        raw: true
    })
        .then((promotions) => {
            res.render('promotion/userInterface', { promotions });
        })
        .catch(err => console.log(err));
});

router.get('/details/:id', ensureAuthenticated, (req, res) => {
    Promotion.findByPk(req.params.id)
        .then((promotion) => {
            if (!promotion) {
                flashMessage(res, 'error', 'Promotion not found');
                res.redirect('/promotion/listPromotions');
                return;
            }
            res.render('promotion/details', { promotion });
        })
        .catch(err => console.log(err));
});

router.get('/editPromotion/:id', ensureAuthenticated, (req, res) => {
    Promotion.findByPk(req.params.id)
        .then((promotion) => {
            if (!promotion) {
                flashMessage(res, 'error', 'Promotion not found');
                res.redirect('/promotion/listPromotions');
                return;
            }
            if (req.user.id != promotion.userId) {
                flashMessage(res, 'error', 'Unauthorised access');
                res.redirect('/promotion/listPromotions');
                return;
            }
            res.render('promotion/editPromotion', { promotion });
        })
        .catch(err => console.log(err));
});

router.post('/editPromotion/:id', ensureAuthenticated, (req, res) => {
    let title = req.body.title;
    let description = req.body.description.slice(0, 1999);
    let storeowner = req.body.storeowner;
    let posterURL = req.body.posterURL;
    let dateRelease = moment(req.body.dateRelease, 'DD/MM/YYYY');
    Promotion.update(
        {
            title, description, storeowner, posterURL, dateRelease
        },
        { where: { id: req.params.id } }
    )
        .then((result) => {
            console.log(result[0] + ' promotion updated');
            res.redirect('/promotion/listPromotions');
        })
        .catch(err => console.log(err));
});

router.get('/deletePromotion/:id', ensureAuthenticated, async function
    (req, res) {
    try {
        let promotion = await Promotion.findByPk(req.params.id);
        if (!promotion) {
            flashMessage(res, 'error', 'Promotion not found');
            res.redirect('/promotion/listPromotions');
            return;
        }
        if (req.user.id != promotion.userId) {
            flashMessage(res, 'error', 'Unauthorised access');
            res.redirect('/promotion/listPromotions');
            return;
        }
        let result = await Promotion.destroy({ where: { id: promotion.id } });
        console.log(result + ' promotion deleted');
        res.redirect('/promotion/listPromotions');
    }
    catch (err) {
        console.log(err);
    }
});

router.get('/omdb', ensureAuthenticated, (req, res) => {
    let apikey = process.env.OMDB_API_KEY;
    let title = req.query.title;
    fetch(`https://www.omdbapi.com/?t=${title}&apikey=${apikey}`)
        .then(res => res.json())
        .then(data => {
            console.log(data);
            res.json(data);
        });
});

router.post('/upload', ensureAuthenticated, (req, res) => {
    // Creates user id directory for upload if not exist
    if (!fs.existsSync('./public/uploads/' + req.user.id)) {
        fs.mkdirSync('./public/uploads/' + req.user.id, {
            recursive:
                true
        });
    }
    upload(req, res, (err) => {
        if (err) {
            // e.g. File too large
            res.json({ file: '/img/no-image.jpg', err: err });
        }
        else {
            res.json({
                file: `/uploads/${req.user.id}/${req.file.filename}`
            });
        }
    });
});

module.exports = router;