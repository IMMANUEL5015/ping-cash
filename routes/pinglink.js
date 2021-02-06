const router = require('express').Router();
const pinglink = require('../controllers/pinglink');

router.post(
    '/create_ping_link',
    pinglink.createPingLink
)

module.exports = router;