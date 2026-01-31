const categoryService = require("../services/category.service");

const getAll = async (req, res) => {
  try {
    const categories = await categoryService.getAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const category = await categoryService.getById(parseInt(req.params.id));
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const category = await categoryService.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const category = await categoryService.update(
      parseInt(req.params.id),
      req.body,
    );
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await categoryService.remove(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
