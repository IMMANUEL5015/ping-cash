const mongoose = require('mongoose');

const currencySchema = mongoose.Schema({
    country: {
        type: String,
        required: [true, 'Please specify the name of the country, that this currency belongs to.']
    },
    name: {
        type: String,
        required: [true, 'Every currency must have a name.']
    },
    abbreviation: {
        type: String,
        required: [true, 'Please specify the abbreviated version of the currency name.']
    }
});

module.exports = mongoose.model('Currency', currencySchema);