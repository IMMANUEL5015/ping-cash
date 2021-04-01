const Accounting = require('../models/accounting');
const { create, findAll, find, seeData, update, deleteOne } = require('../utils/crud');

exports.createAccountingItem = create(Accounting);

exports.getAccountingItems = findAll(Accounting);

exports.findAccountingItem = find(Accounting);

exports.seeAccountingItem = seeData();

exports.updateAccountingItem = update(Accounting);

exports.deleteAccountingItem = deleteOne(Accounting);