const express = require('express');
const router = express.Router();
const User = require('../models/User');
const moment = require('moment');
const Promotion = require('../models/Promotion');
const Store = require('../models/Store');
const ensureAuthenticated = require('../helpers/authenticate');
const flashMessage = require('../helpers/messenger');
require('dotenv').config();
const fetch = require('node-fetch');
// Required for file upload
const fs = require('fs');
const upload = require('../helpers/imageUpload');
// Required for sending of promotional email
require('dotenv').config();
const jwt = require('jsonwebtoken');
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
            res.render('promotion/addPromotion', { stores });
        })
        .catch(err => console.log(err));
});

router.post('/addPromotion', (req, res) => {
    let name = req.body.name;
    let description = req.body.description.slice(0, 1999);
    let storeid = req.body.storeid;
    let posterURL = req.body.posterURL;
    let dateRelease = moment(req.body.dateRelease, 'DD/MM/YYYY');
    let userId = req.user.id;
    Promotion.create(
        {
            name, description, storeid, posterURL, dateRelease, userId
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
    
// router.get('/userInterface', (req, res) => {
//     Promotion.findAll({
//         order: [['dateRelease', 'DESC']],
//         raw: true
//     })
//         .then((promotions) => {
//             res.render('promotion/userInterface', { promotions });
//         })
//         .catch(err => console.log(err));
// });

router.get('/promotionalEmail', ensureAuthenticated, (req, res) => {
    res.render('promotion/promotionalEmail');
})

router.post('/promotionalEmail', (req, res) => {
    User.findAll({
        raw: true
    })
        .then((users) => {
            let isValid = true;
            if (!isValid) {
                flashMessage(res, 'error', 'Extra');
                res.render('promotionionalEmail')
            } else {
                try {
                    let email = User.findOne({ where: { email: email } });
                    // Send email
                    let token = jwt.sign(email, process.env.APP_SECRET);
                    let url = `${process.env.BASE_URL}:${process.env.PORT}/promotionalEmail/${id}/${token}`;
                    sendEmail(email, url)
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
            }
        })
})

router.get('/details/:id', ensureAuthenticated, (req, res) => {
    Store.findByPk(req.params.id)
        .then((stores) => {
            for (var x in stores) {
                if (req.id == x.id) {
                    res.redirect('../../user/listStores2');
                    return;
                }
            }
            flashMessage(res, 'error', 'Promotion not found');
            res.redirect('/promotion/userInterface');
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
                    res.render('promotion/editPromotion', { promotion, stores });
                })
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
});

router.post('/editPromotion/:id', ensureAuthenticated, (req, res) => {
    let name = req.body.name;
    let description = req.body.description.slice(0, 1999);
    let storeid = req.body.storeid;
    let posterURL = req.body.posterURL;
    let dateRelease = moment(req.body.dateRelease, 'DD/MM/YYYY');
    Promotion.update(
        {
            name, description, storeid, posterURL, dateRelease
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
        // if (req.user.id != promotion.userId) {
        //     flashMessage(res, 'error', 'Unauthorised access');
        //     res.redirect('/promotion/listPromotions');
        //     return;
        // }
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

function sendEmail(toEmail, url) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const message = {
        to: toEmail,
        from: `Video Jotter <${process.env.SENDGRID_SENDER_EMAIL}>`,
        subject: 'Verify Video Jotter Account',
        html: `Thank you registering with Video Jotter.<br><br> Please
    <a href=\"${url}"><strong>verify</strong></a> your account.`
    };
    // Returns the promise from SendGrid to the calling function
    return new Promise((resolve, reject) => {
        sgMail.send(message)
            .then(response => resolve(response))
            .catch(err => reject(err));
    });
}

module.exports = router;