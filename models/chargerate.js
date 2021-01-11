const mongoose = require('mongoose');

const chargeRateSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please specify the name of this charge rate.'],
        enum: ['to-nigeria', 'within-nigeria']
    },
    flatOrPercentage: {
        type: String,
        required: [true, 'Please specify if this is a flat figure or a percentage value.'],
        enum: ['percent', 'flat']
    },
    figure: {
        type: String,
        required: [true, 'Please specify the figure.']
    }
});

module.exports = mongoose.model('ChargeRate', chargeRateSchema);