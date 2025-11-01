import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

const StateSelector = ({ onStateSelect, selectedState }) => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      setError(null);
      const data = await api.getStates();
      
      console.log('Fetched states:', data);
      setStates(data.data);
    } catch (error) {
      console.error('Error loading states:', error);
      setError('Failed to load states');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select State
      </label>
      <select
        value={selectedState || ''}
        onChange={(e) => onStateSelect(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">
          {loading ? 'Loading...' : error ? 'Error loading states' : 'Choose a state...'}
        </option>
        {states.length > 0 ? states.map((state) => (
          <option key={state.id} value={state.id}>
            {state.name}
          </option>
        )) : 
         ""
          }
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </motion.div>
  );
};

export default StateSelector;
