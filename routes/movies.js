// Create the router object that will manage all operations on movies
const moviesRouter = require('express').Router();
// Import the movie model that we'll need in controller functions
const Movie = require('../models/movie');

// GET /api/movies/
moviesRouter.get('/', (req, res) => {
  const { max_duration, color } = req.query;
  Movie.findMany({ filters: { max_duration, color } })
    .then((movies) => {
      res.json(movies);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error retrieving movies from database');
    });
});

moviesRouter.get('/api/movies', (req, res) => {
  let sql = 'SELECT * FROM movies';
  const sqlValues = [];
  if (req.query.color) {
    sql += ' WHERE color = ?';
    sqlValues.push(req.query.color);
  }
  if (req.query.max_duration) {
    if (req.query.color) sql += ' AND duration <= ? ;';
    else sql += ' WHERE duration <= ?';

    sqlValues.push(req.query.max_duration);
  }

  connection
    .promise()
    .query(sql, sqlValues) /*  (err, results) => { */
    .then(([results]) => {
      res.json(results);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error retrieving movies from database');
    });

  /*     if (err) {
      console.log(err);
      res.status(500).send('Error retrieving movies from database');
    } else {
      res.json(results);
    }
  });*/
});

moviesRouter.get('/api/movies/:id', (req, res) => {
  const movieId = req.params.id;
  connection.query(
    'SELECT * FROM movies WHERE id = ?',
    [movieId],
    (err, results) => {
      if (err) {
        res.status(500).send('Error retrieving movie from database');
      } else {
        if (results.length) res.json(results[0]);
        else res.status(404).send('Movie not found');
      }
    }
  );
});

/* POST : MOVIES */

moviesRouter.post('/api/movies', (req, res) => {
  const { title, director, year, color, duration } = req.body;

  const { error } = Joi.object({
    title: Joi.string().max(255).required(),
    director: Joi.string().max(255).required(),
    year: Joi.number().integer().min(1888).required(),
    color: Joi.boolean().required(),
    duration: Joi.number().integer().min(1).required(),
  }).validate(
    { title, director, year, color, duration },
    { abortEarly: false }
  );

  if (error) {
    res.status(422).json({ validationErrors: error.details });
  } else {
    connection.query(
      'INSERT INTO movies (title, director, year, color, duration) VALUES (?, ?, ?, ?, ?)',
      [title, director, year, color, duration],
      (err, result) => {
        if (err) {
          res.status(500).send('Error saving the movie');
        } else {
          const id = result.insertId;
          const createdMovie = { id, title, director, year, color, duration };
          res.status(201).json(createdMovie);
        }
      }
    );
  }
});

moviesRouter.put('/api/movies/:id', (req, res) => {
  const movieId = req.params.id;
  const db = connection.promise();
  let existingMovie = null;
  let validationErrors = null;
  db.query('SELECT * FROM movies WHERE id = ?', [movieId])
    .then(([results]) => {
      existingMovie = results[0];
      if (!existingMovie) return Promise.reject('RECORD_NOT_FOUND');
      validationErrors = Joi.object({
        title: Joi.string().max(255),
        director: Joi.string().max(255),
        year: Joi.number().integer().min(1888),
        color: Joi.boolean(),
        duration: Joi.number().integer().min(1),
      }).validate(req.body, { abortEarly: false }).error;
      if (validationErrors) return Promise.reject('INVALID_DATA');
      return db.query('UPDATE movies SET ? WHERE id = ?', [req.body, movieId]);
    })
    .then(() => {
      res.status(200).json({ ...existingMovie, ...req.body });
    })
    .catch((err) => {
      console.error(err);
      if (err === 'RECORD_NOT_FOUND')
        res.status(404).send(`Movie with id ${movieId} not found.`);
      else if (err === 'INVALID_DATA')
        res.status(422).json({ validationErrors });
      else res.status(500).send('Error updating a movie.');
    });
});

/* DELETE : MOVIES id / USERS id */

moviesRouter.delete('/api/movies/:id', (req, res) => {
  const movieId = req.params.id;
  connection.query(
    'DELETE FROM movies WHERE id = ?',
    [movieId],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error deleting a movie');
      } else {
        if (result.affectedRows) res.status(200).send('🎉 Movie deleted!');
        else res.status(404).send('Movie not found');
      }
    }
  );
});
// TODO : GET /api/movies/:id
// moviesRouter.get('/:id', (req, res) => { ... })

// Don't forget to export the router in order to link it to the app in routes/index.js
module.exports = moviesRouter;
