const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Menu = require('../models/Menu');
const Promotion = require('../models/Promotion');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Store = require('../models/Store')
const flashMessage = require('../helpers/messenger');
const ensureAuthenticated = require('../helpers/authenticate');
const fs = require('fs'); 1
const upload = require('../helpers/imageUpload');

// router.get('/listMenus2/:id', ensureAuthenticated, (req, res) => {
//     Menu.findAll({
//         order: [['price']],
//         raw: true
//     })
//         .then((menus) => {
//             res.render('user/listMenus2/:id', { menus });
//         })
//         .catch(err => console.log(err));
// });

router.get('/listMenus2/:id', ensureAuthenticated, (req, res) => {
    Store.findByPk(req.params.id)
        .then((store) => {
            Menu.findAll({
                where: { storeId: req.params.id },
                raw: true
            })
                .then((menu) => {
                    res.render('user/listMenus2', { store, menu });
                })
        })
        .catch(err => console.log(err));
});

// router.post('/listMenus2/:id')

router.post('/listMenus2/:id', ensureAuthenticated, (req, res) => {
    let name = req.body.name;
    let quantity = 1;
    let price = req.body.price;
    let userId = req.user.id;
    let productid = req.body.id;

    Cart.create(
        {
            name, quantity, price, userId, productid
        }
    )
        .then((cart) => {
            console.log(cart.toJSON());
            flashMessage(res, 'success', name + ' added to cart');
            Store.findByPk(req.params.id)
                .then((store) => {
                    Menu.findAll({
                        where: { storeId: req.params.id },
                        raw: true
                    })
                        .then((menu) => {
                            res.render('user/listMenus2', { store, menu });
                        })
                })
        })
        .catch(err => console.log(err))
});

router.get('/listStores2', ensureAuthenticated, (req, res) => {
    Store.findAll({
        raw: true
    })
        .then((stores) => {
            res.render('user/listStores2', { stores })
        })
})

router.get('/profile/:id', ensureAuthenticated, (req, res) => {
    User.findByPk(req.params.id)
        .then((users) => {
            Order.findAll({
                where: { userId: req.params.id },
                raw: true
            })
                .then((orders) => {
                    if (users.id != req.user.id) {
                        flashMessage(res, 'error', "Unauthorized Access to other's profiles.");
                        res.redirect('/user/home');
                    }
                    res.render('user/profile', { users, orders });
                })
        })
        .catch(err => console.log(err));
});

router.get('/profile/editProfile/:id', ensureAuthenticated, (req, res) => {
    User.findByPk(req.params.id)
        .then((user) => {
            res.render('user/editProfile', { user })
        })
        .catch(err => console.log(err));
})

router.post('/profile/editProfile/:id', async function (req, res) {
    let name = req.body.name;
    let email = req.body.email;
    let posterURL = req.body.posterURL;
    let address = req.body.address;

    try {
        // If all is well, checks if user is already registered
        let user = await User.findOne({ where: { email: email } });
        if (user.email != email) {
            // If user is found, that means email has already been registered
            flashMessage(res, 'error', email + ' is already registered. Please try again.');
            res.render('user/editProfile', {
                name, posterURL

            });
        }
        else {
            // Create new user record
            User.update(
                { name, posterURL, email, address },
                { where: { id: req.params.id } }
            )
                .then((result) => {
                    console.log(result[0] + ' user updated!');
                    flashMessage(res, 'success', name + '\'s profile has been updated!');
                    res.redirect('/user/profile/:id');
                })
        }
    }
    catch (err) {
        console.log(err);
    }
});

router.get('/home', (req, res) => {
    res.render('user/home', { title: title })
    // title is defined, sent into the index.handlebars, {title thingamajig} sends const title into index.
});

