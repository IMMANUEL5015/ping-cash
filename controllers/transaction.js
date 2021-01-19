const Transaction = require('../models/transaction');
const randomString = require('random-string');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_TEST_SECRET);
const axios = require('axios');
const Sms = require('../models/sms');
const sendSms = require('../utils/sms');

const customerId = process.env.TELESIGN_CUSTOMER_ID;
const apiKey = process.env.TELESIGN_API_KEY;
const rest_endpoint = "https://rest-api.telesign.com";
const timeout = 10 * 1000; // 10 secs

const cron = require('node-cron');
const shell = require('shelljs');

exports.initializeTransaction = catchAsync(async (req, res, next) => {
    const uniqueString = randomString({ length: 6, numeric: true });
    const transaction = await Transaction.create({
        reference: `PNG-${uniqueString}eq`,
        transactionType: req.body.transactionType,
        senderFullName: req.body.senderFullName,
        senderPhoneNumber: req.body.senderPhoneNumber,
        accountNumberForRefund: req.body.accountNumberForRefund,
        bankForRefund: req.body.bankForRefund,
        bankSortCode: req.body.bankSortCode,
        receiverFullName: req.body.receiverFullName,
        receiverPhoneNumber: req.body.receiverPhoneNumber,
        amount: req.body.amount,
        chargeReceiverTheCommission: req.body.chargeReceiverTheCommission,
        country: req.body.country,
        currency: req.body.currency,
        currencyId: req.body.currencyId
    });

    return res.status(201).json({
        status: 'success', message: 'Transaction Initialized Successfully',
        transaction
    });
});

exports.findTransaction = catchAsync(async (req, res, next) => {
    const transaction = await Transaction.findOne({
        reference: req.params.ref
    });

    if (!transaction) return next(new AppError('Transaction not found!', 404));
    req.transaction = transaction;
    return next();
});

exports.checkIfTransactionIsPending = catchAsync(async (req, res, next) => {
    const { transaction } = req;
    if (transaction.status !== 'pending') return next(new AppError('This transaction is no longer pending.'));
    return next();
});

exports.makePayment = catchAsync(async (req, res, next) => {
    const { transaction } = req;
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Number(transaction.finalAmountPaid),
        currency: transaction.currencyId.abbreviation,
        metadata: { integration_check: 'accept_a_payment' },
    });

    await Transaction.findByIdAndUpdate(
        transaction.id,
        { client_secret: paymentIntent.client_secret },
        { new: true }
    );

    return res.status(200).json({
        status: 'Success',
        client_secret: paymentIntent.client_secret,
        name: transaction.senderFullName
    })
});

exports.verifyStripePayment = catchAsync(async (req, res, next) => {
    //Later on, check for and fix the reason for the async error that occured earlier
    const sig = req.headers['stripe-signature'];

    let event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    // Handle the event
    if (event && event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        if (paymentIntent.status === 'succeeded') {
            res.status(200).json();
            const transaction = await Transaction.findOneAndUpdate(
                { client_secret: paymentIntent.client_secret },
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
            //Later on, the message being sent might need to be adjusted.
            const smsService = await Sms.findOne({ active: true });
            if (smsService) {
                if (smsService.name === 'Twilio') {
                    const phoneNumber = "+234" + transaction.receiverPhoneNumber.slice(1, 11);
                    const body = `${transaction.finalAmountReceived} ${transaction.currency} has been pinged to your phone number. Utilize the USSD code and follow it's instructions to claim the pinged cash. ${ussd}`;
                    await sendSms.sendWithTwilio(body, phoneNumber);
                }

                if (smsService.name === 'Telesign') {
                    const message = `${transaction.finalAmountReceived} ${transaction.currency} has been pinged to your phone number. Utilize the USSD code and follow it's instructions to claim the pinged cash. ${ussd}`;
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
                    //Later on, ensure that Termii works fine
                    const sms = `${transaction.finalAmountReceived} ${transaction.currency} has been pinged to your phone number. Utilize the USSD code and follow it's instructions to claim the pinged cash. ${ussd}`;
                    await sendSms.sendWithTermi(transaction.receiverPhoneNumber, sms);
                }
            }
        }
    }
});

exports.authorizeTransfer = catchAsync(async (req, res, next) => {
    const data = req.body;
    if (
        data.success === 'true' && data.message === 'Succcessful' &&
        data.webhook_secret === process.env.WEBHOOK_SECRET
    ) {
        const transaction = await Transaction.findOne({ reference: data.reference });
        const authorize_url = "https://api.fusbeast.com/v1/MobileTransfer/Authorize";

        //Authorize Transfer
        await axios.post(authorize_url, {
            authorization_code: data.authorization_code,
            merchant_id: process.env.MERCHANT_ID,
            amount: transaction.finalAmountReceivedInNaira //Later on, approx to two decimals.
        },
            {
                headers: {
                    Authorization: `Bearer ${process.env.MERCHANT_SECRET}`
                }
            }
        )
    }
});

//Run once every day
cron.schedule("* 23 * * *", async function () {
    //Later on, ensure that errors don't prevent the cron's continuation
    const transactions = await Transaction.find({ status: 'paid' });
    for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        const url = 'https://api.fusbeast.com/v1/Transfer/Verify';

        const response = await axios.post(url, {
            merchant_id: process.env.MERCHANT_ID,
            reference: transaction.reference
        }, {
                headers: {
                    Authorization: `Bearer ${process.env.MERCHANT_SECRET}`
                }
            }
        );

        const data = response.data;

        if (
            data.success === true && data.payment_status === "SUCCESS" &&
            data.status === "SUCCESS" && data.transactionDescription === "Approved or completed successfully"
        ) {
            await Transaction.findByIdAndUpdate(transaction.id, { status: 'received' }, {
                new: true
            });
        }
    }
});