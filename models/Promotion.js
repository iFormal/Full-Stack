const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
// Create videos table in MySQL Database
const Promotion = db.define('promotion',
    {
        name: { type: Sequelize.STRING },
        discount: { type: Sequelize.INTEGER },
        storeid: { type: Sequelize.STRING },
        menuid: { type: Sequelize.STRING },
        posterURL: { type: Sequelize.STRING },
        dateRelease: { type: Sequelize.DATE },
    });
module.exports = Promotion;