import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useTranslation } from '../store/languageStore';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/analytics/overview?days=30');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  if (!analytics) {
    return <div className="flex items-center justify-center h-full"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('analytics')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600">Total Followers Gained</p>
          <p className="text-3xl font-bold mt-2">{analytics.totals.total_followers_gained}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600">Total Reach</p>
          <p className="text-3xl font-bold mt-2">{analytics.totals.total_reach.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600">Avg Sentiment</p>
          <p className="text-3xl font-bold mt-2">{Math.round(analytics.totals.avg_sentiment * 100)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Engagement Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.daily}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total_reach" stroke="#4f46e5" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
