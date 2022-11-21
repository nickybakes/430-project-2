const models = require('../models');
const PasteModel = require('../models/Paste');

const { Paste } = models;

const appPage = (req, res) => res.render('app');

const getPastes = (req, res) => PasteModel.findByOwner(
  req.session.account._id,
  req.query.index,
  (err, docs) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred!' });
    }

    return res.json({ pastes: docs });
  },
);

const makePaste = async (req, res) => {
  const pasteData = {
    text: req.body.text,
    channel: req.body.channelIndex,
    owner: req.session.account._id,
  };

  try {
    const newPaste = new Paste(pasteData);
    await newPaste.save();

    return res.status(201).json({ text: newPaste.text });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: 'An error occured!' });
  }
};

module.exports = {
  appPage,
  getPastes,
  makePaste,
};
