const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/user');
const Withdrawal = require('../models/withdrawal');
const PingLink = require('../models/pinglink');
const LinkTransaction = require('../models/linktransaction');
const { sendLoginCode } = require('../utils/email');
const { genLoginCode, calcWalletBalance, calcWithdrawals,
    preventOverWithdrawal, calcTotalAmountReceived } = require('../utils/otherUtils');
const { find, create } = require('../utils/crud');

exports.getLoginCode = catchAsync(async (req, res, next) => {
    //Get email from body.
    const { email } = req.body;
    if (!email) return next(new AppError('Please provide a valid email address.'));

    const code = genLoginCode();

    //If user exists with that email, send a login code to that email address
    let user = await User.findOne({ email });
    if (user) {
        user.password = code;
        user.passwordConfirm = code;
        await user.save();

        await sendLoginCode(user, code);
        return res.status(200).json({
            status: 'Success',
            message: 'Your authentication code has been sent to your account email address.'
        })
    }

    //If user does not exist with that email, check if a pinglink with that email exists
    const pinglink = await PingLink.findOne({ email });

    //If pinglink exists, create a user account based on the data on the pinglink
    if (pinglink) {
        user = await User.create({
            name: email,
            email,
            password: code,
            passwordConfirm: code
        });

        //Send login code to the email address
        await sendLoginCode(user, code);

        return res.status(200).json({
            status: 'Success',
            message: 'Your authentication code has been sent to your account email address.'
        })
    }

    //If no pinglink with that email address, direct the user to create a pinglink
    return next(new AppError('Please create a pinglink', 403));
});

exports.myPinglinks = catchAsync(async (req, res, next) => {
    const myPingLinks = await PingLink.find({ email: req.user.email })
        .sort('-createdAt');

    let walletBalance = calcWalletBalance(myPingLinks);
    let totalAmountReceived = calcTotalAmountReceived(myPingLinks);
    let amountFromWithdrawals = await calcWithdrawals(req.user._id);

    walletBalance = walletBalance - amountFromWithdrawals;
    totalAmountReceived = totalAmountReceived + amountFromWithdrawals;

    return res.status(200).json({
        myPingLinks,
        walletBalance,
        totalAmountReceived
    });
});

exports.findPingLink = find(PingLink);

exports.myPingLinkTransactions = catchAsync(async (req, res, next) => {
    const linkTransactions = await LinkTransaction.find({
        pingLink: req.data._id
    }).sort('-createdAt');

    return res.status(200).json({
        pingLink: req.data,
        linkTransactions
    })
});

exports.setBankDetails = catchAsync(async (req, res, next) => {
    const { accountNumber, bankName, bankSwiftCode } = req.body;

    if (!accountNumber || !bankName || !bankSwiftCode) {
        return next(new AppError('Please provide all relevant bank details.', 400));
    }

    await User.findByIdAndUpdate(
        req.user._id,
        { accountNumber, bankName, bankSwiftCode },
        { new: true }
    );

    return res.status(200).json({
        status: 'Success',
        message: 'Bank details addedd successfully!'
    })
});

exports.validateWithdrawalRequest = catchAsync(async (req, res, next) => {
    req.body.user = req.user._id;
    req.body.status = 'raised';

    if (req.body.amount) {
        const myPingLinks = await PingLink.find({ email: req.user.email });
        let walletBalance = calcWalletBalance(myPingLinks);
        let currentRaisedAmount = await preventOverWithdrawal(req.user._id, req.body.amount);

        if (req.body.amount > walletBalance || currentRaisedAmount > walletBalance) {
            return next(
                new AppError('You cannot withdraw more than the amount in your wallet balance.', 400)
            );
        }
    }

    return next();
});

exports.makeWithdrawalRequest = create(Withdrawal);

exports.myWithdrawalRequests = catchAsync(async (req, res, next) => {
    const withdrawalRequests = await Withdrawal.find({
        user: req.user._id
    }).sort('-createdAt');

    return res.status(200).json(withdrawalRequests);
});