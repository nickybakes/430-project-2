const models = require('../models');
const AccountModel = require('../models/Account');

const { Account, Channel } = models;

// gives us the log in page
const loginPage = (req, res) => {
  res.render('login', { csrfToken: req.csrfToken() });
};

// logs us out of our current session
const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

// when the user wants to log in, this verifies their
// info is correct and if so logs them in
const login = (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;

  if (!username || !pass) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  // if account athentication fails, send back an error message
  return Account.authenticate(username, pass, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong username or password!' });
    }

    req.session.account = Account.toAPI(account);

    return res.json({ redirect: '/app' });
  });
};

// makes a new channel for pastes and returns it
const makeNewChannel = async (index, req) => {
  const newChannel = new Channel({ index, name: (`Channel ${index + 1}`), owner: req.session.account });
  await newChannel.save();
  return newChannel;
};

// when the user signs up for a new account
const signup = async (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;
  const pass2 = `${req.body.pass2}`;

  // checks if the info is all there/correct
  if (!username || !pass || !pass2) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  if (pass !== pass2) {
    return res.status(400).json({ error: 'Passwords do not match!' });
  }

  try {
    // tries to make a new account with the proper data
    const hash = await Account.generateHash(pass);

    const newAccount = new Account({ username, password: hash });
    await newAccount.save();
    req.session.account = Account.toAPI(newAccount);

    // all accounts start with 2 default channels
    makeNewChannel(0, req);
    makeNewChannel(1, req);

    return res.json({ redirect: '/app' });
  } catch (err) {
    console.log(err);

    // the error if the user name is already in use
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already in use.' });
    }
    return res.status(400).json({ error: 'An error occured' });
  }
};

// changes the users password, does the hash and everything
const passwordChange = async (req, res) => {
  const newHash = await Account.generateHash(req.body.pass);

  Account.updateOne({
    _id: req.session.account._id,
  }, {
    password: newHash,
  }, (err) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occured' });
    }
    return res.status(204).json({ message: 'Password updated!' });
  });
};

// gets whether the user's account has premium or not
const getPremium = (req, res) => {
  AccountModel.findOne({
    _id: req.session.account._id,
  }, (err, docs) => {
    if (err) {
      console.log(err);
      res.status(400).json({ error: 'An error occured' });
    } else {
      res.status(200).json({ isPremium: docs.isPremium });
    }
  });
};

// sets the user's account to premium
// and gives them the extra channels!
const purchasePremium = async (req, res) => {
  try {
    await AccountModel.updateOne({
      _id: req.session.account._id,
      isPremium: false,
    }, {
      isPremium: true,
    });

    makeNewChannel(2, req);
    makeNewChannel(3, req);
    makeNewChannel(4, req);
    res.status(204).json({ error: 'Purchased premium!' });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: 'An error occured, you may already be premium!' });
  }
};

// gets the current csrf token
const getToken = (req, res) => res.json({ csrfToken: req.csrfToken() });

module.exports = {
  loginPage,
  login,
  logout,
  signup,
  getToken,
  passwordChange,
  getPremium,
  purchasePremium,
};