router.get('/listProduct', ensureAuthenticated, (req, res) => {
    Cart.findAll({
        where: { userId: req.user.id },
        raw: true
    })
        .then((cart) => {
            User.findAll({
                where: { id: req.user.id },
                raw: true
            })
                .then((users) => {
                    Promotion.findAll({
                        order: [['dateRelease', 'DESC']],
                        raw: true
                    })
                        .then((promotions) => {
                            // pass object to listProduct.handlebar
                            var totalprice = 0;
                            var discount = 1;
                            for (var index in cart) {
                                for (var x in promotions) {
                                    if (promotions[x].menuid == cart[index].productid) {
                                        var discount = (100 - promotions[x].discount)/100;
                                        console.log(promotions[x].discount)
                                        console.log(discount);
                                        break;
                                    }
                                    else {
                                        var discount = 1;
                                    }
                                }
                                totalprice += cart[index].price * cart[index].quantity * discount
                                console.log(totalprice)
                            }
                            res.render('user/listProduct', { cart, totalprice, users, discount});
                        })
                        .catch(err => console.log(err));
                })
                .catch(err => console.log(err));
        })
});

router.get('/minusQuantity/:id', ensureAuthenticated, async function (req, res) {
    try {
        let cart = await Cart.findByPk(req.params.id);
        if (!cart) {
            flashMessage(res, 'error', 'Product not found');
            res.redirect('/user/listProduct');
            return;
        }
        if (req.user.id != cart.userId) {
            flashMessage(res, 'error', 'Unauthorised access');
            res.redirect('/user/listProduct');
            return;
        }
        let d = await Cart.increment({ quantity: -1 }, { where: { id: cart.id } });
        if (cart.quantity == 1) {
            let result = await Cart.destroy({ where: { id: cart.id } });
            console.log(result + ' product deleted');
            res.redirect('/user/listProduct');
        }
        res.redirect('/user/listProduct');
    }
    catch (err) {
        console.log(err);
    }
});

router.get('/addQuantity/:id', ensureAuthenticated, async function (req, res) {
    try {
        let cart = await Cart.findByPk(req.params.id);
        if (!cart) {
            flashMessage(res, 'error', 'Product not found');
            res.redirect('/user/listProduct');
            return;
        }
        if (req.user.id != cart.userId) {
            flashMessage(res, 'error', 'Unauthorised access');
            res.redirect('/user/listProduct');
            return;
        }
        if (cart.quantity < 10) {
            let d = await Cart.increment({ quantity: 1 }, { where: { id: cart.id } });
            res.redirect('/user/listProduct');
        }
    }
    catch (err) {
        console.log(err);
    }
});

router.get('/deleteProduct/:id', ensureAuthenticated, async function (req, res) {
    try {
        let cart = await Cart.findByPk(req.params.id);
        if (!cart) {
            flashMessage(res, 'error', 'Product not found');
            res.redirect('/user/listProduct');
            return;
        }
        if (req.user.id != cart.userId) {
            flashMessage(res, 'error', 'Unauthorised access');
            res.redirect('/user/listProduct');
            return;
        }
        let result = await Cart.destroy({ where: { id: cart.id } });
        console.log(result + ' product deleted');
        res.redirect('/user/listProduct');
    }
    catch (err) {
        console.log(err);
    }
});

router.get('/receipt', ensureAuthenticated, (req, res) => {
    Order.findAll({
        where: { userId: req.user.id },
        raw: true
    })
        .then((order) => {
            // pass object to receipt.handlebar
            res.render('user/receipt', { order });
        })
        .catch(err => console.log(err));
});

router.get('/review', ensureAuthenticated, (req, res) =>{
    User.findAll({
        where: { id: req.user.id },
        raw: true
    })
    .then((users) => 
    {
        res.render('user/review', { users });
    })
});

router.post('/review', ensureAuthenticated, (req, res) => {
    let rating = req.body.rating;
    let feedback = req.body.feedback;
    console.log(req.body.rating);
    console.log(req.body.feedback);
    console.log(req.body.email);

    User.update(
        { rating, feedback},
        { where: {email: req.body.email}}
    )
    .then((result) => {
        console.log(result[0] + ' user updated!');
        flashMessage(res, 'success', 'Review successfully sent!');
        res.redirect('/');
    })

});

router.post('/listProduct', ensureAuthenticated, (req, res) => {
    let name = req.body.name;
    let quantity = req.body.quantity;
    const cart = (name.map((value, index) => ([value, quantity[index]])));
    let totalprice = req.body.totalprice;
    let userId = req.user.id;

    Order.create(
        {
            cart, totalprice, userId
        }
    )
        .then((order) => {
            console.log(order.toJSON());
            res.redirect('/user/receipt',);
            Cart.destroy(
                {
                    where: {
                        userId: userId
                    },
                }
            );
        })
        .catch(err => console.log(err))
});

