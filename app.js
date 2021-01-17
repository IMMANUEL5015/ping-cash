const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const router = require('./routes.js');
const transaction = require('./controllers/transaction');
const bodyParser = require('body-parser');

//Connect to database
const URI = process.env.DATABASE_URI;
mongoose.connect(URI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(res => console.log('Successfully connected to database'))
    .catch(error => console.error(console.log("Database Error", error.message)));

app.enable('trust proxy');
app.use(cors());

app.post('/transactions/verify-payment/stripe',
    bodyParser.raw({ type: 'application/json' }),
    transaction.verifyStripePayment
);

app.use(express.json());
app.use(router);

module.exports = app;