const CreditRate = require('../models/creditrate');
const { create, findAll, find, seeData, update, deleteOne } = require('../utils/crud');

exports.createCreditRate = create(CreditRate);

exports.getCreditRates = findAll(CreditRate);

exports.findCreditRate = find(CreditRate);

exports.seeCreditRate = seeData();

exports.updateCreditRate = update(CreditRate);

exports.deleteCreditRate = deleteOne(CreditRate);