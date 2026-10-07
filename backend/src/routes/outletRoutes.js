const express = require('express');
const router = express.Router();
const outletController = require('../controllers/outletController');

router.get('/', outletController.getOutlets);
router.get('/:id', outletController.getOutletById);
router.post('/', outletController.createOutlet);
router.put('/:id', outletController.updateOutlet);
router.delete('/:id', outletController.deleteOutlet);

module.exports = router;
