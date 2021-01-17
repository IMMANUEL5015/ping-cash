const router = require('express').Router();
const sms = require('../controllers/sms');

router.post('/',
    sms.createSmsService);

router.get('/',
    sms.getAllSmsServices
);

router.get('/:id',
    sms.findSmsService,
    sms.seeSmsService
);

router.patch('/:id',
    sms.findSmsService,
    sms.updateSmsService
);

router.delete('/:id',
    sms.findSmsService,
    sms.deleteSmsService
);

module.exports = router;