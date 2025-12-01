import { useState, useRef } from 'react';
import api from '../services/api';
import Button from './Button';

const TransactionForm = ({ transaction, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: transaction?.type || 'expense',
    amount: transaction?.amount || '',
    category: transaction?.category || '',
    description: transaction?.description || '',
    date: transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    receiptImage: null,
    isRecurring: transaction?.isRecurring || false,
    recurringFrequency: transaction?.recurringFrequency || '',
  });
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
        setFormData((prev) => ({ ...prev, receiptImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanReceipt = async () => {
    if (!formData.receiptImage) {
      setError('Please upload a receipt image first');
      return;
    }

    setScanning(true);
    setError('');

    try {
      const response = await api.post('/ai/scan-receipt', {
        receiptImage: formData.receiptImage,
      });

      if (response.data.success) {
        const extracted = response.data.data;
        setFormData((prev) => ({
          ...prev,
          amount: extracted.amount || prev.amount,
          category: extracted.category || prev.category,
          description: extracted.description || prev.description,
          date: extracted.date || prev.date,
        }));
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to scan receipt');
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.amount || !formData.category) {
      setError('Please fill in amount and category');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        receiptImage: formData.receiptImage || undefined,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency : null,
      };

      if (transaction) {
        await api.put(`/transactions/${transaction._id}`, submitData);
      } else {
        await api.post('/transactions', submitData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-700">
      {error && (
        <div className="bg-neutral-800 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount *
        </label>
        <input
          type="number"
          name="amount"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category *
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Transaction description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Receipt Image
        </label>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Receipt
            </Button>
            {formData.receiptImage && (
              <Button
                type="button"
                variant="outline"
                onClick={handleScanReceipt}
                disabled={scanning}
              >
                {scanning ? 'Scanning...' : 'Scan Receipt (AI)'}
              </Button>
            )}
          </div>
          {receiptPreview && (
            <img
              src={receiptPreview}
              alt="Receipt preview"
              className="mt-2 max-w-xs rounded border"
            />
          )}
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="isRecurring"
          checked={formData.isRecurring}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">
          Recurring transaction
        </label>
      </div>

      {formData.isRecurring && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frequency
          </label>
          <select
            name="recurringFrequency"
            value={formData.recurringFrequency}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select frequency</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : transaction ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

export default TransactionForm;

