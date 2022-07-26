const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create users table in MySQL Database
const User = db.define('user',
    {
        name: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
        verified: { type: Sequelize.BOOLEAN },
        password: { type: Sequelize.STRING },
        posterURL: { type: Sequelize.STRING}, 
        status: { type: Sequelize.STRING}
    });

module.exports = User;