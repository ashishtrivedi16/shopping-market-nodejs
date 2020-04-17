const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-app', 'root', 'rootpassword', {
  dialect: 'mysql',
  host: 'localhost'
});

module.exports = sequelize;
