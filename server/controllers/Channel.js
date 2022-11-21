const ChannelModel = require('../models/Channel');

const getChannels = (req, res) => ChannelModel.findByOwner(req.session.account._id, (err, docs) => {
  if (err) {
    console.log(err);
    return res.status(400).json({ error: 'An error occurred!' });
  }

  return res.json({ channels: docs });
});

module.exports = {
  getChannels,
};
