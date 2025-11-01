import React, { useState, useEffect, createContext, useContext } from 'react';
import { MapPin, TrendingUp, Users, DollarSign, Briefcase, Calendar, RefreshCw, AlertCircle, Search, ChevronRight, BarChart3, Home, Upload, Database, Trash2, Activity } from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// ============================================
// CONTEXT & STATE MANAGEMENT
// ============================================
const AppContext = createContext();

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

// ============================================
// API SERVICE
// ============================================
const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },
  async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }
};

// ============================================
// MAIN APP COMPONENT
// ============================================
function MGNREGATracker() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    checkHealth();
    loadStates();
  }, []);

  const checkHealth = async () => {
    try {
      await api.get('/health');
      setIsOnline(true);
    } catch (err) {
      setIsOnline(false);
    }
  };

  const loadStates = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/v1/districts/states');
      setStates(data.states || []);
      setError(null);
    } catch (err) {
      setError('Failed to load states');
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (stateId) => {
    try {
      setLoading(true);
      const data = await api.get(`/api/v1/districts/states/${stateId}/districts`);
      setDistricts(data.districts || []);
      setError(null);
    } catch (err) {
      setError('Failed to load districts');
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await api.post('/api/v1/districts/by-location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          if (data.district) {
            setSelectedDistrict(data.district);
            await loadDashboardData(data.district.id);
            setCurrentPage('dashboard');
          }
        } catch (err) {
          setError('Could not detect district');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Location access denied');
        setLoading(false);
      }
    );
  };

  const loadDashboardData = async (districtId) => {
    try {
      setLoading(true);
      const [metricsData, historyData, comparisonData] = await Promise.all([
        api.get(`/api/v1/metrics/districts/${districtId}`),
        api.get(`/api/v1/metrics/districts/${districtId}/history`),
        api.get(`/api/v1/metrics/districts/${districtId}/compare`)
      ]);
      setMetrics(metricsData);
      setHistory(historyData.history || []);
      setComparison(comparisonData);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentPage, setCurrentPage,
    selectedState, setSelectedState,
    selectedDistrict, setSelectedDistrict,
    states, districts, metrics, history, comparison,
    loading, error, isOnline, setError,
    loadDistricts, detectLocation, loadDashboardData
  };

  return (
    <AppContext.Provider value={value}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        {!isOnline && <OfflineBanner />}
        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
        
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'admin' && <AdminPage />}
        
        <BottomNav />
      </div>
    </AppContext.Provider>
  );
}

// ============================================
// SHARED COMPONENTS
// ============================================

