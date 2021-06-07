const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
        enum: ['customer', 'super-admin', 'system-admin', 'admin'],
        default: 'customer'
    },
    roles: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role'
        }
    ],
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
    passwordResetExpires: Date,
    accountNumber: {
        type: String,
        // required: [true, 'Please tell us your account number.']
    },
    bankName: {
        type: String,
        // required: [true, 'Please tell us your bank name.']
    },
    bankSwiftCode: {
        type: String,
        // required: [true, 'Please tell us your bank swift code.']
    }
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

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.methods.changedPasswordAfterTokenWasIssued = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedPasswordTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimeStamp < changedPasswordTimeStamp;
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + (1000 * 60 * 10);

    return resetToken;
}

module.exports = User = mongoose.model('User', userSchema); 