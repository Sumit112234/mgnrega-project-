import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Upload, RefreshCw, BarChart3 } from 'lucide-react';
import DataUpload from './DataUpload';
import SyncControl from './SyncControl';
import SystemStats from './SystemStats';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('upload');

  const tabs = [
    { id: 'upload', label: 'Data Upload', icon: Upload },
    { id: 'sync', label: 'Sync Control', icon: RefreshCw },
    { id: 'stats', label: 'System Stats', icon: BarChart3 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-lg shadow-lg overflow-hidden"
    >
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          <Shield className="text-white" size={28} />
          <h2 className="text-xl md:text-2xl font-bold text-white">Admin Panel</h2>
        </div>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex min-w-max md:min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 md:p-6">
        {activeTab === 'upload' && <DataUpload />}
        {activeTab === 'sync' && <SyncControl />}
        {activeTab === 'stats' && <SystemStats />}
      </div>
    </motion.div>
  );
};

export default AdminPanel;
