const axios = require('axios');

exports.initTransferAndGenUssd = async (url, transaction) => {
    try {
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
            reference: transaction.reference
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