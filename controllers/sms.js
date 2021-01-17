const Sms = require('../models/sms');
const { create, findAll, find, seeData, update, deleteOne } = require('../utils/crud');

exports.createSmsService = create(Sms);

exports.getAllSmsServices = findAll(Sms);

exports.findSmsService = find(Sms);

exports.seeSmsService = seeData();

exports.updateSmsService = update(Sms);

exports.deleteSmsService = deleteOne(Sms);