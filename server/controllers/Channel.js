const ChannelModel = require('../models/Channel');

// gets all the channels owned by a specific user id
const getChannels = (req, res) => ChannelModel.findByOwner(req.session.account._id, (err, docs) => {
  if (err) {
    console.log(err);
    return res.status(400).json({ error: 'An error occurred!' });
  }

  return res.json({ channels: docs });
});

// renames a singular channel after checking if it even exists
const renameSpecificChannel = async (req, res, _index) => {
  if (req.body.newNames[_index]) {
    try {
      await ChannelModel.updateOne({
        index: _index,
        owner: req.session.account._id,
      }, {
        name: req.body.newNames[_index],
      });
    } catch (err) {
      console.log(err);
    }
  }
};

// the Rename channels dialog renames any channels
// the user owns, so we just search for each one
// up to 5 here
const renameChannels = (req, res) => {
  renameSpecificChannel(req, res, 0);
  renameSpecificChannel(req, res, 1);
  renameSpecificChannel(req, res, 2);
  renameSpecificChannel(req, res, 3);
  renameSpecificChannel(req, res, 4);

  return res.status(204).json({ message: 'Updated!' });
};

module.exports = {
  getChannels,
  renameChannels,
};
