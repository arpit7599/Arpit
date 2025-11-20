const mongoose = require('mongoose');

const PersonalSchema = new mongoose.Schema({
  name: String,
  relation: String,
  phone: String
}, { timestamps: true });

module.exports = mongoose.model('Personal', PersonalSchema);