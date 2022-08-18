const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create users table in MySQL Database
const User = db.define('user',
    {
        name: { type: Sequelize.STRING(60) },
        email: { type: Sequelize.STRING(255) },
        verified: { type: Sequelize.BOOLEAN },
        password: { type: Sequelize.STRING(255) },
        posterURL: { type: Sequelize.STRING(255) }, 
        address: { type: Sequelize.STRING(60) },
        status: { type: Sequelize.INTEGER(1)},
        rating: {type: Sequelize.INTEGER(1)},
        feedback: {type: Sequelize.STRING(255) }
    });

module.exports = User;