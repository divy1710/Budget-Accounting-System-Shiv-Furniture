const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

router.get("/", paymentController.getAll);
router.get("/outstanding/:contactId", paymentController.getOutstanding);
router.get("/:id", paymentController.getById);
router.post("/", paymentController.create);
router.post(
  "/from-transaction/:transactionId",
  paymentController.createFromTransaction,
);
router.put("/:id", paymentController.update);
router.post("/:id/confirm", paymentController.confirm);
router.post("/:id/cancel", paymentController.cancel);
router.post("/:id/void", paymentController.voidPayment);
router.delete("/:id", paymentController.remove);

module.exports = router;
