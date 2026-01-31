const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

router.get("/", paymentController.getAll);
router.get("/outstanding/:contactId", paymentController.getOutstanding);
router.get("/:id", paymentController.getById);
router.post("/", paymentController.create);
router.put("/:id", paymentController.update);
router.post("/:id/void", paymentController.voidPayment);
router.delete("/:id", paymentController.remove);

module.exports = router;
