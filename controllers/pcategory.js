const Pcategory = require('../models/pcategory');

const { create, findAll, find, seeData, update, deleteOne } = require('../utils/crud');

exports.createPcategory = create(Pcategory);

exports.getPcateories = findAll(Pcategory);

exports.findPcategory = find(Pcategory);

exports.seePcategory = seeData();

exports.updatePcategory = update(Pcategory);

exports.deletePcategory = deleteOne(Pcategory);