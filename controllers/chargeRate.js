const ChargeRate = require('../models/chargerate');
const catchAsync = require('../utils/catchAsync');
const { success } = require('../utils/responses');

exports.createChargeRate = catchAsync(async (req, res, next) => {
    const chargeRate = await ChargeRate.create({
        ...req.body
    });

    return success(res, 201, 'success',
        'Charge Rate Created Successfully!', chargeRate);
});

exports.getChargeRates = catchAsync(async (req, res, next) => {
    const chargeRates = await ChargeRate.find({});
    return success(res, 200, 'success',
        'Charge Rates Retrieved Successfully!', chargeRates);
});

exports.seeChargeRate = catchAsync(async (req, res, next) => {
    const chargeRate = await ChargeRate.findById(req.params.id);
});