import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';
import api from '../services/api';

const MetricCards = ({ districtId }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (districtId) {
      loadMetrics();
    }
  }, [districtId]);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCurrentMetrics(districtId);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
        <button onClick={loadMetrics} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  const metricList = Object.entries(metrics).map(([key, value]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: typeof value === 'object' ? value.current : value,
    change: typeof value === 'object' ? value.change : null,
    trend: typeof value === 'object' ? value.trend : null
  }));

  const getTrendIcon = (change) => {
    if (change > 0) return <TrendingUp size={16} />;
    if (change < 0) return <TrendingDown size={16} />;
    return <Minus size={16} />;
  };

  const getTrendColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {metricList.map((metric, index) => (
        <motion.div
          key={metric.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{metric.name}</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              </p>
            </div>
            <Activity className="text-blue-500 flex-shrink-0" size={24} />
          </div>
          
          {metric.change !== null && metric.change !== undefined && (
            <div className={`flex items-center gap-1 ${getTrendColor(metric.change)}`}>
              {getTrendIcon(metric.change)}
              <span className="text-sm font-medium">
                {Math.abs(metric.change).toFixed(1)}% {metric.change >= 0 ? 'increase' : 'decrease'}
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default MetricCards;
