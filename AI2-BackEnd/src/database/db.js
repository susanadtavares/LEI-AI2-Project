require('dotenv').config({ path: __dirname + '/../../.env' });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, 
    dialect: process.env.DB_DIALECT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: console.log,
    pool: {
        max: 15,
        min: 5,
        acquire: 60000,
        idle: 10000
      }
});

module.exports = sequelize;