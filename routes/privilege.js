const router = require('express').Router();
const privilege = require('../controllers/privilege');
const admin = require('../controllers/admin');

router.use(admin.protect);

router.post('/',
    privilege.createPrivilege);

router.get('/',
    privilege.getPrivileges
);

router.get('/:id',
    privilege.findPrivilege,
    privilege.seePrivilege
);

router.patch('/:id',
    privilege.findPrivilege,
    privilege.updatePrivilege
);

router.delete('/:id',
    privilege.findPrivilege,
    privilege.deletePrivilege
);

module.exports = router;