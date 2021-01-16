const Currency = require('../models/currency');
const Country = require('../models/country');
const { create, findAll, find, seeData, update, deleteOne } = require('../utils/crud');

exports.createCurrency = create(Currency);

exports.getCurrencies = findAll(Currency);

exports.findCurrency = find(Currency);

exports.seeCurrency = seeData();

exports.updateCurrency = update(Currency);

exports.deleteCurrency = deleteOne(Currency);

exports.getCountries = findAll(Country);