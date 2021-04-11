const mongoose = require('mongoose');

const existSchema = mongoose.Schema({
    type: {
        type: String,
        required: [true, 'Please specify the transaction type.'],
        enum: ["international-transactions", "pinglinks"]
    },
    status: String,
    uniqueId: {
        type: String,
        unique: true
    }
});


module.exports = mongoose.model('Exist', existSchema);