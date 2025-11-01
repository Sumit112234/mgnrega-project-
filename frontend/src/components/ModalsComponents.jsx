import React, { useState } from 'react';
import { MapPin, Loader, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Location Detector Component
export const LocationDetector = ({ onLocationFound, states, districts }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Normalize location names for better matching
  const normalizeLocationName = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b(district|state)\b/gi, '')
      .trim();
  };

  // Find best matching state
  const findMatchingState = (stateName) => {
    const normalized = normalizeLocationName(stateName);
    
    // Try exact match first
    let match = states.find(s => 
      normalizeLocationName(s.state_name) === normalized
    );
    
    // Try partial match
    if (!match) {
      match = states.find(s => 
        normalizeLocationName(s.state_name).includes(normalized) ||
        normalized.includes(normalizeLocationName(s.state_name))
      );
    }
    
    return match;
  };

  // Find best matching district
  const findMatchingDistrict = (districtName, stateCode) => {
    const normalized = normalizeLocationName(districtName);
    const stateDistricts = districts.filter(d => d.state_code === stateCode);
    
    // Try exact match first
    let match = stateDistricts.find(d => 
      normalizeLocationName(d.district_name) === normalized
    );
    
    // Try partial match
    if (!match) {
      match = stateDistricts.find(d => 
        normalizeLocationName(d.district_name).includes(normalized) ||
        normalized.includes(normalizeLocationName(d.district_name))
      );
    }
    
    // Return first district if no match (fallback)
    return match || stateDistricts[0];
  };

  const detectLocation = async () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use OpenStreetMap Nominatim for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'MGNREGA-Dashboard/1.0'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Geocoding service unavailable');
          }

          const data = await response.json();

          ////console.log('data', data)
          const address = data.address;

          if (!address) {
            setError('Could not determine location from coordinates');
            setLoading(false);
            return;
          }

          // Extract state and district from address
          let stateName = address.state || address.state_district ||  null;
          let districtName = address.city || address.city_district  || address.state_district || address.district || null;

          if (!stateName) {
            setError('Could not identify state from your location');
            setLoading(false);
            return;
          }

          // Match with available states and districts
          const matchedState = findMatchingState(stateName);
          
          if (!matchedState) {
            setError(`State '${stateName}' not found in available data`);
            setLoading(false);
            return;
          }

          // If no district name found, use first district in state
          let matchedDistrict;
          if (districtName) {
            matchedDistrict = findMatchingDistrict(districtName, matchedState.state_code);
          } else {
            matchedDistrict = districts.find(d => d.state_code === matchedState.state_code);
          }

          if (!matchedDistrict) {
            setError(`No districts found for ${matchedState.state_name}`);
            setLoading(false);
            return;
          }

          // Success - call the callback with matched data
          onLocationFound({
            stateCode: matchedState.state_code,
            districtCode: matchedDistrict.district_code,
            stateName: matchedState.state_name,
            districtName: matchedDistrict.district_name,
            coordinates: { latitude, longitude },
            isApproximate: !districtName // Flag if we couldn't find exact district
          });

          setLoading(false);

        } catch (err) {
          console.error('Location detection error:', err);
          setError('Failed to detect location. Please try again or select manually.');
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. Please enable location access.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <button
        onClick={detectLocation}
        disabled={loading}
        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={20} />
            <span>Detecting Location...</span>
          </>
        ) : (
          <>
            <MapPin size={20} />
            <span>Detect My Location</span>
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center max-w-xs">
        Click to automatically detect your location and view local MGNREGA data
      </p>
    </div>
  );
};

