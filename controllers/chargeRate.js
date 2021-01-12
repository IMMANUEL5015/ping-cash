const ChargeRate = require('../models/chargerate');
const catchAsync = require('../utils/catchAsync');
const { success } = require('../utils/responses');
const AppError = require('../utils/appError');

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

exports.findChargeRate = catchAsync(async (req, res, next) => {
    const chargeRate = await ChargeRate.findById(req.params.id);
    if (!chargeRate) return next(new AppError('Charge Rate Not Found!', 404));
    req.chargeRate = chargeRate;
    return next();
});

exports.seeChargeRate = (req, res, next) => {
    return success(res, 200, 'success', 'Retrieved Charge Rate!', req.chargeRate);
}

exports.updateChargeRate = catchAsync(async (req, res, next) => {
    const chargeRate = await ChargeRate.findByIdAndUpdate(req.params.id,
        { ...req.body }, { new: true });
    return success(res, 200, 'success', 'Updated Charge Rate!', chargeRate);
});

exports.deleteChargeRate = catchAsync(async (req, res, next) => {
    await ChargeRate.findByIdAndDelete(req.params.id);
    return res.status(204).json();
});