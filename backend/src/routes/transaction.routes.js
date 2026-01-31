const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");

router.get("/", transactionController.getAll);
router.get("/:id", transactionController.getById);
router.get("/:id/budget-warnings", transactionController.checkBudgetWarnings);
router.post("/", transactionController.create);
router.put("/:id", transactionController.update);
router.post("/:id/confirm", transactionController.confirm);
router.post("/:id/cancel", transactionController.cancel);
router.post("/:id/create-bill", transactionController.createBillFromPO);
router.post("/:id/create-invoice", transactionController.createInvoiceFromSO);
router.delete("/:id", transactionController.remove);

module.exports = router;
