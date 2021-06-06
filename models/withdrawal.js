const mongoose = require('mongoose');

const withdrawalSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required!']
    },
    status: {
        type: String,
        required: true,
        enum: ['raised', 'satisfied'],
        default: 'raised'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

withdrawalSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name email accountNumber bankName bankSwiftCode'
    });
    return next();
});

module.exports = Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);