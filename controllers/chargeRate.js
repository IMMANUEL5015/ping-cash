const ChargeRate = require('../models/chargerate');
const { create, findAll, find, seeData, update, deleteOne } = require('../utils/crud');

exports.createChargeRate = create(ChargeRate);

exports.getChargeRates = findAll(ChargeRate);

exports.findChargeRate = find(ChargeRate);

exports.seeChargeRate = seeData();

exports.updateChargeRate = update(ChargeRate);

exports.deleteChargeRate = deleteOne(ChargeRate);