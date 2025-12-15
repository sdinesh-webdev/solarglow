// components/HistoricalDataChart.tsx - Fixed circular dependency issue
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, Legend, ReferenceLine } from 'recharts';
import { useDeviceContext } from '../context/DeviceContext';
import { 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  Activity, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Battery, 
  Zap, 
  Gauge, 
  Thermometer, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  Calculator,
  Info
} from 'lucide-react';

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

interface CumulativeDataItem {
  timestamp: string;
  date: string;
  originalWh: number; // API value in Wh
  cumulativeKwh: number; // Converted to kWh
  cumulativeWh: number; // Original in Wh (for reference)
  period: string;
  isFirstPeriod: boolean; // Flag to identify first period
}

interface PeriodDataItem {
  timestamp: string;
  date: string;
  periodProductionKwh: number; // Production for this period
  cumulativeKwh: number; // Cumulative to date
  originalWh: number; // Original API value in Wh
  period: string;
  growth?: number; // Growth percentage
  calculation: string; // Formula used
  isFirstPeriod: boolean;
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
  const [showRawJson, setShowRawJson] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [conversionMode, setConversionMode] = useState<'cumulative' | 'period'>('period');

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

  // Format cumulative data from API
  const formatCumulativeData = (): CumulativeDataItem[] => {
    if (!historicalData) return [];
    
    const psKey = Object.keys(historicalData.result_data)[0];
    if (!psKey) return [];
    
    const dataPoint = Object.keys(historicalData.result_data[psKey])[0];
    const dataArray = historicalData.result_data[psKey][dataPoint];
    
    if (!dataArray || dataArray.length === 0) return [];

    // Sort data by timestamp chronologically
    const sortedData = [...dataArray].sort((a, b) => a.time_stamp.localeCompare(b.time_stamp));

    // Get period label based on query type
    const getPeriodLabel = () => {
      switch (formData.query_type) {
        case '1': return 'Daily';
        case '2': return 'Monthly';
        case '3': return 'Yearly';
        default: return 'Period';
      }
    };

    return sortedData.map((item, index) => {
      const timestamp = item.time_stamp;
      const formattedDate = formatDateFromAPI(timestamp, formData.query_type);
      const valueKey = Object.keys(item).find(key => key !== 'time_stamp');
      
      if (!valueKey) {
        return {
          timestamp,
          date: formattedDate,
          originalWh: 0,
          cumulativeKwh: 0,
          cumulativeWh: 0,
          period: getPeriodLabel(),
          isFirstPeriod: index === 0
        };
      }

      const originalWh = parseFloat(item[valueKey]) || 0;
      const cumulativeKwh = Number((originalWh / 1000).toFixed(2));

      return {
        timestamp,
        date: formattedDate,
        originalWh,
        cumulativeKwh,
        cumulativeWh: originalWh,
        period: getPeriodLabel(),
        isFirstPeriod: index === 0
      };
    });
  };

