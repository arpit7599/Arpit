const mongoose = require('mongoose');

const FakeCallSchema = new mongoose.Schema({
  caller: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FakeCall', FakeCallSchema);