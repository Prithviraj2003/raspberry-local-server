const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const ProfileImg = require("./ProfileImg");

const User = sequelize.define("User", {
  prn: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  phoneNumber: { type: DataTypes.BIGINT, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  DOB: { type: DataTypes.STRING, allowNull: false },
  bloodGroup: { type: DataTypes.STRING, allowNull: false },
  AdmissionYear: { type: DataTypes.STRING, allowNull: false },
  Department: { type: DataTypes.STRING, allowNull: false },
  validTill: { type: DataTypes.STRING, allowNull: false },
  access: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: { mainGate: true, bus: false, hostel: false, library: true },
  },
  image: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "ProfileImgs", key: "id" },
  },
  pin: {
    type: DataTypes.INTEGER,
    defaultValue: 12345,
    allowNull: false,
  },
});

User.belongsTo(ProfileImg, { foreignKey: "image" });
ProfileImg.hasOne(User, { foreignKey: "image" });
module.exports = User;

// const mongoose = require("mongoose");

// const UserSchema = new mongoose.Schema({
//   prn: { type: String, required: true, unique: true },
//   name: { type: String, required: true },
//   phoneNumber: { type: Number, required: true },
//   address: { type: String, required: true },
//   DOB: { type: String, required: true },
//   bloodGroup: { type: String, required: true },
//   AdmissionYear: { type: String, required: true },
//   Department: { type: String, required: true },
//   validTill: { type: String, required: true },
//   access: {
//     type: Map,
//     of: Boolean,
//     default: { mainGate: true, bus: false, hostel: false, library: true },
//   },
//   image: {
//     type: mongoose.ObjectId,
//     ref: "ProfileImg",
//     required: false,
//     default: null,
//   },
// });

// module.exports = mongoose.model("User", UserSchema);
