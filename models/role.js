const mongoose = require('mongoose');
const roleSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required!'],
        unique: true
    },
    privileges: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Privilege'
        }
    ]
});

roleSchema.pre(/^find/, function (next) {
    this.populate('privileges');
    next();
});

module.exports = Role = mongoose.model('Role', roleSchema);