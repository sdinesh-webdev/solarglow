// components/CumulativeEnergyDisplay.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  Legend, ReferenceLine, Brush
} from 'recharts';
import {
  BarChart3, Calendar, RefreshCw, Download,
  TrendingUp, Battery, AlertCircle, CheckCircle,
  ChevronRight, Zap, Filter, LineChart as LineChartIcon,
  Activity, Thermometer, Gauge,
  ChevronUp, ChevronDown, Maximize2, Minimize2, ArrowRight
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

interface CumulativeDataItem {
  month: string;
  year: string;
  monthNum: number;
  cumulativeWh: number; // Original API value in Wh
  cumulativeKwh: number; // Converted to kWh (Wh ÷ 1000)
  formattedCumulativeKwh: string;
  formattedCumulativeWh: string;
  rawValue: string;
  monthName: string;
  date: string;
  shortDate: string;
}

interface MonthlyDataItem {
  time_stamp: string;
  monthly_energy_kwh: number;
  monthName: string;
  shortDate: string;
  year: string;
  monthNum: number;
  cumulativeKwh: number; // Keep for reference
}

const CumulativeEnergyDisplay: React.FC = () => {
  // State management
  const [loginData, setLoginData] = useState<LoginResponse | null>(null);
  const [energyData, setEnergyData] = useState<MonthlyDataResponse | null>(null);
  const [loading, setLoading] = useState({
    login: false,
    data: false
  });
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    ps_key: '1589518_1_1_1',
    data_point: 'p2',
    start_year: '2024', // Changed to 2024 for your expected data
    start_month: '05', // May
    end_year: '2024', // Changed to 2024
    end_month: '10', // October
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
      console.log('Login successful');
      
    } catch (err: any) {
      setError(err.message);
      console.error('Login error:', err);
    } finally {
      setLoading(prev => ({ ...prev, login: false }));
    }
  };

  // Fetch energy data
  const fetchEnergyData = async () => {
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

      console.log('Fetching energy data with:', requestBody);

      const response = await fetch('http://localhost:3000/api/solar/historical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data: MonthlyDataResponse = await response.json();
      
      if (!response.ok || data.result_code !== "1") {
        throw new Error(data.result_msg || 'Failed to fetch energy data');
      }

      setEnergyData(data);
      console.log('Energy data fetched:', data);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Energy data error:', err);
    } finally {
      setLoading(prev => ({ ...prev, data: false }));
    }
  };

  // Format cumulative energy data
  const formatCumulativeData = (): CumulativeDataItem[] => {
    if (!energyData) return [];
    
    const psKey = Object.keys(energyData.result_data)[0];
    if (!psKey) return [];
    
    const dataPoint = Object.keys(energyData.result_data[psKey])[0];
    const dataArray = energyData.result_data[psKey][dataPoint];
    
    console.log('Raw API data for conversion:', dataArray);
    
    if (!dataArray || dataArray.length === 0) return [];

    // Sort data by timestamp chronologically
    const sortedData = [...dataArray].sort((a, b) => a.time_stamp.localeCompare(b.time_stamp));

    return sortedData.map((item) => {
      const timestamp = item.time_stamp;
      const year = timestamp.slice(0, 4);
      const monthNum = parseInt(timestamp.slice(4, 6));
      const valueKey = Object.keys(item).find(key => key !== 'time_stamp');
      
      if (!valueKey) {
        return {
          month: timestamp,
          year,
          monthNum,
          cumulativeWh: 0,
          cumulativeKwh: 0,
          formattedCumulativeKwh: '0.00',
          formattedCumulativeWh: '0',
          rawValue: '0',
          monthName: monthNames[monthNum - 1],
          date: `${shortMonthNames[monthNum - 1]} ${year}`,
          shortDate: `${shortMonthNames[monthNum - 1]} '${year.slice(2)}`
        };
      }

      const cumulativeWh = parseFloat(item[valueKey]);
      const cumulativeKwh = cumulativeWh / 1000;

      console.log(`Conversion: ${cumulativeWh} Wh → ${cumulativeKwh} kWh`);

      return {
        month: timestamp,
        year,
        monthNum,
        cumulativeWh,
        cumulativeKwh,
        formattedCumulativeKwh: cumulativeKwh.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        formattedCumulativeWh: cumulativeWh.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }),
        rawValue: item[valueKey],
        monthName: monthNames[monthNum - 1],
        date: `${shortMonthNames[monthNum - 1]} ${year}`,
        shortDate: `${shortMonthNames[monthNum - 1]} '${year.slice(2)}`
      };
    });
  };

  // Pure function to convert cumulative data to monthly data
  const convertCumulativeToMonthly = (
    cumulativeData: CumulativeDataItem[]
  ): MonthlyDataItem[] => {
    if (!Array.isArray(cumulativeData) || cumulativeData.length === 0) {
      return [];
    }

    // Sort chronologically for correct calculations
    const sortedData = [...cumulativeData].sort((a, b) => {
      if (a.year !== b.year) return parseInt(a.year) - parseInt(b.year);
      return a.monthNum - b.monthNum;
    });

    return sortedData.map((current, index) => {
      if (index === 0) {
        // First month: monthly equals cumulative
        return {
          time_stamp: current.month,
          monthly_energy_kwh: Number(current.cumulativeKwh.toFixed(2)),
          monthName: current.monthName,
          shortDate: current.shortDate,
          year: current.year,
          monthNum: current.monthNum,
          cumulativeKwh: current.cumulativeKwh
        };
      }

      const previous = sortedData[index - 1];
      const monthlyKwh = current.cumulativeKwh - previous.cumulativeKwh;
      
      // Prevent negative values (data safeguard)
      const safeMonthlyKwh = Math.max(0, monthlyKwh);
      
      return {
        time_stamp: current.month,
        monthly_energy_kwh: Number(safeMonthlyKwh.toFixed(2)),
        monthName: current.monthName,
        shortDate: current.shortDate,
        year: current.year,
        monthNum: current.monthNum,
        cumulativeKwh: current.cumulativeKwh
      };
    });
  };

  // Use useMemo for efficient monthly data calculation
  const monthlyData = useMemo(() => {
    const cumulativeData = formatCumulativeData();
    return convertCumulativeToMonthly(cumulativeData);
  }, [energyData]);

  // Format data for chart (now uses monthly data)
  const formatChartData = () => {
    return monthlyData.map(item => ({
      ...item,
      name: item.shortDate,
      energy: item.monthly_energy_kwh, // Now using monthly energy
      cumulative: item.cumulativeKwh,
      monthIndex: parseInt(item.year) * 12 + item.monthNum
    })).sort((a, b) => a.monthIndex - b.monthIndex);
  };

  // Calculate statistics based on monthly data
  const calculateStats = () => {
    if (monthlyData.length === 0) return null;
    
    const monthlyValues = monthlyData.map(d => d.monthly_energy_kwh);
    const totalMonthlyEnergy = monthlyValues.reduce((sum, val) => sum + val, 0);
    const averageMonthly = monthlyValues.length > 0 ? totalMonthlyEnergy / monthlyValues.length : 0;
    const maxMonthly = Math.max(...monthlyValues);
    const minMonthly = Math.min(...monthlyValues);
    
    // Calculate growth from first to last cumulative
    const cumulativeData = formatCumulativeData();
    if (cumulativeData.length >= 2) {
      const firstCumulative = cumulativeData[0].cumulativeKwh;
      const lastCumulative = cumulativeData[cumulativeData.length - 1].cumulativeKwh;
      const totalGrowth = firstCumulative > 0 ? ((lastCumulative - firstCumulative) / firstCumulative * 100) : 0;
      
      return {
        totalMonthlyEnergy: Number(totalMonthlyEnergy.toFixed(2)),
        averageMonthly: Number(averageMonthly.toFixed(2)),
        maxMonthly: Number(maxMonthly.toFixed(2)),
        minMonthly: Number(minMonthly.toFixed(2)),
        totalGrowth: totalGrowth.toFixed(1),
        count: monthlyData.length,
        latestMonth: `${monthlyData[monthlyData.length - 1]?.monthName} ${monthlyData[monthlyData.length - 1]?.year}`,
        firstMonth: `${monthlyData[0]?.monthName} ${monthlyData[0]?.year}`
      };
    }
    
    return {
      totalMonthlyEnergy: Number(totalMonthlyEnergy.toFixed(2)),
      averageMonthly: Number(averageMonthly.toFixed(2)),
      maxMonthly: Number(maxMonthly.toFixed(2)),
      minMonthly: Number(minMonthly.toFixed(2)),
      totalGrowth: '0.0',
      count: monthlyData.length,
      latestMonth: `${monthlyData[monthlyData.length - 1]?.monthName} ${monthlyData[monthlyData.length - 1]?.year}`,
      firstMonth: `${monthlyData[0]?.monthName} ${monthlyData[0]?.year}`
    };
  };

  // Export data as CSV
  const exportToCSV = () => {
    const cumulativeData = formatCumulativeData();
    const monthly = monthlyData;
    
    const headers = ['Year', 'Month', 'Cumulative (Wh)', 'Cumulative (kWh)', 'Monthly (kWh)', 'Calculation'];
    const csvContent = [
      headers.join(','),
      ...monthly.map((monthlyItem, index) => {
        const cumulativeItem = cumulativeData[index] || {};
        const calculation = index === 0 
          ? 'First month: Monthly = Cumulative'
          : `Monthly = ${cumulativeItem.cumulativeKwh?.toFixed(2)} - ${cumulativeData[index - 1]?.cumulativeKwh?.toFixed(2)}`;
        
        return [
          monthlyItem.year,
          monthlyItem.monthName,
          cumulativeItem.cumulativeWh || 0,
          cumulativeItem.cumulativeKwh?.toFixed(2) || '0.00',
          monthlyItem.monthly_energy_kwh.toFixed(2),
          calculation
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-energy-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
  const cumulativeDataArray = formatCumulativeData();
  const chartData = formatChartData();

  // Custom Tooltip component - updated for monthly data
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.monthName} {data.year}</p>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-gray-600">Monthly Generation: </span>
              <span className="font-semibold text-green-600">{data.monthly_energy_kwh?.toFixed(2) || data.energy?.toFixed(2)} kWh</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Cumulative to Date: </span>
              <span className="font-semibold text-blue-600">{data.cumulativeKwh?.toFixed(2)} kWh</span>
            </p>
            {data.monthNum > 1 && (
              <div className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">
                <span>Calculation: Current Cumulative - Previous Cumulative</span>
              </div>
            )}
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
                    setSelectedMonth(data.activePayload[0].payload.time_stamp);
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
                    value: 'Monthly Energy (kWh)', 
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
                  name="Monthly Generation (kWh)"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.8}
                />
                {stats && (
                  <ReferenceLine 
                    y={stats.averageMonthly} 
                    stroke="#3B82F6" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: `Avg: ${stats.averageMonthly} kWh`, 
                      position: 'right',
                      fill: '#3B82F6',
                      fontSize: 12
                    }}
                  />
                )}
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                onClick={(data) => {
                  if (data && data.activePayload) {
                    setSelectedMonth(data.activePayload[0].payload.time_stamp);
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
                    value: 'Monthly Energy (kWh)', 
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
                  name="Monthly Generation (kWh)"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ stroke: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 8, strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                onClick={(data) => {
                  if (data && data.activePayload) {
                    setSelectedMonth(data.activePayload[0].payload.time_stamp);
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
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
                    value: 'Monthly Energy (kWh)', 
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
                  name="Monthly Generation (kWh)"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#colorEnergy)"
                />
                <Brush dataKey="shortDate" height={30} stroke="#10B981" />
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
              disabled={!energyData}
              className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>
        
        {/* Data insights */}
        {stats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Total Monthly Energy</p>
              <p className="font-semibold text-gray-900">{stats.totalMonthlyEnergy} kWh</p>
              <p className="text-sm text-gray-600">Sum of all months</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Average Monthly</p>
              <p className="font-semibold text-green-600">{stats.averageMonthly} kWh</p>
              <p className="text-sm text-gray-600">Monthly average</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Peak Month</p>
              <p className="font-semibold text-amber-600">{stats.maxMonthly} kWh</p>
              <p className="text-sm text-gray-600">Highest generation</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Conversion</p>
              <p className="font-semibold text-blue-600">Cumulative → Monthly</p>
              <p className="text-sm text-gray-600">Current - Previous</p>
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
                  Monthly Energy Generation
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Cumulative → Monthly Conversion
                  </span>
                </h1>
                <p className="text-gray-600 mt-2">
                  Convert YTD cumulative values to monthly generation: Current Month - Previous Month
                </p>
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
                <Battery className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Data Point</span>
                <span className="text-sm text-gray-900">Total Energy</span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Activity className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Data Points</span>
                <span className="text-sm text-gray-900">{monthlyData.length}</span>
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
                      <option value="p2">p2 - Total Energy (Wh→kWh)</option>
                      <option value="p1">p1 - Total Power (W)</option>
                      <option value="p14">p14 - Grid Voltage (V)</option>
                      <option value="p21">p21 - Output Current (A)</option>
                      <option value="p24">p24 - Output Power (W)</option>
                      <option value="p25">p25 - Temperature (°C)</option>
                      <option value="p87">p87 - Today Energy (Wh→kWh)</option>
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
                  onClick={fetchEnergyData}
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
                      Load Energy Data
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

              {/* Conversion Stats */}
              {stats && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Months Analyzed</span>
                      <span className="font-semibold text-gray-900">{stats.count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Monthly Energy</span>
                      <span className="font-semibold text-gray-900">{stats.totalMonthlyEnergy} kWh</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average Monthly</span>
                      <span className="font-semibold text-green-600">{stats.averageMonthly} kWh</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Peak Month</span>
                      <span className="font-semibold text-amber-600">{stats.maxMonthly} kWh</span>
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
                      Monthly Energy Generation (kWh)
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Cumulative → Monthly Conversion
                      </span>
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {monthlyData.length} months • Formula: Monthly = Current Cumulative - Previous Cumulative
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
                            Cumulative (kWh)
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">
                            Monthly (kWh)
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50 rounded-r-lg">
                            Calculation
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.map((item, index) => {
                          const cumulativeItem = cumulativeDataArray[index] || {};
                          const calculation = index === 0 
                            ? 'First month: Monthly = Cumulative'
                            : `Monthly = ${cumulativeItem.cumulativeKwh?.toFixed(2)} - ${cumulativeDataArray[index - 1]?.cumulativeKwh?.toFixed(2)}`;
                          
                          return (
                            <tr 
                              key={item.time_stamp}
                              className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                                selectedMonth === item.time_stamp ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => setSelectedMonth(item.time_stamp)}
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
                                  {cumulativeItem.formattedCumulativeKwh || '0.00'} kWh
                                </p>
                                <p className="text-sm text-gray-500">YTD cumulative</p>
                              </td>
                              <td className="py-4 px-4">
                                <p className="font-bold text-green-700 text-lg">
                                  {item.monthly_energy_kwh.toFixed(2)} kWh
                                </p>
                                <p className="text-sm text-gray-500">Monthly generation</p>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm text-gray-600">
                                  {calculation}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                  {index === 0 ? (
                                    <div className="bg-green-100 px-2 py-1 rounded text-green-800">
                                      First month
                                    </div>
                                  ) : (
                                    <>
                                      <div className="bg-gray-100 px-2 py-1 rounded">
                                        {cumulativeItem.cumulativeKwh?.toFixed(2)}
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-gray-400" />
                                      <div className="bg-gray-100 px-2 py-1 rounded">
                                        {cumulativeDataArray[index - 1]?.cumulativeKwh?.toFixed(2)}
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-gray-400" />
                                      <div className="bg-green-100 px-2 py-1 rounded text-green-800">
                                        = {item.monthly_energy_kwh.toFixed(2)}
                                      </div>
                                    </>
                                  )}
                                </div>
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
              {selectedMonth && monthlyData.find(item => item.time_stamp === selectedMonth) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Conversion Details for {monthlyData.find(item => item.time_stamp === selectedMonth)?.monthName} {monthlyData.find(item => item.time_stamp === selectedMonth)?.year}
                    </h3>
                    <button
                      onClick={() => setSelectedMonth('')}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Current Cumulative (kWh)</p>
                      <p className="text-xl font-bold text-gray-900">
                        {cumulativeDataArray.find(item => item.month === selectedMonth)?.formattedCumulativeKwh}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Cumulative value for this month
                      </p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Monthly Generation (kWh)</p>
                      <p className="text-xl font-bold text-green-700">
                        {monthlyData.find(item => item.time_stamp === selectedMonth)?.monthly_energy_kwh.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Energy generated this month
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Previous Cumulative (kWh)</p>
                      <p className="text-xl font-bold text-purple-700">
                        {(() => {
                          const index = monthlyData.findIndex(item => item.time_stamp === selectedMonth);
                          return index > 0 
                            ? cumulativeDataArray[index - 1]?.formattedCumulativeKwh || 'N/A'
                            : 'First month';
                        })()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Previous month's cumulative
                      </p>
                    </div>
                    
                    <div className="bg-amber-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Calculation Type</p>
                      <p className="text-xl font-bold text-amber-700">
                        {(() => {
                          const index = monthlyData.findIndex(item => item.time_stamp === selectedMonth);
                          return index === 0 ? 'First Month' : 'Monthly Difference';
                        })()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {(() => {
                          const index = monthlyData.findIndex(item => item.time_stamp === selectedMonth);
                          return index === 0 
                            ? 'Monthly = Cumulative' 
                            : 'Current - Previous';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw JSON Display */}
              {energyData && !isChartFullScreen && (
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
                        <span className="text-sm font-medium text-gray-700">API Response Data (Values in Wh)</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(JSON.stringify(energyData, null, 2))}
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          Copy JSON
                        </button>
                      </div>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                        {JSON.stringify(energyData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!energyData && !loading.data && !isChartFullScreen && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Energy Data Loaded</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Configure your parameters and click "Load Energy Data" to convert cumulative values to monthly generation
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
            <p>Monthly Energy Generation • Cumulative → Monthly Conversion (Current - Previous) • Powered by RBP India Solar Solutions</p>
            <p className="mt-1">Data updates on request • {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      )}
      
      {isChartFullScreen && renderChart()}
    </div>
  );
};

export default CumulativeEnergyDisplay;