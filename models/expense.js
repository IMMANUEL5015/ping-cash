const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema({
    type: {
        type: String,
        required: [true, 'Please specify the type of administrative expense.'],
        enum: ['send-money-to-nigeria', 'pinglink', 'general']
    },
    name: {
        type: String,
        required: [true, 'Name is required.'],
        unique: true
    },
    flatOrPercentage: {
        type: String,
        required: [true, 'Please specify if this is a flat figure or a percentage value.'],
        enum: ['percent', 'flat']
    },
    figure: {
        type: Number,
        required: [true, 'Please specify the figure.']
    }
});

module.exports = mongoose.model('Expense', expenseSchema);