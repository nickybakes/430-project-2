const controllers = require('./controllers');
const mid = require('./middleware');

// gets the page for 404 error
const notFoundPage = (req, res) => {
  res.render('notFound', { csrfToken: req.csrfToken() });
};

// gets us different pages and functions depending on the
// requested url
const router = (app) => {
  // gets us various things relating to parts of  the app
  // like channels, premium, pastes
  app.get('/getToken', mid.requiresSecure, controllers.Account.getToken);
  app.get('/getChannels', mid.requiresLogin, controllers.Channel.getChannels);
  app.get('/getPremium', mid.requiresLogin, controllers.Account.getPremium);
  app.post('/renameChannels', mid.requiresLogin, controllers.Channel.renameChannels);
  app.post('/passwordChange', mid.requiresLogin, controllers.Account.passwordChange);
  app.post('/purchasePremium', mid.requiresLogin, controllers.Account.purchasePremium);
  app.get('/getPastes', mid.requiresLogin, controllers.Paste.getPastes);
  app.post('/app', mid.requiresLogin, controllers.Paste.makePaste);
  app.delete('/app', mid.requiresLogin, controllers.Paste.deletePaste);

  // stuff to do with logging in and and out and signing up
  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);

  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  app.get('/logout', mid.requiresLogin, controllers.Account.logout);
  app.get('/app', mid.requiresLogin, controllers.Paste.appPage);

  // general stuff, gets us the login page or not found page
  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.get('*', mid.requiresSecure, notFoundPage);
};

module.exports = router;
