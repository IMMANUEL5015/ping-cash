const { promisify } = require('util');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const { create, findAll, find, seeData, update, deleteOne } = require('../utils/crud');
const PingLink = require('../models/pinglink');
const LinkTransaction = require('../models/linktransaction');

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

exports.protect = catchAsync(async (req, res, next) => {
    let token;

    //1. Check if token is available
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) return next(new AppError('Please login to gain access to this resource', 401));

    //2. Verify the token
    const decoded = await promisify(jwt.verify)(token, process.env.SECRET);

    //3. Check if the owner of the token still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The owner of the login credentials no longer exists.', 401));
    }

    //Grant access to protected route
    req.user = currentUser;
    next();
});


exports.logout = (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.SECRET, {
        expiresIn: '1s'
    })

    res.status(200).json({
        status: 'success',
        message: 'You have been logged out successfully.',
        token
    });
}

exports.viewInternationalTransactions = catchAsync(async (req, res, next) => {
    const transactions = await Transaction.find({ transactionType: 'send-to-nigeria' });
    return res.status(200).json({ status: 'Success', transactions });
});

exports.findInternationalTransaction = find(Transaction);
exports.viewInternationalTransaction = (req, res, next) => {
    return res.status(200).json({ status: 'Success', transaction: req.data });
}

const pingLinkStats = async (pinglink) => {
    const obj = {};
    const {
        linkUrl, numOfLinkTransactions,
        linkName, createdAt, totalAmountOfPaidLinkTransactions, _id
    } = pinglink;

    obj.linkUrl = linkUrl;
    obj.totalTransactions = numOfLinkTransactions;
    obj.description = linkName;
    obj.date = createdAt.toDateString();
    obj.totalAmount = totalAmountOfPaidLinkTransactions;
    obj.id = _id;

    return obj;
}

exports.viewAllPinglinks = catchAsync(async (req, res, next) => {
    const allPinglinks = await PingLink.find({});

    const pinglinks = [];

    for (let i = 0; i < allPinglinks.length; i++) {
        const pinglink = allPinglinks[i];
        const obj = await pingLinkStats(pinglink);

        pinglinks.push(obj);
    }

    return res.status(200).json({ status: 'Success', pinglinks });
});


exports.findPinglink = find(PingLink);
exports.viewPinglink = catchAsync(async (req, res, next) => {
    const linkTransactions = await LinkTransaction.find({ pingLink: req.data.id });
    const stats = await pingLinkStats(req.data);

    return res.status(200).json({
        status: 'Success',
        data: {
            stats,
            pingLink: req.data,
            linkTransactions
        }
    })
});

exports.findPinglinkTransaction = find(LinkTransaction);
exports.viewPinglinkTransaction = (req, res, next) => {
    return res.status(200).json({ status: 'Success', transaction: req.data });
}