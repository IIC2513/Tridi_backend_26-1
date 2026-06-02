const express = require('express');
const cors = require('cors');
const router = require('./routes/routes.js');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();


const swaggerOptions = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Tridi API', version: '0.0.1' },
  },
  apis: ['./src/routes/*.js'], 
});


app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use(router);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerOptions));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});