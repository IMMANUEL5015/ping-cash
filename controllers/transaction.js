const Transaction = require('../models/transaction');
const PingLink = require('../models/pinglink');
const LinkTransaction = require('../models/linktransaction');
const randomString = require('random-string');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_TEST_SECRET);
const axios = require('axios');
const sendSms = require('../utils/sms');
const email = require('../utils/email');
const cron = require('node-cron');
const {
    verifyPaymentToFuspay, verifyTransfer,
    verifyTransferWithId, initTransferAndGenUssd,
    payPinglinkCreator
} = require('../utils/fuspay_apis');

exports.initializeTransaction = catchAsync(async (req, res, next) => {
    const uniqueString = randomString({ length: 26, numeric: true });
    const transaction = await Transaction.create({
        reference: `PNG-${uniqueString}eq`,
        transactionType: req.body.transactionType,
        senderFullName: req.body.senderFullName,
        senderPhoneNumber: req.body.senderPhoneNumber,
        senderEmailAddress: req.body.senderEmailAddress,
        accountNumberForRefund: req.body.accountNumberForRefund,
        bankForRefund: req.body.bankForRefund,
        bankSortCode: req.body.bankSortCode,
        receiverFullName: req.body.receiverFullName,
        receiverPhoneNumber: req.body.receiverPhoneNumber,
        amount: req.body.amount,
        chargeReceiverTheCommission: req.body.transactionType === 'send-to-nigeria' ? false : req.body.chargeReceiverTheCommission,
        country: req.body.country,
        currency: req.body.currency,
        currencyId: req.body.currencyId
    });

    await email.sendRefCode(
        req.body.senderEmailAddress,
        req.body.senderFullName,
        transaction.reference
    )

    return res.status(201).json({
        status: 'success', message: 'Transaction Initialized Successfully. Please check your mail to see the ref code for this transaction.',
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

exports.ensureTransactionIsFromAbroad = catchAsync(async (req, res, next) => {
    const { transaction } = req;
    if (transaction.transactionType !== 'send-to-nigeria') {
        return next(new AppError('This transaction must originate from outside Nigeria.'));
    }
    return next();
});

exports.ensureTransactionIsFromNigeria = catchAsync(async (req, res, next) => {
    const { transaction } = req;
    if (transaction.transactionType !== 'send-within-nigeria') {
        return next(new AppError('This transaction must originate from within Nigeria.'));
    }
    return next();
});

exports.makePayment = catchAsync(async (req, res, next) => {
    const { transaction } = req;
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Send Money to Nigeria',
                    },
                    unit_amount: Number(transaction.finalAmountPaid + "00"),
                },
                quantity: 1,
            },
        ],
        customer_email: transaction.senderEmailAddress,
        client_reference_id: transaction.id,
        mode: 'payment',
        success_url: process.env.HOME_PAGE, //To be changed later
        cancel_url: process.env.HOME_PAGE //To be changed later
    });

    await Transaction.findByIdAndUpdate(
        transaction.id,
        { session_id: session.id },
        { new: true }
    );

    return res.status(200).json({
        status: 'Success',
        session_id: session.id,
        name: transaction.senderFullName
    })
});

exports.verifyStripePayment = async (req, res, next) => {
    let linkTransaction;
    try {
        const sig = req.headers['stripe-signature'];

        let event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        const paymentIntent = event.data.object.payment_intent;
        const session_id = event.data.object.id;

        // Handle the event
        if (event && event.type === 'checkout.session.completed') {
            const data = event.data.object;
            res.status(200).json();

            let transaction = await Transaction.findOne({
                session_id
            });

            linkTransaction = await LinkTransaction.findOne({
                session_id
            })

            let pingLink;
            if (linkTransaction) {
                pingLink = await PingLink.findById(linkTransaction.pingLink);
            }

            if (transaction) {
                transaction = await Transaction.findOneAndUpdate(
                    { session_id },
                    { status: 'paid', paymentIntent },
                    { new: true }
                );

                //Initiate Transfer and Generate USSD Code
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
            } else if (linkTransaction && pingLink) {
                await LinkTransaction.findByIdAndUpdate(linkTransaction.id, {
                    status: 'paid'
                }, { new: true })

                const response = await payPinglinkCreator(pingLink, linkTransaction);
                if (response) {
                    const messageToBeSent = `Dear ${pingLink.linkName}. ${linkTransaction.fullName} has pinged you ${linkTransaction.finalAmountReceived} Dollars (${Math.floor(Number(linkTransaction.finalAmountReceivedInNaira))} Naira) via your pinglink. Time: ${new Date(Date.now()).toLocaleTimeString()}. Fuspay Technology.`;
                    const phoneNumber = "+234" + pingLink.phoneNumber.slice(1, 11);
                    const body = messageToBeSent;
                    await sendSms.sendWithTwilio(body, phoneNumber);
                }
            }
        }
    } catch (error) {
        console.error(error);
        if (linkTransaction) {
            await LinkTransaction.findByIdAndUpdate(linkTransaction.id, {
                status: 'failed'
            }, { new: true })
        }
    }
}

