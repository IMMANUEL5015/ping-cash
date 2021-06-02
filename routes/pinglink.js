const router = require('express').Router();
const pinglink = require('../controllers/pinglink');
const { setBankAndBankCode } = require('../middlewares/general');

router.post(
    '/create_ping_link',
    pinglink.checkPaymentType,
    setBankAndBankCode,
    pinglink.checkIfCountryExists,
    // pinglink.preventDuplicatePin,
    pinglink.createPingLink
)

router.post(
    '/track_ping_link/',
    pinglink.trackPingLink
)

router.get(
    '/get_ping_link_details/:urlname',
    pinglink.findPingLink,
    pinglink.getPingLinkData
)

router.post(
    '/make_ping_link_payment/:urlname',
    pinglink.findPingLink,
    pinglink.flexiblePayments,
    pinglink.makePingLinkPayment
)

router.patch(
    '/edit_pinglink/:id',
    pinglink.checkPaymentType,
    setBankAndBankCode,
    pinglink.updateTransaction
)

module.exports = router;