// // Required for email verification
// require('dotenv').config();
// const jwt = require('jsonwebtoken');
// const sgMail = require('@sendgrid/mail');

// function sendEmail(toEmail, url) {
//     sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//     const message = {
//         to: toEmail,
//         from: `South Canteen <${process.env.SENDGRID_SENDER_EMAIL}>`,
//         subject: 'Verify South Canteen Account',
//         html: `Thank you registering with South Canteen.<br><br> Please <a href=\"${url}"><strong>verify</strong></a> your account.`
//     };

//     // Returns the promise from SendGrid to the calling function
//     return new Promise((resolve, reject) => {
//         sgMail.send(message)
//             .then(response => resolve(response))
//             .catch(err => reject(err));
//     });
// }

// router.get('/login', (req, res) => {
//     res.render('user/login');
// });

// router.get('/register', (req, res) => {
//     res.render('user/register');
// });

// router.post('/register', async function (req, res) {
//     let { name, email, password, password2 } = req.body;

//     let isValid = true;
//     if (password.length < 6) {
//         flashMessage(res, 'error', 'Password must be at least 6 char-acters');
//         isValid = false;
//     }
//     if (password != password2) {
//         flashMessage(res, 'error', 'Passwords do not match');
//         isValid = false;
//     }
//     if (!isValid) {
//         res.render('user/register', {
//             name, email
//         });
//         return;
//     }

//     try {
//         // If all is well, checks if user is already registered
//         let user = await User.findOne({ where: { email: email } });
//         if (user) {
//             // If user is found, that means email has already been registered
//             flashMessage(res, 'error', email + ' already registered');
//             res.render('user/register', {
//                 name, email
//             });
//         }
//         else {
//             // Create new user record 
//             var salt = bcrypt.genSaltSync(10);
//             var hash = bcrypt.hashSync(password, salt);
//             // Use hashed password
//             let user = await User.create({ name, email, password: hash, verified: 0 });
//             // Send email
//             let token = jwt.sign(email, process.env.APP_SECRET);
//             let url = `${process.env.BASE_URL}:${process.env.PORT}/user/verify/${user.id}/${token}`;
//             sendEmail(user.email, url)
//                 .then(response => {
//                     console.log(response);
//                     flashMessage(res, 'success', user.email + ' registered successfully');
//                     res.redirect('/user/login');
//                 })
//                 .catch(err => {
//                     console.log(err);
//                     flashMessage(res, 'error', 'Error when sending email to ' + user.email);
//                     res.redirect('/');
//                 });
//         }
//     }
//     catch (err) {
//         console.log(err);
//     }
// });

// router.get('/verify/:userId/:token', async function (req, res) {
//     let id = req.params.userId;
//     let token = req.params.token;

//     try {
//         // Check if user is found
//         let user = await User.findByPk(id);
//         if (!user) {
//             flashMessage(res, 'error', 'User not found');
//             res.redirect('/user/login');
//             return;
//         }
//         // Check if user has been verified
//         if (user.verified) {
//             flashMessage(res, 'info', 'User already verified');
//             res.redirect('/user/login');
//             return;
//         }
//         // Verify JWT token sent via URL 
//         let authData = jwt.verify(token, process.env.APP_SECRET);
//         if (authData != user.email) {
//             flashMessage(res, 'error', 'Unauthorised Access');
//             res.redirect('/user/login');
//             return;
//         }

//         let result = await User.update(
//             { verified: 1 },
//             { where: { id: user.id } });
//         console.log(result[0] + ' user updated');
//         flashMessage(res, 'success', user.email + ' verified. Please login');
//         res.redirect('/user/login');
//     }
//     catch (err) {
//         console.log(err);
//     }
// });

// router.post('/login', (req, res, next) => {
//     passport.authenticate('local', {
//         // Success redirect URL
//         successRedirect: '/menu/listMenus',
//         // Failure redirect URL 
//         failureRedirect: '/user/login',
//         /* Setting the failureFlash option to true instructs Passport to flash 
//         an error message using the message given by the strategy's verify callback.
//         When a failure occur passport passes the message object as error */
//         failureFlash: true
//     })(req, res, next);
// });

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

router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

module.exports = router;
