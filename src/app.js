const express = require('express');
const cors = require('cors');
const router = require('./routes/routes.js');
const { sequelize } = require('./models');

const app = express();

app.use(cors());
app.use(express.json());


// usar router aquí
app.use(router);

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
  });
});