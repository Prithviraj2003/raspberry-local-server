const {  DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const date = new Date().toISOString().split('T')[0];
console.log(date);
const Entry = sequelize.define(`${date}_Entry`, {
  prn: { type: DataTypes.STRING, allowNull: false },
  gate: { type: DataTypes.STRING, allowNull: false },
  entry: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  exit: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
  },
});

module.exports = Entry;













// const mongoose = require("mongoose");

// const EntrySchema = new mongoose.Schema({
//   date: { type: String, required: true },
//   userEntries: [
//     {
//       prn: { type: String, required: true },
//       entry: {
//         time: { type: Date, required: true },
//         presentAuthority: { type: String, required: true },
//       },
//       exit: {
//         time: { type: Date, required: false },
//         presentAuthority: { type: String, required: false },
//       },
//     },
//   ],
//   visitorEntries: [
//     {
//       name: { type: String, required: true },
//       phoneNumber: { type: Number, required: false },
//       numberOfVisitors: { type: Number, required: true },
//       purpose: { type: String, required: true },
//       entry: {
//         time: { type: Date, required: true },
//         presentAuthority: { type: String, required: true },
//       },
//       exit: {
//         time: { type: Date, required: false },
//         presentAuthority: { type: String, required: false },
//       },
//     },
//   ],
// });

// module.exports = mongoose.model("Entry", EntrySchema);
