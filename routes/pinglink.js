const router = require('express').Router();
const pinglink = require('../controllers/pinglink');

router.post(
    '/create_ping_link',
    pinglink.createPingLink
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