const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/user');
const PingLink = require('../models/pinglink');
const LinkTransaction = require('../models/linktransaction');
const { sendLoginCode } = require('../utils/email');
const { genLoginCode } = require('../utils/otherUtils');
const { find } = require('../utils/crud');

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
    const myPingLinks = await PingLink.find({ email: req.user.email });
    return res.status(200).json(myPingLinks);
});

exports.findPingLink = find(PingLink);

exports.myPingLinkTransactions = catchAsync(async (req, res, next) => {
    const linkTransactions = await LinkTransaction.find({
        pingLink: req.data._id
    })

    return res.status(200).json({
        pingLink: req.data,
        linkTransactions
    })
});