  // Professional conversion: Cumulative to Period Production with FIRST PERIOD AS 0
  const convertCumulativeToPeriodProduction = (
    cumulativeData: CumulativeDataItem[]
  ): PeriodDataItem[] => {
    if (!Array.isArray(cumulativeData) || cumulativeData.length === 0) {
      return [];
    }

    // Sort chronologically for correct calculations
    const sortedData = [...cumulativeData].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    let previousProduction = 0; // Track previous production for growth calculation

    return sortedData.map((current, index) => {
      // FIRST PERIOD AS 0: Production = 0 for first period
      if (index === 0) {
        return {
          timestamp: current.timestamp,
          date: current.date,
          periodProductionKwh: 0, // FIRST PERIOD IS 0
          cumulativeKwh: current.cumulativeKwh,
          originalWh: current.originalWh,
          period: current.period,
          growth: 0, // No growth for first period
          calculation: 'First period: Production = 0 kWh (no previous period to compare)',
          isFirstPeriod: true
        };
      }

      const previous = sortedData[index - 1];
      const periodKwh = current.cumulativeKwh - previous.cumulativeKwh;
      
      // Prevent negative values (data safeguard) but log them
      const safePeriodKwh = Math.max(0, periodKwh);
      
      if (periodKwh < 0) {
        console.warn(`Negative period value detected: ${current.date} (${periodKwh.toFixed(2)} kWh). Using 0 instead.`);
      }
      
      // Calculate growth percentage relative to previous period's production
      let growth = 0;
      if (index > 1) {
        // For growth calculation after the first period, use the previous period's production
        // For index 1, growth is 0 because we're comparing to the first period (0)
        growth = previousProduction > 0 
          ? Number(((safePeriodKwh - previousProduction) / previousProduction * 100).toFixed(1))
          : safePeriodKwh > 0 ? 100 : 0; // If previous was 0 and current > 0, growth is 100%
      }

      // Store current production for next iteration's growth calculation
      previousProduction = safePeriodKwh;

      return {
        timestamp: current.timestamp,
        date: current.date,
        periodProductionKwh: Number(safePeriodKwh.toFixed(2)),
        cumulativeKwh: current.cumulativeKwh,
        originalWh: current.originalWh,
        period: current.period,
        growth,
        calculation: `${current.cumulativeKwh.toFixed(2)} kWh - ${previous.cumulativeKwh.toFixed(2)} kWh = ${safePeriodKwh.toFixed(2)} kWh`,
        isFirstPeriod: false
      };
    });
  };

  // Use useMemo for efficient data calculation
  const periodData = useMemo(() => {
    const cumulativeData = formatCumulativeData();
    console.log('Cumulative Data for Conversion:', cumulativeData);
    const result = convertCumulativeToPeriodProduction(cumulativeData);
    console.log('Period Data with First Period as 0:', result);
    return result;
  }, [historicalData, formData.query_type]);

  // Format data for chart based on conversion mode
  const formatChartData = () => {
    if (conversionMode === 'cumulative') {
      const cumulativeData = formatCumulativeData();
      console.log('Chart Cumulative Data:', cumulativeData);
      
      return cumulativeData.map(item => ({
        ...item,
        name: item.date,
        value: item.cumulativeKwh,
        displayValue: item.cumulativeKwh.toFixed(2),
        unit: 'kWh',
        label: `Cumulative (${item.period})`,
        originalValue: item.originalWh,
        isFirstPeriod: item.isFirstPeriod
      }));
    } else {
      console.log('Chart Period Data:', periodData);
      return periodData.map(item => ({
        ...item,
        name: item.date,
        value: item.periodProductionKwh,
        displayValue: item.periodProductionKwh.toFixed(2),
        unit: 'kWh',
        label: `${item.period} Production`,
        cumulativeValue: item.cumulativeKwh,
        isFirstPeriod: item.isFirstPeriod
      }));
    }
  };

