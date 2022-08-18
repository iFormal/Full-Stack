const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create videos table in MySQL Database
const Cart = db.define('cart',
    {
        name: { type: Sequelize.STRING(40) },
        quantity: { type: Sequelize.INTEGER },
        price: { type: Sequelize.DECIMAL(10, 2) },
        productid: { type: Sequelize.STRING(100) }
    });

module.exports = Cart;