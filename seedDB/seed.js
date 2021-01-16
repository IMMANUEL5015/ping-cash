// require('dotenv').config();
// const axios = require('axios');
// const Country = require('../models/country');
// const mongoose = require('mongoose');

exports.deleteAll = async (Model) => {
    try {
        await Model.deleteMany({});
        return 'delete successful.';
    } catch (error) {
        console.error(error);
    }
}

exports.createAll = async (Model, data) => {
    try {
        await Model.create(data);
        return 'created successfully.';
    } catch (error) {
        console.error(error);
    }
}

// const URI = process.env.DATABASE_URI;
// mongoose.connect(URI, {
//     useCreateIndex: true,
//     useFindAndModify: false,
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(res => console.log('Successfully connected to database'))
//     .catch(error => console.error(console.log("Database Error", error.message)));

// axios.get('https://restcountries.eu/rest/v2/').then(async res => {
//     const data = res.data;

//     for (let i = 0; i < data.length; i++) {
//         await Country.create({ name: data[i].name });
//     }
// }).catch(error => console.error(error));