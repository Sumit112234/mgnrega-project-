import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Menu, X } from 'lucide-react';
import StateSelector from './components/StateSelector';
import DistrictSelector from './components/DistrictSelector';
import SearchBar from './components/SearchBar';
import LocationDetector from './components/LocationDetector';
import MetricCards from './components/MetricCards';
import TrendChart from './components/TrendChart';
import ComparisonChart from './components/ComparisonChart';
import AdminPanel from './components/admin/AdminPanel';
import api from './services/api';
import './App.css';
import MGNREGADashboard from './Dashboard';

function App() {
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const status = await api.healthCheck();
      setHealthStatus(status);
    } catch (error) {
      setHealthStatus({ status: 'error' });
    }
  };

  const handleStateSelect = (stateId) => {
    setSelectedState(stateId);
    setSelectedDistrict(null);
  };

  const handleDistrictSelect = (districtId) => {
    setSelectedDistrict(districtId);
  };

  const handleDistrictFound = (district) => {
    setSelectedState(district.stateId);
    setSelectedDistrict(district.id);
  };

  return (
    <>
      <MGNREGADashboard/>    
    </>
  );
}
    // <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
    //   {/* Header */}
    //   <motion.header
    //     initial={{ y: -100 }}
    //     animate={{ y: 0 }}
    //     className="bg-white shadow-md sticky top-0 z-50"
    //   >
    //     <div className="container mx-auto px-4 py-4 md:py-6">
    //       <div className="flex items-center justify-between">
    //         <div className="flex items-center gap-2 md:gap-3">
    //           <Activity className="text-blue-600" size={28} />
    //           <h1 className="text-xl md:text-3xl font-bold text-gray-900">
    //             District Analytics
    //           </h1>
    //         </div>
            
    //         {/* Desktop Controls */}
    //         <div className="hidden md:flex items-center gap-4">
    //           <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
    //             healthStatus?.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    //           }`}>
    //             <div className={`w-2 h-2 rounded-full ${
    //               healthStatus?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
    //             }`} />
    //             <span className="text-sm font-medium">
    //               {healthStatus?.status === 'ok' ? 'Online' : 'Offline'}
    //             </span>
    //           </div>
    //           <button
    //             onClick={() => setShowAdmin(!showAdmin)}
    //             className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
    //           >
    //             {showAdmin ? 'User View' : 'Admin Panel'}
    //           </button>
    //         </div>

    //         {/* Mobile Menu Button */}
    //         <button
    //           onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    //           className="md:hidden p-2 text-gray-600"
    //         >
    //           {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
    //         </button>
    //       </div>

    //       {/* Mobile Menu */}
    //       <AnimatePresence>
    //         {mobileMenuOpen && (
    //           <motion.div
    //             initial={{ height: 0, opacity: 0 }}
    //             animate={{ height: 'auto', opacity: 1 }}
    //             exit={{ height: 0, opacity: 0 }}
    //             className="md:hidden mt-4 space-y-3"
    //           >
    //             <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
    //               healthStatus?.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    //             }`}>
    //               <div className={`w-2 h-2 rounded-full ${
    //                 healthStatus?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
    //               }`} />
    //               <span className="text-sm font-medium">
    //                 {healthStatus?.status === 'ok' ? 'System Online' : 'System Offline'}
    //               </span>
    //             </div>
    //             <button
    //               onClick={() => {
    //                 setShowAdmin(!showAdmin);
    //                 setMobileMenuOpen(false);
    //               }}
    //               className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
    //             >
    //               {showAdmin ? 'Switch to User View' : 'Switch to Admin Panel'}
    //             </button>
    //           </motion.div>
    //         )}
    //       </AnimatePresence>
    //     </div>
    //   </motion.header>

    //   {/* Main Content */}
    //   <main className="container mx-auto px-4 py-6 md:py-8">
    //     <AnimatePresence mode="wait">
    //       {showAdmin ? (
    //         <motion.div
    //           key="admin"
    //           initial={{ opacity: 0, x: 20 }}
    //           animate={{ opacity: 1, x: 0 }}
    //           exit={{ opacity: 0, x: -20 }}
    //         >
    //           <AdminPanel />
    //         </motion.div>
    //       ) : (
    //         <motion.div
    //           key="user"
    //           initial={{ opacity: 0, x: -20 }}
    //           animate={{ opacity: 1, x: 0 }}
    //           exit={{ opacity: 0, x: 20 }}
    //           className="space-y-6 md:space-y-8"
    //         >
    //           {/* Selection Controls */}
    //           <motion.div
    //             initial={{ opacity: 0, y: 20 }}
    //             animate={{ opacity: 1, y: 0 }}
    //             className="bg-white p-4 md:p-6 rounded-lg shadow-md"
    //           >
    //             <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">
    //               Select District
    //             </h2>
                
    //             <div className="space-y-4">
    //               <SearchBar onDistrictFound={handleDistrictFound} />
                  
    //               <div className="relative">
    //                 <div className="absolute inset-0 flex items-center">
    //                   <div className="w-full border-t border-gray-300" />
    //                 </div>
    //                 <div className="relative flex justify-center">
    //                   <span className="bg-white px-3 text-sm text-gray-500">or</span>
    //                 </div>
    //               </div>

    //               <LocationDetector onDistrictDetected={handleDistrictFound} />

    //               <div className="relative">
    //                 <div className="absolute inset-0 flex items-center">
    //                   <div className="w-full border-t border-gray-300" />
    //                 </div>
    //                 <div className="relative flex justify-center">
    //                   <span className="bg-white px-3 text-sm text-gray-500">or browse</span>
    //                 </div>
    //               </div>

    //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    //                 <StateSelector
    //                   selectedState={selectedState}
    //                   onStateSelect={handleStateSelect}
    //                 />
    //                 <DistrictSelector
    //                   stateId={selectedState}
    //                   selectedDistrict={selectedDistrict}
    //                   onDistrictSelect={handleDistrictSelect}
    //                 />
    //               </div>
    //             </div>
    //           </motion.div>

    //           {/* Metrics Display */}
    //           {selectedDistrict && (
    //             <>
    //               <motion.div
    //                 initial={{ opacity: 0 }}
    //                 animate={{ opacity: 1 }}
    //                 transition={{ delay: 0.2 }}
    //               >
    //                 <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
    //                   Current Metrics
    //                 </h2>
    //                 <MetricCards districtId={selectedDistrict} />
    //               </motion.div>

    //               <motion.div
    //                 initial={{ opacity: 0 }}
    //                 animate={{ opacity: 1 }}
    //                 transition={{ delay: 0.3 }}
    //               >
    //                 <TrendChart districtId={selectedDistrict} />
    //               </motion.div>

    //               <motion.div
    //                 initial={{ opacity: 0 }}
    //                 animate={{ opacity: 1 }}
    //                 transition={{ delay: 0.4 }}
    //               >
    //                 <ComparisonChart districtId={selectedDistrict} />
    //               </motion.div>
    //             </>
    //           )}

    //           {!selectedDistrict && (
    //             <motion.div
    //               initial={{ opacity: 0 }}
    //               animate={{ opacity: 1 }}
    //               className="text-center py-12 md:py-20 text-gray-500"
    //             >
    //               <Activity size={64} className="mx-auto mb-4 opacity-20" />
    //               <p className="text-lg md:text-xl">Select a district to view analytics</p>
    //             </motion.div>
    //           )}
    //         </motion.div>
    //       )}
    //     </AnimatePresence>
    //   </main>
    // </div>

export default App;
