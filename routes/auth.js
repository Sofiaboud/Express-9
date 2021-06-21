const db = require('../db-config');
const User = require('../models/user');
const authRouter = require('express').Router();

authRouter.post('/checkCredentials', (req, res) => {
  const { email, password } = req.body;
  console.log(db);
  return db
    .query('SELECT email, hashedPassword FROM users WHERE email = ?', [
      email,
      password,
    ])
    .then(([results]) => {
      user = results[0];

      if (!user) res.status(400).send('invalid user');
      else {
        return User.verifyPassword(plainPassword, user.hashedPassword).then(
          (passwordIsCorrect) => {
            if (passwordIsCorrect) res.status(200).send('OK');
            else res.status(400);
          }
        );
      }
    });
});

module.exports = authRouter;
