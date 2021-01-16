const mongoose = require('mongoose');

const countrySchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Every country must have a name.']
    }
});

module.exports = mongoose.model('Country', countrySchema);