const express = require('express');
const cors = require('cors');
const router = require('./routes/routes.js');

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

module.exports = app;
