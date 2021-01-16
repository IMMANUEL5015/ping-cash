const mongoose = require('mongoose');

const currencySchema = mongoose.Schema({
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