const router = require('express').Router();
const expense = require('../controllers/expense');
const admin = require('../controllers/admin');
const { checkIfLoggedInUserHasRequiredPrivilege } = require('../utils/otherUtils');

router.use(admin.protect);

router.post('/',
    checkIfLoggedInUserHasRequiredPrivilege('create-expense'),
    expense.createExpense);

router.get('/',
    checkIfLoggedInUserHasRequiredPrivilege('view-expenses'),
    expense.getExpenses
);

router.get('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('view-expenses'),
    expense.findExpense,
    expense.seeExpense
);

router.patch('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('update-expense'),
    expense.findExpense,
    expense.updateExpense
);

router.delete('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('delete-expense'),
    expense.findExpense,
    expense.deleteExpense
);

module.exports = router;