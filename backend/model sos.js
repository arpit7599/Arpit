const mongoose = require('mongoose');

const SOSSchema = new mongoose.Schema({
  note: String,
  location: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SOS', SOSSchema);