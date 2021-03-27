const Privilege = require('../models/privilege');

const { create, findAll, find, seeData, update, deleteOne } = require('../utils/crud');

exports.createPrivilege = create(Privilege);

exports.getPrivileges = findAll(Privilege);

exports.findPrivilege = find(Privilege);

exports.seePrivilege = seeData();

exports.updatePrivilege = update(Privilege);

exports.deletePrivilege = deleteOne(Privilege);