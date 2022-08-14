const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create videos table in MySQL Database
const Order = db.define('order',
    {
        cart: {type: Sequelize.JSON},
        totalprice: {type: Sequelize.DECIMAL(10, 2)},
        status: { type: Sequelize.INTEGER(1)}
    });

module.exports = Order;