exports.authorizeTransfer = async (req, res, next) => {
    let transaction;
    let authorization_code;
    try {
        const data = req.body;
        if (
            data.success === 'true' && data.message === 'Succcessful' &&
            data.webhook_secret === process.env.WEBHOOK_SECRET
        ) {
            transaction = await Transaction.findOne({ reference: data.reference });
            authorization_code = data.authorization_code;
            await Transaction.findByIdAndUpdate(
                transaction.id,
                { authorization_code: data.authorization_code },
                { new: true }
            )
            if (transaction.status === 'paid') {
                const authorize_url = "https://api.fusbeast.com/v1/MobileTransfer/Authorize";

                //Authorize Transfer
                await axios.post(authorize_url, {
                    authorization_code: data.authorization_code,
                    merchant_id: process.env.MERCHANT_ID,
                    amount: `${Math.round(Number(transaction.finalAmountReceivedInNaira))}`
                },
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.MERCHANT_SECRET}`
                        }
                    }
                )
            }
        }

        res.status(200).json({ status: 'Successful', message: "Successful" });
    } catch (error) {
        console.error(error);
        if (transaction) {
            await Transaction.findByIdAndUpdate(
                transaction.id,
                { authorization_code, status: 'failed' },
                { new: true }
            )
        }
    }
}

//Verify paid transactions at 11:59pm every day.
cron.schedule('59 23 * * *', async () => {
    try {
        let transactions = await Transaction.find({ status: 'paid' });
        let linkTransactions = await LinkTransaction.find({ status: 'paid' });

        transactions = transactions.concat(linkTransactions);

        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];

            const url = 'https://api.fusbeast.com/v1/Transfer/Verify';

            if (transaction) {
                const response = await verifyTransfer(url, transaction);

                let data;
                if (response) data = response.data;

                if (
                    data && data.success === true && data.payment_status === "SUCCESS" &&
                    data.status === "SUCCESS" && data.transactionDescription === "Approved or completed successfully"
                ) {
                    const normalTransaction = await Transaction.findById(transaction.id);
                    if (normalTransaction) {
                        await Transaction.findByIdAndUpdate(
                            transaction.id,
                            { status: 'received' },
                            {
                                new: true
                            });
                    }

                    const linkTransaction = await LinkTransaction.findById(transaction.id);
                    if (linkTransaction) {
                        await LinkTransaction.findByIdAndUpdate(
                            transaction.id,
                            { status: 'received' },
                            { new: true }
                        );

                        const pingLink = await PingLink.findById(linkTransaction.pingLink);
                        if (pingLink) {
                            const { numOfLinkTransactions, totalAmountOfPaidLinkTransactions } = pingLink;
                            await PingLink.findByIdAndUpdate(
                                pingLink._id,
                                {
                                    numOfLinkTransactions: numOfLinkTransactions + 1,
                                    totalAmountOfPaidLinkTransactions: totalAmountOfPaidLinkTransactions + Number(linkTransaction.finalAmountReceived)
                                },
                                { new: true }
                            )
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
});

exports.getCheckoutUrl = catchAsync(async (req, res, next) => {
    const { transaction } = req;
    const url = `https://api.fusbeast.com/checkout/${process.env.MERCHANT_ID}/create`;

    const response = await axios.post(url, {
        reference: transaction.reference,
        checkout_type: 'DIRECT',
        customer_email: transaction.senderEmailAddress,
        amount: `${Math.round(Number(transaction.finalAmountPaid))}`,
        callback_url: process.env.HOME_PAGE
    });

    return res.status(200).json({
        status: 'Success',
        url: response.data.url
    });
});

cron.schedule('*/5 * * * *', async () => {
    try {
        //Run every 5 minutes
        const transactions = await Transaction.find({
            status: 'pending',
            transactionType: 'send-within-nigeria'
        })

        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            const { reference } = transaction;

            const url = `https://api.fusbeast.com/checkout-status/${reference}`;
            const data = await verifyPaymentToFuspay(url);

            if (
                data && data.status === 'PAID' &&
                data.success && data.message === 'Successful'
                && !data.error
            ) {
                await Transaction.findOneAndUpdate(
                    { reference },
                    { status: 'paid' },
                    { new: true }
                );

                //Initiate Transfer and Generate USSD Code
                const url = 'https://api.fusbeast.com/v1/MobileTransfer/Initiate';
                const response = await initTransferAndGenUssd(url, transaction);

                //Send USSD Code
                let ussd;
                if (response) ussd = response.data.ussd;
                if (ussd) {
                    const messageToBeSent = `Dear ${transaction.receiverFullName}. ${transaction.senderFullName} has pinged you ${Math.round(Number(transaction.finalAmountReceivedInNaira))} Naira. Time: ${new Date(Date.now()).toLocaleTimeString()}. Ref: ${transaction.reference}. Dial ${ussd} to withdraw your money. Fuspay Technology.`;
                    const phoneNumber = "+234" + transaction.receiverPhoneNumber.slice(1, 11);
                    const body = messageToBeSent;
                    await sendSms.sendWithTwilio(body, phoneNumber);
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
});

exports.viewSpecificTransaction = catchAsync(async (req, res, next) => {
    const { transaction } = req;
    return res.status(200).json({
        status: 'Success',
        transaction
    });
});

exports.updateTransaction = catchAsync(async (req, res, next) => {
    let { transaction } = req;
    const {
        transactionType, senderFullName, senderPhoneNumber,
        senderEmailAddress, accountNumberForRefund, bankForRefund,
        bankSortCode, receiverFullName, receiverPhoneNumber, amount,
        chargeReceiverTheCommission, country, currency, currencyId
    } = req.body;

    if (transactionType) transaction.transactionType = transactionType;
    if (senderFullName) transaction.senderFullName = senderFullName;
    if (senderPhoneNumber) transaction.senderPhoneNumber = senderPhoneNumber;
    if (senderEmailAddress) transaction.senderEmailAddress = senderEmailAddress;
    if (accountNumberForRefund) transaction.accountNumberForRefund = accountNumberForRefund;
    if (bankForRefund) transaction.bankForRefund = bankForRefund;
    if (bankSortCode) transaction.bankSortCode = bankSortCode;
    if (receiverFullName) transaction.receiverFullName = receiverFullName;
    if (receiverPhoneNumber) transaction.receiverPhoneNumber = receiverPhoneNumber;
    if (transactionType) transaction.transactionType = transactionType;
    if (amount) transaction.amount = amount;
    if (chargeReceiverTheCommission === true) transaction.chargeReceiverTheCommission = true;
    if (chargeReceiverTheCommission === false) transaction.chargeReceiverTheCommission = false;
    if (country) transaction.country = country;
    if (currency) transaction.currency = currency;
    if (currencyId) transaction.currencyId = currencyId;

    transaction = await transaction.save();

    return res.status(200).json({
        status: 'Success',
        message: 'Transaction updated!',
        transaction
    });
});

exports.cancelTransaction = catchAsync(async (req, res, next) => {
    let { transaction } = req;

    if (
        transaction.status === 'received' || transaction.status === 'cancelled' ||
        transaction.status === 'refunded'
    ) {
        return next(new AppError('You cannot cancel this transaction!', 403));
    }

    if (transaction.status === 'paid') {
        const url = 'https://api.fusbeast.com/v1/Transfer/Verify';

        if (transaction) {
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
                return next(new AppError('Sorry, you cannot cancel this transaction anymore. The receiver has already claimed the money.', 403));
            }
        }
    }

    transaction = await Transaction.findByIdAndUpdate(
        transaction.id,
        { status: 'cancelled' },
        { new: true }
    )

    return res.status(200).json({
        status: 'Success',
        message: 'Transaction cancelled successfully!',
        transaction
    });
});

exports.refundMoneyToNigerian = async (transaction) => {
    //Handle failed refunds later on
    try {
        const {
            finalAmountPaid, accountNumberForRefund, bankSortCode
        } = transaction;

        const url = 'https://api.fusbeast.com/v1/Transfer/Initiate';
        const data = {
            "pin": process.env.PIN,
            "narration": "PingCash Transaction Refund.",
            "account_number": accountNumberForRefund,
            "bank_code": bankSortCode,
            "to": "bank",
            "amount": finalAmountPaid,
            reference: transaction.id,
            "merchant_id": process.env.MERCHANT_ID
        };
        const headers = { headers: { Authorization: `Bearer ${process.env.MERCHANT_SECRET}` } };

        await axios.post(url, data, headers);
    } catch (error) {
        console.error(error);
    }
}

exports.refundMoneyToForeigner = async (transaction) => {
    try {
        const { paymentIntent } = transaction;
        await stripe.refunds.create({
            payment_intent: paymentIntent,
        });

        await Transaction.findOneAndUpdate(
            { paymentIntent },
            { status: 'refunded' },
            { new: true }
        )

    } catch (error) {
        console.error(error);
    }
}

exports.failedTransactions = catchAsync(async (req, res, next) => {
    const transactions = await Transaction.find({ status: 'failed' });
    return res.status(200).json({ status: 'Success', transactions });
});

//Verify paid transactions at 9:59pm every day.
cron.schedule('59 21 * * *', async () => {
    try {
        let transactions = await Transaction.find({ status: 'cancelled' });

        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];

            const url = 'https://api.fusbeast.com/v1/Transfer/Verify';

            if (transaction) {
                const response = await verifyTransferWithId(url, transaction);

                let data;
                if (response) data = response.data;

                if (
                    data && data.success === true && data.payment_status === "SUCCESS" &&
                    data.status === "SUCCESS" && data.transactionDescription === "Approved or completed successfully"
                ) {

                    await Transaction.findByIdAndUpdate(
                        transaction.id, { status: 'refunded' }, { new: true }
                    )
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
});