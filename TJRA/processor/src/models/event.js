const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  site_id: {
    type: String,
    required: true,
    index: true,
  },
  event_type: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
    index: true,
  },
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    required: true,
    index: true,
  },
});

module.exports = mongoose.model('Event', eventSchema);