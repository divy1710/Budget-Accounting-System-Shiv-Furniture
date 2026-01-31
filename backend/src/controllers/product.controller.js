const productService = require("../services/product.service");

const getAll = async (req, res) => {
  try {
    const products = await productService.getAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const product = await productService.getById(parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const product = await productService.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const product = await productService.update(
      parseInt(req.params.id),
      req.body,
    );
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await productService.remove(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