// Instructions Modal Component
export const InstructionsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Info size={32} />
              <div>
                <h2 className="text-2xl font-bold">Welcome to MGNREGA Dashboard</h2>
                <p className="text-blue-100 text-sm mt-1">Important Information & Instructions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm font-bold">1</span>
              About This Dashboard
            </h3>
            <p className="text-gray-600 leading-relaxed ml-10">
              This dashboard provides comprehensive visualization of MGNREGA (Mahatma Gandhi National Rural Employment Guarantee Act) data across India. 
              Explore employment statistics, expenditure trends, and social inclusion metrics at state and district levels.
            </p>
          </div>

          {/* Features Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm font-bold">2</span>
              Key Features
            </h3>
            <ul className="ml-10 space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Real-time district and state-level employment data</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Historical trends analysis over 12 months</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Performance comparison with state averages</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Location-based automatic district detection</span>
              </li>
            </ul>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start">
              <AlertTriangle className="text-yellow-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Important Notice</h4>
                <p className="text-yellow-700 text-sm leading-relaxed mb-2">
                  This dashboard fetches data from Government APIs which may experience intermittent issues:
                </p>
                <ul className="text-yellow-700 text-sm space-y-1 ml-4">
                  <li>• APIs may be slow or temporarily unavailable</li>
                  <li>• Some districts may have incomplete or missing data</li>
                  <li>• If you experience issues, try selecting different states or districts</li>
                  <li>• Data is refreshed periodically from official sources</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How to Use */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm font-bold">3</span>
              How to Use
            </h3>
            <ol className="ml-10 space-y-2 text-gray-600 list-decimal">
              <li>Select a state from the dropdown menu</li>
              <li>Choose a district to view detailed data</li>
              <li>Or use "Detect My Location" for automatic selection</li>
              <li>Switch between Overview, History, and Compare views</li>
              <li>Explore charts and statistics for comprehensive insights</li>
            </ol>
          </div>

          {/* Support */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Thank you for your cooperation!</strong> We appreciate your patience as we work with government data sources. 
              If you encounter persistent issues, please try again later or contact support.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Got It, Let's Start!
          </button>
        </div>
      </div>
    </div>
  );
};

// No Data Available Modal Component
export const NoDataModal = ({ isOpen, onClose, districtName, stateName, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle size={32} />
              <h2 className="text-xl font-bold">Data Not Available</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-orange-600" size={32} />
            </div>
            
            {districtName && stateName && (
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {districtName}, {stateName}
              </h3>
            )}
            
            <p className="text-gray-600 leading-relaxed">
              {message || 'Unfortunately, data is not available for the selected district at this time.'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Possible reasons:</p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Data has not been uploaded for this period</li>
              <li>• Government API is temporarily unavailable</li>
              <li>• District code may have changed</li>
              <li>• Network connectivity issues</li>
            </ul>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
            <p className="text-sm text-blue-800">
              <strong>Suggestion:</strong> Try selecting a different district or state, or check back later.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Try Another District
          </button>
        </div>
      </div>
    </div>
  );
};

// Demo Component showing how to use all three
const DemoUsage = () => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [showNoData, setShowNoData] = useState(false);
  const [locationData, setLocationData] = useState(null);

  // Mock data for demo
  const mockStates = [
    { state_code: '09', state_name: 'Madhya Pradesh' },
    { state_code: '07', state_name: 'Delhi' },
    { state_code: '27', state_name: 'Maharashtra' }
  ];

  const mockDistricts = [
    { district_code: '0901', district_name: 'Bhopal', state_code: '09' },
    { district_code: '0902', district_name: 'Indore', state_code: '09' },
    { district_code: '0701', district_name: 'Central Delhi', state_code: '07' }
  ];

  const handleLocationFound = (data) => {
    setLocationData(data);
    ////console.log('Location detected:', data);
    // Use data.stateCode and data.districtCode to fetch data
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">MGNREGA Dashboard Components Demo</h1>

        {/* Location Detector */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Location Detector</h2>
          <LocationDetector 
            onLocationFound={handleLocationFound}
            states={mockStates}
            districts={mockDistricts}
          />
          {locationData && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Location Detected:</strong> {locationData.districtName}, {locationData.stateName}
                {locationData.isApproximate && <span className="text-orange-600"> (Approximate match)</span>}
              </p>
            </div>
          )}
        </div>

        {/* Demo Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Modal Demos</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowInstructions(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Show Instructions
            </button>
            <button
              onClick={() => setShowNoData(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Show No Data Modal
            </button>
          </div>
        </div>

        {/* Modals */}
        <InstructionsModal 
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
        />

        <NoDataModal
          isOpen={showNoData}
          onClose={() => setShowNoData(false)}
          districtName="Sample District"
          stateName="Sample State"
          message="Data is currently unavailable for this district."
        />
      </div>
    </div>
  );
};

export default DemoUsage;

// import React, { useState } from 'react';
// import { MapPin, Loader, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// // Location Detector Component
// export const LocationDetector = ({ onLocationFound, apiBase }) => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const detectLocation = async () => {
//     setLoading(true);
//     setError('');

//     if (!navigator.geolocation) {
//       setError('Geolocation is not supported by your browser');
//       setLoading(false);
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const { latitude, longitude } = position.coords;
        
//         try {
//           // Send location to backend to find district
//           const response = await fetch(`${apiBase}/location/detect`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ latitude, longitude }),
//           });

