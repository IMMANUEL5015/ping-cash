const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.sendWithTwilio = async (body, sender, to) => {
    return await client.messages.create({
        body,
        from: sender,
        to
    });
}