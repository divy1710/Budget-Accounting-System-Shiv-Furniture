const transactionService = require("../services/transaction.service");

const getAll = async (req, res) => {
  try {
    const transactions = await transactionService.getAll(req.query);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const transaction = await transactionService.getById(
      parseInt(req.params.id),
    );
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const transaction = await transactionService.create(req.body);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const transaction = await transactionService.update(
      parseInt(req.params.id),
      req.body,
    );
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const confirm = async (req, res) => {
  try {
    const transaction = await transactionService.confirm(
      parseInt(req.params.id),
    );
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const cancel = async (req, res) => {
  try {
    const transaction = await transactionService.cancel(
      parseInt(req.params.id),
    );
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await transactionService.remove(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { getAll, getById, create, update, confirm, cancel, remove };
