const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create videos table in MySQL Database
const Order = db.define('order',
    {
        cart: {type: Sequelize.STRING},
        totalprice: {type: Sequelize.DECIMAL(10, 2)}
    });

module.exports = Order;