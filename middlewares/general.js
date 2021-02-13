const axios = require('axios');
const catchAsync = require('../utils/catchAsync');
const responses = require('../utils/responses');

exports.seeNigerianBanks = catchAsync(async (req, res, next) => {
    const url = 'https://api.paystack.co/bank';
    let banks = await axios.get(url, {
        headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_API_KEY}`
        }
    });
    banks = banks.data.data;

    return responses.success(res, 200, 'Success', 'All banks and their bank code.', banks);
});

exports.setBankAndBankCode = catchAsync(async (req, res, next) => {
    if (req.body.bankForRefund) {
        const url = 'https://api.paystack.co/bank';
        let banks = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_API_KEY}`
            }
        });
        banks = banks.data.data;

        for (let i = 0; i < banks.length; i++) {
            if (req.body.bankForRefund === banks[i].name) {
                req.body.bankSortCode = banks[i].code;
            }
        }
    }

    if (req.body.bankName) {
        const url = 'https://api.paystack.co/bank';
        let banks = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_API_KEY}`
            }
        });
        banks = banks.data.data;

        for (let i = 0; i < banks.length; i++) {
            if (req.body.bankName === banks[i].name) {
                req.body.bankSortCode = banks[i].code;
            }
        }
    }

    return next();
});