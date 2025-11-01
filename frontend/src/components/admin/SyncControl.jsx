import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Trash2, Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const SyncControl = () => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(null);

  useEffect(() => {
    loadSyncStatus();
    const interval = setInterval(loadSyncStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await api.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleTriggerSync = async () => {
    setLoading(true);
    setAction('sync');
    try {
      await api.triggerSync();
      await loadSyncStatus();
      alert('Sync triggered successfully!');
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Failed to trigger sync');
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear the cache?')) {
      return;
    }
    
    setLoading(true);
    setAction('cache');
    try {
      await api.clearCache();
      alert('Cache cleared successfully!');
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Failed to clear cache');
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const getStatusIcon = () => {
    if (!syncStatus) return <Activity className="text-gray-400" size={20} />;
    
    switch (syncStatus.status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'running':
      case 'syncing':
        return <RefreshCw className="text-blue-600 animate-spin" size={20} />;
      case 'error':
      case 'failed':
        return <AlertCircle className="text-red-600" size={20} />;
      default:
        return <Activity className="text-gray-600" size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      {syncStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-4">
            {getStatusIcon()}
            <h4 className="font-semibold text-lg">Sync Status</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Status:</span>
              <span className="font-medium text-gray-900">
                {syncStatus.status || 'Unknown'}
              </span>
            </div>
            
            {syncStatus.lastSync && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock size={14} />
                  Last Sync:
                </span>
                <span className="font-medium text-gray-900">
                  {new Date(syncStatus.lastSync).toLocaleString()}
                </span>
              </div>
            )}
            
            {syncStatus.nextSync && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Next Sync:</span>
                <span className="font-medium text-gray-900">
                  {new Date(syncStatus.nextSync).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleTriggerSync}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <RefreshCw size={20} className={(loading && action === 'sync') ? 'animate-spin' : ''} />
          {(loading && action === 'sync') ? 'Syncing...' : 'Trigger ETL Sync'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClearCache}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Trash2 size={20} />
          {(loading && action === 'cache') ? 'Clearing...' : 'Clear Cache'}
        </motion.button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>ETL sync may take several minutes to complete</li>
              <li>Clearing cache will temporarily affect performance</li>
              <li>Always backup data before major operations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncControl;
