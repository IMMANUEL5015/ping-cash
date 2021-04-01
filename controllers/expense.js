const Expense = require('../models/expense');
const { create, findAll, find, seeData, update, deleteOne } = require('../utils/crud');

exports.createExpense = create(Expense);

exports.getExpenses = findAll(Expense);

exports.findExpense = find(Expense);

exports.seeExpense = seeData();

exports.updateExpense = update(Expense);

exports.deleteExpense = deleteOne(Expense);