const models = require('../models');

const { Account, Channel } = models;

const loginPage = (req, res) => {
  res.render('login', { csrfToken: req.csrfToken() });
};

const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

const login = (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;

  if (!username || !pass) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  return Account.authenticate(username, pass, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong username or password!' });
    }

    req.session.account = Account.toAPI(account);

    return res.json({ redirect: '/app' });
  });
};

const signup = async (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;
  const pass2 = `${req.body.pass2}`;

  if (!username || !pass || !pass2) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  if (pass !== pass2) {
    return res.status(400).json({ error: 'Passwords do not match!' });
  }

  try {
    const hash = await Account.generateHash(pass);

    // wow i sure do love not being able to have for loops in a server!!
    const channels = [];

    let newChannel = new Channel({ index: 0, name: ('Channel 1'), messages: [] });
    await newChannel.save();
    channels.push(newChannel);

    newChannel = new Channel({ index: 1, name: ('Channel 2'), messages: [] });
    await newChannel.save();
    channels.push(newChannel);

    const newAccount = new Account({ username, password: hash, channels });
    await newAccount.save();
    req.session.account = Account.toAPI(newAccount);
    return res.json({ redirect: '/app' });
  } catch (err) {
    console.log(err);

    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already in use.' });
    }
    return res.status(400).json({ error: 'An error occured' });
  }
};

const getToken = (req, res) => res.json({ csrfToken: req.csrfToken() });

const getChannels = async (req, res) => {
  const channels = req.session.account.channels;

  return res.json({ channels });
};

module.exports = {
  loginPage,
  login,
  logout,
  signup,
  getToken,
  getChannels,
};
