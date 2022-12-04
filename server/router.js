const controllers = require('./controllers');
const mid = require('./middleware');

const notFoundPage = (req, res) => {
  res.render('notFound', { csrfToken: req.csrfToken() });
};

const router = (app) => {
  app.get('/getToken', mid.requiresSecure, controllers.Account.getToken);
  app.get('/getChannels', mid.requiresLogin, controllers.Channel.getChannels);
  app.post('/renameChannels', mid.requiresLogin, controllers.Channel.renameChannels);
  app.get('/getPastes', mid.requiresLogin, controllers.Paste.getPastes);

  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);

  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  app.get('/logout', mid.requiresLogin, controllers.Account.logout);
  app.get('/app', mid.requiresLogin, controllers.Paste.appPage);
  app.post('/app', mid.requiresLogin, controllers.Paste.makePaste);
  app.delete('/app', mid.requiresLogin, controllers.Paste.deletePaste);

  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.get('*', mid.requiresSecure, notFoundPage);
};

module.exports = router;
