const autoAnalyticalService = require("../services/autoAnalytical.service");

const getAll = async (req, res) => {
  try {
    const models = await autoAnalyticalService.getAll();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const model = await autoAnalyticalService.getById(parseInt(req.params.id));
    if (!model) {
      return res.status(404).json({ error: "Auto analytical model not found" });
    }
    res.json(model);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const model = await autoAnalyticalService.create(req.body);
    res.status(201).json(model);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const model = await autoAnalyticalService.update(
      parseInt(req.params.id),
      req.body,
    );
    res.json(model);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await autoAnalyticalService.remove(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const findMatch = async (req, res) => {
  try {
    const accountId = await autoAnalyticalService.findMatch(
      parseInt(req.params.productId),
    );
    res.json({ analyticalAccountId: accountId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, findMatch };
