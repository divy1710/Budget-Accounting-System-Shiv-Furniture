const contactService = require('../services/contact.service');

const getAll = async (req, res) => {
  try {
    const contacts = await contactService.getAll(req.query);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCustomers = async (req, res) => {
  try {
    const customers = await contactService.getCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getVendors = async (req, res) => {
  try {
    const vendors = await contactService.getVendors();
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const contact = await contactService.getById(parseInt(req.params.id));
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const contact = await contactService.create(req.body);
    res.status(201).json(contact);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const contact = await contactService.update(parseInt(req.params.id), req.body);
    res.json(contact);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await contactService.remove(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { getAll, getCustomers, getVendors, getById, create, update, remove };
