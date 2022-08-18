const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create stores table in MySQL Database
const Menu = db.define('menu',
    {
        name: { type: Sequelize.STRING(40) },
        description: { type: Sequelize.STRING(200) },
        price: { type: Sequelize.DOUBLE },
        posterURL: { type: Sequelize.STRING(255) },
    });

module.exports = Menu;