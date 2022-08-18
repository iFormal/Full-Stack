const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create stores table in MySQL Database
const Store = db.define('store',
    {
        name: { type: Sequelize.STRING(40) },
        category: { type: Sequelize.STRING(20) },
        posterURL: { type: Sequelize.STRING(255) },
    });

module.exports = Store;