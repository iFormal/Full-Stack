const mySQLDB = require('./DBConfig');
const User = require('../models/User');
const Menu = require('../models/Menu');

// If drop is true, all existing tables are dropped and recreated 
const setUpDB = (drop) => {
    mySQLDB.authenticate()
        .then(() => {
            console.log('Database connected');
            /* 
            Defines the relationship where a user has many menus. 
            The primary key from user will be a foreign key in menu. 
            */
            User.hasMany(Menu);
            Menu.belongsTo(User);
            mySQLDB.sync({
                force: drop
            });
        })
        .catch(err => console.log(err));
};

module.exports = { setUpDB };