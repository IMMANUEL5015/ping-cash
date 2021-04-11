const mongoose = require('mongoose');

const existSchema = mongoose.Schema({
    type: {
        type: String,
        required: [true, 'Please specify the transaction type.'],
        enum: ["international-transactions", "pinglinks"]
    },
    status: String,
    uniqueId: {
        type: String
    }
});

existSchema.index({ type: 1, uniqueId: 1 }, { unique: true });

module.exports = mongoose.model('Exist', existSchema);