import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchCandidates();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await axios.get('/api/admin/candidates');
      setCandidates(response.data.data);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    }
  };

  if (!stats) return <div className="flex items-center justify-center h-screen"><div className="spinner"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600">Active Users</p>
          <p className="text-3xl font-bold mt-2">{stats.active_users}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-3xl font-bold mt-2">${stats.revenue.total_revenue?.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600">Content Generated</p>
          <p className="text-3xl font-bold mt-2">{stats.content.total_content}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600">Paid Users</p>
          <p className="text-3xl font-bold mt-2">{stats.conversions.paid_users}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">All Candidates</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-start py-3 px-4">Name</th>
                <th className="text-start py-3 px-4">Governorate</th>
                <th className="text-start py-3 px-4">Tier</th>
                <th className="text-start py-3 px-4">Status</th>
                <th className="text-start py-3 px-4">Posts</th>
                <th className="text-start py-3 px-4">Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{candidate.name}</td>
                  <td className="py-3 px-4">{candidate.governorate}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {candidate.tier}
                    </span>
                  </td>
                  <td className="py-3 px-4">{candidate.subscription_status}</td>
                  <td className="py-3 px-4">{candidate.total_posts}</td>
                  <td className="py-3 px-4">{Math.round(candidate.avg_sentiment * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
