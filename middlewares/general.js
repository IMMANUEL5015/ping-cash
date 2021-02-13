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