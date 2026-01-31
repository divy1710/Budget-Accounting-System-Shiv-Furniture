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
    const transaction = await transactionService.getById(req.params.id);
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
      req.params.id,
      req.body,
    );
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const confirm = async (req, res) => {
  try {
    const transaction = await transactionService.confirm(req.params.id);
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const cancel = async (req, res) => {
  try {
    const transaction = await transactionService.cancel(req.params.id);
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await transactionService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const createBillFromPO = async (req, res) => {
  try {
    const bill = await transactionService.createBillFromPO(req.params.id);
    res.status(201).json(bill);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const createInvoiceFromSO = async (req, res) => {
  try {
    const invoice = await transactionService.createInvoiceFromSO(req.params.id);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const checkBudgetWarnings = async (req, res) => {
  try {
    const warnings = await transactionService.checkBudgetWarnings(
      req.params.id,
    );
    res.json(warnings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  confirm,
  cancel,
  remove,
  createBillFromPO,
  createInvoiceFromSO,
  checkBudgetWarnings,
};
