const PingLink = require('../models/pinglink');
const randomString = require('random-string');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const axios = require('axios');
const sendEmail = require('../utils/email');
const ChargeRate = require('../models/chargerate');

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
