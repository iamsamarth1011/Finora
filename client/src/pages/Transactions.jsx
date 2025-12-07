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
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8 animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Transactions
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track all your financial transactions</p>
          </div>
          <Button onClick={handleAdd} className="shadow-lg hover:shadow-xl bg-neutral-700 border-white-500">
            <svg className="w-5 h-5 inline mr-2 bg-neutral-700 border-white-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Transaction
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-neutral-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="bg-neutral-800 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-gray-600 focus:border-blue-500 dark:focus:border-gray-600 bg-neutral-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-gray-600 focus:border-blue-500 dark:focus:border-gray-600 bg-neutral-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-gray-600 focus:border-blue-500 dark:focus:border-gray-600 bg-neutral-800 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-gray-600 focus:border-blue-500 dark:focus:border-gray-600 bg-neutral-800 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search description..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-gray-600 focus:border-blue-500 dark:focus:border-gray-600 bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
          <div className="mt-4 ">
            <Button variant="primary" onClick={resetFilters} className='bg-neutral-700 border-white-500'>
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-neutral-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-white"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-neutral-700 dark:bg-neutral-700">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('amount')}
                      >
                        Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedTransactions.length > 0 ? (
                      sortedTransactions.map((transaction) => (
                        <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {transaction.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-neutral-800 dark:bg-neutral-700 text-blue-800 dark:text-white">
                              {transaction.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                transaction.type === 'income'
                                  ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                                  : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                              }`}
                            >
                              {transaction.type}
                            </span>
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                              transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="text-blue-600 dark:text-white hover:text-blue-900 dark:hover:text-gray-300 mr-4 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(transaction._id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p>No transactions found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-neutral-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="secondary"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="bg-neutral-800 hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="bg-neutral-800 text-sm text-gray-700 dark:text-gray-300">
                        Showing <span className="bg-neutral-800 font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <Button
                          variant="primary"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="rounded-l-md bg-neutral-700"
                        >
                          Previous
                        </Button>
                        <div className="hidden md:flex items-center space-x-1 px-3">
                          {pageButtons.map((value) =>
                            typeof value === 'string' ? (
                              <span key={value} className="text-gray-500 dark:text-gray-400 px-2">
                                ...
                              </span>
                            ) : (
                              <button
                                key={value}
                                onClick={() => handlePageChange(value)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  pagination.page === value
                                    ? 'bg-neutral-600 text-white'
                                    : 'bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                              >
                                {value}
                              </button>
                            )
                          )}
                        </div>
                        <span className="md:hidden relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600  text-sm font-medium text-gray-700 dark:text-gray-300">
                          Page {pagination.page} of {pagination.pages}
                        </span>
                        <Button
                          variant="primary"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                          className="rounded-r-md bg-neutral-700"
                        >
                          Next
                        </Button>
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

