const budgetService = require("../services/budget.service");

const getAll = async (req, res) => {
  try {
    const budgets = await budgetService.getAll(req.query);
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSummary = async (req, res) => {
  try {
    const summary = await budgetService.getSummary(req.query);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const budget = await budgetService.getById(parseInt(req.params.id));
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const budget = await budgetService.create(req.body);
    res.status(201).json(budget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const budget = await budgetService.update(
      parseInt(req.params.id),
      req.body,
    );
    res.json(budget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await budgetService.remove(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { getAll, getSummary, getById, create, update, remove };
