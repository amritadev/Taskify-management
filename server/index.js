const express = require('express');
var bodyParser = require("body-parser");
const cors = require('cors');
const apiRoute = require('./routes/api');

require('dotenv').config();


const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['POST','GET', 'PUT', 'DELETE'],
  credentials: true
}));

app.use('/', apiRoute);

app.listen(5000, () => {
    console.log(`Server is running on port `);
  });