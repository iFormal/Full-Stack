const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create stores table in MySQL Database
const Menu = db.define('menu',
    {
        name: { type: Sequelize.STRING },
        description: { type: Sequelize.STRING(2000) },
        price: { type: Sequelize.DOUBLE },
        posterURL: { type: Sequelize.STRING },
    });

module.exports = Menu;