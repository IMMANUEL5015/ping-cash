const router = require('express').Router();
const pinglink = require('../controllers/pinglink');

router.post(
    '/create_ping_link',
    pinglink.createPingLink
)

router.get(
    '/get_ping_link_details/:urlname',
    pinglink.getPingLinkData
)

module.exports = router;