const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const axios = require('axios');

const TeleSignSDK = require('telesignsdk');

exports.sendWithTwilio = async (body, to) => {
    return await client.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
    });
}

exports.sendWithTermi = async (to, sms) => {
    const url = 'https://termii.com/api/sms/send';
    return await axios.post(url, {
        "to": to,
        "from": process.env.TERMII_SMS_ID,
        sms,
        "type": "plain",
        "channel": "generic",
        "api_key": process.env.TERMII_API_KEY
    });
}

exports.sendWithTelesign = async (customerId, apiKey, rest_endpoint,
    timeout, phoneNumber, message, messageType, messageCallback) => {
    const theClient = new TeleSignSDK(customerId,
        apiKey,
        rest_endpoint,
        timeout // optional
        // userAgent
    );

    return theClient.sms.message(messageCallback, phoneNumber, message, messageType);
}