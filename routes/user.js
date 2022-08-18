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
            console.log(users);
            Order.findAll({
                where: { userId: req.params.id },
                raw: true
            })
                .then((orders) => {
                    console.log(users.id);
                    console.log(req.params.id);
                    if (users.id != req.user.id) {
                        flashMessage(res, 'error', "Unauthorized Access to other's profiles.");
                        res.redirect('/');
                    }
                    res.render('user/profile', { users, orders });
                })
        })
        .catch(err => console.log(err));
});

router.get('/editProfile/:id', ensureAuthenticated, (req, res) => {
    User.findByPk(req.params.id)
        .then((user) => {
            res.render('user/editProfile', { user })
        })
        .catch(err => console.log(err));
})

router.post('/editProfile/:id', async function (req, res) {
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
                    res.redirect('/');
                })
        }
    }
    catch (err) {
        console.log(err);
    }
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
                                        var discount = (100 - promotions[x].discount) / 100;
                                        break;
                                    }
                                    else {
                                        var discount = 1;
                                    }
                                }
                                totalprice += cart[index].price * cart[index].quantity * discount
                                console.log(totalprice)
                            }
                            res.render('user/listProduct', { cart, totalprice, users });
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

router.get('/review', ensureAuthenticated, (req, res) => {
    User.findAll({
        where: { id: req.user.id },
        raw: true
    })
        .then((users) => {
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
        { rating, feedback },
        { where: { email: req.body.email } }
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
