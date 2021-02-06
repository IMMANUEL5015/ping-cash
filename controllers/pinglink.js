const PingLink = require('../models/pinglink');
const randomString = require('random-string');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const axios = require('axios');
const sendEmail = require('../utils/email');
const ChargeRate = require('../models/chargerate');

exports.createPingLink = catchAsync(async (req, res, next) => {
    const chargeRate = await ChargeRate.findOne({ name: 'within-nigeria' });
    const uniqueString = randomString({ length: 26, numeric: true });

    const {
        linkName, phoneNumber, pin, email, description,
        amount, accountNumber, bankName,
        bankSortCode, thankYouMessage
    } = req.body;

    const paymentId = `PNG-${uniqueString}eq`;

    const getPingLinkUrl = 'https://api.fusbeast.com/v1/PaymentLink/Create';
    const response = await axios.post(getPingLinkUrl, {
        payment_id: paymentId,
        webhook_url: process.env.PING_LINK_WEBHOOK,
        redirect_url: process.env.PING_LINK_REDIRECT,
        notification_email: email,
        success_message: thankYouMessage,
        amount: `${parseInt(amount) + parseInt(chargeRate.figure)}`,
        description,
        link_name: linkName,
        pay_type: 'fixed',
        merchant_id: process.env.MERCHANT_ID
    }, {
            headers: {
                Authorization: `Bearer ${process.env.MERCHANT_SECRET}`
            }
        })

    const data = response.data;

    const pingLink = await PingLink.create({
        linkName,
        paymentId,
        email,
        phoneNumber,
        description,
        pin,
        amount,
        accountNumber,
        bankName,
        bankSortCode,
        thankYouMessage,
        url: data.payment_link,
        urlName: data.url_name
    });

    await sendEmail.sendPingLinkDetails(
        email,
        linkName,
        data.payment_link,
        pin
    )

    return res.status(200).json({
        status: 'Success',
        message: 'Pinglink created successfully!',
        pingLink
    })
});