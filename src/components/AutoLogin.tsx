import React, { useState, useEffect } from 'react';
import { Key, Cpu, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { useDeviceContext } from '../context/DeviceContext';
import { LoginResponse, DeviceDataResponse, DevicePoint } from '../types/solarData';

interface AutoLoginProps {
  onTokenChange: (token: string) => void;
  onDeviceDataChange?: (deviceData: DevicePoint | null) => void;
}

const AutoLogin: React.FC<AutoLoginProps> = ({ onTokenChange, onDeviceDataChange }) => {
  const { psKey, setPsKey } = useDeviceContext();
  
  // Auto login and serial number states
  const [autoLoginEnabled, setAutoLoginEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoLoginEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [serialNumber, setSerialNumber] = useState<string>(() => {
    return localStorage.getItem('serialNumber') || 'I2460100212';
  });
  
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState({
    login: false,
    device: false
  });
  const [error, setError] = useState<string>('');
  const [deviceData, setDeviceData] = useState<DevicePoint | null>(null);
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);

  // Save auto login preference to localStorage
  useEffect(() => {
    localStorage.setItem('autoLoginEnabled', JSON.stringify(autoLoginEnabled));
  }, [autoLoginEnabled]);

  // Save serial number to localStorage
  useEffect(() => {
    localStorage.setItem('serialNumber', serialNumber);
  }, [serialNumber]);

  // Initialize auto login on mount
  useEffect(() => {
    if (autoLoginEnabled) {
      handleLogin();
    }
  }, [autoLoginEnabled]);

  // Login function with auto-retry
  const handleLogin = async (retryCount = 0) => {
    setLoading(prev => ({ ...prev, login: true }));
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/solar/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_account: 'sahoo@rbpindia.com',
          user_password: 'rbpindia@2025'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: LoginResponse = await response.json();
      
      if (result.result_code === "1") {
        const newToken = result.result_data?.token || '';
        setToken(newToken);
        onTokenChange(newToken);
        console.log('Login successful, token set');
        
        // If we have a serial number, fetch device data
        if (serialNumber) {
          fetchDeviceDataBySerial(newToken);
        }
      } else {
        // Retry logic for transient failures
        if (retryCount < 2 && result.result_msg.includes('busy')) {
          console.log(`Retry ${retryCount + 1} after busy error`);
          setTimeout(() => handleLogin(retryCount + 1), 2000);
          return;
        }
        setError(`Login failed: ${result.result_msg}`);
      }
    } catch (err: any) {
      // Retry logic for network errors
      if (retryCount < 2) {
        console.log(`Retry ${retryCount + 1} after error:`, err.message);
        setTimeout(() => handleLogin(retryCount + 1), 2000);
        return;
      }
      console.error('Login error details:', err);
      setError(`Login error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(prev => ({ ...prev, login: false }));
    }
  };

  // Fetch device data by serial number
  const fetchDeviceDataBySerial = async (tokenParam?: string) => {
    const actualToken = tokenParam || token;
    
    if (!actualToken) {
      setError('No login token available. Please login first.');
      return;
    }

    if (!serialNumber.trim()) {
      setError('Please enter a serial number');
      return;
    }

    setLoading(prev => ({ ...prev, device: true }));
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/solar/inverter-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: actualToken,
          sn_list: [serialNumber.trim()]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: DeviceDataResponse = await response.json();
      
      if (result.result_code === "1") {
        const devicePoint = result.result_data?.device_point_list?.[0]?.device_point;
        if (devicePoint) {
          setDeviceData(devicePoint);
          const newPsKey = devicePoint.ps_key;
          setPsKey(newPsKey); // Update context
          console.log('Device data fetched, PS Key:', newPsKey);
          setShowDeviceDetails(true);
          onDeviceDataChange?.(devicePoint);
        } else {
          setError('No device data found for the serial number');
        }
      } else {
        setError(`Device fetch failed: ${result.result_msg}`);
      }
    } catch (err: any) {
      console.error('Device fetch error:', err);
      setError(`Device fetch error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(prev => ({ ...prev, device: false }));
    }
  };

  // Fetch device data by PS Key
  const fetchDeviceDataByPsKey = async () => {
    if (!token) {
      return;
    }

    setLoading(prev => ({ ...prev, device: true }));

    try {
      const response = await fetch('http://localhost:3000/api/solar/inverter-data-by-pskey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          ps_key: psKey
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.result_code === "1") {
          const devicePoint = result.result_data?.device_point;
          setDeviceData(devicePoint);
          onDeviceDataChange?.(devicePoint);
        }
      }
    } catch (err) {
      console.error('Error fetching device data by PS Key:', err);
    } finally {
      setLoading(prev => ({ ...prev, device: false }));
    }
  };

  // Render device details
  const renderDeviceDetails = () => {
    if (!deviceData) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">Device Details</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Serial Number:</span>
            <span className="ml-2 font-medium">{deviceData.device_sn}</span>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <span className={`ml-2 font-medium ${
              deviceData.dev_status === 1 ? 'text-green-600' : 'text-red-600'
            }`}>
              {deviceData.dev_status === 1 ? 'Normal' : 'Fault'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">PS Key:</span>
            <span className="ml-2 font-medium">{deviceData.ps_key}</span>
          </div>
          <div>
            <span className="text-gray-600">Device Type:</span>
            <span className="ml-2 font-medium">{deviceData.dev_type}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Auto Login Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto-login"
            checked={autoLoginEnabled}
            onChange={(e) => setAutoLoginEnabled(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="auto-login" className="text-sm font-medium text-gray-700">
            Auto Login
          </label>
        </div>
        
        <button
          onClick={handleLogin}
          disabled={loading.login}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          {loading.login ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Logging in...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Refresh Token
            </>
          )}
        </button>
      </div>

      {/* Token Status */}
      {token && (
        <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-sm font-medium text-green-900">Logged In</p>
            <p className="text-xs text-green-700 truncate">Token: {token.substring(0, 20)}...</p>
          </div>
        </div>
      )}

      {/* Device Configuration */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Serial Number
            </div>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
              placeholder="Enter device serial number"
            />
            <button
              onClick={() => fetchDeviceDataBySerial()}
              disabled={loading.device || !token}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm ${
                loading.device || !token
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading.device ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
              Fetch
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter inverter serial number to fetch PS Key automatically
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              PS Key
            </div>
          </label>
          <input
            type="text"
            value={psKey || ''}
            onChange={(e) => setPsKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
            placeholder="Enter PS Key"
          />
          <p className="text-xs text-gray-500 mt-1">
            Current: {psKey || 'Not set'} • Auto-updated from serial number
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium text-sm">Error</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Device Details */}
      {deviceData && (
        <>
          <button
            onClick={() => setShowDeviceDetails(!showDeviceDetails)}
            className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center gap-2"
          >
            {showDeviceDetails ? 'Hide' : 'Show'} Device Details
          </button>
          {showDeviceDetails && renderDeviceDetails()}
        </>
      )}
    </div>
  );
};

export default AutoLogin;