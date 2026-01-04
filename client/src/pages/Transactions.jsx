import { useEffect, useState, useRef, useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import { format } from 'date-fns';

const Transactions = () => {
  const {
    transactions,
    loading,
    pagination,
    filters,
    fetchTransactions,
    deleteTransaction,
    updateFilters,
    resetFilters,
    setPagination,
  } = useTransactions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const prevFiltersRef = useRef(JSON.stringify(filters));
  const prevPageRef = useRef(pagination.page);
  const prevLimitRef = useRef(pagination.limit);
  const hasMountedRef = useRef(false);

  const categories = [
    'Food',
    'Shopping',
    'Transportation',
    'Entertainment',
    'Bills',
    'Healthcare',
    'Education',
    'Travel',
    'Other',
  ];

  useEffect(() => {
    setPagination((prev) => {
      if (prev.limit === 10) {
        return prev;
      }
      return { ...prev, limit: 10, page: 1 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filtersChanged = prevFiltersRef.current !== JSON.stringify(filters);
    const pageChanged = prevPageRef.current !== pagination.page;
    const limitChanged = prevLimitRef.current !== pagination.limit;

    // On first mount: only fetch if transactions are empty OR if limit is wrong
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      prevFiltersRef.current = JSON.stringify(filters);
      prevPageRef.current = pagination.page;
      prevLimitRef.current = pagination.limit;

      if (transactions.length === 0 || pagination.limit !== 10) {
        fetchTransactions({ limit: 10 });
      }
      return;
    }

    // After first mount: only fetch if filters, page, or limit actually changed
    if (filtersChanged || pageChanged || limitChanged) {
      prevFiltersRef.current = JSON.stringify(filters);
      prevPageRef.current = pagination.page;
      prevLimitRef.current = pagination.limit;
      fetchTransactions({ limit: 10 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page, pagination.limit]);

  const handlePageChange = (newPage) => {
    if (!pagination.pages) return;
    if (newPage < 1 || newPage > pagination.pages || newPage === pagination.page) {
      return;
    }
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const pageButtons = useMemo(() => {
    const totalPages = pagination.pages || 1;
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }

    const pages = new Set([1, totalPages, pagination.page]);
    if (pagination.page > 1) pages.add(pagination.page - 1);
    if (pagination.page < totalPages) pages.add(pagination.page + 1);

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result = [];

    for (let i = 0; i < sorted.length; i += 1) {
      result.push(sorted[i]);
      if (sorted[i + 1] && sorted[i + 1] - sorted[i] > 1) {
        result.push('ellipsis-' + i);
      }
    }
    return result;
  }, [pagination.page, pagination.pages]);

  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      const result = await deleteTransaction(id);
      if (result.success) {
        fetchTransactions();
      }
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleSuccess = () => {
    fetchTransactions();
    handleModalClose();
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aVal, bVal;
    if (sortBy === 'date') {
      aVal = new Date(a.date);
      bVal = new Date(b.date);
    } else if (sortBy === 'amount') {
      aVal = a.amount;
      bVal = b.amount;
    } else {
      return 0;
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold font-display text-white mb-2">
              Transactions
            </h1>
            <p className="text-gray-400">Manage and track all your financial transactions</p>
          </div>
          <Button onClick={handleAdd} variant="primary" className="shadow-lg shadow-primary-500/20">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Transaction
          </Button>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all hover:bg-white/10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all hover:bg-white/10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all hover:bg-white/10"
              >
                <option value="" className="bg-gray-900">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-gray-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all hover:bg-white/10"
              >
                <option value="" className="bg-gray-900">All Types</option>
                <option value="income" className="bg-gray-900">Income</option>
                <option value="expense" className="bg-gray-900">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all hover:bg-white/10"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={resetFilters} className="text-sm">
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead className="bg-[#111111]">
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => handleSort('amount')}
                      >
                        Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-transparent">
                    {sortedTransactions.length > 0 ? (
                      sortedTransactions.map((transaction) => (
                        <tr key={transaction._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 text-sm text-white font-medium">
                            {transaction.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/5 text-gray-300 border border-white/10">
                              {transaction.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 text-sm font-medium rounded-full ${transaction.type === 'income'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}
                            >
                              {transaction.type}
                            </span>
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                          >
                            {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="text-primary-400 hover:text-white mr-4 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(transaction._id)}
                              className="text-gray-500 hover:text-red-400 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-600 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p>No transactions found. Try adjusting your filters.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-[#111111] px-4 py-4 flex items-center justify-between border-t border-white/5 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="secondary"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="text-sm"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="text-sm"
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-400">
                        Showing <span className="font-medium text-white">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                        <span className="font-medium text-white">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of <span className="font-medium text-white">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-white/10 bg-white/5 text-sm font-medium text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {pageButtons.map((value, idx) =>
                          typeof value === 'string' ? (
                            <span key={`ellipsis-${idx}`} className="relative inline-flex items-center px-4 py-2 border border-white/10 bg-transparent text-sm font-medium text-gray-500">
                              ...
                            </span>
                          ) : (
                            <button
                              key={value}
                              onClick={() => handlePageChange(value)}
                              className={`relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium ${pagination.page === value
                                  ? 'z-10 bg-primary-600 border-primary-500 text-white'
                                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                            >
                              {value}
                            </button>
                          )
                        )}
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-white/10 bg-white/5 text-sm font-medium text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm
          transaction={editingTransaction}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      </Modal>
    </Layout>
  );
};

export default Transactions;

