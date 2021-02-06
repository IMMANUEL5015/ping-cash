const router = require('express').Router();
const pinglink = require('../controllers/pinglink');

router.post(
    '/create_ping_link',
    pinglink.createPingLink
)

router.post(
    '/pinglink_webhook_url',
    (req, res, next) => {
        console.log("WEBHOOK", req);
        console.log("WEBHOOK", req.ip);
    }
);

router.get(
    '/pinglink_redirect_url',
    (req, res, next) => {
        console.log("REDIRECT_URL", req);
        console.log("REDIRECT_URL", req.ip);
    }
);

module.exports = router;