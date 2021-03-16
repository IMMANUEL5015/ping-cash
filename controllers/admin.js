const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const signToken = id => {
    return jwt.sign({ id }, process.env.SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user, statusCode, req, res) => {
    user.password = undefined;
    const token = signToken(user.id);
    return res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.checkAdminCode = (req, res, next) => {
    if (!req.body.adminCode) {
        return next(new AppError('Please provide the admin code.', 400));
    }

    if (req.body.adminCode !== process.env.ADMIN_CODE) {
        return next(new AppError('Incorrect code.', 400));
    }

    return next();
}

exports.register = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });

    return createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide your email address and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError(`Incorrect email or password. If you have forgotten your password, please click on the forgot password link.`, 401));
    }

    createSendToken(user, 200, req, res);
});