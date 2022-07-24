const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
// Create videos table in MySQL Database
const Promotion = db.define('promotion',
    {
        title: { type: Sequelize.STRING },
        description: { type: Sequelize.STRING(2000) },
        storeowner: { type: Sequelize.STRING },
        posterURL: { type: Sequelize.STRING },
        dateRelease: { type: Sequelize.DATE }
    });
module.exports = Promotion;