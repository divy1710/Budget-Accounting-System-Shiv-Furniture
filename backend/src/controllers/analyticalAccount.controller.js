const analyticalAccountService = require('../services/analyticalAccount.service');

const getAll = async (req, res) => {
  try {
    const accounts = await analyticalAccountService.getAll();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTree = async (req, res) => {
  try {
    const tree = await analyticalAccountService.getTree();
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const account = await analyticalAccountService.getById(parseInt(req.params.id));
    if (!account) {
      return res.status(404).json({ error: 'Analytical account not found' });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const account = await analyticalAccountService.create(req.body);
    res.status(201).json(account);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const account = await analyticalAccountService.update(parseInt(req.params.id), req.body);
    res.json(account);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await analyticalAccountService.remove(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { getAll, getTree, getById, create, update, remove };
