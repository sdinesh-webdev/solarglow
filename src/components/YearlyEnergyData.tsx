// components/YearlyEnergyData.tsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, RefreshCw, Download, 
  TrendingUp, Battery, AlertCircle, CheckCircle,
  ChevronRight, Zap, ExternalLink
} from 'lucide-react';

interface YearlyDataResponse {
  req_serial_num: string;
  result_code: string;
  result_msg: string;
  result_data: {
    [ps_key: string]: {
      [data_point: string]: Array<{
        [key: string]: string;
        time_stamp: string;
      }>;
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

const YearlyEnergyData: React.FC = () => {
  // State management
  const [loginData, setLoginData] = useState<LoginResponse | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyDataResponse | null>(null);
  const [loading, setLoading] = useState({
    login: false,
    data: false
  });
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    ps_key_list: ['1589518_1_1_1'],
    data_point: 'p2',
    start_time: '2022',
    end_time: '2025',
    data_type: '2',
    query_type: '3',
    order: '0'
  });

  // UI states
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showRawJson, setShowRawJson] = useState(false);

  // Login on component mount
  useEffect(() => {
    handleLogin();
  }, []);

  // Handle login
  const handleLogin = async () => {
    setLoading(prev => ({ ...prev, login: true }));
    setError(null);

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
      console.log('Login successful for yearly data');
      
    } catch (err: any) {
      setError(err.message);
      console.error('Login error:', err);
    } finally {
      setLoading(prev => ({ ...prev, login: false }));
    }
  };

  // Fetch yearly data
  const fetchYearlyData = async () => {
    if (!loginData?.result_data?.token) {
      setError('Please login first');
      return;
    }

    setLoading(prev => ({ ...prev, data: true }));
    setError(null);

    try {
      const requestBody = {
        token: loginData.result_data.token,
        ps_key_list: formData.ps_key_list,
        data_point: formData.data_point,
        start_time: formData.start_time,
        end_time: formData.end_time,
        data_type: formData.data_type,
        query_type: formData.query_type,
        order: formData.order
      };

      console.log('Fetching yearly data with:', requestBody);

      const response = await fetch('http://localhost:3000/api/solar/historical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data: YearlyDataResponse = await response.json();
      
      if (!response.ok || data.result_code !== "1") {
        throw new Error(data.result_msg || 'Failed to fetch yearly data');
      }

      setYearlyData(data);
      console.log('Yearly data fetched:', data);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Yearly data error:', err);
    } finally {
      setLoading(prev => ({ ...prev, data: false }));
    }
  };

  // Format yearly data for display
  const formatYearlyData = () => {
    if (!yearlyData) return [];
    
    const psKey = Object.keys(yearlyData.result_data)[0];
    if (!psKey) return [];
    
    const dataPoint = Object.keys(yearlyData.result_data[psKey])[0];
    const dataArray = yearlyData.result_data[psKey][dataPoint];
    
    return dataArray.map(item => {
      const year = item.time_stamp;
      const valueKey = Object.keys(item).find(key => key !== 'time_stamp');
      const value = valueKey ? parseFloat(item[valueKey]) : 0;
      
      return {
        year,
        value,
        formattedValue: value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        rawValue: item[valueKey || '']
      };
    });
  };

  // Calculate statistics
  const calculateStats = () => {
    const data = formatYearlyData();
    if (data.length === 0) return null;
    
    const values = data.map(d => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxYear = data.find(d => d.value === max)?.year;
    const minYear = data.find(d => d.value === min)?.year;
    
    return { sum, avg, max, min, maxYear, minYear, count: values.length };
  };

  // Export data as CSV
  const exportToCSV = () => {
    const data = formatYearlyData();
    const headers = ['Year', 'Energy (Wh)', 'Raw Value'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => `${row.year},${row.value},${row.rawValue}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yearly-energy-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Get data point label
  const getDataPointLabel = (point: string) => {
    const labels: { [key: string]: string } = {
      p1: 'Total Power',
      p2: 'Total Energy',
      p14: 'Grid Voltage',
      p21: 'Output Current',
      p24: 'Output Power',
      p25: 'Temperature',
      p87: 'Today Energy'
    };
    return labels[point] || point;
  };

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ps_key_list' ? [value] : value
    }));
  };

  const stats = calculateStats();
  const yearlyDataArray = formatYearlyData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Yearly Energy Analytics
              </h1>
              <p className="text-gray-600 mt-2">Annual energy production analysis and trends</p>
            </div>
            
            {loginData && (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-medium">
                  {loginData.result_data?.user_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{loginData.result_data?.user_name}</p>
                  <p className="text-xs text-gray-500">Logged in</p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Device</span>
              <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                {formData.ps_key_list[0]}
              </span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Period</span>
              <span className="text-sm text-gray-900">
                {formData.start_time} - {formData.end_time}
              </span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Battery className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Parameter</span>
              <span className="text-sm text-gray-900">{getDataPointLabel(formData.data_point)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Configuration Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Data Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PS Key
                  </label>
                  <input
                    type="text"
                    name="ps_key_list"
                    value={formData.ps_key_list[0]}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Enter PS Key"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Year
                    </label>
                    <input
                      type="number"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      min="2000"
                      max="2100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Year
                    </label>
                    <input
                      type="number"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      min="2000"
                      max="2100"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Point
                  </label>
                  <select
                    name="data_point"
                    value={formData.data_point}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="p2">p2 - Total Energy (Wh)</option>
                    <option value="p1">p1 - Total Power (W)</option>
                    <option value="p14">p14 - Grid Voltage (V)</option>
                    <option value="p21">p21 - Output Current (A)</option>
                    <option value="p24">p24 - Output Power (W)</option>
                    <option value="p25">p25 - Temperature (°C)</option>
                    <option value="p87">p87 - Today Energy (Wh)</option>
                  </select>
                </div>
              </div>

              {/* Fetch Button */}
              <button
                onClick={fetchYearlyData}
                disabled={loading.data || !loginData}
                className={`w-full mt-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  loading.data || !loginData
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {loading.data ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Fetching Data...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Load Yearly Data
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleLogin}
                  disabled={loading.login}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  <span className="font-medium text-gray-700">Re-authenticate</span>
                  <RefreshCw className={`w-4 h-4 ${loading.login ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={exportToCSV}
                  disabled={!yearlyData}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition"
                >
                  <span className="font-medium text-gray-700">Export as CSV</span>
                  <Download className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition"
                >
                  <span className="font-medium text-gray-700">{showRawJson ? 'Hide' : 'Show'} Raw JSON</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showRawJson ? 'rotate-90' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Data Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics Summary */}
            {yearlyData && stats && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  Yearly Energy Summary
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Years Analyzed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
                    <p className="text-xs text-gray-500">
                      {formData.start_time} - {formData.end_time}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Energy</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(stats.sum / 1000).toFixed(1)} kWh
                    </p>
                    <p className="text-xs text-gray-500">{stats.sum.toLocaleString()} Wh</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Average per Year</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(stats.avg / 1000).toFixed(1)} kWh
                    </p>
                    <p className="text-xs text-gray-500">Annual average</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Peak Year</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.maxYear}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(stats.max / 1000).toFixed(1)} kWh
                    </p>
                  </div>
                </div>
                
                {/* Year Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Year for Details
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {yearlyDataArray.map((item) => (
                      <button
                        key={item.year}
                        onClick={() => setSelectedYear(item.year)}
                        className={`px-4 py-2 rounded-lg border transition ${
                          selectedYear === item.year
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {item.year}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Data Table */}
            {yearlyData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Yearly Energy Data (Wh)
                  </h3>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {yearlyDataArray.length} years
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50 rounded-l-lg">
                          Year
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">
                          Energy (Wh)
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">
                          Energy (kWh)
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50 rounded-r-lg">
                          Trend
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearlyDataArray.map((item, index) => {
                        const kWh = (item.value / 1000).toFixed(2);
                        const prevValue = index > 0 ? yearlyDataArray[index - 1].value : null;
                        const trend = prevValue 
                          ? ((item.value - prevValue) / prevValue * 100).toFixed(1)
                          : null;
                        
                        return (
                          <tr 
                            key={item.year}
                            className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                              selectedYear === item.year ? 'bg-blue-50' : ''
                            }`}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{item.year}</p>
                                  <p className="text-xs text-gray-500">Calendar Year</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-bold text-gray-900 text-lg">
                                {item.formattedValue}
                              </p>
                              <p className="text-sm text-gray-500">Watt-hours</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-bold text-green-700 text-lg">
                                {kWh}
                              </p>
                              <p className="text-sm text-gray-500">Kilowatt-hours</p>
                            </td>
                            <td className="py-4 px-4">
                              {trend && (
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                                  parseFloat(trend) > 0
                                    ? 'bg-green-100 text-green-800'
                                    : parseFloat(trend) < 0
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  <TrendingUp className={`w-4 h-4 mr-1 ${
                                    parseFloat(trend) > 0 ? 'text-green-600' : 'text-red-600'
                                  }`} />
                                  {trend}%
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Selected Year Details */}
                {selectedYear && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Details for {selectedYear}</h4>
                    {yearlyDataArray.find(item => item.year === selectedYear) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Energy Production</p>
                          <p className="font-bold text-gray-900">
                            {yearlyDataArray.find(item => item.year === selectedYear)?.formattedValue} Wh
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">In Kilowatt-hours</p>
                          <p className="font-bold text-green-700">
                            {((yearlyDataArray.find(item => item.year === selectedYear)?.value || 0) / 1000).toFixed(2)} kWh
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Daily Average</p>
                          <p className="font-bold text-gray-900">
                            {((yearlyDataArray.find(item => item.year === selectedYear)?.value || 0) / 365).toFixed(0)} Wh/day
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Raw Value</p>
                          <p className="font-mono text-sm text-gray-600">
                            {yearlyDataArray.find(item => item.year === selectedYear)?.rawValue}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Raw JSON Display */}
            {showRawJson && yearlyData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Raw JSON Response</h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(yearlyData, null, 2))}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                  >
                    Copy JSON
                  </button>
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                  {JSON.stringify(yearlyData, null, 2)}
                </pre>
              </div>
            )}

            {/* Empty State */}
            {!yearlyData && !loading.data && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Yearly Data Loaded</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Configure your parameters and click "Load Yearly Data" to analyze annual energy production
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Set year range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Ensure logged in</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Load data</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Yearly Energy Analytics • API Integration • Powered by RBP India Solar Solutions</p>
          <p className="mt-1">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

// Add missing Settings icon component
const Settings = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default YearlyEnergyData;