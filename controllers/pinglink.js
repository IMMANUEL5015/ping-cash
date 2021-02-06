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

exports.pinglinkWebhook = catchAsync(async(req, res, next) => {
    if (req.ip === process.env.FUSPAY_IP_ADDRESS) {
        const data = req.query;
        if (data.status === 'PAID' && data.code === '1') {
            const { reference } = data;

            const transaction = await Transaction.findOneAndUpdate(
                { reference },
                { status: 'paid' },
                { new: true }
            );

            //Initiate Transfer and Generate USSD Code
            const url = 'https://api.fusbeast.com/v1/MobileTransfer/Initiate';
            const response = await axios.post(url, {
                webhook_secret: process.env.WEBHOOK_SECRET,
                reference: transaction.reference,
                mobile_no: transaction.receiverPhoneNumber,
                merchant_id: process.env.MERCHANT_ID,
                webhook_url: process.env.WEBHOOK_URL
            }, {
                    headers: {
                        Authorization: `Bearer ${process.env.MERCHANT_SECRET}`
                    }
                }
            );

            //Send USSD Code
            const ussd = response.data.ussd;
            const smsService = await Sms.findOne({ active: true });
            const messageToBeSent = `Dear ${transaction.receiverFullName}. ${transaction.senderFullName} has pinged you ${Math.round(Number(transaction.finalAmountReceivedInNaira))} Naira. Time: ${new Date(Date.now()).toLocaleTimeString()}. Ref: ${transaction.reference}. Dial ${ussd} to withdraw your money. Fuspay Technology.`;
            if (smsService) {
                if (smsService.name === 'Twilio') {
                    const phoneNumber = "+234" + transaction.receiverPhoneNumber.slice(1, 11);
                    const body = messageToBeSent;
                    await sendSms.sendWithTwilio(body, phoneNumber);
                }

                if (smsService.name === 'Telesign') {
                    const message = messageToBeSent;
                    const messageCallback = function messageCallback(error, responseBody) {
                        if (error === null) {
                            console.log('Telesign Messaging Successful.')
                        } else {
                            console.error('Error in Telesign Messaging');
                        }
                    }

                    const phoneNumber = "+234" + transaction.receiverPhoneNumber.slice(1, 11);
                    await sendSms.sendWithTelesign(customerId, apiKey, rest_endpoint, timeout, phoneNumber, message, 'ARN', messageCallback);
                }

                if (smsService.name === 'Termii') {
                    const sms = messageToBeSent;
                    const phoneNumber = "+234" + transaction.receiverPhoneNumber.slice(1, 11);
                    await sendSms.sendWithTermi(phoneNumber, sms);
                }
            }
        }
    }
});