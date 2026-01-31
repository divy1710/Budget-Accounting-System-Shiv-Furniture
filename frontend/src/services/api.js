import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Contacts API
export const contactsApi = {
  getAll: (params) => api.get('/contacts', { params }),
  getCustomers: () => api.get('/contacts/customers'),
  getVendors: () => api.get('/contacts/vendors'),
  getById: (id) => api.get(`/contacts/${id}`),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`),
};

// Products API
export const productsApi = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Analytical Accounts API
export const analyticalAccountsApi = {
  getAll: () => api.get('/analytical-accounts'),
  getTree: () => api.get('/analytical-accounts/tree'),
  getById: (id) => api.get(`/analytical-accounts/${id}`),
  create: (data) => api.post('/analytical-accounts', data),
  update: (id, data) => api.put(`/analytical-accounts/${id}`, data),
  delete: (id) => api.delete(`/analytical-accounts/${id}`),
};

// Budgets API
export const budgetsApi = {
  getAll: (params) => api.get('/budgets', { params }),
  getSummary: (params) => api.get('/budgets/summary', { params }),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

// Auto Analytical API
export const autoAnalyticalApi = {
  getAll: () => api.get('/auto-analytical'),
  getById: (id) => api.get(`/auto-analytical/${id}`),
  findMatch: (productId) => api.get(`/auto-analytical/match/${productId}`),
  create: (data) => api.post('/auto-analytical', data),
  update: (id, data) => api.put(`/auto-analytical/${id}`, data),
  delete: (id) => api.delete(`/auto-analytical/${id}`),
};

// Transactions API
export const transactionsApi = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  confirm: (id) => api.post(`/transactions/${id}/confirm`),
  cancel: (id) => api.post(`/transactions/${id}/cancel`),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Payments API
export const paymentsApi = {
  getAll: (params) => api.get('/payments', { params }),
  getOutstanding: (contactId) => api.get(`/payments/outstanding/${contactId}`),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  void: (id) => api.post(`/payments/${id}/void`),
  delete: (id) => api.delete(`/payments/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getBudgetCockpit: (params) => api.get('/dashboard/budget-cockpit', { params }),
  getYearlyTrend: (year) => api.get('/dashboard/yearly-trend', { params: { year } }),
  getRecentActivities: (limit) => api.get('/dashboard/recent-activities', { params: { limit } }),
};

export default api;
