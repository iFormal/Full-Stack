const mySQLDB = require('./DBConfig');
const User = require('../models/User');
const Menu = require('../models/Menu');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Promotion = require('../models/Promotion');
const Store = require('../models/Store');

// If drop is true, all existing tables are dropped and recreated 
const setUpDB = (drop) => {
    mySQLDB.authenticate()
        .then(() => {
            console.log('Database connected');
            /* 
            Defines the relationship where a user has many menus. 
            The primary key from user will be a foreign key in menu. 
            */

            Store.hasMany(Menu);
            Menu.belongsTo(Store);
            mySQLDB.sync({
                force: drop
            });
            User.hasMany(Store);
            Store.belongsTo(User);
            mySQLDB.sync({
                force: drop
            });
            User.hasMany(Menu);
            Menu.belongsTo(User);
            mySQLDB.sync({
                force: drop
            });
            User.hasMany(Cart);
            Cart.belongsTo(User);
            mySQLDB.sync({
                force: drop
            });
            User.hasMany(Order);
            Order.belongsTo(User);
            mySQLDB.sync({
                force: drop
            });
            User.hasMany(Promotion);
            Promotion.belongsTo(User);
            mySQLDB.sync({
                force: drop
            });
        })
        .catch(err => console.log(err));
};



module.exports = { setUpDB };