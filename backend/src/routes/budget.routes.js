const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budget.controller");

router.get("/", budgetController.getAll);
router.get("/summary", budgetController.getSummary);
router.get("/:id", budgetController.getById);
router.post("/", budgetController.create);
router.put("/:id", budgetController.update);
router.delete("/:id", budgetController.remove);

module.exports = router;
