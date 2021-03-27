const mongoose = require('mongoose');
const pcategorySchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for this privilege category.'],
        trim: true,
        unique: true
    },
    description: String
});

module.exports = Pcategory = mongoose.model('Pcategory', pcategorySchema);