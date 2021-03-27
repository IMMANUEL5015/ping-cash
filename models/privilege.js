const mongoose = require('mongoose');
const privilegeSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required!'],
        unique: true
    },
    pcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pcategory'
    }
});

module.exports = Privilege = mongoose.model('Privilege', privilegeSchema);