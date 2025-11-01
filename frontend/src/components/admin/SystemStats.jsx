import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Server, Clock, Users, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const SystemStats = () => {
  const [stats, setStats] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, snapshotsData] = await Promise.all([
        api.getSystemStats(),
        api.getSnapshots()
      ]);
      setStats(statsData);
      setSnapshots(Array.isArray(snapshotsData) ? snapshotsData : []);
    } catch (error) {
      console.error('Error loading system data:', error);
      setError('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    { 
      icon: Database, 
      label: 'Total Records', 
      value: stats?.totalRecords?.toLocaleString() || '0', 
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    { 
      icon: Server, 
      label: 'API Calls', 
      value: stats?.apiCalls?.toLocaleString() || '0', 
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    { 
      icon: Clock, 
      label: 'Uptime', 
      value: stats?.uptime || '0h', 
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    { 
      icon: Users, 
      label: 'Active Users', 
      value: stats?.activeUsers?.toLocaleString() || '0', 
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} p-6 rounded-lg shadow border border-gray-200`}
          >
            <div className="flex items-center gap-3 mb-3">
              <stat.icon className={stat.iconColor} size={24} />
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h4 className="font-semibold text-gray-900">Recent ETL Snapshots</h4>
        </div>
        
        {snapshots.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Records
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {snapshots.slice(0, 10).map((snapshot, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {snapshot.timestamp ? new Date(snapshot.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        snapshot.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : snapshot.status === 'running'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {snapshot.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-900">
                      {snapshot.records?.toLocaleString() || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No snapshots available
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemStats;