  // Get data point label and config
  const getDataPointConfig = (point: string) => {
    const configs = {
      p1: { label: 'Total Power', unit: 'W', icon: Zap, color: '#3B82F6' },
      p2: { label: 'Total Energy', unit: 'Wh/kWh', icon: Battery, color: '#10B981' },
      p14: { label: 'Grid Voltage', unit: 'V', icon: Gauge, color: '#8B5CF6' },
      p21: { label: 'Output Current', unit: 'A', icon: Activity, color: '#F59E0B' },
      p24: { label: 'Output Power', unit: 'W', icon: Zap, color: '#EF4444' },
      p25: { label: 'Temperature', unit: '°C', icon: Thermometer, color: '#EC4899' },
      p87: { label: 'Today Energy', unit: 'Wh/kWh', icon: Battery, color: '#06B6D4' }
    };
    return configs[point as keyof typeof configs] || { label: point, unit: '', icon: Activity, color: '#6B7280' };
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

  // Calculate statistics - UPDATED FOR FIRST PERIOD AS 0
  const calculateStats = () => {
    const data = formatChartData();
    if (data.length === 0) return null;
    
    const values = data.map(d => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxItem = data.find(d => d.value === max);
    const minItem = data.find(d => d.value === min);
    
    let totalGrowth = 0;
    if (conversionMode === 'cumulative') {
      const cumulativeData = formatCumulativeData();
      if (cumulativeData.length >= 2) {
        const firstValue = cumulativeData[0].cumulativeKwh;
        const lastValue = cumulativeData[cumulativeData.length - 1].cumulativeKwh;
        totalGrowth = firstValue > 0 ? ((lastValue - firstValue) / firstValue * 100) : 0;
      }
    } else {
      const periodValues = periodData.map(d => d.periodProductionKwh);
      if (periodValues.length >= 2) {
        // Find first non-zero period (skip the first 0)
        const firstNonZeroIndex = periodValues.findIndex((val, idx) => idx > 0 && val > 0);
        if (firstNonZeroIndex !== -1) {
          const firstNonZeroValue = periodValues[firstNonZeroIndex];
          const lastPeriodValue = periodValues[periodValues.length - 1];
          totalGrowth = firstNonZeroValue > 0 ? ((lastPeriodValue - firstNonZeroValue) / firstNonZeroValue * 100) : 0;
        }
      }
    }
    
    return { 
      sum: Number(sum.toFixed(2)), 
      avg: Number(avg.toFixed(2)), 
      max: Number(max.toFixed(2)), 
      min: Number(min.toFixed(2)), 
      maxPeriod: maxItem ? `${maxItem.date}` : '',
      minPeriod: minItem ? `${minItem.date}` : '',
      count: values.length,
      growth: totalGrowth.toFixed(1),
      totalGrowth,
      firstValue: values[0] || 0,
      lastValue: values[values.length - 1] || 0,
      nonZeroPeriods: values.filter(v => v > 0).length
    };
  };

  // Export data as CSV
  const exportToCSV = () => {
    const periodType = getQueryTypeDescription();
    const isCumulativeMode = conversionMode === 'cumulative';
    
    const headers = isCumulativeMode 
      ? ['Date', 'Cumulative (Wh)', 'Cumulative (kWh)', 'Period Type', 'Is First Period']
      : ['Date', 'Period Production (kWh)', 'Cumulative (kWh)', 'Growth %', 'Calculation', 'Original (Wh)', 'Is First Period'];
    
    const csvContent = [
      headers.join(','),
      ...(isCumulativeMode 
        ? formatCumulativeData().map(row => 
            `${row.date},${row.originalWh},${row.cumulativeKwh.toFixed(2)},${row.period},${row.isFirstPeriod ? 'Yes' : 'No'}`
          )
        : periodData.map(row => 
            `${row.date},${row.periodProductionKwh.toFixed(2)},${row.cumulativeKwh.toFixed(2)},${row.growth || 0},${row.calculation},${row.originalWh},${row.isFirstPeriod ? 'Yes' : 'No'}`
          )
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${periodType.toLowerCase()}-${conversionMode}-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Custom Tooltip component - UPDATED FOR FIRST PERIOD AS 0
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isCumulative = conversionMode === 'cumulative';
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.date}</p>
          <div className="space-y-2">
            {isCumulative ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cumulative Energy:</span>
                  <span className="font-semibold text-blue-600 ml-2">
                    {data.cumulativeKwh?.toFixed(2) || data.value?.toFixed(2)} kWh
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Original Wh:</span>
                  <span className="font-semibold text-gray-900">
                    {data.originalValue?.toLocaleString() || (data.value * 1000).toLocaleString()} Wh
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{getQueryTypeDescription()} Production:</span>
                  <span className={`font-semibold ${data.isFirstPeriod ? 'text-gray-500' : 'text-green-600'} ml-2`}>
                    {data.periodProductionKwh?.toFixed(2) || data.value?.toFixed(2)} kWh
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cumulative to Date:</span>
                  <span className="font-semibold text-blue-600">
                    {data.cumulativeValue?.toFixed(2) || data.cumulativeKwh?.toFixed(2)} kWh
                  </span>
                </div>
                {data.growth !== undefined && !data.isFirstPeriod && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Growth:</span>
                    <span className={`font-semibold ${data.growth > 0 ? 'text-green-600' : data.growth < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {data.growth > 0 ? '↑' : data.growth < 0 ? '↓' : '→'} {Math.abs(data.growth)}%
                    </span>
                  </div>
                )}
              </>
            )}
            
            {data.isFirstPeriod && conversionMode === 'period' && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Info className="w-3 h-3" />
                  <span>First period production set to 0 (no previous period to compare)</span>
                </div>
              </div>
            )}
            
            {!isCumulative && data.calculation && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">{data.calculation}</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const config = getDataPointConfig(formData.data_point);
  const stats = calculateStats();
  const chartData = formatChartData();
  const cumulativeData = formatCumulativeData();

  // Debug logging - FIXED: Removed circular dependency
  useEffect(() => {
    if (chartData.length > 0) {
      console.log('Chart Data Analysis:', {
        mode: conversionMode,
        firstPoint: chartData[0],
        allDataCount: chartData.length,
        cumulativeDataCount: cumulativeData.length,
        periodDataCount: periodData.length
      });
    }
  }, [chartData, conversionMode, cumulativeData, periodData]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                Professional Energy Data Analysis
                <span className={`text-sm px-2 py-1 rounded-full ${conversionMode === 'cumulative' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                  {conversionMode === 'cumulative' ? 'Cumulative View' : 'Period Production'}
                </span>
              </h1>
              <p className="text-gray-600">
                {conversionMode === 'cumulative' 
                  ? 'Viewing cumulative energy data (Wh → kWh conversion)'
                  : `Calculating ${getQueryTypeDescription().toLowerCase()} production: Current Cumulative - Previous Cumulative • First period = 0 kWh`
                }
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {loginData && (
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
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
                disabled={loginLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loginLoading ? 'animate-spin' : ''}`} />
                {loginLoading ? 'Logging in...' : 'Refresh Token'}
              </button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Device</span>
              <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                {formData.ps_key_list || psKey || 'Not set'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Period</span>
              <span className="text-sm text-gray-900">
                {getQueryTypeDescription()}
              </span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <config.icon className="w-4 h-4" style={{ color: config.color }} />
              <span className="text-sm font-medium text-gray-700">Data Point</span>
              <span className="text-sm text-gray-900">{config.label}</span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Data Points</span>
              <span className="text-sm text-gray-900">{chartData.length}</span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Calculator className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">Conversion</span>
              <span className="text-sm text-gray-900">
                {conversionMode === 'cumulative' ? 'Wh → kWh' : 'Cumulative → Period'}
              </span>
            </div>
          </div>

          {/* First Period Information */}
          {conversionMode === 'period' && chartData.length > 0 && (
            <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              <span className="text-sm font-medium text-gray-700">First Period Logic:</span>
              <span className="text-sm text-gray-900">
                Production = 0 kWh (no previous period to compare)
              </span>
              <span className="text-sm text-gray-600 ml-2">
                • {chartData[0].date}: <span className="font-semibold">0 kWh</span>
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Configuration Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                Data Configuration
              </h3>
              
              {/* Data Mode Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Display Mode
                </label>
                <div className="space-y-2">
                  <button 
                    onClick={() => setConversionMode('period')} 
                    className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                      conversionMode === 'period' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">Period Production</p>
                    <p className="text-xs text-gray-500">Current - Previous calculation</p>
                    <div className="text-xs text-gray-600 mt-1">
                      Formula: P = C<sub>n</sub> - C<sub>n-1</sub>
                    </div>
                    <div className="text-xs text-amber-600 mt-1">
                      First period = 0 kWh
                    </div>
                  </button>
                  <button 
                    onClick={() => setConversionMode('cumulative')} 
                    className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                      conversionMode === 'cumulative' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">Cumulative Data</p>
                    <p className="text-xs text-gray-500">Direct Wh → kWh conversion</p>
                    <div className="text-xs text-gray-600 mt-1">
                      Conversion: kWh = Wh ÷ 1000
                    </div>
                  </button>
                </div>
              </div>

              {/* Query Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Query Type
                </label>
                <div className="space-y-2">
                  <button 
                    onClick={() => setQueryType('1')} 
                    className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                      formData.query_type === '1' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">Daily Data</p>
                    <p className="text-xs text-gray-500">Day-by-day analysis</p>
                  </button>
                  <button 
                    onClick={() => setQueryType('2')} 
                    className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                      formData.query_type === '2' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">Monthly Data</p>
                    <p className="text-xs text-gray-500">Month-by-month trends</p>
                  </button>
                  <button 
                    onClick={() => setQueryType('3')} 
                    className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                      formData.query_type === '3' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">Yearly Data</p>
                    <p className="text-xs text-gray-500">Year-over-year comparison</p>
                  </button>
                </div>
              </div>

              {/* Data Point Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Point
                </label>
                <select
                  name="data_point"
                  value={formData.data_point}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="p2">p2 - Total Energy (Wh/kWh)</option>
                  <option value="p1">p1 - Total Power (W)</option>
                  <option value="p14">p14 - Grid Voltage (V)</option>
                  <option value="p21">p21 - Output Current (A)</option>
                  <option value="p24">p24 - Output Power (W)</option>
                  <option value="p25">p25 - Temperature (°C)</option>
                  <option value="p87">p87 - Today Energy (Wh/kWh)</option>
                </select>
              </div>

              {/* Date Range Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Quick Date Ranges */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Ranges
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setDateRange('week')} 
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
                  >
                    Last Week
                  </button>
                  <button 
                    onClick={() => setDateRange('month')} 
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
                  >
                    Last Month
                  </button>
                  <button 
                    onClick={() => setDateRange('3months')} 
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
                  >
                    Last 3 Months
                  </button>
                  <button 
                    onClick={() => setDateRange('6months')} 
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
                  >
                    Last 6 Months
                  </button>
                  <button 
                    onClick={() => setDateRange('year')} 
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
                  >
                    Last Year
                  </button>
                  <button 
                    onClick={setEndToToday} 
                    className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  >
                    Today
                  </button>
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
                      PS Key List
                    </label>
                    <input
                      type="text"
                      name="ps_key_list"
                      value={formData.ps_key_list}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter PS Key"
                    />
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
                onClick={fetchHistoricalData}
                disabled={loading || !loginData}
                className={`w-full mt-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  loading || !loginData
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Fetching Data...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Load Historical Data
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
            {stats && chartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {conversionMode === 'cumulative' ? 'Cumulative Stats' : 'Production Stats'}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Periods Analyzed</span>
                    <span className="font-semibold text-gray-900">{stats.count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">First Period</span>
                    <span className="font-semibold text-gray-900">{chartData[0]?.date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">First Value</span>
                    <span className={`font-semibold ${conversionMode === 'period' ? 'text-gray-500' : 'text-blue-600'}`}>
                      {stats.firstValue.toFixed(2)} kWh
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Latest Value</span>
                    <span className="font-semibold text-green-600">{stats.lastValue.toFixed(2)} kWh</span>
                  </div>
                  {conversionMode === 'period' && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Non-Zero Periods</span>
                      <span className="font-semibold text-gray-900">{stats.nonZeroPeriods}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {conversionMode === 'cumulative' ? 'Total Growth' : 'Total Production'}
                    </span>
                    <span className={`font-semibold ${parseFloat(stats.growth) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {conversionMode === 'cumulative' ? `${stats.growth}%` : `${stats.sum.toFixed(2)} kWh`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Chart Display */}
            {historicalData && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-blue-600" />
                        {conversionMode === 'cumulative' 
                          ? `Cumulative Energy Data (kWh)`
                          : `${getQueryTypeDescription()} Energy Production (kWh)`
                        }
                        <span className={`text-sm px-2 py-1 rounded-full ${conversionMode === 'cumulative' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {conversionMode === 'cumulative' 
                            ? 'Wh ÷ 1000 = kWh'
                            : 'Current Cumulative - Previous Cumulative'
                          }
                        </span>
                      </h2>
                      {chartData.length > 0 && (
                        <p className="text-gray-600 mt-1">
                          {chartData.length} data points • First: {chartData[0].date} ({chartData[0].value.toFixed(2)} kWh)
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button 
                          onClick={() => setChartType('area')} 
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                            chartType === 'area' 
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Area
                        </button>
                        <button 
                          onClick={() => setChartType('line')} 
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                            chartType === 'line' 
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Line
                        </button>
                        <button 
                          onClick={() => setChartType('bar')} 
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                            chartType === 'bar' 
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Bar
                        </button>
                      </div>
                      
                      <button
                        onClick={exportToCSV}
                        disabled={!historicalData}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ height: '400px' }}>
                    {chartData.length === 0 ? (
                      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No data available for chart</p>
                        </div>
                      </div>
                    ) : chartType === 'area' ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={config.color} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={config.color} stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#6b7280" 
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            tickFormatter={(value) => value.toLocaleString()}
                            label={{ 
                              value: conversionMode === 'cumulative' ? 'Cumulative Energy (kWh)' : 'Period Production (kWh)', 
                              angle: -90, 
                              position: 'insideLeft',
                              offset: 10
                            }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            name={conversionMode === 'cumulative' ? 'Cumulative Energy' : 'Period Production'}
                            stroke={config.color} 
                            strokeWidth={2}
                            fill="url(#colorValue)"
                          />
                          {conversionMode === 'period' && chartData[0]?.value === 0 && (
                            <ReferenceLine 
                              x={chartData[0].date}
                              stroke="#6B7280"
                              strokeDasharray="3 3"
                              label={{ 
                                value: 'First period: 0 kWh', 
                                position: 'top',
                                fill: '#6B7280',
                                fontSize: 12
                              }}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : chartType === 'line' ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#6b7280" 
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            tickFormatter={(value) => value.toLocaleString()}
                            label={{ 
                              value: conversionMode === 'cumulative' ? 'Cumulative Energy (kWh)' : 'Period Production (kWh)', 
                              angle: -90, 
                              position: 'insideLeft',
                              offset: 10
                            }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            name={conversionMode === 'cumulative' ? 'Cumulative Energy' : 'Period Production'}
                            stroke={config.color} 
                            strokeWidth={3}
                            dot={{ stroke: config.color, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 8, strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#6b7280" 
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            tickFormatter={(value) => value.toLocaleString()}
                            label={{ 
                              value: conversionMode === 'cumulative' ? 'Cumulative Energy (kWh)' : 'Period Production (kWh)', 
                              angle: -90, 
                              position: 'insideLeft',
                              offset: 10
                            }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar 
                            dataKey="value" 
                            name={conversionMode === 'cumulative' ? 'Cumulative Energy' : 'Period Production'}
                            fill={config.color} 
                            fillOpacity={0.8}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
                
                {/* Data Summary */}
                {stats && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Activity className="w-6 h-6 text-blue-600" />
                      {conversionMode === 'cumulative' ? 'Cumulative Statistics' : 'Production Statistics'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">
                          {conversionMode === 'cumulative' ? 'Latest Cumulative' : 'Total Production'}
                        </p>
                        <p className="font-semibold text-gray-900">
                          {conversionMode === 'cumulative' ? stats.lastValue.toFixed(2) : stats.sum.toFixed(2)} kWh
                        </p>
                        <p className="text-sm text-gray-600">
                          {conversionMode === 'cumulative' ? 'Final cumulative value' : 'Sum of all periods'}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">Average per Period</p>
                        <p className="font-semibold text-gray-900">{stats.avg.toFixed(2)} kWh</p>
                        <p className="text-sm text-gray-600">per {getQueryTypeDescription().slice(0, -2).toLowerCase()}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">Peak Period</p>
                        <p className="font-semibold text-gray-900">{stats.maxPeriod}</p>
                        <p className="text-sm text-green-600">{stats.max} kWh</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">First Period</p>
                        <p className="font-semibold text-gray-900">{chartData[0]?.date}</p>
                        <p className={`text-sm ${conversionMode === 'period' ? 'text-gray-500' : 'text-blue-600'}`}>
                          {stats.firstValue.toFixed(2)} kWh
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Data Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {conversionMode === 'cumulative' ? 'Cumulative Data' : 'Production Data'}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-200">
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                          {conversionMode === 'cumulative' ? (
                            <>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cumulative (Wh)</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cumulative (kWh)</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Conversion</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            </>
                          ) : (
                            <>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Production (kWh)</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cumulative (kWh)</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Growth %</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Calculation</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(conversionMode === 'cumulative' ? cumulativeData : periodData).map((item, index) => (
                          <tr key={index} className={`border-b border-gray-200 hover:bg-gray-50 ${index === 0 ? 'bg-gray-50' : ''}`}>
                            <td className="px-6 py-4 text-sm text-gray-800">
                              {item.date}
                              {index === 0 && (
                                <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                  First
                                </span>
                              )}
                            </td>
                            {conversionMode === 'cumulative' ? (
                              <>
                                <td className="px-6 py-4 text-sm text-gray-800">
                                  {(item as CumulativeDataItem).originalWh.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-blue-700 font-semibold">
                                  {(item as CumulativeDataItem).cumulativeKwh.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  ÷ 1000
                                </td>
                                <td className="px-6 py-4">
                                  {index === 0 ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                      First data point
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400">—</span>
                                  )}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className={`px-6 py-4 text-sm font-semibold ${index === 0 ? 'text-gray-500' : 'text-green-700'}`}>
                                  {(item as PeriodDataItem).periodProductionKwh.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-sm text-blue-700">
                                  {(item as PeriodDataItem).cumulativeKwh.toFixed(2)}
                                </td>
                                <td className="px-6 py-4">
                                  {index > 0 ? (
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                      (item as PeriodDataItem).growth! > 0
                                        ? 'bg-green-100 text-green-800'
                                        : (item as PeriodDataItem).growth! < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {(item as PeriodDataItem).growth! > 0 ? '↑' : (item as PeriodDataItem).growth! < 0 ? '↓' : '→'} {Math.abs((item as PeriodDataItem).growth!)}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                  {(item as PeriodDataItem).calculation}
                                </td>
                                <td className="px-6 py-4">
                                  {index === 0 ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                      First period: 0 kWh
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400">—</span>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* JSON Response Display */}
            {historicalData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <code className="text-sm font-medium">{"{}"}</code>
                    </div>
                    <span className="font-medium text-gray-700">Raw JSON Response (Cumulative Values in Wh)</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showRawJson ? 'rotate-90' : ''}`} />
                </button>
                
                {showRawJson && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">API Response Data</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(historicalData, null, 2))}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                      >
                        Copy JSON
                      </button>
                    </div>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                      {JSON.stringify(historicalData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!historicalData && !loading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 flex items-center justify-center">
                  <TrendingUp className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Historical Data Loaded</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Configure your parameters and click "Load Historical Data" to analyze energy production trends
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Set date range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Choose query type</span>
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
          <p>Professional Energy Analytics • Wh → kWh Conversion & Cumulative → Period Production • Powered by RBP India Solar Solutions</p>
          <p className="mt-1">First period production = 0 kWh (no previous period to compare) • {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default HistoricalDataChart;