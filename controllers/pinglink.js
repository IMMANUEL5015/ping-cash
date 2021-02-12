const PingLink = require('../models/pinglink');
const LinkTransaction = require('../models/linktransaction');
const randomString = require('random-string');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_TEST_SECRET);

exports.createPingLink = catchAsync(async (req, res, next) => {
    const urlName = randomString({ length: 8, numeric: true });
    const linkUrl = `https://pingcash-dev.netlify.app/pinglinks/${urlName}`
    const {
        linkName, phoneNumber, pin,
        linkAmount, accountNumber,
        bankSortCode, redirectUrl,
        thankYouMessage, email
    } = req.body;

    if (linkAmount.includes('.')) return next(new AppError('Please. The link amount must be an integer value.'));

    const pingLink = await PingLink.create({
        linkName,
        phoneNumber,
        urlName,
        pin,
        linkAmount,
        accountNumber,
        bankSortCode,
        redirectUrl,
        thankYouMessage,
        linkUrl,
        email
    });

    await sendEmail.sendPingLinkDetails(email, linkName, linkUrl, pin);

    return res.status(201).json({
        status: 'Success',
        message: 'Pinglink created.',
        pingLink
    })
});

exports.findPingLink = catchAsync(async (req, res, next) => {
    const urlName = req.params.urlname;

    const pingLink = await PingLink.findOne({ urlName });
    if (!pingLink) return next(new AppError('We cannot found what you are looking for.', 404));

    req.pingLink = pingLink;
    return next();
});

exports.getPingLinkData = catchAsync(async (req, res, next) => {
    return res.status(200).json({
        status: 'Success',
        pingLink: req.pingLink
    })
});

exports.makePingLinkPayment = catchAsync(async (req, res, next) => {
    let pingLink = req.pingLink;

    //Convert cents to dollars
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Number(pingLink.linkAmount + "00"),
        currency: 'usd',
        metadata: {
            integration_check: 'accept_a_payment',
            transaction_id: pingLink.id,
        },
        payment_method_types: ['card'],
        setup_future_usage: 'off_session',
    });

    const linkTransaction = await LinkTransaction.create({
        pingLink,
        amount: pingLink.linkAmount,
        client_secret: paymentIntent.client_secret,
        fullName: req.body.fullName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber
    });

    return res.status(200).json({
        status: 'Success',
        client_secret: paymentIntent.client_secret,
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

    if (!pingLink) return next(new AppError('We cannot find what you are looking for.', 404));
    const linkTransactions = await LinkTransaction.find({ pingLink: pingLink.id });

    return res.status(200).json({
        status: 'Success',
        data: {
            pingLink,
            linkTransactions
        }
    })
})