const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
// Create videos table in MySQL Database
const Promotion = db.define('promotion',
    {
        name: { type: Sequelize.STRING(30) },
        discount: { type: Sequelize.INTEGER },
        storeid: { type: Sequelize.STRING(2) },
        menuid: { type: Sequelize.STRING(2) },
        posterURL: { type: Sequelize.STRING(255) },
        dateRelease: { type: Sequelize.DATE },
    });
module.exports = Promotion;