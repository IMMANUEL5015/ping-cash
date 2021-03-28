const randomString = require('random-string');

exports.generateRef = () => {
    const uniqueString = randomString({ length: 26, numeric: true });
    return uniqueString;
}