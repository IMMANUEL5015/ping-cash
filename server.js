require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const PORT = process.env.PORT;
const router = require('./routes/transaction');

//Connect to database
const URI = process.env.DATABASE_URI;
mongoose.connect(URI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(res => console.log('Successfully connected to database'))
    .catch(error => console.error(console.log("Database Error", error.message)));

app.use(express.json());    
app.use(router);

//Setup server
app.listen(PORT, () => {
    console.log(`Sever has started and is listening on port ${PORT}`);
});