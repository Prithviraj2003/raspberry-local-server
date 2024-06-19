const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Visitors = sequelize.define("Visitors", {
  name: { type: DataTypes.STRING, allowNull: false },
  phoneNumber: { type: DataTypes.BIGINT, allowNull: false },
  numberOfVisitors: { type: DataTypes.INTEGER, allowNull: false },
  purpose: { type: DataTypes.STRING, allowNull: false },
  vehicleNumber: { type: DataTypes.STRING, allowNull: true },
  entry: { type: DataTypes.STRING, allowNull: false },
  exit: { type: DataTypes.STRING, allowNull: false },
  presentAuthority: { type: DataTypes.STRING, allowNull: false },
});

module.exports = Visitors;