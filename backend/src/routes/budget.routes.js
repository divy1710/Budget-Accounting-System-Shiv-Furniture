const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budget.controller");

router.get("/", budgetController.getAll);
router.get("/:id", budgetController.getById);
router.post("/", budgetController.create);
router.put("/:id", budgetController.update);
router.post("/:id/confirm", budgetController.confirm);
router.post("/:id/revise", budgetController.revise);
router.post("/:id/archive", budgetController.archive);
router.delete("/:id", budgetController.remove);

module.exports = router;
