const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create stores table in MySQL Database
const Menu = db.define('store',
    {
        name: { type: Sequelize.STRING },
        category: { type: Sequelize.STRING },
        posterURL: { type: Sequelize.STRING },
    });

module.exports = Menu;