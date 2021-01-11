require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const PORT = process.env.PORT;
const router = require('./routes/transaction');
const cors = require('cors');

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

app.all('*', (req, res) => {
    res.status(404).json({
        status: 'fail', message: 'The resource you are looking for cannot be found.'
    });
});

//Setup server
app.listen(PORT, () => {
    console.log(`Sever has started and is listening on port ${PORT}`);
});