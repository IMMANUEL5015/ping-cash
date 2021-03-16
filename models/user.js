const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name.'],
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Please provide your email address.'],
        validate: [validator.isEmail, 'Please provide a valid email.'],
        lowercase: true //Ensures that email addresses are always in lowercase
    },
    role: {
        type: String,
        enum: ['admin'],
        default: 'admin'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'You password should consist of at least Eight characters'],
        select: false
    },
    passwordChangedAt: Date,
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function (value) {
                return value === this.password;
            },
            message: 'Passwords do not match'
        }
    },
    passwordResetToken: String,
    passwordResetExpires: Date
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

module.exports = User = mongoose.model('User', userSchema); 