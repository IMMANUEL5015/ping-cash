const Role = require('../models/role');

const { create, findAll, find, seeData, update, deleteOne } = require('../utils/crud');

exports.createRole = create(Role);

exports.getRoles = findAll(Role);

exports.findRole = find(Role);

exports.seeRole = seeData();

exports.updateRole = update(Role);

exports.deleteRole = deleteOne(Role);