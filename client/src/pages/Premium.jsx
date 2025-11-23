import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Button from '../components/Button';

const Premium = () => {
  const { user } = useAuth();

  const features = [
    { name: 'Transaction Tracking', free: true, premium: true },
    { name: 'Basic Reports', free: true, premium: true },
    { name: 'AI Receipt Scanning', free: false, premium: true },
    { name: 'AI Financial Insights', free: false, premium: true },
    { name: 'Advanced Analytics', free: false, premium: true },
    { name: 'Export Reports (PDF)', free: false, premium: true },
    { name: 'Recurring Transactions', free: false, premium: true },
    { name: 'Priority Support', free: false, premium: true },
  ];

  const handleSubscribe = (plan) => {
    // Since Stripe is removed, show a message
    alert(`Premium subscription coming soon! This would redirect to Stripe checkout for ${plan} plan.`);
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upgrade to Premium</h1>
          <p className="text-xl text-gray-600">
            Unlock advanced features and AI-powered financial insights
          </p>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Free
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {features.map((feature, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {feature.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {feature.free ? (
                      <span className="text-green-600 font-semibold">✓</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {feature.premium ? (
                      <span className="text-green-600 font-semibold">✓</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">₹799</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-gray-600 mb-6">Perfect for trying out Premium features</p>
              <Button
                onClick={() => handleSubscribe('monthly')}
                className="w-full"
                disabled={user?.subscriptionPlan === 'premium'}
              >
                {user?.subscriptionPlan === 'premium' ? 'Current Plan' : 'Subscribe Monthly'}
              </Button>
            </div>
          </div>

          {/* Yearly Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Best Value
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Yearly</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">₹7,999</span>
                <span className="text-gray-600">/year</span>
              </div>
              <p className="text-gray-600 mb-2">Save ₹1,589 per year</p>
              <p className="text-sm text-green-600 font-semibold mb-6">2 months free!</p>
              <Button
                onClick={() => handleSubscribe('yearly')}
                className="w-full"
                disabled={user?.subscriptionPlan === 'premium'}
              >
                {user?.subscriptionPlan === 'premium' ? 'Current Plan' : 'Subscribe Yearly'}
              </Button>
            </div>
          </div>
        </div>

        {user?.subscriptionPlan === 'premium' && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-semibold">
              ✓ You are currently on a Premium plan
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Premium;

