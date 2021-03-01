const PingLink = require('../models/pinglink');
const LinkTransaction = require('../models/linktransaction');
const randomString = require('random-string');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_TEST_SECRET);
const { error } = require('../utils/responses');

exports.checkPaymentType = catchAsync(async (req, res, next) => {
    const { paymentType, minimumAmount, linkAmount } = req.body;

    if (paymentType === 'fixed') req.body.minimumAmount = undefined;
    if (paymentType === 'flexible') {
        if (!minimumAmount) {
            return error(res, 400, 'Fail', 'Please specify a minimum amount for this pinglink!')
        }

        if (minimumAmount && linkAmount && (Number(minimumAmount) > Number(linkAmount))) {
            return error(res, 400, 'Fail', 'The specified minimum amount is too high!');
        }

        if (minimumAmount) {
            if (minimumAmount && String(minimumAmount).includes('.')) return error(res, 400, 'Fail', 'Currently, we only accept money in whole number values, not decimals.');
        }

        if (linkAmount) {
            if (linkAmount && String(linkAmount).includes('.')) return error(res, 400, 'Fail', 'Currently, we only accept money in whole number values, not decimals.');
        }
    }

    return next();
});

exports.preventDuplicatePin = catchAsync(async (req, res, next) => {
    const { pin } = req.body;

    if (pin) {
        const existingPingLink = await PingLink.findOne({ pin });
        if (existingPingLink)
            return error(res, 400, 'Fail', 'Pin Already Exists!');
    }

    return next();
});

exports.createPingLink = catchAsync(async (req, res, next) => {
    const urlName = randomString({ length: 8, numeric: true });
    const linkUrl = `https://pingcash-dev.netlify.app/pinglinks/${urlName}`
    const {
        linkName, phoneNumber, pin,
        linkAmount, accountNumber,
        bankSortCode, redirectUrl,
        thankYouMessage, email, bankName,
        paymentType, minimumAmount
    } = req.body;

    if (linkAmount.includes('.')) return next(new AppError('Please. The link amount must be an integer value.'));

    const pingLink = await PingLink.create({
        linkName,
        phoneNumber,
        urlName,
        pin,
        linkAmount,
        accountNumber,
        bankName,
        bankSortCode,
        redirectUrl,
        thankYouMessage,
        linkUrl,
        email,
        paymentType,
        minimumAmount
    });

    await sendEmail.sendPingLinkDetails(email, linkName, linkUrl, pin);

    return res.status(201).json({
        status: 'Success',
        message: 'Your Pinglink has been created. Please check your mail box.',
        pingLink
    })
});

exports.findPingLink = catchAsync(async (req, res, next) => {
    const urlName = req.params.urlname;

    const pingLink = await PingLink.findOne({ urlName });
    if (!pingLink) return next(new AppError('The resource you are looking for cannot be found.', 404));

    req.pingLink = pingLink;
    return next();
});

exports.getPingLinkData = catchAsync(async (req, res, next) => {
    return res.status(200).json({
        status: 'Success',
        pingLink: req.pingLink
    })
});

exports.flexiblePayments = catchAsync(async (req, res, next) => {
    let pingLink = req.pingLink;
    if (pingLink.paymentType === 'fixed') return next();

    //If payment type is flexible

    const { amount } = req.body;

    if (!amount) {
        return error(res, 400, 'Fail', 'Please specify the amount you want to pay.');
    }

    if (String(amount).includes('.')) return error(res, 400, 'Fail', 'Currently, we only accept money in whole number values, not decimals.');

    if (Number(amount) < Number(pingLink.minimumAmount)) return error(res, 400, 'Fail', `The amount you want to pay should be at least ${pingLink.minimumAmount}.`);

    req.amount = amount;
    return next();
});

exports.makePingLinkPayment = catchAsync(async (req, res, next) => {
    let pingLink = req.pingLink;
    const amount = req.amount;

    const linkTransaction = await LinkTransaction.create({
        pingLink,
        amount: amount ? amount : pingLink.linkAmount,
        fullName: req.body.fullName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber
    });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Ping Money',
                    },
                    unit_amount: amount ? Number(amount + "00") : Number(pingLink.linkAmount + "00"),
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        client_reference_id: linkTransaction.id,
        customer_email: req.body.email,
        success_url: pingLink.redirectUrl ? pingLink.redirectUrl : 'https://pingcash-dev.netlify.app/', //To be changed later
        cancel_url: 'https://pingcash-dev.netlify.app/' //To be changed later
    });

    await LinkTransaction.findByIdAndUpdate(linkTransaction.id, {
        session_id: session.id,
    }, { new: true });

    return res.status(200).json({
        status: 'Success',
        session_id: session.id,
        pingLink,
        linkTransaction
    });
});

exports.trackPingLink = catchAsync(async (req, res, next) => {
    let { pingLink, pin } = req.body;
    if (!pingLink) return next(new AppError('Please enter your ping link.', 400));
    if (!pin) return next(new AppError('Please enter the pin.', 400));

    pingLink = await PingLink.findOne({
        linkUrl: pingLink,
        pin
    });

    if (!pingLink) return next(new AppError('The resource you are looking for cannot be found.', 404));
    const linkTransactions = await LinkTransaction.find({ pingLink: pingLink.id });

    return res.status(200).json({
        status: 'Success',
        data: {
            pingLink,
            linkTransactions
        }
    })
});