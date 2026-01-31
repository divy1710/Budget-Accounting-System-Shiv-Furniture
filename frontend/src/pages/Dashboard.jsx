import { useState, useEffect } from "react";
import { transactionApi } from "../services/api";

function Dashboard() {
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, transactionsRes] = await Promise.all([
        transactionApi.getSummary(),
        transactionApi.getAll(),
      ]);
      setSummary(summaryRes.data);
      setRecentTransactions(transactionsRes.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-value amount-income">
            {formatCurrency(summary.totalIncome)}
          </div>
          <div className="stat-label">Total Income</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-value amount-expense">
            {formatCurrency(summary.totalExpense)}
          </div>
          <div className="stat-label">Total Expense</div>
        </div>
        <div className="stat-card balance">
          <div
            className={`stat-value ${summary.balance >= 0 ? "amount-income" : "amount-expense"}`}
          >
            {formatCurrency(summary.balance)}
          </div>
          <div className="stat-label">Current Balance</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Recent Transactions</h2>
        {recentTransactions.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td>{transaction.description || "-"}</td>
                    <td>{transaction.category?.name || "-"}</td>
                    <td className={`amount-${transaction.type}`}>
                      {transaction.type === "expense" ? "-" : "+"}
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No transactions yet. Add your first transaction!</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
