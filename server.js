require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const PORT = process.env.PORT;

//Connect to database
const URI = process.env.DATABASE_URI;
mongoose.connect(URI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(res => console.log('Successfully connected to database'))
    .catch(error => console.error(console.log("Database Error", error.message)));

//Setup server
app.listen(PORT, () => {
    console.log(`Sever has started and is listening on port ${PORT}`);
});