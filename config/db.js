const { Sequelize } = require('sequelize');
console.log(process.env.DATABASE_URL);
const sequelize = new Sequelize("postgresql://prithvi:Pr%409420268341@89.116.121.46:5432/college_security", {
  dialect: 'postgres',
  logging: false
});

module.exports = sequelize;