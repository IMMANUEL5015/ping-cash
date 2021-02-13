const router = require('express').Router();
const general = require('../middlewares/general');

router.get('/banks',
    general.seeNigerianBanks
);

router.post('/calculator',
    general.calculator
);

module.exports = router;