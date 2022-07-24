const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create videos table in MySQL Database
const Cart = db.define('cart',
    {
        name: { type: Sequelize.STRING },
        description: { type: Sequelize.STRING },
        quantity: { type: Sequelize.INTEGER },
        price: { type: Sequelize.DECIMAL(10, 2) },
        productid: { type: Sequelize.STRING }
    });

module.exports = Cart;