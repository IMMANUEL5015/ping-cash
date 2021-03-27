const router = require('express').Router();
const pCategory = require('../controllers/pcategory');
const admin = require('../controllers/admin');

router.use(admin.protect);

router.post('/',
    pCategory.createPcategory);

router.get('/',
    pCategory.getPcateories
);

router.get('/:id',
    pCategory.findPcategory,
    pCategory.seePcategory
);

router.patch('/:id',
    pCategory.findPcategory,
    pCategory.updatePcategory
);

router.delete('/:id',
    pCategory.findPcategory,
    pCategory.deletePcategory
);

module.exports = router;