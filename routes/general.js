const router = require('express').Router();
const general = require('../middlewares/general');

router.get('/banks',
    general.seeNigerianBanks
);

router.post('/calculator',
    general.calculator
);

router.post(
    '/verify_bank_acct',
    general.verifyBankAcct
);

module.exports = router;