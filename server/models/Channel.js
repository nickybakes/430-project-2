const mongoose = require('mongoose');

let ChannelModel = {};

// a Channel stores its index, the name set by the user,
// and what user id owns it
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
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account',
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
});

// finds channels owned by a specific user id
ChannelSchema.statics.findByOwner = (ownerId, callback) => {
  const search = {
    owner: mongoose.Types.ObjectId(ownerId),
  };

  return ChannelModel.find(search).select('index name').lean().exec(callback);
};

ChannelModel = mongoose.model('Channel', ChannelSchema);
module.exports = ChannelModel;
