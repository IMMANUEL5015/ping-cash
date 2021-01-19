const mongoose = require('mongoose');

const creditRateSchema = mongoose.Schema({
    name: {
        type: String,
        unique: true,
        enum: ['credit-rate'],
        default: 'credit-rate'
    },
    figure: {
        type: String,
        required: [true, 'Please specify the percentage value figure.'],
        unique: true
    }
});

module.exports = mongoose.model('CreditRate', creditRateSchema);