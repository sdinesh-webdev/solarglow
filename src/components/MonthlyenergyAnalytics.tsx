// components/MonthlyEnergyAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  Legend, ReferenceLine, Brush
} from 'recharts';
import { 
  BarChart3, Calendar, RefreshCw, Download, 
  TrendingUp, Battery, AlertCircle, CheckCircle,
  ChevronRight, Zap, ExternalLink, PieChart,
  ChevronLeft, ChevronDown, Filter, LineChart as LineChartIcon,
  DollarSign, Activity, Thermometer, Gauge,
  ChevronUp, Maximize2, Minimize2
} from 'lucide-react';

interface MonthlyDataResponse {
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

interface MonthlyDataItem {
  month: string;
  year: string;
  monthNum: number;
  value: number;
  formattedValue: string;
  rawValue: string;
  monthName: string;
  date: string;
  shortDate: string;
  kwhValue: number;
}

const MonthlyEnergyAnalytics: React.FC = () => {
  // State management
  const [loginData, setLoginData] = useState<LoginResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataResponse | null>(null);
  const [loading, setLoading] = useState({
    login: false,
    data: false
  });
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    ps_key: '1589518_1_1_1',
    data_point: 'p2',
    start_year: '2025',
    start_month: '01',
    end_year: '2025',
    end_month: '12',
    data_type: '2',
    query_type: '2',
    order: '0'
  });

  // UI states
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showRawJson, setShowRawJson] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [activeView, setActiveView] = useState<'table' | 'chart'>('table');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isChartFullScreen, setIsChartFullScreen] = useState(false);

  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const shortMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

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
      console.log('Login successful for monthly data');
      
    } catch (err: any) {
      setError(err.message);
      console.error('Login error:', err);
    } finally {
      setLoading(prev => ({ ...prev, login: false }));
    }
  };

  // Fetch monthly data
  const fetchMonthlyData = async () => {
    if (!loginData?.result_data?.token) {
      setError('Please login first');
      return;
    }

    setLoading(prev => ({ ...prev, data: true }));
    setError(null);

    try {
      const startTime = `${formData.start_year}${formData.start_month}`;
      const endTime = `${formData.end_year}${formData.end_month}`;

      const requestBody = {
        token: loginData.result_data.token,
        ps_key_list: [formData.ps_key],
        data_point: formData.data_point,
        start_time: startTime,
        end_time: endTime,
        data_type: formData.data_type,
        query_type: formData.query_type,
        order: formData.order
      };

      console.log('Fetching monthly data with:', requestBody);

      const response = await fetch('http://localhost:3000/api/solar/historical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data: MonthlyDataResponse = await response.json();
      
      if (!response.ok || data.result_code !== "1") {
        throw new Error(data.result_msg || 'Failed to fetch monthly data');
      }

      setMonthlyData(data);
      console.log('Monthly data fetched:', data);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Monthly data error:', err);
    } finally {
      setLoading(prev => ({ ...prev, data: false }));
    }
  };

  // Format monthly data for display and chart
  const formatMonthlyData = (): MonthlyDataItem[] => {
    if (!monthlyData) return [];
    
    const psKey = Object.keys(monthlyData.result_data)[0];
    if (!psKey) return [];
    
    const dataPoint = Object.keys(monthlyData.result_data[psKey])[0];
    const dataArray = monthlyData.result_data[psKey][dataPoint];
    
    return dataArray.map(item => {
      const timestamp = item.time_stamp;
      const year = timestamp.slice(0, 4);
      const monthNum = parseInt(timestamp.slice(4, 6));
      const valueKey = Object.keys(item).find(key => key !== 'time_stamp');
      const value = valueKey ? parseFloat(item[valueKey]) : 0;
      
      return {
        month: timestamp,
        year,
        monthNum,
        value,
        formattedValue: value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        rawValue: item[valueKey || ''],
        monthName: monthNames[monthNum - 1],
        date: `${shortMonthNames[monthNum - 1]} ${year}`,
        shortDate: `${shortMonthNames[monthNum - 1]} '${year.slice(2)}`,
        kwhValue: value / 1000
      };
    }).sort((a, b) => {
      // Sort by year and month
      if (a.year !== b.year) return parseInt(a.year) - parseInt(b.year);
      return a.monthNum - b.monthNum;
    });
  };

  // Format data for chart specifically
  const formatChartData = () => {
    const data = formatMonthlyData();
    return data.map(item => ({
      ...item,
      name: item.shortDate,
      energy: item.value,
      kWh: item.kwhValue,
      monthIndex: parseInt(item.year) * 12 + item.monthNum // For sorting
    })).sort((a, b) => a.monthIndex - b.monthIndex);
  };

  // Calculate statistics
  const calculateStats = () => {
    const data = formatMonthlyData();
    if (data.length === 0) return null;
    
    const values = data.map(d => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxMonth = data.find(d => d.value === max);
    const minMonth = data.find(d => d.value === min);
    
    // Calculate monthly growth
    const monthlyGrowth = data.length > 1 
      ? ((data[data.length - 1].value - data[data.length - 2].value) / data[data.length - 2].value * 100)
      : 0;
    
    // Calculate trend line (simple linear regression)
    let trendSlope = 0;
    if (data.length > 1) {
      const xValues = data.map((_, i) => i);
      const yValues = data.map(d => d.value);
      const n = xValues.length;
      
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
      
      trendSlope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }
    
    return { 
      sum, 
      avg, 
      max, 
      min, 
      maxMonth: maxMonth ? `${maxMonth.monthName} ${maxMonth.year}` : '',
      minMonth: minMonth ? `${minMonth.monthName} ${minMonth.year}` : '',
      count: values.length,
      monthlyGrowth: monthlyGrowth.toFixed(1),
      trendSlope: (trendSlope * 100).toFixed(2) // Convert to percentage
    };
  };

  // Export data as CSV
  const exportToCSV = () => {
    const data = formatMonthlyData();
    const headers = ['Year', 'Month', 'Energy (Wh)', 'Energy (kWh)', 'Raw Value'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => `${row.year},${row.monthName},${row.value},${row.kwhValue.toFixed(2)},${row.rawValue}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-energy-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Get data point label and icon
  const getDataPointConfig = (point: string) => {
    const configs = {
      p1: { label: 'Total Power', unit: 'W', icon: Zap, color: '#3B82F6' },
      p2: { label: 'Total Energy', unit: 'Wh', icon: Battery, color: '#10B981' },
      p14: { label: 'Grid Voltage', unit: 'V', icon: Gauge, color: '#8B5CF6' },
      p21: { label: 'Output Current', unit: 'A', icon: Activity, color: '#F59E0B' },
      p24: { label: 'Output Power', unit: 'W', icon: Zap, color: '#EF4444' },
      p25: { label: 'Temperature', unit: '°C', icon: Thermometer, color: '#EC4899' },
      p87: { label: 'Today Energy', unit: 'Wh', icon: Battery, color: '#06B6D4' }
    };
    return configs[point as keyof typeof configs] || { label: point, unit: '', icon: Activity, color: '#6B7280' };
  };

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, '0'),
    label: monthNames[i]
  }));

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => ({
    value: (currentYear - 5 + i).toString(),
    label: (currentYear - 5 + i).toString()
  }));

  const stats = calculateStats();
  const monthlyDataArray = formatMonthlyData();
  const chartData = formatChartData();
  const dataPointConfig = getDataPointConfig(formData.data_point);
  const IconComponent = dataPointConfig.icon;

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.monthName} {data.year}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-gray-600">Energy: </span>
              <span className="font-semibold text-gray-900">{data.value.toLocaleString()} {dataPointConfig.unit}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">In kWh: </span>
              <span className="font-semibold text-green-600">{data.kwhValue.toFixed(2)} kWh</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">Click for more details</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Chart component
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No data available for chart</p>
            <p className="text-sm text-gray-400 mt-2">Load data to visualize trends</p>
          </div>
        </div>
      );
    }

    const chartHeight = isChartFullScreen ? '70vh' : '500px';

    return (
      <div className={`relative ${isChartFullScreen ? 'fixed inset-0 z-50 bg-white p-8' : ''}`}>
        {isChartFullScreen && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setIsChartFullScreen(false)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <div style={{ height: chartHeight, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                onClick={(data) => {
                  if (data && data.activePayload) {
                    setSelectedMonth(data.activePayload[0].payload.month);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="shortDate" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => value.toLocaleString()}
                  label={{ 
                    value: `Energy (${dataPointConfig.unit})`, 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 10,
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="energy" 
                  name={`Energy (${dataPointConfig.unit})`}
                  fill={dataPointConfig.color}
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.8}
                />
                <ReferenceLine 
                  y={stats?.avg} 
                  stroke="#666" 
                  strokeDasharray="3 3"
                  label={{ 
                    value: `Avg: ${stats?.avg.toLocaleString(undefined, {maximumFractionDigits: 0})}`, 
                    position: 'right',
                    fill: '#666',
                    fontSize: 12
                  }}
                />
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                onClick={(data) => {
                  if (data && data.activePayload) {
                    setSelectedMonth(data.activePayload[0].payload.month);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="shortDate" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => value.toLocaleString()}
                  label={{ 
                    value: `Energy (${dataPointConfig.unit})`, 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 10,
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="energy" 
                  name={`Energy (${dataPointConfig.unit})`}
                  stroke={dataPointConfig.color}
                  strokeWidth={3}
                  dot={{ stroke: dataPointConfig.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 8, strokeWidth: 2 }}
                />
                {stats && (
                  <ReferenceLine 
                    y={stats.avg} 
                    stroke="#666" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: `Avg: ${stats.avg.toLocaleString(undefined, {maximumFractionDigits: 0})}`, 
                      position: 'right',
                      fill: '#666',
                      fontSize: 12
                    }}
                  />
                )}
              </LineChart>
            ) : (
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                onClick={(data) => {
                  if (data && data.activePayload) {
                    setSelectedMonth(data.activePayload[0].payload.month);
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={dataPointConfig.color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={dataPointConfig.color} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="shortDate" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => value.toLocaleString()}
                  label={{ 
                    value: `Energy (${dataPointConfig.unit})`, 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 10,
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="energy" 
                  name={`Energy (${dataPointConfig.unit})`}
                  stroke={dataPointConfig.color}
                  strokeWidth={2}
                  fill="url(#colorEnergy)"
                />
                {stats && (
                  <ReferenceLine 
                    y={stats.avg} 
                    stroke="#666" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: `Avg: ${stats.avg.toLocaleString(undefined, {maximumFractionDigits: 0})}`, 
                      position: 'right',
                      fill: '#666',
                      fontSize: 12
                    }}
                  />
                )}
                <Brush dataKey="shortDate" height={30} stroke={dataPointConfig.color} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Chart controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Chart Type:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  chartType === 'bar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Bar
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  chartType === 'line'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LineChartIcon className="w-4 h-4" />
                Line
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  chartType === 'area'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Area
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsChartFullScreen(!isChartFullScreen)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-1.5"
            >
              {isChartFullScreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  Fullscreen
                </>
              )}
            </button>
            
            <button
              onClick={exportToCSV}
              disabled={!monthlyData}
              className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>
        
        {/* Chart insights */}
        {stats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Peak Month</p>
              <p className="font-semibold text-gray-900">{stats.maxMonth}</p>
              <p className="text-sm text-green-600">{(stats.max / 1000).toFixed(1)} kWh</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Monthly Average</p>
              <p className="font-semibold text-gray-900">{(stats.avg / 1000).toFixed(1)} kWh</p>
              <p className="text-sm text-gray-600">per month</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Total Production</p>
              <p className="font-semibold text-gray-900">{(stats.sum / 1000).toFixed(1)} kWh</p>
              <p className="text-sm text-gray-600">{stats.count} months</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Trend</p>
              <p className={`font-semibold ${parseFloat(stats.trendSlope) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(stats.trendSlope) > 0 ? '↗' : '↘'} {stats.trendSlope}%
              </p>
              <p className="text-sm text-gray-600">per month trend</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isChartFullScreen ? 'overflow-hidden' : 'bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6'}`}>
      {!isChartFullScreen && (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                  Monthly Energy Analytics
                </h1>
                <p className="text-gray-600 mt-2">Detailed monthly energy production analysis and trends</p>
              </div>
              
              <div className="flex items-center gap-3">
                {loginData && (
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {loginData.result_data?.user_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-900">{loginData.result_data?.user_name}</p>
                      <p className="text-xs text-gray-500">Logged in</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                )}
                
                <button
                  onClick={handleLogin}
                  disabled={loading.login}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading.login ? 'animate-spin' : ''}`} />
                  {loading.login ? 'Logging in...' : 'Refresh Token'}
                </button>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Device</span>
                <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                  {formData.ps_key}
                </span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Period</span>
                <span className="text-sm text-gray-900">
                  {monthNames[parseInt(formData.start_month) - 1]} {formData.start_year} - {monthNames[parseInt(formData.end_month) - 1]} {formData.end_year}
                </span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <IconComponent className="w-4 h-4" style={{ color: dataPointConfig.color }} />
                <span className="text-sm font-medium text-gray-700">Parameter</span>
                <span className="text-sm text-gray-900">{dataPointConfig.label}</span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Activity className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Data Points</span>
                <span className="text-sm text-gray-900">{monthlyDataArray.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Panel - Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Configuration Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  Data Configuration
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PS Key
                    </label>
                    <input
                      type="text"
                      name="ps_key"
                      value={formData.ps_key}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter PS Key"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Month
                      </label>
                      <select
                        name="start_month"
                        value={formData.start_month}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        {monthOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Year
                      </label>
                      <select
                        name="start_year"
                        value={formData.start_year}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        {yearOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Month
                      </label>
                      <select
                        name="end_month"
                        value={formData.end_month}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        {monthOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Year
                      </label>
                      <select
                        name="end_year"
                        value={formData.end_year}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        {yearOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
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

                {/* Advanced Settings */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-2"
                >
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Advanced Settings
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Type
                      </label>
                      <select
                        name="data_type"
                        value={formData.data_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        <option value="2">Peak Values</option>
                        <option value="4">Total Values</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sort Order
                      </label>
                      <select
                        name="order"
                        value={formData.order}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        <option value="0">Ascending (Oldest First)</option>
                        <option value="1">Descending (Newest First)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Fetch Button */}
                <button
                  onClick={fetchMonthlyData}
                  disabled={loading.data || !loginData}
                  className={`w-full mt-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    loading.data || !loginData
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
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
                      Load Monthly Data
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

              {/* Quick Stats */}
              {stats && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Months Analyzed</span>
                      <span className="font-semibold text-gray-900">{stats.count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Energy</span>
                      <span className="font-semibold text-gray-900">{(stats.sum / 1000).toFixed(1)} kWh</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monthly Average</span>
                      <span className="font-semibold text-gray-900">{(stats.avg / 1000).toFixed(1)} kWh</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Peak Month</span>
                      <span className="font-semibold text-gray-900">{stats.maxMonth}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Growth</span>
                      <span className={`font-semibold ${parseFloat(stats.monthlyGrowth) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.monthlyGrowth}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* View Toggle */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-blue-600" />
                      Monthly Energy Analytics
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {monthlyDataArray.length} months of data • {dataPointConfig.label}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setActiveView('table')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                          activeView === 'table'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Table View
                      </button>
                      <button
                        onClick={() => setActiveView('chart')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                          activeView === 'chart'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Chart View
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Display */}
              {activeView === 'table' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50 rounded-l-lg">
                            Month
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">
                            Energy ({dataPointConfig.unit})
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">
                            In kWh
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50 rounded-r-lg">
                            Trend
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyDataArray.map((item, index) => {
                          const prevValue = index > 0 ? monthlyDataArray[index - 1].value : null;
                          const trend = prevValue 
                            ? ((item.value - prevValue) / prevValue * 100).toFixed(1)
                            : null;
                          
                          return (
                            <tr 
                              key={item.month}
                              className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                                selectedMonth === item.month ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => setSelectedMonth(item.month)}
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-600">
                                      {shortMonthNames[item.monthNum - 1]}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{item.monthName}</p>
                                    <p className="text-sm text-gray-500">{item.year}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <p className="font-bold text-gray-900 text-lg">
                                  {item.formattedValue}
                                </p>
                                <p className="text-sm text-gray-500">{dataPointConfig.unit}</p>
                              </td>
                              <td className="py-4 px-4">
                                <p className="font-bold text-green-700 text-lg">
                                  {item.kwhValue.toFixed(2)}
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
                </div>
              ) : (
                renderChart()
              )}

              {/* Selected Month Details */}
              {selectedMonth && monthlyDataArray.find(item => item.month === selectedMonth) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Details for {monthlyDataArray.find(item => item.month === selectedMonth)?.monthName} {monthlyDataArray.find(item => item.month === selectedMonth)?.year}
                    </h3>
                    <button
                      onClick={() => setSelectedMonth('')}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Energy Production</p>
                      <p className="text-xl font-bold text-gray-900">
                        {monthlyDataArray.find(item => item.month === selectedMonth)?.formattedValue} {dataPointConfig.unit}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">In Kilowatt-hours</p>
                      <p className="text-xl font-bold text-green-700">
                        {monthlyDataArray.find(item => item.month === selectedMonth)?.kwhValue.toFixed(2)} kWh
                      </p>
                    </div>
                    
                    <div className="bg-amber-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Daily Average</p>
                      <p className="text-xl font-bold text-amber-700">
                        {((monthlyDataArray.find(item => item.month === selectedMonth)?.value || 0) / 30).toFixed(0)} {dataPointConfig.unit}/day
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Raw Value</p>
                      <p className="font-mono text-sm text-gray-600 break-all">
                        {monthlyDataArray.find(item => item.month === selectedMonth)?.rawValue}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw JSON Display */}
              {monthlyData && !isChartFullScreen && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <button
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <code className="text-sm font-medium">{"{}"}</code>
                      </div>
                      <span className="font-medium text-gray-700">Raw JSON Response</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showRawJson ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {showRawJson && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">API Response Data</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(JSON.stringify(monthlyData, null, 2))}
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          Copy JSON
                        </button>
                      </div>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                        {JSON.stringify(monthlyData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!monthlyData && !loading.data && !isChartFullScreen && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Monthly Data Loaded</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Configure your parameters and click "Load Monthly Data" to analyze monthly energy production
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Set date range</span>
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
            <p>Monthly Energy Analytics • Real-time Data • Powered by RBP India Solar Solutions</p>
            <p className="mt-1">Data updates on request • {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      )}
      
      {isChartFullScreen && renderChart()}
    </div>
  );
};

export default MonthlyEnergyAnalytics;