// Header Component
function Header() {
  const { currentPage } = useAppContext();
  
  const getTitle = () => {
    switch(currentPage) {
      case 'home': return 'Select District';
      case 'dashboard': return 'Dashboard';
      case 'admin': return 'Admin Panel';
      default: return 'MGNREGA';
    }
  };
  
  return (
    <header className="bg-green-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Briefcase size={28} />
            <div>
              <h1 className="text-xl font-bold">MGNREGA Tracker</h1>
              <p className="text-xs opacity-90">{getTitle()}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Offline Banner
function OfflineBanner() {
  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
      <div className="flex items-center">
        <AlertCircle className="text-yellow-700 mr-2" size={20} />
        <p className="text-sm text-yellow-700">
          Offline Mode - Showing cached data
        </p>
      </div>
    </div>
  );
}

// Error Banner
function ErrorBanner({ message, onClose }) {
  return (
    <div className="bg-red-100 border-l-4 border-red-500 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertCircle className="text-red-700 mr-2" size={20} />
          <p className="text-sm text-red-700">{message}</p>
        </div>
        <button onClick={onClose} className="text-red-700 font-bold text-xl">×</button>
      </div>
    </div>
  );
}

// Bottom Navigation
function BottomNav() {
  const { currentPage, setCurrentPage } = useAppContext();
  
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'admin', icon: Database, label: 'Admin' }
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center py-3 px-4 ${
                currentPage === item.id
                  ? 'text-green-600'
                  : 'text-gray-500'
              }`}
            >
              <item.icon size={24} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ============================================
// HOME PAGE
// ============================================
function HomePage() {
  const { 
    states, districts, loading, selectedState, setSelectedState,
    setSelectedDistrict, setCurrentPage, loadDistricts, detectLocation, loadDashboardData
  } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const handleStateSelect = async (state) => {
    setSelectedState(state);
    await loadDistricts(state.id);
  };

  const handleDistrictSelect = async (district) => {
    setSelectedDistrict(district);
    await loadDashboardData(district.id);
    setCurrentPage('dashboard');
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <HeroSection />
      <AutoDetectButton onClick={detectLocation} loading={loading} />
      
      <div className="text-center text-gray-500 my-6">OR</div>

      {!selectedState ? (
        <StateSelector 
          states={states} 
          onSelect={handleStateSelect} 
        />
      ) : (
        <DistrictSelector
          stateName={selectedState.name}
          districts={districts}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelect={handleDistrictSelect}
          onBack={() => setSelectedState(null)}
        />
      )}
    </div>
  );
}

// Hero Section Component
function HeroSection() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Check Work Status
      </h2>
      <p className="text-gray-600">
        Select your district to see job cards, wages, and work progress
      </p>
    </div>
  );
}

// Auto Detect Button Component
function AutoDetectButton({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-blue-600 text-white py-4 rounded-lg shadow-md flex items-center justify-center space-x-2 hover:bg-blue-700 disabled:bg-gray-400 transition"
    >
      <MapPin size={24} />
      <span className="text-lg font-semibold">
        {loading ? 'Detecting...' : 'Auto-Detect My District'}
      </span>
    </button>
  );
}

// State Selector Component
function StateSelector({ states, onSelect }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <MapPin className="mr-2" size={20} />
        Select State
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {states.map((state) => (
          <button
            key={state.id}
            onClick={() => onSelect(state)}
            className="w-full text-left p-4 border rounded-lg hover:bg-green-50 hover:border-green-500 flex items-center justify-between transition"
          >
            <span className="font-medium">{state.name}</span>
            <ChevronRight size={20} />
          </button>
        ))}
      </div>
    </div>
  );
}

// District Selector Component
function DistrictSelector({ stateName, districts, searchTerm, onSearchChange, onSelect, onBack }) {
  const filteredDistricts = districts.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <MapPin className="mr-2" size={20} />
          Select District in {stateName}
        </h3>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline"
        >
          Change State
        </button>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search district..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredDistricts.map((district) => (
          <button
            key={district.id}
            onClick={() => onSelect(district)}
            className="w-full text-left p-4 border rounded-lg hover:bg-green-50 hover:border-green-500 flex items-center justify-between transition"
          >
            <span className="font-medium">{district.name}</span>
            <ChevronRight size={20} />
          </button>
        ))}
        {filteredDistricts.length === 0 && (
          <p className="text-center text-gray-500 py-4">No districts found</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD PAGE
// ============================================
function DashboardPage() {
  const { selectedDistrict, metrics, history, comparison, loading, setCurrentPage } = useAppContext();

  if (!selectedDistrict) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 mb-4">No district selected</p>
          <button
            onClick={() => setCurrentPage('home')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Select District
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <DistrictHeader district={selectedDistrict} metrics={metrics} />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {metrics && <MetricsGrid metrics={metrics} />}
          {history.length > 0 && <TrendChart data={history} />}
          {comparison && <ComparisonChart data={comparison} />}
        </>
      )}
    </div>
  );
}

// District Header Component
function DistrictHeader({ district, metrics }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-bold text-gray-800">{district.name}</h2>
      {metrics && (
        <p className="text-sm text-gray-600 mt-1">
          Last Updated: {new Date(metrics.last_updated).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

// Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="text-center py-8">
      <RefreshCw className="animate-spin mx-auto mb-2 text-green-600" size={32} />
      <p className="text-gray-600">Loading data...</p>
    </div>
  );
}

// Metrics Grid Component
function MetricsGrid({ metrics }) {
  const cards = [
    {
      icon: Users,
      label: 'Active Workers',
      value: metrics.active_workers?.toLocaleString() || 'N/A',
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: DollarSign,
      label: 'Wages Paid',
      value: `₹${(metrics.total_wages / 10000000).toFixed(2)}Cr` || 'N/A',
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Briefcase,
      label: 'Jobs Provided',
      value: metrics.jobs_provided?.toLocaleString() || 'N/A',
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Calendar,
      label: 'Work Days',
      value: metrics.work_days?.toLocaleString() || 'N/A',
      color: 'bg-orange-100 text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {cards.map((card, idx) => (
        <MetricCard key={idx} {...card} />
      ))}
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className={`${bgColor} rounded-lg shadow-md p-4 border border-gray-100`}>
      <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mb-3`}>
        <Icon size={24} />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

