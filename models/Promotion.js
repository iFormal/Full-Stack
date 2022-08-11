const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
// Create videos table in MySQL Database
const Promotion = db.define('promotion',
    {
        name: { type: Sequelize.STRING },
        description: { type: Sequelize.STRING(2000) },
        storeid: { type: Sequelize.STRING },
        posterURL: { type: Sequelize.STRING },
        dateRelease: { type: Sequelize.DATE },
        useremail : {type: Sequelize.STRING}
    });
module.exports = Promotion;