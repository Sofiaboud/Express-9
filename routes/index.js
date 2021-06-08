const moviesRouter = require('./movies');
const usersRouter = require('./users');

const setupRoutes = (app) => {
  //Movie routes
  app.use('/api/movies', moviesRouter);
  app.use('/api/users', usersRouter);
  // User routes
  //TODO
};

module.exports = {
  setupRoutes,
};
