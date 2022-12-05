const models = require('../models');
const PasteModel = require('../models/Paste');

const { Paste } = models;

// gives us the page for the main app
const appPage = (req, res) => res.render('app');

// grabs all pastes by a certain user, within the requested channel index
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

// creates a new paste
// gives it the data of the channel its in and what user owns it
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

// deletes a paste from the data base by searching for
// that paste's ID
const deletePaste = async (req, res) => {
  try {
    await Paste.deleteOne({
      _id: req.body.id,
    });
    return res.status(204).json({ message: 'Paste deleted!' });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: 'An error occured!' });
  }
};

module.exports = {
  appPage,
  getPastes,
  makePaste,
  deletePaste,
};
