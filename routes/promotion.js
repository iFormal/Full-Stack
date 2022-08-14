const express = require('express');
const router = express.Router();
const User = require('../models/User');
const moment = require('moment');
const Promotion = require('../models/Promotion');
const Store = require('../models/Store');
const Menu = require('../models/Menu');
const ensureAuthenticated = require('../helpers/authenticate');
const flashMessage = require('../helpers/messenger');
require('dotenv').config();
const fetch = require('node-fetch');
// Required for file upload
const fs = require('fs');
const upload = require('../helpers/imageUpload');
// Required for sending of promotional email
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

router.get('/listPromotions', ensureAuthenticated, (req, res) => {
    Promotion.findAll({
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
    Store.findAll({
        order: [['name']],
        raw: true
    })
        .then((stores) => {
            Menu.findAll({
                order: [['price']],
                raw: true
            })
                .then((menus) => {
                    res.render('promotion/addPromotion', { stores, menus });
                })
        })
        .catch(err => console.log(err));
});

router.post('/addPromotion', (req, res) => {
    let name = req.body.name;
    let discount = req.body.discount;
    let storeid = req.body.storeid;
    let menuid = req.body.menuid;
    let posterURL = req.body.posterURL;
    let dateRelease = moment(req.body.dateRelease, 'DD/MM/YYYY');
    let userId = req.user.id;
    Promotion.create(
        {
            name, discount, storeid, menuid, posterURL, dateRelease, userId
        }
    )
        .then((promotion) => {
            console.log(promotion.toJSON());
            res.redirect('/promotion/listPromotions');
        })
        .catch(err => console.log(err))
});

router.get('/userInterface', ensureAuthenticated, (req, res) => {
    Store.findAll({
        raw: true
    })
        .then((stores) => {
            Promotion.findAll({
                // where: { storeid: stores.id },
                raw: true
            })
                .then((promotions) => {
                    res.render('promotion/userInterface', { promotions, stores });
                })
        })
        .catch(err => console.log(err))
});

router.get('/promotionalEmail', ensureAuthenticated, (req, res) => {
    User.findAll({
        raw: true
    })
        .then((users) => {
            Promotion.findAll({
                order: [['dateRelease', 'DESC']],
                raw: true
            })
                .then((promotions) => {
                    // pass object to listPromotions.handlebar
                    res.render('promotion/promotionalEmail', { users, promotions });
                })
                .catch(err => console.log(err));
        })
})

router.post('/promotionalEmail', async function (req, res) {
    let { email, name } = req.body;
    try {
        let user = await User.findOne({ where: { email: email } });
        let url = `${process.env.BASE_URL}:${process.env.PORT}/login`;
        sendEmail(user.email, url, name)
            .then(response => {
                console.log(response);
                flashMessage(res, 'success', 'Email sent successfully');
                res.redirect('/promotion/promotionalEmail');
            })
            .catch(err => {
                console.log(err);
                flashMessage(res, 'error', 'Error when sending email');
                res.redirect('/promotion/promotionalEmail');
            });
    }
    catch (err) {
        console.log(err);
    }
})

router.get('/details/:id', ensureAuthenticated, (req, res) => {
    Store.findByPk(req.params.id)
        .then((stores) => {
            if (req.params.id == stores.id) {
                res.redirect('../../user/listMenus2/' + stores.id);
                return;
            }
            else {
                flashMessage(res, 'error', 'Promotion not found');
                res.redirect('/promotion/userInterface');
            }
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
            Store.findAll({
                order: [['name']],
                raw: true
            })
                .then((stores) => {
                    Menu.findAll({
                        order: [['price']],
                        raw: true
                    })
                        .then((menus) => {
                            res.render('promotion/editPromotion', { promotion, stores, menus });
                        })
                        .catch(err => console.log(err));
                })
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
});

router.post('/editPromotion/:id', ensureAuthenticated, (req, res) => {
    let name = req.body.name;
    let discount = req.body.discount;
    let storeid = req.body.storeid;
    let menuid = req.body.menuid;
    let posterURL = req.body.posterURL;
    let dateRelease = moment(req.body.dateRelease, 'DD/MM/YYYY');
    Promotion.update(
        {
            name, discount, storeid, menuid, posterURL, dateRelease
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

function sendEmail(toEmail, url, promotion) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const message = {
        to: toEmail,
        from: `South Canteen <${process.env.SENDGRID_SENDER_EMAIL}>`,
        subject: 'New Promotion',
        html: `A new promotion is available at South Canteen now.<br><br> Click
    <a href=\"${url}"><strong>${promotion}</strong></a> to check for more info.`
    };
    // Returns the promise from SendGrid to the calling function
    return new Promise((resolve, reject) => {
        sgMail.send(message)
            .then(response => resolve(response))
            .catch(err => reject(err));
    });
}

module.exports = router;