const { promisify } = require('util');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const { find } = require('../utils/crud');
const PingLink = require('../models/pinglink');
const LinkTransaction = require('../models/linktransaction');
const {
    initTransferAndGenUssd,
    payPinglinkCreator
} = require('../utils/fuspay_apis');
const sendSms = require('../utils/sms');
const { generateRef } = require('../utils/otherUtils');
const { refundMoneyToForeigner, refundMoneyToNigerian } = require('./transaction');
const { emailNewUser } = require('../utils/email');
const Role = require('../models/role');

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

exports.checkForRoles = catchAsync(async (req, res, next) => {
    if (!req.body.roles) {
        const errMsg = 'Please specify the roles that you want this user to have.';
        return next(new AppError(errMsg, 400));
    }

    if (!Array.isArray(req.body.roles)) {
        const errMsg = 'The roles you are assigning to this user should be a list.';
        return next(new AppError(errMsg, 400));
    }

    for (let i = 0; i < req.body.roles.length; i++) {
        const roleId = req.body.roles[i];
        const role = await Role.findById(roleId);

        if (!role) {
            const errMsg = 'You cannot assign a non-existent role to an administrator.';
            return next(new AppError(errMsg, 400));
        }
    }

    return next();
});

const createNewUser = async (req) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        roles: req.body.roles,
        role: req.body.adminCode ? 'super-admin' : 'admin'
    });

    return newUser;
}

exports.register = catchAsync(async (req, res, next) => {
    const newUser = createNewUser(req);
    return createSendToken(newUser, 201, req, res);
});

exports.createUser = catchAsync(async (req, res, next) => {
    await createNewUser(req);
    const { email, name, password } = req.body;
    await emailNewUser(email, name, password);
    res.status(201).json({
        status: 'success',
        message: 'New user created successfully.'
    });
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

exports.viewCancelledInternationalTransactions = catchAsync(async (req, res, next) => {
    const transactions = await Transaction.find({
        transactionType: 'send-to-nigeria',
        status: 'cancelled'
    });
    return res.status(200).json({ status: 'Success', transactions });
});

exports.viewRefundedInternationalTransactions = catchAsync(async (req, res, next) => {
    const transactions = await Transaction.find({
        transactionType: 'send-to-nigeria',
        status: 'refunded'
    });
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

const findAllFailedTransactions = async () => {
    let failedTransactions = [];

    const transactions = await Transaction.find({ status: 'failed' });
    failedTransactions = failedTransactions.concat(transactions);

    const linkTransactions = await LinkTransaction.find({ status: 'failed' }).populate('pingLink');
    failedTransactions = failedTransactions.concat(linkTransactions);

    const failedRefunds = await Transaction.find({ status: 'refund-failed' });
    failedTransactions = failedTransactions.concat(failedRefunds);

    return failedTransactions;
}

exports.viewFailedTransactions = catchAsync(async (req, res, next) => {
    const failedTransactions = await findAllFailedTransactions();

    return res.status(200).json({
        status: 'Success',
        failedTransactions
    });
});

exports.makePayout = catchAsync(async (req, res, next) => {
    const transactions = await findAllFailedTransactions();

    for (let i = 0; i < transactions.length; i++) {
        const theTransaction = transactions[i];

        let transaction;
        let linkTransaction;

        if (
            (
                theTransaction.transactionType === 'send-to-nigeria' &&
                theTransaction.status === 'failed'
            )

            ||

            (
                theTransaction.transactionType === 'send-within-nigeria' &&
                theTransaction.status === 'failed'
            )
        ) {
            transaction = theTransaction;

            if (transaction) {
                transaction = await Transaction.findByIdAndUpdate(
                    transaction._id,
                    { status: 'paid', reference: generateRef() },
                    { new: true }
                )
                const url = 'https://api.fusbeast.com/v1/MobileTransfer/Initiate';
                const response = await initTransferAndGenUssd(url, transaction);

                //Send USSD Code
                const ussd = response.data.ussd;
                let messageToBeSent;
                if (transaction.transactionType === 'send-to-nigeria') {
                    messageToBeSent = `Dear ${transaction.receiverFullName}. ${transaction.senderFullName} has pinged you ${Number(transaction.finalAmountReceived)} ${transaction.currency} (${Math.round(Number(transaction.finalAmountReceivedInNaira))} Naira). Time: ${new Date(Date.now()).toLocaleTimeString()}. Ref: ${transaction.reference}. Dial ${ussd} to withdraw your money. Fuspay Technology.`;
                } else {
                    messageToBeSent = `Dear ${transaction.receiverFullName}. ${transaction.senderFullName} has pinged you ${Math.round(Number(transaction.finalAmountReceivedInNaira))} Naira. Time: ${new Date(Date.now()).toLocaleTimeString()}. Ref: ${transaction.reference}. Dial ${ussd} to withdraw your money. Fuspay Technology.`;
                }
                const phoneNumber = "+234" + transaction.receiverPhoneNumber.slice(1, 11);
                const body = messageToBeSent;
                await sendSms.sendWithTwilio(body, phoneNumber);
            }
        }

        if (theTransaction.pingLink && theTransaction.status === 'failed') {
            linkTransaction = theTransaction;

            linkTransaction = await LinkTransaction.findByIdAndUpdate(
                linkTransaction._id,
                { status: 'paid', reference: generateRef() },
                { new: true }
            )
            const pingLink = await PingLink.findById(linkTransaction.pingLink._id);
            const response = await payPinglinkCreator(pingLink, linkTransaction);
            if (response) {
                const messageToBeSent = `Dear ${pingLink.linkName}. ${linkTransaction.fullName} has pinged you ${linkTransaction.finalAmountReceived} Dollars (${Math.floor(Number(linkTransaction.finalAmountReceivedInNaira))} Naira) via your pinglink. Time: ${new Date(Date.now()).toLocaleTimeString()}. Fuspay Technology.`;
                const phoneNumber = "+234" + pingLink.phoneNumber.slice(1, 11);
                const body = messageToBeSent;
                await sendSms.sendWithTwilio(body, phoneNumber);
            } else {
                await LinkTransaction.findByIdAndUpdate(linkTransaction._id, {
                    status: 'failed'
                }, { new: true })
            }
        }

        if (
            (
                theTransaction.transactionType === 'send-to-nigeria' &&
                theTransaction.status === 'refund-failed'
            )

            ||

            (
                theTransaction.transactionType === 'send-within-nigeria' &&
                theTransaction.status === 'refund-failed'
            )
        ) {
            transaction = theTransaction;
            if (transaction.transactionType === 'send-to-nigeria') {
                await refundMoneyToForeigner(transaction);
            }

            if (transaction.transactionType === 'send-within-nigeria') {
                transaction = await Transaction.findByIdAndUpdate(
                    transaction._id,
                    { reference: generateRef(), status: 'cancelled' },
                    { new: true }
                )
                await refundMoneyToNigerian(transaction);
            }
        }
    }

    return res.status(200).json({
        status: 'Success',
        message: 'Operation completed!'
    })
});