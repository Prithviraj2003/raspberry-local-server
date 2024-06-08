// models/ProfileImg.js
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProfileImg = sequelize.define("ProfileImg", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    prn: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    img: {
        type: DataTypes.BLOB,
        allowNull: false,
    },
});

module.exports = ProfileImg;
