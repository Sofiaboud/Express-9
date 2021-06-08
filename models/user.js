const connection = require('../db-config');
const Joi = require('joi');

const db = connection.promise();

const validate = (firstname, lastname, email, forCreation = true) => {
  const presence = forCreation ? 'required' : 'optional';
  return Joi.object({
    email: Joi.string().email().max(255).required(),
    firstname: Joi.string().max(255).required(),
    lastname: Joi.string().max(255).required(),
    city: Joi.string().max(255).required(),
    language: Joi.string().max(255).required(),
  }).validate({ firstname, lastname, email }, { abortEarly: false }).error;
};

const findMany = ({ filters: { language } }) => {
  let sql = 'SELECT * FROM users';
  const sqlValues = [];
  if (language) {
    sql += ' WHERE language = ?';
    sqlValues.push(language);
  }

  return db.query(sql, sqlValues).then(([results]) => results);
};

const findOne = (id) => {
  return db
    .query('SELECT * FROM users WHERE id = ?', [id])
    .then(([results]) => results[0]);
};

const create = ({ title, director, year, color, duration }) => {
  return db
    .query(
      'INSERT INTO users (firstname, lastname, email, city, language) VALUES (?, ?, ?, ?, ?)',
      [firstname, lastname, email, city, language]
    )
    .then(([result]) => {
      const id = result.insertId;
      return { id: insertId, firstname, lastname, email };
    });
};

const update = (id, newAttributes) => {
  return db.query('UPDATE users SET ? WHERE id = ?', [newAttributes, id]);
};

const destroy = (id) => {
  return db
    .query('DELETE FROM users WHERE id = ?', [id])
    .then(([result]) => result.affectedRows !== 0);
};

module.exports = {
  findMany,
  findOne,
  validate,
  create,
  update,
  destroy,
};
