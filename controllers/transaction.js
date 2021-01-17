const Transaction = require('../models/transaction');
const randomString = require('random-string');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_TEST_SECRET);
const axios = require('axios');

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
                reference: /*transaction.reference*/'PNG-12333eq',
                mobile_no: /*transaction.receiverPhoneNumber*/'09064058820',
                merchant_id: process.env.MERCHANT_ID,
                webhook_url: process.env.WEBHOOK_URL
            }, {
                    headers: {
                        Authorization: `Bearer ${process.env.MERCHANT_SECRET}`
                    }
                }
            );
            const data = response.data;
            const ussd = data.ussd;
            console.log(data);
            // if (data.success && data.message === 'Successful') {
            //     const authorize_url = "https://api.fusbeast.com/v1/MobileTransfer/Authorize";

            //     //Authorize Transfer and Send USSD Code
            //     const response = await axios.post(authorize_url, {

            //     },
            //         {
            //             headers: {
            //                 Authorization: `Bearer ${process.env.MERCHANT_SECRET}`
            //             }
            //         }
            //     )
            // }
        }
    }
});

exports.authorizeTransfer = catchAsync(async (req, res, next) => {
    //Send USSD code to receiver
    console.log(req);
    console.log(res);
});