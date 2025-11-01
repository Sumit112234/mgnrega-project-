import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const ComparisonChart = ({ districtId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (districtId) {
      loadComparisonData();
    }
  }, [districtId]);

  const loadComparisonData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.compareWithState(districtId);
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error loading comparison data:', error);
      setError('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 md:p-6 rounded-lg shadow-md"
    >
      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6">
        District vs State Comparison
      </h3>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="district" fill="#3B82F6" name="District" radius={[8, 8, 0, 0]} />
            <Bar dataKey="state" fill="#10B981" name="State Average" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No comparison data available
        </div>
      )}
    </motion.div>
  );
};

export default ComparisonChart;
