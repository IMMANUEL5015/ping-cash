exports.success = (res, code, status, message, data) => {
    res.status(code).json({
        status,
        message,
        data
    });
}