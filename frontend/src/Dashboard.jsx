import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Users, Briefcase, DollarSign, Activity, AlertCircle, CheckCircle, Loader, Search, Calendar, MapPin } from 'lucide-react';

const API_BASE = import.meta.env.VITE_APP_API_URL;

const MGNREGADashboard = () => {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districtData, setDistrictData] = useState(null);
  const [history, setHistory] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [popularDistricts, setPopularDistricts] = useState([]);
  const [health, setHealth] = useState(null);
  
  const [loading, setLoading] = useState({
    states: false,
    districts: false,
    data: false,
    history: false,
    comparison: false
  });
  
  const [error, setError] = useState('');
  const [view, setView] = useState('overview'); 

  // Fetch states on mount
  useEffect(() => {
    fetchStates();
    fetchHealth();
    fetchPopularDistricts();
  }, []);

 
  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState);
    }
  }, [selectedState]);

  // Fetch district data when district is selected
  useEffect(() => {
    if (selectedDistrict) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
      fetchDistrictData(selectedDistrict, currentMonth, `${currentYear}-${currentYear + 1}`);
    }
  }, [selectedDistrict]);

  const fetchStates = async () => {
    setLoading(prev => ({ ...prev, states: true }));
    try {
      const response = await fetch(`${API_BASE}/states`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setStates(data.data);
      }
    } catch (err) {
      setError('Failed to fetch states');
    } finally {
      setLoading(prev => ({ ...prev, states: false }));
    }
  };

  const fetchDistricts = async (stateCode) => {
    setLoading(prev => ({ ...prev, districts: true }));
    try {
      const response = await fetch(`${API_BASE}/states/${stateCode}/districts`);
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data);
      }
    } catch (err) {
      setError('Failed to fetch districts');
    } finally {
      setLoading(prev => ({ ...prev, districts: false }));
    }
  };

  const fetchDistrictData = async (districtCode, month, year) => {
    setLoading(prev => ({ ...prev, data: true }));
    try {
      const response = await fetch(`${API_BASE}/district/${districtCode}/data?month=${month}&year=${year}`);
      const data = await response.json();
      if (data.success) {
        setDistrictData(data.data);
      }
    } catch (err) {
      setError('Failed to fetch district data');
    } finally {
      setLoading(prev => ({ ...prev, data: false }));
    }
  };

  const fetchHistory = async () => {
    if (!selectedDistrict) return;
    
    setLoading(prev => ({ ...prev, history: true }));
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    
    const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
    
    try {
      const response = await fetch(`${API_BASE}/district/${selectedDistrict}/history?startDate=${start}&endDate=${end}`);
      const data = await response.json();
      if (data.success) {
        setHistory(data);
        setView('history');
      }
    } catch (err) {
      setError('Failed to fetch history');
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  };

  const fetchComparison = async () => {
    if (!selectedDistrict) return;
    
    setLoading(prev => ({ ...prev, comparison: true }));
    try {
      const response = await fetch(`${API_BASE}/district/${selectedDistrict}/comparison`);
      const data = await response.json();
      if (data.success) {
        setComparison(data.data);
        setView('comparison');
      }
    } catch (err) {
      setError('Failed to fetch comparison');
    } finally {
      setLoading(prev => ({ ...prev, comparison: false }));
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();
      if (data.success) {
        setHealth(data);
      }
    } catch (err) {
      console.error('Health check failed');
    }
  };

  const fetchPopularDistricts = async () => {
    try {
      const response = await fetch(`${API_BASE}/popular-districts`);
      const data = await response.json();
      if (data.success) {
        setPopularDistricts(data.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch popular districts');
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color = "blue" }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: `var(--${color})` }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {trend > 0 ? <TrendingUp size={16} /> : trend < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
              <span className="ml-1">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon size={24} style={{ color: `var(--${color})` }} />
        </div>
      </div>
    </div>
  );

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('en-IN').format(Number(num));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --blue: #3b82f6;
          --green: #10b981;
          --yellow: #f59e0b;
          --red: #ef4444;
          --purple: #8b5cf6;
        }
        .bg-blue-100 { background-color: #dbeafe; }
        .bg-green-100 { background-color: #d1fae5; }
        .bg-yellow-100 { background-color: #fef3c7; }
        .bg-red-100 { background-color: #fee2e2; }
      `}</style>

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">MGNREGA Data Visualization</h1>
              <p className="text-blue-100 mt-1">Mahatma Gandhi National Rural Employment Guarantee Act</p>
            </div>
            {health && (
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-4 py-2">
                <CheckCircle size={20} className="text-green-300" />
                <span className="text-sm">System Online</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-2" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Select State
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict('');
                  setDistrictData(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading.states}
              >
                <option value="">-- Select State --</option>
                {/* {console.log(states)} */}
                { states.map(state => (
                  <option key={state.state_code} value={state.state_code}>
                    {state.state_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search size={16} className="inline mr-1" />
                Select District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!selectedState || loading.districts}
              >
                <option value="">-- Select District --</option>
                {districts.map(district => (
                  <option key={district.district_code} value={district.district_code}>
                    {district.district_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setView('overview')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${view === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Overview
                </button>
                <button
                  onClick={fetchHistory}
                  disabled={!selectedDistrict || loading.history}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${view === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} disabled:opacity-50`}
                >
                  {loading.history ? 'Loading...' : 'History'}
                </button>
                <button
                  onClick={fetchComparison}
                  disabled={!selectedDistrict || loading.comparison}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${view === 'comparison' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} disabled:opacity-50`}
                >
                  {loading.comparison ? 'Loading...' : 'Compare'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading.data ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-blue-600" size={48} />
          </div>
        ) : districtData && view === 'overview' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Households Worked"
                value={formatNumber(districtData.metrics.totalHouseholdsWorked)}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Total Workers"
                value={formatNumber(districtData.metrics.totalIndividualsWorked)}
                icon={Briefcase}
                color="green"
              />
              <StatCard
                title="Total Expenditure (₹ Lakhs)"
                value={formatNumber(districtData.metrics.totalExpenditure)}
                icon={DollarSign}
                color="yellow"
              />
              <StatCard
                title="Avg Wage Rate (₹/day)"
                value={districtData.metrics.averageWageRate.toFixed(2)}
                icon={Activity}
                color="purple"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Work Statistics */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Work Statistics</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Completed', value: districtData.metrics.completedWorks },
                    { name: 'Ongoing', value: districtData.metrics.ongoingWorks }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Total Works: {formatNumber(districtData.metrics.totalWorks)} | 
                  Completion Rate: {districtData.metrics.workCompletionRate.toFixed(1)}%
                </p>
              </div>

              {/* Participation Distribution */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Worker Participation</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Women', value: districtData.metrics.womenParticipationRate },
                        { name: 'SC', value: districtData.metrics.scParticipationRate },
                        { name: 'ST', value: districtData.metrics.stParticipationRate },
                        { name: 'Others', value: 100 - districtData.metrics.womenParticipationRate - districtData.metrics.scParticipationRate - districtData.metrics.stParticipationRate }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Detailed Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Employment</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Days/Household:</span>
                      <span className="font-medium">{districtData.metrics.averageDaysEmployment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">100 Days Completed:</span>
                      <span className="font-medium">{formatNumber(districtData.metrics.households100Days)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Women Persondays:</span>
                      <span className="font-medium">{formatNumber(districtData.metrics.womenPersondays)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Social Inclusion</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">SC Persondays:</span>
                      <span className="font-medium">{formatNumber(districtData.metrics.scPersondays)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ST Persondays:</span>
                      <span className="font-medium">{formatNumber(districtData.metrics.stPersondays)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Differently Abled:</span>
                      <span className="font-medium">{districtData.rawData.Differently_abled_persons_worked}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Financial</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wages (₹ Lakhs):</span>
                      <span className="font-medium">{districtData.rawData.Wages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Material Wages:</span>
                      <span className="font-medium">{districtData.rawData.Material_and_skilled_Wages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admin Exp:</span>
                      <span className="font-medium">{districtData.rawData.Total_Adm_Expenditure}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : view === 'history' && history ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Historical Trends (Last 12 Months)</h3>
            
            {history.trends && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Recent Average</p>
                    <p className="text-2xl font-bold text-blue-600">{formatNumber(history.trends.recentAverage)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Change</p>
                    <p className={`text-2xl font-bold ${history.trends.percentageChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {history.trends.percentageChange}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Trend</p>
                    <p className="text-2xl font-bold text-gray-800 capitalize">{history.trends.trend}</p>
                  </div>
                </div>
              </div>
            )}

            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={history?.data?.map(d => ({
                month: `${d.month} ${d.fin_year.split('-')[0]}`,
                households: Number(d.Total_Households_Worked),
                expenditure: Number(d.Total_Exp)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="households" stroke="#3b82f6" name="Households Worked" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="expenditure" stroke="#10b981" name="Expenditure (₹ Lakhs)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : view === 'comparison' && comparison ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">District vs State Average Comparison</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600 mb-2">District Average</p>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(comparison.performance.districtAverage)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600 mb-2">State Average</p>
                <p className="text-3xl font-bold text-gray-600">{formatNumber(comparison.performance.stateAverage)}</p>
              </div>
              <div className={`rounded-lg p-6 text-center ${comparison.performance.status === 'Above Average' ? 'bg-green-50' : comparison.performance.status === 'Below Average' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                <p className="text-sm text-gray-600 mb-2">Performance</p>
                <p className={`text-3xl font-bold ${comparison.performance.status === 'Above Average' ? 'text-green-600' : comparison.performance.status === 'Below Average' ? 'text-red-600' : 'text-yellow-600'}`}>
                  {comparison.performance.status}
                </p>
                <p className="text-sm text-gray-600 mt-2">Index: {comparison.performance.performanceIndex}</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparison.district.recentData.slice(0, 6).map(d => ({
                month: d.month,
                households: Number(d.Total_Households_Worked),
                stateAvg: comparison.performance.stateAverage
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="households" fill="#3b82f6" name="District" />
                <Bar dataKey="stateAvg" fill="#94a3b8" name="State Average" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a District to View Data</h3>
            <p className="text-gray-500">Choose a state and district from the dropdowns above to explore MGNREGA data</p>
            
            {popularDistricts.length > 0 && (
              <div className="mt-8">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Popular Districts</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {popularDistricts.map(district => (
                    <button
                      key={district._id}
                      onClick={() => {
                        // Find state code for this district
                        const state = states.find(s => s.state_name === district.state_name);
                        if (state) {
                          setSelectedState(state.state_code);
                          setTimeout(() => setSelectedDistrict(district._id), 500);
                        }
                      }}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                    >
                      {district.district_name}, {district.state_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">MGNREGA Data Visualization Dashboard</p>
          <p className="text-xs text-gray-400 mt-1">Data source: data.gov.in | Ministry of Rural Development</p>
        </div>
      </footer>
    </div>
  );
};

export default MGNREGADashboard;