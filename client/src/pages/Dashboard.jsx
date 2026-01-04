import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useTransactions } from '../context/TransactionContext';
import Button from '../components/Button';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import { format } from 'date-fns';

const Dashboard = () => {
  const { transactions, fetchTransactions } = useTransactions();
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
  });
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasLoadedRef = useRef(false);

  // Custom refined color palette
  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#6366f1', '#10b981'];

  // Calculate dashboard data from transactions
  const calculateDashboardData = (trans) => {
    // Calculate statistics
    const income = trans
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = trans
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setStats({
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
    });

    // Category breakdown for expenses
    const categoryMap = {};
    trans
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });

    const categoryChartData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));

    setCategoryData(categoryChartData);

    // Trend data (last 7 days)
    const today = new Date();
    const trendMap = {};

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'MMM dd');
      trendMap[dateStr] = { income: 0, expenses: 0 };
    }

    trans.forEach((t) => {
      const date = new Date(t.date);
      const dateStr = format(date, 'MMM dd');
      if (trendMap[dateStr]) {
        if (t.type === 'income') {
          trendMap[dateStr].income += t.amount;
        } else {
          trendMap[dateStr].expenses += t.amount;
        }
      }
    });

    const trendChartData = Object.entries(trendMap).map(([date, values]) => ({
      date,
      income: parseFloat(values.income.toFixed(2)),
      expenses: parseFloat(values.expenses.toFixed(2)),
    }));

    setTrendData(trendChartData);
  };

  // Load data only on initial mount if transactions are empty or limit is too small
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      // Fetch if no transactions OR if we have fewer than 100 items (likely from Transactions page)
      if (transactions.length === 0 || transactions.length < 100) {
        fetchTransactions({ limit: 100 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculate dashboard data when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      calculateDashboardData(transactions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  const handleTransactionSuccess = () => {
    fetchTransactions({ limit: 100 });
  };

  const recentTransactions = transactions.slice(0, 5);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-white/10 p-4 rounded-xl shadow-xl backdrop-blur-md">
          <p className="font-medium text-gray-200 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name === 'value' ? 'Amount' : entry.name}: ₹{entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold font-display text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-400">Welcome back! Here's your financial overview</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} variant="primary" className="shadow-lg shadow-primary-500/20">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Transaction
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Income</h3>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              ₹{stats.totalIncome.toFixed(2)}
            </div>
            <div className="text-xs text-emerald-400 font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              +12.5% from last month
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Expenses</h3>
              <div className="p-2.5 bg-rose-500/10 rounded-xl">
                <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              ₹{stats.totalExpenses.toFixed(2)}
            </div>
            <div className="text-xs text-rose-400 font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              +4.3% from last month
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Balance</h3>
              <div className="p-2.5 bg-primary-500/10 rounded-xl">
                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className={`text-3xl font-bold mb-1 ${stats.balance >= 0 ? 'text-white' : 'text-orange-400'}`}>
              ₹{stats.balance.toFixed(2)}
            </div>
            <div className="text-xs text-primary-400 font-medium flex items-center">
              Net balance available
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Pie Chart */}
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-lg font-semibold mb-6 text-white flex items-center">
              <div className="w-2 h-6 bg-primary-500 rounded-full mr-3" />
              Expense Breakdown
            </h2>
            {categoryData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-gray-400 text-sm ml-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-xl">
                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
                No expense data available
              </div>
            )}
          </div>

          {/* Trend Line Chart */}
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-lg font-semibold mb-6 text-white flex items-center">
              <div className="w-2 h-6 bg-secondary-500 rounded-full mr-3" />
              Cash Flow Trend
            </h2>
            {trendData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '20px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorExpenses)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-xl">
                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Transactions
            </h2>
            <Link to="/transactions" className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors flex items-center">
              View all
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-[#111111]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {transaction.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/5 text-gray-300 border border-white/10">
                          {transaction.category}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${transaction.type === 'income'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                          }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-600 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>No transactions yet. Add your first transaction!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Transaction"
      >
        <TransactionForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleTransactionSuccess}
        />
      </Modal>
    </Layout>
  );
};

export default Dashboard;

