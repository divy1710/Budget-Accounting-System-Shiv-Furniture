const express = require('express');
const router = express.Router();
const autoAnalyticalController = require('../controllers/autoAnalytical.controller');

router.get('/', autoAnalyticalController.getAll);
router.get('/:id', autoAnalyticalController.getById);
router.get('/match/:productId', autoAnalyticalController.findMatch);
router.post('/', autoAnalyticalController.create);
router.put('/:id', autoAnalyticalController.update);
router.delete('/:id', autoAnalyticalController.remove);

module.exports = router;
