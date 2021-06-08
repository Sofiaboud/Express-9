const connection = require('./db-config');
const express = require('express');
const Joi = require('joi');
const app = express();

const { setupRoutes } = require('./routes');
setupRoutes(app);

const port = process.env.PORT || 3002;

/* 
req.query contient les paramètres de requête de la requête.
req.body contient n'importe quoi dans le corps de la requête. Généralement, cela est utilisé sur PUTet les POSTdemandes.
 */

connection.connect((err) => {
  if (err) {
    console.error('error connecting: ' + err.stack);
  } else {
    console.log('connected as id ' + connection.threadId);
  }
});

setupRoutes(app);
app.use(express.json()); // ajoute le body a mon objet req -> {body: ...}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
