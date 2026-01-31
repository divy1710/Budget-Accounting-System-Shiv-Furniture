const express = require('express');
const router = express.Router();
const analyticalAccountController = require('../controllers/analyticalAccount.controller');

router.get('/', analyticalAccountController.getAll);
router.get('/tree', analyticalAccountController.getTree);
router.get('/:id', analyticalAccountController.getById);
router.post('/', analyticalAccountController.create);
router.put('/:id', analyticalAccountController.update);
router.delete('/:id', analyticalAccountController.remove);

module.exports = router;
