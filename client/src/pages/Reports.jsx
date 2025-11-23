import { useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import Button from '../components/Button';

const Reports = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    setReport(null);

    try {
      const response = await api.get('/ai/report/monthly', {
        params: { month, year },
      });

      if (response.data.success) {
        setReport(response.data.report);
      } else {
        setError('Failed to generate report');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    // Simple PDF export using window.print() - can be enhanced with a PDF library
    window.print();
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = [];
  for (let i = new Date().getFullYear(); i >= new Date().getFullYear() - 5; i--) {
    years.push(i);
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
            Financial Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">AI-powered insights into your financial health</p>
        </div>

        {/* Report Generator */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Generate Monthly Report</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {months.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Report Display */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">AI is analyzing your financial data...</p>
          </div>
        )}

        {report && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6 border border-gray-200 dark:border-gray-700 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {months[month - 1]} {year} Financial Report
              </h2>
              <Button onClick={handleExportPDF} variant="outline">
                Export PDF
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800/50">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹{report.summary?.totalIncome?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg p-4 border border-red-100 dark:border-red-800/50">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ₹{report.summary?.totalExpenses?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/50">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Balance</div>
                <div className={`text-2xl font-bold ${(report.summary?.balance || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ₹{report.summary?.balance?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800/50">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Savings Rate</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {report.summary?.savingsRate?.toFixed(1) || '0.0'}%
                </div>
              </div>
            </div>

            {/* Financial Health Score */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Financial Health Score</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 h-4 rounded-full transition-all"
                    style={{ width: `${report.financialHealthScore || 0}%` }}
                  ></div>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {report.financialHealthScore || 0}/100
                </span>
              </div>
            </div>

            {/* Top Spending Categories */}
            {report.topSpendingCategories && report.topSpendingCategories.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Spending Categories</h3>
                <div className="space-y-2">
                  {report.topSpendingCategories.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <span className="font-medium text-gray-900 dark:text-white">{item.category}</span>
                      <span className="text-red-600 dark:text-red-400 font-semibold">₹{item.amount?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {report.insights && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Financial Insights</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{report.insights}</p>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations && report.recommendations.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Personalized Recommendations</h3>
                <ul className="space-y-2">
                  {report.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;

