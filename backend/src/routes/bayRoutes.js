const express = require('express');
const router = express.Router();
const bayController = require('../controllers/bayController');

router.get('/', bayController.getBays);
router.post('/', bayController.createBay);
router.put('/:id', bayController.updateBay);
router.delete('/:id', bayController.deleteBay);

module.exports = router;
