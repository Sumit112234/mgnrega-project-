import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Loader } from 'lucide-react';
import api from '../services/api';

const LocationDetector = ({ onDistrictDetected }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detectLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          //console.log('Detected coordinates:', latitude, longitude);
          const data = await api.detectDistrictByLocation(latitude, longitude);
          onDistrictDetected(data);
        } catch (err) {
          setError('Could not detect district from location');
          console.error('Location detection error:', err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Failed to get your location. Please enable location services.');
        setLoading(false);
        console.error('Geolocation error:', err);
      }
    );
  };

  return (
    <div className="w-full">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={detectLocation}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader className="animate-spin" size={20} />
        ) : (
          <MapPin size={20} />
        )}
        {loading ? 'Detecting Location...' : 'Detect My Location'}
      </motion.button>
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default LocationDetector;