//           const data = await response.json();

//           if (data.success) {
//             onLocationFound({
//               stateCode: data.data.state_code,
//               districtCode: data.data.district_code,
//               stateName: data.data.state_name,
//               districtName: data.data.district_name,
//               coordinates: { latitude, longitude }
//             });
//           } else {
//             setError(data.message || 'Could not find district for your location');
//           }
//         } catch (err) {
//           setError('Failed to fetch location data from server');
//         } finally {
//           setLoading(false);
//         }
//       },
//       (err) => {
//         setLoading(false);
//         switch (err.code) {
//           case err.PERMISSION_DENIED:
//             setError('Location permission denied. Please enable location access.');
//             break;
//           case err.POSITION_UNAVAILABLE:
//             setError('Location information unavailable.');
//             break;
//           case err.TIMEOUT:
//             setError('Location request timed out.');
//             break;
//           default:
//             setError('An unknown error occurred.');
//         }
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 10000,
//         maximumAge: 0
//       }
//     );
//   };

//   return (
//     <div className="flex flex-col items-center space-y-3">
//       <button
//         onClick={detectLocation}
//         disabled={loading}
//         className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
//       >
//         {loading ? (
//           <>
//             <Loader className="animate-spin" size={20} />
//             <span>Detecting Location...</span>
//           </>
//         ) : (
//           <>
//             <MapPin size={20} />
//             <span>Detect My Location</span>
//           </>
//         )}
//       </button>

//       {error && (
//         <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
//           <AlertCircle size={16} />
//           <span className="text-sm">{error}</span>
//         </div>
//       )}

//       <p className="text-xs text-gray-500 text-center max-w-xs">
//         Click to automatically detect your location and view local MGNREGA data
//       </p>
//     </div>
//   );
// };

// // Instructions Modal Component
// export const InstructionsModal = ({ isOpen, onClose }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
//       <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-xl">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <Info size={32} />
//               <div>
//                 <h2 className="text-2xl font-bold">Welcome to MGNREGA Dashboard</h2>
//                 <p className="text-blue-100 text-sm mt-1">Important Information & Instructions</p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
//             >
//               <X size={24} />
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-6 space-y-6">
//           {/* About Section */}
//           <div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
//               <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm font-bold">1</span>
//               About This Dashboard
//             </h3>
//             <p className="text-gray-600 leading-relaxed ml-10">
//               This dashboard provides comprehensive visualization of MGNREGA (Mahatma Gandhi National Rural Employment Guarantee Act) data across India. 
//               Explore employment statistics, expenditure trends, and social inclusion metrics at state and district levels.
//             </p>
//           </div>

//           {/* Features Section */}
//           <div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
//               <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm font-bold">2</span>
//               Key Features
//             </h3>
//             <ul className="ml-10 space-y-2 text-gray-600">
//               <li className="flex items-start">
//                 <span className="text-blue-600 mr-2">•</span>
//                 <span>Real-time district and state-level employment data</span>
//               </li>
//               <li className="flex items-start">
//                 <span className="text-blue-600 mr-2">•</span>
//                 <span>Historical trends analysis over 12 months</span>
//               </li>
//               <li className="flex items-start">
//                 <span className="text-blue-600 mr-2">•</span>
//                 <span>Performance comparison with state averages</span>
//               </li>
//               <li className="flex items-start">
//                 <span className="text-blue-600 mr-2">•</span>
//                 <span>Location-based automatic district detection</span>
//               </li>
//             </ul>
//           </div>

//           {/* Important Notice */}
//           <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
//             <div className="flex items-start">
//               <AlertTriangle className="text-yellow-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
//               <div>
//                 <h4 className="font-semibold text-yellow-800 mb-2">Important Notice</h4>
//                 <p className="text-yellow-700 text-sm leading-relaxed mb-2">
//                   This dashboard fetches data from Government APIs which may experience intermittent issues:
//                 </p>
//                 <ul className="text-yellow-700 text-sm space-y-1 ml-4">
//                   <li>• APIs may be slow or temporarily unavailable</li>
//                   <li>• Some districts may have incomplete or missing data</li>
//                   <li>• If you experience issues, try selecting different states or districts</li>
//                   <li>• Data is refreshed periodically from official sources</li>
//                 </ul>
//               </div>
//             </div>
//           </div>

