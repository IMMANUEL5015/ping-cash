const axios = require('axios');

exports.getBankSortCode = async (bankName) => {
    try {
        let bankSortCode;
        const url = 'https://api.paystack.co/bank';
        let banks = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_API_KEY}`
            }
        });
        banks = banks.data.data;

        for (let i = 0; i < banks.length; i++) {
            if (bankName === banks[i].name) {
                bankSortCode = banks[i].code;
                i = banks.length;
            }
        }

        return bankSortCode;
    } catch (error) {
        console.error(error);
    }
}

exports.getBankName = async (accountNumber, bankSortCode) => {
    let accountName;
    const url = "https://api.fusbeast.com/v1/Transfer/ValidateAccount";
    if (accountNumber && bankSortCode) {
        let data = await axios.post(url, {
            merchant_id: process.env.MERCHANT_ID,
            account_no: accountNumber,
            bank_code: bankSortCode
        },
            {
                headers: {
                    Authorization: `Bearer ${process.env.MERCHANT_SECRET}`
                }
            }
        )

        data = data.data;
        if (data.success) accountName = data.account_name;
    }
    return accountName;
}