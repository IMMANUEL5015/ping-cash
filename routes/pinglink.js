const router = require('express').Router();
const pinglink = require('../controllers/pinglink');
const { setBankAndBankCode } = require('../middlewares/general');

router.post(
    '/create_ping_link',
    setBankAndBankCode,
    pinglink.preventDuplicatePin,
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
    pinglink.makePingLinkPayment
)

module.exports = router;