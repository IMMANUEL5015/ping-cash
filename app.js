const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const router = require('./routes.js');

//Connect to database
const URI = process.env.DATABASE_URI;
mongoose.connect(URI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(res => console.log('Successfully connected to database'))
    .catch(error => console.error(console.log("Database Error", error.message)));

app.use(cors());
app.use(express.json());
app.use(router);

module.exports = app;