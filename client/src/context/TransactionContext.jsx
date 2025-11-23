import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const TransactionContext = createContext();

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    type: '',
    search: '',
  });

  const fetchTransactions = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const currentPage = params.page !== undefined ? params.page : pagination.page;
      const currentLimit = params.limit !== undefined ? params.limit : pagination.limit;
      
      // Build query params - explicitly set page and limit first
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(currentPage));
      queryParams.set('limit', String(currentLimit));
      
      // Add filters (only non-empty ones)
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.set(key, value);
        }
      });
      
      // Add any additional params (excluding page/limit to avoid override)
      Object.entries(params).forEach(([key, value]) => {
        if (key !== 'page' && key !== 'limit' && value !== undefined && value !== '') {
          queryParams.set(key, value);
        }
      });

      const response = await api.get(`/transactions?${queryParams}`);
      setTransactions(response.data.transactions);
      
      // Update pagination - use the limit we sent, not what server returns
      // (server returns what it used, which should match, but this ensures consistency)
      setPagination({
        ...response.data.pagination,
        limit: currentLimit, // Use the limit we actually sent
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch transactions',
      };
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const createTransaction = async (transactionData) => {
    try {
      const response = await api.post('/transactions', transactionData);
      setTransactions((prev) => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create transaction',
      };
    }
  };

  const updateTransaction = async (id, transactionData) => {
    try {
      const response = await api.put(`/transactions/${id}`, transactionData);
      setTransactions((prev) =>
        prev.map((t) => (t._id === id ? response.data : t))
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update transaction',
      };
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete transaction',
      };
    }
  };

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      type: '',
      search: '',
    });
  };

  const value = {
    transactions,
    loading,
    pagination,
    filters,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateFilters,
    resetFilters,
    setPagination,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