// Trend Chart Component
function TrendChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.active_workers || 0));
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <TrendingUp className="mr-2 text-green-600" size={20} />
        12-Month Trend
      </h3>
      <div className="space-y-3">
        {data.slice(-12).map((item, idx) => {
          const percentage = (item.active_workers / maxValue) * 100;
          return (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {new Date(item.month).toLocaleDateString('en', {month: 'short', year: 'numeric'})}
                </span>
                <span className="font-semibold text-gray-800">
                  {item.active_workers?.toLocaleString()}
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Comparison Chart Component
function ComparisonChart({ data }) {
  const metrics = [
    { 
      label: 'Active Workers', 
      district: data.district_metrics?.active_workers, 
      state: data.state_average?.active_workers 
    },
    { 
      label: 'Jobs Provided', 
      district: data.district_metrics?.jobs_provided, 
      state: data.state_average?.jobs_provided 
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <BarChart3 className="mr-2 text-purple-600" size={20} />
        District vs State Average
      </h3>
      <div className="space-y-6">
        {metrics.map((metric, idx) => (
          <ComparisonMetric key={idx} {...metric} />
        ))}
      </div>
    </div>
  );
}

// Comparison Metric Component
function ComparisonMetric({ label, district, state }) {
  const maxVal = Math.max(district || 0, state || 0);
  
  return (
    <div>
      <p className="text-sm font-semibold mb-3 text-gray-700">{label}</p>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">District</span>
            <span className="font-semibold">{district?.toLocaleString()}</span>
          </div>
          <div className="bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${(district / maxVal) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">State Average</span>
            <span className="font-semibold">{state?.toLocaleString()}</span>
          </div>
          <div className="bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${(state / maxVal) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ADMIN PAGE
// ============================================
function AdminPage() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setError } = useAppContext();

  const handleSync = async () => {
    try {
      setLoading(true);
      await api.post('/api/v1/admin/sync', {});
      setError(null);
      alert('Sync triggered successfully');
      loadSyncStatus();
    } catch (err) {
      setError('Failed to trigger sync');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear cache?')) return;
    
    try {
      setLoading(true);
      await api.post('/api/v1/admin/clear-cache', {});
      setError(null);
      alert('Cache cleared successfully');
    } catch (err) {
      setError('Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const data = await api.get('/api/v1/admin/sync-status');
      setSyncStatus(data);
    } catch (err) {
      setError('Failed to load sync status');
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.get('/api/v1/admin/stats');
      setStats(data);
    } catch (err) {
      setError('Failed to load stats');
    }
  };

  useEffect(() => {
    loadSyncStatus();
    loadStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Database className="mr-2 text-green-600" size={28} />
          Admin Panel
        </h2>
        <p className="text-gray-600">Manage data synchronization and system health</p>
      </div>

      <AdminActions 
        onSync={handleSync}
        onClearCache={handleClearCache}
        loading={loading}
      />

      {syncStatus && <SyncStatusCard status={syncStatus} />}
      {stats && <SystemStatsCard stats={stats} />}
    </div>
  );
}

// Admin Actions Component
function AdminActions({ onSync, onClearCache, loading }) {
  return (
    <div className="grid grid-cols-1 gap-4 mb-6">
      <button
        onClick={onSync}
        disabled={loading}
        className="bg-green-600 text-white p-4 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center space-x-2"
      >
        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        <span className="font-semibold">Trigger Data Sync</span>
      </button>

      <button
        onClick={onClearCache}
        disabled={loading}
        className="bg-red-600 text-white p-4 rounded-lg shadow-md hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center space-x-2"
      >
        <Trash2 size={20} />
        <span className="font-semibold">Clear Cache</span>
      </button>
    </div>
  );
}

// Sync Status Card Component
function SyncStatusCard({ status }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <Activity className="mr-2 text-blue-600" size={20} />
        Sync Status
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className={`font-semibold ${
            status.status === 'success' ? 'text-green-600' : 'text-orange-600'
          }`}>
            {status.status}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Last Sync:</span>
          <span className="font-semibold">
            {status.last_sync ? new Date(status.last_sync).toLocaleString() : 'Never'}
          </span>
        </div>
      </div>
    </div>
  );
}

// System Stats Card Component
function SystemStatsCard({ stats }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <BarChart3 className="mr-2 text-purple-600" size={20} />
        System Statistics
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-2xl font-bold text-blue-600">
            {stats.total_districts || 0}
          </p>
          <p className="text-sm text-gray-600">Districts</p>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <p className="text-2xl font-bold text-green-600">
            {stats.total_states || 0}
          </p>
          <p className="text-sm text-gray-600">States</p>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <p className="text-2xl font-bold text-purple-600">
            {stats.cache_size || 0}
          </p>
          <p className="text-sm text-gray-600">Cached Items</p>
        </div>
        <div className="bg-orange-50 p-3 rounded">
          <p className="text-2xl font-bold text-orange-600">
            {stats.api_calls || 0}
          </p>
          <p className="text-sm text-gray-600">API Calls</p>
        </div>
      </div>
    </div>
  );
}

export default MGNREGATracker;