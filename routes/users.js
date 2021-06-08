const usersRouter = require('express').Router();
const User = require('../models/user');

usersRouter.get('/', (req, res) => {
  const { language } = req.query;
  User.findMany({ filters: { language } })
    .then((results) => {
      res.json(results);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error retrieving users from database');
    });
});

usersRouter.get('/api/users', (req, res) => {
  let sql = 'SELECT * FROM users';
  const sqlValues = [];
  if (req.query.language) {
    sql += ' WHERE language = ?';
    sqlValues.push(req.query.language);
  }
  connection.query(sql, sqlValues, (err, results) => {
    if (err) {
      res.status(500).send('Error retrieving users from database');
    } else {
      res.json(results);
    }
  });
});

usersRouter.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  connection.query(
    'SELECT * FROM users WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) {
        res.status(500).send('Error retrieving user from database');
      } else {
        if (results.length) res.json(results[0]);
        else res.status(404).send('User not found');
      }
    }
  );
});

/* Old version : "manual validation" and callbacks 
app.post('/api/users', (req, res) => {
  const { firstname, lastname, email } = req.body;
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, result) => {
      if (result[0]) {
        console.error(err);
        res.status(409).json({ message: 'This email is already used' });
      } else {
        const errors = [];
        const emailRegex = /[a-z0-9._]+@[a-z0-9-]+\.[a-z]{2,3}/;
        if (!firstname)
          errors.push({
            field: 'firstname',
            message: 'This field is required',
          });
        else if (firstname.length >= 255)
          errors.push({
            field: 'firstname',
            message: 'Should be less than 255 characters',
          });
        if (!lastname)
          errors.push({ field: 'lastname', message: 'This field is required' });
        else if (lastname.length >= 255)
          errors.push({
            field: 'lastname',
            message: 'Should be less than 255 characters',
          });
        if (!email)
          errors.push({ field: 'email', message: 'This field is required' });
        else if (email.length >= 255)
          errors.push({
            field: 'email',
            message: 'Should be less than 255 characters',
          });
        if (!emailRegex.test(email))
          errors.push({ field: 'email', message: 'Invalid email' });
        if (error) {
          res.status(422).json({ validationErrors: error.details });
        } else {
          connection.query(
            'INSERT INTO users (firstname, lastname, email) VALUES (?, ?, ?)',
            [firstname, lastname, email],
            (err, result) => {
              if (err) {
                console.error(err);
                res.status(500).send('Error saving the user');
              } else {
                const id = result.insertId;
                const createdUser = { id, firstname, lastname, email };
                res.status(201).json(createdUser);
              }
            }
          );
        }
      }
    }
  );
});
*/

usersRouter.post('/api/users', (req, res) => {
  const { firstname, lastname, email, city, language } = req.body;
  const db = connection.promise();
  let validationErrors = null;
  db.query('SELECT * FROM users WHERE email = ?', [email])
    .then(([result]) => {
      if (result[0]) return Promise.reject('DUPLICATE_EMAIL');
      validationErrors = Joi.object({
        email: Joi.string().email().max(255).required(),
        firstname: Joi.string().max(255).required(),
        lastname: Joi.string().max(255).required(),
        city: Joi.string().max(255).required(),
        language: Joi.string().max(255).required(),
      }).validate({ firstname, lastname, email }, { abortEarly: false }).error;
      if (validationErrors) return Promise.reject('INVALID_DATA');
      return db.query(
        'INSERT INTO users (firstname, lastname, email, city, language) VALUES (?, ?, ?, ?, ?)',
        [firstname, lastname, email, city, language]
      );
    })
    .then(([{ insertId }]) => {
      res.status(201).json({ id: insertId, firstname, lastname, email });
    })
    .catch((err) => {
      console.error(err);
      if (err === 'DUPLICATE_EMAIL')
        res.status(409).json({ message: 'This email is already used' });
      else if (err === 'INVALID_DATA')
        res.status(422).json({ validationErrors });
      else res.status(500).send('Error saving the user');
    });
});

usersRouter.post('/api/users', (req, res) => {
  const { firstname, lastname, email, city, language } = req.body;
  const db = connection.promise();
  let validationErrors = null;
  db.query('SELECT * FROM users WHERE email = ?', [email])
    .then(([result]) => {
      if (result[0]) return Promise.reject('DUPLICATE_EMAIL');
      validationErrors = Joi.object({
        email: Joi.string().email().max(255).required(),
        firstname: Joi.string().max(255).required(),
        lastname: Joi.string().max(255).required(),
        city: Joi.string().max(255).required(),
        language: Joi.string().max(255).required(),
      }).validate({ firstname, lastname, email }, { abortEarly: false }).error;
      if (validationErrors) return Promise.reject('INVALID_DATA');
      return db.query(
        'INSERT INTO users (firstname, lastname, email, city, language) VALUES (?, ?, ?, ?, ?)',
        [firstname, lastname, email, city, language]
      );
    })
    .then(([{ insertId }]) => {
      res.status(201).json({ id: insertId, firstname, lastname, email });
    })
    .catch((err) => {
      console.error(err);
      if (err === 'DUPLICATE_EMAIL')
        res.status(409).json({ message: 'This email is already used' });
      else if (err === 'INVALID_DATA')
        res.status(422).json({ validationErrors });
      else res.status(500).send('Error saving the user');
    });
});

/* Sur la /api/movies/:idroute PUT , ajoutez un gestionnaire d'erreurs 404 dans les routes de films que nous 
avons créées auparavant, avec le message Movie not found si idl'URL transmise ne correspond à aucun film existant

====>

*/

usersRouter.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const db = connection.promise();
  let existingUser = null;
  let validationErrors = null;
  Promise.all([
    db.query('SELECT * FROM users WHERE id = ?', [userId]),
    db.query('SELECT * FROM users WHERE email = ? AND id <> ?', [
      req.body.email,
      userId,
    ]),
  ])
    .then(([[[existingUser]], [[otherUserWithEmail]]]) => {
      if (!existingUser) return Promise.reject('RECORD_NOT_FOUND');
      if (otherUserWithEmail) return Promise.reject('DUPLICATE_EMAIL');
      validationErrors = Joi.object({
        email: Joi.string().email().max(255),
        firstname: Joi.string().min(1).max(255),
        lastname: Joi.string().min(1).max(255),
        city: Joi.string().allow(null, '').max(255),
        language: Joi.string().allow(null, '').max(255),
      }).validate(req.body, { abortEarly: false }).error;
      if (validationErrors) return Promise.reject('INVALID_DATA');
      return db.query('UPDATE users SET ? WHERE id = ?', [req.body, userId]);
    })
    .then(() => {
      res.status(200).json({ ...existingUser, ...req.body });
    })
    .catch((err) => {
      console.error(err);
      if (err === 'RECORD_NOT_FOUND')
        res.status(404).send(`User with id ${userId} not found.`);
      if (err === 'DUPLICATE_EMAIL')
        res.status(409).json({ message: 'This email is already used' });
      else if (err === 'INVALID_DATA')
        res.status(422).json({ validationErrors });
      else res.status(500).send('Error updating a user');
    });
});

/* DELETE : MOVIES id / USERS id */

usersRouter.delete('/api/movies/:id', (req, res) => {
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

usersRouter.delete('/api/users/:id', (req, res) => {
  connection.query(
    'DELETE FROM users WHERE id = ?',
    [req.params.id],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error deleting an user');
      } else {
        if (result.affectedRows) res.status(200).send('🎉 User deleted!');
        else res.status(404).send('User not found.');
      }
    }
  );
});

module.exports = usersRouter;
