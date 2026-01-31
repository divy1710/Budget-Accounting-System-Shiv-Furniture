const paymentService = require("../services/payment.service");

const getAll = async (req, res) => {
  try {
    const payments = await paymentService.getAll(req.query);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const payment = await paymentService.getById(parseInt(req.params.id));
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const payment = await paymentService.create(req.body);
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const payment = await paymentService.update(
      parseInt(req.params.id),
      req.body,
    );
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const confirm = async (req, res) => {
  try {
    const payment = await paymentService.confirm(parseInt(req.params.id));
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const cancel = async (req, res) => {
  try {
    const payment = await paymentService.cancel(parseInt(req.params.id));
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const voidPayment = async (req, res) => {
  try {
    const payment = await paymentService.voidPayment(parseInt(req.params.id));
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await paymentService.remove(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getOutstanding = async (req, res) => {
  try {
    const transactions = await paymentService.getOutstandingTransactions(
      req.params.contactId,
    );
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createFromTransaction = async (req, res) => {
  try {
    const payment = await paymentService.createFromTransaction(
      req.params.transactionId,
    );
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  confirm,
  cancel,
  voidPayment,
  remove,
  getOutstanding,
  createFromTransaction,
};
