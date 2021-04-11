const axios = require('axios');
const {
    notifyPrivilegedUsersOfFailedTransactions,
    keepRecords
} = require('./otherUtils');
const Transaction = require('../models/transaction');
const Exist = require('../models/exist');

exports.initTransferAndGenUssd = async (url, transaction) => {
    try {
        const response = await axios.post(url, {
            webhook_secret: process.env.WEBHOOK_SECRET,
            reference: transaction.dynamicReference,
            mobile_no: transaction.receiverPhoneNumber,
            merchant_id: process.env.MERCHANT_ID,
            webhook_url: process.env.WEBHOOK_URL
        }, {
                headers: {
                    Authorization: `Bearer ${process.env.MERCHANT_SECRET}`
                }
            }
        );

        return response;
    } catch (error) {
        console.error(error);
    }
}

exports.verifyPaymentToFuspay = async (url) => {
    try {
        const response = await axios.get(url);

        if (response) return response.data;
    } catch (error) {
        console.error(error);
    }
}

exports.verifyTransfer = async (url, transaction) => {
    try {
        const response = await axios.post(url, {
            merchant_id: process.env.MERCHANT_ID,
            reference: transaction.dynamicReference
        }, {
                headers: {
                    Authorization: `Bearer ${process.env.MERCHANT_SECRET}`
                }
            }
        );

        if (response) return response;
    } catch (error) {
        console.error(error);
    }
}

exports.payPinglinkCreator = async (pingLink, linkTransaction) => {
    try {
        const url = 'https://api.fusbeast.com/v1/Transfer/Initiate';
        const data = {
            "pin": process.env.PIN,
            "narration": "Money Transfer Via PingLink.",
            "account_number": pingLink.accountNumber,
            "bank_code": pingLink.bankSortCode,
            "to": "bank",
            "amount": `${Math.floor(Number(linkTransaction.finalAmountReceivedInNaira))}`,
            reference: linkTransaction.reference,
            "merchant_id": process.env.MERCHANT_ID
        };
        const headers = { headers: { Authorization: `Bearer ${process.env.MERCHANT_SECRET}` } };

        const response = await axios.post(url, data, headers);

        if (response) return response;
    } catch (error) {
        console.error(error);
    }
}

exports.authorizeMobileTransfer = async (authorize_url, data, transaction) => {
    try {
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
    } catch (error) {
        console.error(error);
        if (transaction) {
            await Transaction.findByIdAndUpdate(
                transaction._id,
                { authorization_code: data.authorization_code, status: 'failed' },
                { new: true }
            )

            const existing = await Exist.findOne({
                type: "international-transactions",
                uniqueId: transaction._id
            });

            if (!existing) {
                await keepRecords(
                    'international-transactions',
                    {
                        totalAmount: Number(transaction.amount),
                        totalFinalAmountPaid: Number(transaction.finalAmountPaid),
                        totalFinalAmountReceived: Number(transaction.finalAmountReceived),
                        totalFinalAmountReceivedInNaira: Number(transaction.finalAmountReceivedInNaira),
                        totalAdministrativeExpensesInNaira: Number(transaction.administrativeExpensesInNaira),
                        totalActualAdministrativeExpensesInNaira: Number(transaction.actualAdministrativeExpensesInNaira),
                        totalAdministrativeExpensesOverflow: Number(transaction.administrativeExpensesOverflow)
                    },
                    'failed'
                );

                await Exist.create({
                    type: "international-transactions",
                    uniqueId: transaction._id
                })
            }

            const obj = {
                message: 'An error occured when a customer tried to claim the amount pinged to his phone number.',
                type: 'send-money-transaction',
                transactionId: transaction._id
            };

            await notifyPrivilegedUsersOfFailedTransactions(obj);
        }
    }
}