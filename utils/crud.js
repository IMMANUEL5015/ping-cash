const catchAsync = require('../utils/catchAsync');
const { success } = require('../utils/responses');
const AppError = require('../utils/appError');

exports.create = (Model) => {
    return catchAsync(async (req, res, next) => {
        const data = await Model.create({
            ...req.body
        });

        return success(res, 201, 'success',
            'Created Successfully!', data);
    });
}

exports.findAll = (Model) => {
    return catchAsync(async (req, res, next) => {
        const data = await Model.find({});
        return success(res, 200, 'success',
            'Retrieved Successfully!', data);
    });
}

exports.find = (Model) => {
    return catchAsync(async (req, res, next) => {
        const data = await Model.findById(req.params.id);
        if (!data) return next(new AppError('Not Found!', 404));
        req.data = data;
        return next();
    });
}

exports.seeData = () => {
    return (req, res, next) => {
        return success(res, 200, 'success', 'Retrieved', req.data);
    }
}

exports.update = (Model) => {
    return catchAsync(async (req, res, next) => {
        const data = await Model.findByIdAndUpdate(req.params.id,
            { ...req.body }, { new: true });
        return success(res, 200, 'success', 'Updated!', data);
    });
}

exports.deleteOne = (Model) => {
    return catchAsync(async (req, res, next) => {
        await Model.findByIdAndDelete(req.params.id);
        return res.status(204).json();
    });
}