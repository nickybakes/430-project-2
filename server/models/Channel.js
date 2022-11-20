const mongoose = require('mongoose');

let ChannelModel = {};

const ChannelSchema = new mongoose.Schema({
  index: {
    type: Number,
    min: 0,
    require: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  messages:
  {
    type: Array,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

// Converts a doc to something we can store in redis later on.
ChannelSchema.statics.toAPI = (doc) => ({
  index: doc.index,
  name: doc.name,
  messages: doc.messages,
});

ChannelModel = mongoose.model('Channel', ChannelSchema);
module.exports = ChannelModel;
