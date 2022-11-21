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

ChannelSchema.statics.findByOwner = (ownerId, callback) => {
  const search = {
    owner: mongoose.Types.ObjectId(ownerId),
  };

  return ChannelModel.find(search).select('index name').lean().exec(callback);
};

ChannelModel = mongoose.model('Channel', ChannelSchema);
module.exports = ChannelModel;
