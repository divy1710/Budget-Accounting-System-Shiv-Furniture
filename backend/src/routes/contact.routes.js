const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');

router.get('/', contactController.getAll);
router.get('/customers', contactController.getCustomers);
router.get('/vendors', contactController.getVendors);
router.get('/:id', contactController.getById);
router.post('/', contactController.create);
router.put('/:id', contactController.update);
router.delete('/:id', contactController.remove);

module.exports = router;
