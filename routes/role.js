const router = require('express').Router();
const role = require('../controllers/role');
const admin = require('../controllers/admin');
const { checkIfLoggedInUserHasRequiredPrivilege } = require('../utils/otherUtils');

router.use(admin.protect);

router.post('/',
    checkIfLoggedInUserHasRequiredPrivilege('create-role'),
    role.createRole);

router.get('/',
    checkIfLoggedInUserHasRequiredPrivilege('view-roles'),
    role.getRoles
);

router.get('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('view-roles'),
    role.findRole,
    role.seeRole
);

router.patch('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('update-role'),
    role.findRole,
    role.updateRole
);

router.delete('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('delete-role'),
    role.findRole,
    role.deleteRole
);

module.exports = router;