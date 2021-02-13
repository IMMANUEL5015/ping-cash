const router = require('express').Router();
const general = require('../middlewares/general');

router.get('/banks',
    general.seeNigerianBanks
);

module.exports = router;