//           {/* How to Use */}
//           <div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
//               <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm font-bold">3</span>
//               How to Use
//             </h3>
//             <ol className="ml-10 space-y-2 text-gray-600 list-decimal">
//               <li>Select a state from the dropdown menu</li>
//               <li>Choose a district to view detailed data</li>
//               <li>Or use "Detect My Location" for automatic selection</li>
//               <li>Switch between Overview, History, and Compare views</li>
//               <li>Explore charts and statistics for comprehensive insights</li>
//             </ol>
//           </div>

//           {/* Support */}
//           <div className="bg-blue-50 p-4 rounded-lg">
//             <p className="text-sm text-blue-800">
//               <strong>Thank you for your cooperation!</strong> We appreciate your patience as we work with government data sources. 
//               If you encounter persistent issues, please try again later or contact support.
//             </p>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end">
//           <button
//             onClick={onClose}
//             className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
//           >
//             Got It, Let's Start!
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // No Data Available Modal Component
// export const NoDataModal = ({ isOpen, onClose, districtName, stateName, message }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
//       <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-xl">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <AlertCircle size={32} />
//               <h2 className="text-xl font-bold">Data Not Available</h2>
//             </div>
//             <button
//               onClick={onClose}
//               className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
//             >
//               <X size={24} />
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-6 space-y-4">
//           <div className="text-center">
//             <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
//               <AlertCircle className="text-orange-600" size={32} />
//             </div>
            
//             {districtName && stateName && (
//               <h3 className="text-lg font-semibold text-gray-800 mb-2">
//                 {districtName}, {stateName}
//               </h3>
//             )}
            
//             <p className="text-gray-600 leading-relaxed">
//               {message || 'Unfortunately, data is not available for the selected district at this time.'}
//             </p>
//           </div>

//           <div className="bg-gray-50 rounded-lg p-4 space-y-2">
//             <p className="text-sm font-medium text-gray-700">Possible reasons:</p>
//             <ul className="text-sm text-gray-600 space-y-1 ml-4">
//               <li>• Data has not been uploaded for this period</li>
//               <li>• Government API is temporarily unavailable</li>
//               <li>• District code may have changed</li>
//               <li>• Network connectivity issues</li>
//             </ul>
//           </div>

//           <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
//             <p className="text-sm text-blue-800">
//               <strong>Suggestion:</strong> Try selecting a different district or state, or check back later.
//             </p>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
//           <button
//             onClick={onClose}
//             className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
//           >
//             Try Another District
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Demo Component showing how to use all three
// const DemoUsage = () => {
//   const [showInstructions, setShowInstructions] = useState(true);
//   const [showNoData, setShowNoData] = useState(false);
//   const [locationData, setLocationData] = useState(null);

//   const handleLocationFound = (data) => {
//     setLocationData(data);
//     ////console.log('Location detected:', data);
//     // Use data.stateCode and data.districtCode to fetch data
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <div className="max-w-4xl mx-auto space-y-6">
//         <h1 className="text-3xl font-bold text-gray-800 mb-8">MGNREGA Dashboard Components Demo</h1>

//         {/* Location Detector */}
//         <div className="bg-white rounded-lg shadow-md p-6">
//           <h2 className="text-xl font-semibold mb-4">Location Detector</h2>
//           <LocationDetector 
//             onLocationFound={handleLocationFound}
//             apiBase="/api"
//           />
//           {locationData && (
//             <div className="mt-4 p-4 bg-green-50 rounded-lg">
//               <p className="text-sm text-green-800">
//                 <strong>Location Detected:</strong> {locationData.districtName}, {locationData.stateName}
//               </p>
//             </div>
//           )}
//         </div>

//         {/* Demo Buttons */}
//         <div className="bg-white rounded-lg shadow-md p-6">
//           <h2 className="text-xl font-semibold mb-4">Modal Demos</h2>
//           <div className="flex space-x-4">
//             <button
//               onClick={() => setShowInstructions(true)}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             >
//               Show Instructions
//             </button>
//             <button
//               onClick={() => setShowNoData(true)}
//               className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
//             >
//               Show No Data Modal
//             </button>
//           </div>
//         </div>

//         {/* Modals */}
//         <InstructionsModal 
//           isOpen={showInstructions}
//           onClose={() => setShowInstructions(false)}
//         />

//         <NoDataModal
//           isOpen={showNoData}
//           onClose={() => setShowNoData(false)}
//           districtName="Sample District"
//           stateName="Sample State"
//           message="Data is currently unavailable for this district."
//         />
//       </div>
//     </div>
//   );
// };

// export default DemoUsage;