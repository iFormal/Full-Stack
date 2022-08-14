const express = require('express');
const router = express.Router();
const moment = require('moment');
const Cart = require('../models/Cart');
const Order = require('../models/Order')
const ensureAuthenticated = require('../helpers/auth');
const flashMessage = require('../helpers/messenger');
require('dotenv').config();

const fs = require('fs');
const products = JSON.parse(fs.readFileSync('./data/product.json', 'utf8'));

router.get('/listProduct', ensureAuthenticated, (req, res) => {
    Cart.findAll({
        where: { userId: req.user.id },
        raw: true
    })
        .then((cart) => {
            // pass object to listProduct.handlebar
            var totalprice = 0;
            for (var index in cart) {
                totalprice += cart[index].price * cart[index].quantity
                console.log(totalprice)
            }
            res.render('order/listProduct', { cart, totalprice });
        })
        .catch(err => console.log(err));
});

router.get('/addProduct', ensureAuthenticated, (req, res) => {
    res.render('order/addProduct',
        {
            products: products
        });
});

router.post('/addProduct', ensureAuthenticated, (req, res) => {
    let name = req.body.name;
    let description = req.body.description;
    let quantity = req.body.quantity;
    let price = req.body.price;
    let userId = req.user.id;
    let productid = req.body.id;

    Cart.create(
        {
            name, description, quantity, price, userId, productid
        }
    )
        .then((cart) => {
            console.log(cart.toJSON());
            res.redirect('/order/listProduct',
            );
        })
        .catch(err => console.log(err))
    // }
});

router.get('/minusOne/:id', ensureAuthenticated, async function (req, res) {
    try {
        let cart = await Cart.findByPk(req.params.id);
        if (!cart) {
            flashMessage(res, 'error', 'Product not found');
            res.redirect('/order/listProduct');
            return;
        }
        if (req.user.id != cart.userId) {
            flashMessage(res, 'error', 'Unauthorised access');
            res.redirect('/order/listProduct');
            return;
        }
        let d = await Cart.increment({ quantity: -1 }, { where: { id: cart.id } });
        if (cart.quantity == 1) {
            let result = await Cart.destroy({ where: { id: cart.id } });
            console.log(result + ' product deleted');
            res.redirect('/order/listProduct');
        }
        res.redirect('/order/listProduct');
    }
    catch (err) {
        console.log(err);
    }
});

router.get('/addOne/:id', ensureAuthenticated, async function (req, res) {
    try {
        let cart = await Cart.findByPk(req.params.id);
        if (!cart) {
            flashMessage(res, 'error', 'Product not found');
            res.redirect('/order/listProduct');
            return;
        }
        if (req.user.id != cart.userId) {
            flashMessage(res, 'error', 'Unauthorised access');
            res.redirect('/order/listProduct');
            return;
        }
        let d = await Cart.increment({ quantity: 1 }, { where: { id: cart.id } });
        console.log(d + ' product mius 1');
        res.redirect('/order/listProduct');
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
            res.redirect('/order/listProduct');
            return;
        }
        if (req.user.id != cart.userId) {
            flashMessage(res, 'error', 'Unauthorised access');
            res.redirect('/order/listProduct');
            return;
        }
        let result = await Cart.destroy({ where: { id: cart.id } });
        console.log(result + ' product deleted');
        res.redirect('/order/listProduct');
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
            res.render('order/receipt', { order });
        })
        .catch(err => console.log(err));
});

router.post('/listProduct', ensureAuthenticated, (req, res) => {
    let name = req.body.name;
    let quantity = req.body.quantity;
    let cart = [name,'X',quantity];
    let totalprice = req.body.totalprice;
    let userId = req.user.id;

    Order.create(
        {
            cart, totalprice, userId
        }
    )
        .then((order) => {
            console.log(order.toJSON());
            res.redirect('/order/receipt',);
            Cart.destroy(
                {
                    where : {},
                    truncate: true
                }
            );
        })
        .catch(err => console.log(err))
});

module.exports = router;