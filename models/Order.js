const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create videos table in MySQL Database
const Cart = db.define('cart',
    {
        cart: { type: Sequelize.JSON },
    });

module.exports = Cart;