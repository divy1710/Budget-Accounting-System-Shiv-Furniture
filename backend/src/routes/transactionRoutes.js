const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");

// Get all transactions
router.get("/", async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        category: true,
      },
      orderBy: {
        date: "desc",
      },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
      },
    });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
router.post("/", async (req, res) => {
  try {
    const { amount, description, date, type, categoryId } = req.body;
    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : new Date(),
        type,
        categoryId: parseInt(categoryId),
      },
      include: {
        category: true,
      },
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update transaction
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, date, type, categoryId } = req.body;
    const transaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        description,
        date: date ? new Date(date) : undefined,
        type,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
      },
      include: {
        category: true,
      },
    });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transaction
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.transaction.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary (total income and expense)
router.get("/summary/totals", async (req, res) => {
  try {
    const income = await prisma.transaction.aggregate({
      where: { type: "income" },
      _sum: { amount: true },
    });
    const expense = await prisma.transaction.aggregate({
      where: { type: "expense" },
      _sum: { amount: true },
    });
    res.json({
      totalIncome: income._sum.amount || 0,
      totalExpense: expense._sum.amount || 0,
      balance: (income._sum.amount || 0) - (expense._sum.amount || 0),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
