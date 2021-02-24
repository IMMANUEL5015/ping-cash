exports.success = (res, code, status, message, data) => {
    return res.status(code).json({
        status,
        message,
        data
    });
}

exports.error = (res, code, status, message) => {
    return res.status(code).json({
        status,
        message
    });
}