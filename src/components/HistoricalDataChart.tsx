// components/HistoricalDataChart.tsx - Updated with professional UI and date picker
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { useDeviceContext } from '../context/DeviceContext';
import { Calendar, TrendingUp, BarChart3, Activity } from 'lucide-react';

interface HistoricalDataPoint {
  [key: string]: string;
  time_stamp: string;
}

interface HistoricalDataResponse {
  req_serial_num: string;
  result_code: string;
  result_msg: string;
  result_data: {
    [ps_key: string]: {
      [data_point: string]: HistoricalDataPoint[];
    };
  };
}

interface LoginResponse {
  result_code: string;
  result_msg: string;
  result_data: {
    token: string;
    user_name: string;
    email: string;
    [key: string]: any;
  } | null;
}

const HistoricalDataChart: React.FC = () => {
  const { psKey } = useDeviceContext();

  // Login states
  const [loginData, setLoginData] = useState<LoginResponse | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Historical data states
  const [historicalData, setHistoricalData] = useState<HistoricalDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    ps_key_list: psKey || '',
    data_point: 'p2',
    start_time: '',
    end_time: '',
    data_type: '2',
    query_type: '1',
    order: '0'
  });

  // Calendar states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');

  // Update formData when psKey changes
  useEffect(() => {
    if (psKey) {
      setFormData(prev => ({
        ...prev,
        ps_key_list: psKey
      }));
    }
  }, [psKey]);

  // Initialize dates on component mount
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const formatDateForDisplay = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    setStartDate(formatDateForDisplay(sevenDaysAgo));
    setEndDate(formatDateForDisplay(today));
    
    setFormData(prev => ({
      ...prev,
      start_time: formatDateForAPI(sevenDaysAgo, 'day'),
      end_time: formatDateForAPI(today, 'day')
    }));
  }, []);

  // Format date for API based on query_type
  const formatDateForAPI = (date: Date, queryType: string): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    switch (queryType) {
      case '1': return `${year}${month}${day}`;
      case '2': return `${year}${month}`;
      case '3': return `${year}`;
      default: return `${year}${month}${day}`;
    }
  };

  // Format date from API for display
  const formatDateFromAPI = (dateStr: string, queryType: string): string => {
    switch (queryType) {
      case '1': return `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
      case '2': return `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}`;
      case '3': return dateStr;
      default: return dateStr;
    }
  };

  // Handle date changes and update formData
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      setFormData(prev => ({
        ...prev,
        start_time: formatDateForAPI(start, formData.query_type),
        end_time: formatDateForAPI(end, formData.query_type)
      }));
    }
  }, [startDate, endDate, formData.query_type]);

  // Set current date as end time
  const setEndToToday = () => {
    const today = new Date();
    const formatForDisplay = (date: Date) => date.toISOString().split('T')[0];
    setEndDate(formatForDisplay(today));
  };

  // Calculate date ranges
  const setDateRange = (range: 'week' | 'month' | 'year' | '3months' | '6months') => {
    const today = new Date();
    const start = new Date();
    
    switch (range) {
      case 'week': start.setDate(today.getDate() - 7); break;
      case 'month': start.setMonth(today.getMonth() - 1); break;
      case '3months': start.setMonth(today.getMonth() - 3); break;
      case '6months': start.setMonth(today.getMonth() - 6); break;
      case 'year': start.setFullYear(today.getFullYear() - 1); break;
    }
    
    const formatForDisplay = (date: Date) => date.toISOString().split('T')[0];
    setStartDate(formatForDisplay(start));
    setEndDate(formatForDisplay(today));
  };

  // Set query type and update dates accordingly
  const setQueryType = (type: '1' | '2' | '3') => {
    setFormData(prev => ({
      ...prev,
      query_type: type,
      data_type: type === '1' ? '2' : '4'
    }));
    
    const today = new Date();
    const start = new Date();
    
    switch (type) {
      case '1': start.setDate(today.getDate() - 7); break;
      case '2': start.setMonth(today.getMonth() - 6); break;
      case '3': start.setFullYear(today.getFullYear() - 3); break;
    }
    
    const formatForDisplay = (date: Date) => date.toISOString().split('T')[0];
    setStartDate(formatForDisplay(start));
    setEndDate(formatForDisplay(today));
  };

  // Perform login on component mount
  useEffect(() => {
    handleLogin();
  }, []);

  // Handle login
  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await fetch('http://localhost:3000/api/solar/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_account: 'sahoo@rbpindia.com',
          user_password: 'rbpindia@2025'
        })
      });

      const data: LoginResponse = await response.json();
      
      if (!response.ok || data.result_code !== "1") {
        throw new Error(data.result_msg || 'Login failed');
      }

      setLoginData(data);
      console.log('Login successful');
      console.log('Using ps_key from context:', psKey);
      
    } catch (err: any) {
      setLoginError(err.message);
      console.error('Login error:', err);
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch historical data
  const fetchHistoricalData = async () => {
    if (!loginData?.result_data?.token) {
      setError('Please login first');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (formData.query_type === '1' && daysDiff > 100) {
      setError('Daily data queries are limited to 100 days maximum');
      return;
    }
    if (formData.query_type === '2' && daysDiff > 24 * 30) {
      setError('Monthly data queries are limited to 24 months maximum');
      return;
    }
    if (formData.query_type === '3' && daysDiff > 5 * 365) {
      setError('Yearly data queries are limited to 5 years maximum');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestBody: any = {
        token: loginData.result_data.token,
        ps_key_list: formData.ps_key_list.split(',').map(s => s.trim()),
        data_point: formData.data_point,
        start_time: formData.start_time,
        end_time: formData.end_time,
        data_type: formData.data_type,
        query_type: formData.query_type,
        order: formData.order
      };

      console.log('Sending request with:', requestBody);

      const response = await fetch('http://localhost:3000/api/solar/historical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data: HistoricalDataResponse = await response.json();
      
      if (!response.ok || data.result_code !== "1") {
        throw new Error(data.result_msg || 'Failed to fetch historical data');
      }

      setHistoricalData(data);
      console.log('Historical data fetched:', data);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Historical data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format data for chart
  const formatChartData = () => {
    if (!historicalData) return [];
    
    const psKey = Object.keys(historicalData.result_data)[0];
    if (!psKey) return [];
    
    const dataPoint = Object.keys(historicalData.result_data[psKey])[0];
    const dataArray = historicalData.result_data[psKey][dataPoint];
    
    return dataArray.map(item => {
      const formattedDate = formatDateFromAPI(item.time_stamp, formData.query_type);
      const valueKey = Object.keys(item).find(key => key !== 'time_stamp');
      const value = valueKey ? parseFloat(item[valueKey]) : 0;
      
      return {
        date: formattedDate,
        value: value,
        rawValue: item[valueKey || ''],
        timestamp: item.time_stamp
      };
    });
  };

  // Get data point label
  const getDataPointLabel = (point: string) => {
    const labels: { [key: string]: string } = {
      p1: 'Total Power (W)',
      p2: 'Total Energy (Wh)',
      p14: 'Grid Voltage (V)',
      p21: 'Output Current (A)',
      p24: 'Output Power (W)',
      p25: 'Temperature (°C)',
      p87: 'Today Energy (Wh)'
    };
    return labels[point] || point;
  };

  // Get query type description
  const getQueryTypeDescription = () => {
    const types: { [key: string]: string } = {
      '1': 'Daily',
      '2': 'Monthly',
      '3': 'Yearly'
    };
    return types[formData.query_type] || 'Unknown';
  };

  // Calculate date range limits
  const getDateRangeLimits = () => {
    switch (formData.query_type) {
      case '1': return 'Max 100 days';
      case '2': return 'Max 24 months';
      case '3': return 'Max 5 years';
      default: return '';
    }
  };

  if (loginLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Logging in...</p>
        </div>
      </div>
    );
  }

  if (loginError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-red-600 text-center mb-4">
            <p className="text-xl font-semibold mb-2">Login Error</p>
            <p className="text-sm">{loginError}</p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Retry Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Historical Energy Data</h1>
          <p className="text-gray-600">Analyze solar energy generation over time</p>
        </div>

        {/* Current PS Key Info */}
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-gray-800 mb-1">Current Device PS Key</p>
          <p className="text-lg font-mono text-green-700">{psKey || 'Not shared yet'}</p>
          <p className="text-xs text-gray-600 mt-1">Automatically synced from DeviceData component</p>
        </div>
        
        {/* User Info */}
        {loginData && (
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Logged in as</p>
                <p className="font-semibold text-gray-800">{loginData.result_data?.user_name}</p>
                <p className="text-sm text-gray-600">{loginData.result_data?.email}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {loginData.result_data?.user_name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Query Type Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={24} className="text-blue-600" />
            Query Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <button 
              onClick={() => setQueryType('1')} 
              className={`p-4 rounded-lg border-2 transition ${
                formData.query_type === '1' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-gray-800">Daily Data</p>
              <p className="text-sm text-gray-600 mt-1">Day-by-day analysis</p>
            </button>
            <button 
              onClick={() => setQueryType('2')} 
              className={`p-4 rounded-lg border-2 transition ${
                formData.query_type === '2' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-gray-800">Monthly Data</p>
              <p className="text-sm text-gray-600 mt-1">Month-by-month trends</p>
            </button>
            <button 
              onClick={() => setQueryType('3')} 
              className={`p-4 rounded-lg border-2 transition ${
                formData.query_type === '3' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-gray-800">Yearly Data</p>
              <p className="text-sm text-gray-600 mt-1">Year-over-year comparison</p>
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Mode:</span>
                <span className="ml-2 font-semibold text-gray-800">{getQueryTypeDescription()}</span>
              </div>
              <div>
                <span className="text-gray-600">Limit:</span>
                <span className="ml-2 font-semibold text-gray-800">{getDateRangeLimits()}</span>
              </div>
              <div>
                <span className="text-gray-600">Data Type:</span>
                <span className="ml-2 font-semibold text-gray-800">
                  {formData.data_type} ({formData.data_type === '2' ? 'Peak' : 'Total'})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Date Range Presets */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Date Ranges</h3>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setDateRange('week')} 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition"
            >
              Last Week
            </button>
            <button 
              onClick={() => setDateRange('month')} 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition"
            >
              Last Month
            </button>
            <button 
              onClick={() => setDateRange('3months')} 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition"
            >
              Last 3 Months
            </button>
            <button 
              onClick={() => setDateRange('6months')} 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition"
            >
              Last 6 Months
            </button>
            <button 
              onClick={() => setDateRange('year')} 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition"
            >
              Last Year
            </button>
            <button 
              onClick={setEndToToday} 
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition"
            >
              Set End to Today
            </button>
          </div>
        </div>

        {/* Professional Date Picker */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar size={24} className="text-blue-600" />
            Date Range Selection
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Start Date */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                />
              </div>
              <p className="text-xs text-gray-500">
                API Format: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{formData.start_time}</span>
              </p>
            </div>
            
            {/* End Date */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                />
              </div>
              <p className="text-xs text-gray-500">
                API Format: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{formData.end_time}</span>
              </p>
            </div>
          </div>

          {/* Data Point Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Data Point
            </label>
            <select
              name="data_point"
              value={formData.data_point}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
            >
              <option value="p1">p1 - Total Power (W)</option>
              <option value="p2">p2 - Total Energy (Wh)</option>
              <option value="p14">p14 - Grid Voltage (V)</option>
              <option value="p21">p21 - Output Current (A)</option>
              <option value="p24">p24 - Output Power (W)</option>
              <option value="p25">p25 - Temperature (°C)</option>
              <option value="p87">p87 - Today Energy (Wh)</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              {getDataPointLabel(formData.data_point)} • Returns {formData.data_type === '2' ? 'peak values' : 'total values'}
            </p>
          </div>

          {/* PS Key and Sort Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                PS Key List
              </label>
              <input
                type="text"
                name="ps_key_list"
                value={formData.ps_key_list}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                placeholder="Enter PS Key"
              />
              <p className="text-xs text-gray-500 mt-2">
                Auto-filled from DeviceData: {psKey ? <span className="font-mono bg-green-100 px-2 py-1 rounded">{psKey}</span> : 'No PS Key shared yet'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
              >
                <option value="0">Ascending (Oldest First)</option>
                <option value="1">Descending (Newest First)</option>
              </select>
            </div>
          </div>
        
          <button
            onClick={fetchHistoricalData}
            disabled={loading || !formData.ps_key_list}
            className={`w-full py-4 rounded-lg font-semibold text-white transition ${
              loading || !formData.ps_key_list
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Fetching Data...
              </span>
            ) : (
              'Fetch Historical Data'
            )}
          </button>
          
          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-800 font-medium">Error: {error}</p>
            </div>
          )}
        </div>

        {/* Chart Display */}
        {historicalData && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BarChart3 size={28} className="text-blue-600" />
                    Historical Data Chart ({getQueryTypeDescription()})
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setChartType('area')} 
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      chartType === 'area' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Area
                  </button>
                  <button 
                    onClick={() => setChartType('line')} 
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      chartType === 'line' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Line
                  </button>
                  <button 
                    onClick={() => setChartType('bar')} 
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      chartType === 'bar' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Bar
                  </button>
                </div>
              </div>
              
              <div style={{ height: '400px' }}>
                {chartType === 'area' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formatChartData()}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : chartType === 'line' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Bar 
                        dataKey="value" 
                        fill="#f59e0b" 
                        fillOpacity={0.8}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            
            {/* Data Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Activity size={24} className="text-blue-600" />
                Data Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Parameter</p>
                  <p className="font-semibold text-gray-800">{getDataPointLabel(formData.data_point)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Query Type</p>
                  <p className="font-semibold text-gray-800">{getQueryTypeDescription()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Data Type</p>
                  <p className="font-semibold text-gray-800">{formData.data_type} ({formData.data_type === '2' ? 'Peak' : 'Total'})</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Period</p>
                  <p className="font-semibold text-gray-800 text-sm">{formatDateFromAPI(formData.start_time, formData.query_type)} to {formatDateFromAPI(formData.end_time, formData.query_type)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Data Points</p>
                  <p className="font-semibold text-gray-800">{formatChartData().length}</p>
                </div>
                {formData.data_type === '2' && (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Total Sum</p>
                      <p className="font-semibold text-gray-800">{formatChartData().reduce((sum, item) => sum + item.value, 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Average Value</p>
                      <p className="font-semibold text-gray-800">
                        {formatChartData().length > 0 
                          ? (formatChartData().reduce((sum, item) => sum + item.value, 0) / formatChartData().length).toFixed(2)
                          : '0'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              {formData.data_type === '4' && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Total Values:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {formatChartData().map((item, index) => (
                      <div key={index} className="text-sm">
                        <span className="text-gray-600">{item.date}:</span>
                        <span className="ml-1 font-semibold text-gray-800">{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Raw Data Table */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Raw Data</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-200">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Raw Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formatChartData().map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-800">{item.date}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">{item.value}</td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">{item.rawValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* JSON Response */}
            <details className="bg-white rounded-xl shadow-sm p-6">
              <summary className="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition">
                View Raw JSON Response
              </summary>
              <pre className="mt-4 bg-gray-900 text-green-400 p-6 rounded-lg overflow-auto max-h-96 text-sm">
                {JSON.stringify(historicalData, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalDataChart;