const mongoose = require('mongoose');
const _ = require('underscore');

let PasteModel = {};

const setName = (name) => _.escape(name).trim();

// a Paste stores the text a user pasted in
// as well as the index of the channel its in
const PasteSchema = new mongoose.Schema({
  text:
  {
    type: String,
    required: true,
    trim: true,
    set: setName,
  },
  channel: {
    type: Number,
    min: 0,
    require: true,
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
PasteSchema.statics.toAPI = (doc) => ({
  text: doc.text,
});

// finds all pastes owned by a specific user id and
// within a requested channel index
PasteSchema.statics.findByOwner = (ownerId, channelIndex, callback) => {
  const search = {
    owner: mongoose.Types.ObjectId(ownerId),
    channel: channelIndex,
  };

  return PasteModel.find(search).select('text createdDate').lean().exec(callback);
};

PasteModel = mongoose.model('Paste', PasteSchema);
module.exports = PasteModel;
