const router = require('express').Router();
const role = require('../controllers/role');
const admin = require('../controllers/admin');

router.use(admin.protect);

router.post('/',
    role.createRole);

router.get('/',
    role.getRoles
);

router.get('/:id',
    role.findRole,
    role.seeRole
);

router.patch('/:id',
    role.findRole,
    role.updateRole
);

router.delete('/:id',
    role.findRole,
    role.deleteRole
);

module.exports = router;