import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

const DistrictSelector = ({ stateId, onDistrictSelect, selectedDistrict }) => {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (stateId) {
      loadDistricts();
    } else {
      setDistricts([]);
    }
  }, [stateId]);

  const loadDistricts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDistricts(stateId);
      setDistricts(data);
    } catch (error) {
      console.error('Error loading districts:', error);
      setError('Failed to load districts');
    } finally {
      setLoading(false);
    }
  };

  if (!stateId) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select District
      </label>
      <select
        value={selectedDistrict || ''}
        onChange={(e) => onDistrictSelect(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">
          {loading ? 'Loading...' : error ? 'Error loading districts' : 'Choose a district...'}
        </option>
        {districts.map((district) => (
          <option key={district.id} value={district.id}>
            {district.name}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </motion.div>
  );
};

export default DistrictSelector;
