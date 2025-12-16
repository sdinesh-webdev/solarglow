// components/CombinedAreaChart.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ReferenceLine, Brush
} from 'recharts';
import { 
  Calendar, Clock, RefreshCw, Download, 
  TrendingUp, Activity, Zap, Battery,
  BarChart3, LineChart as LineChartIcon,
  ChevronDown, ChevronUp, Filter,
  Maximize2, Minimize2,
  CalendarDays,
  Settings,
  AlertCircle, CheckCircle,
  Thermometer, Gauge, Wind,
  ArrowUpDown,
  Sun,
  Moon,
  Cloud,
  Layers,
  Key,
  Cpu,
  Search,
  Database,
  Server,
  HardDrive,
  Calculator,
  Info
} from 'lucide-react';
import { useDeviceContext } from '../context/DeviceContext';
import {
  MinuteDataResponse,
  HistoricalDataResponse,
  MonthlyDataItem,
  DailyDataItem,
  YearlyDataItem,
  LoginResponse,
  DevicePoint,
  DeviceDataResponse,
  MinuteFormState,
  DailyFormState,
  MonthlyFormState,
  YearlyFormState,
  DateTimeState,
  DailyDateRangeState,
  MonthRangeState,
  YearRangeState,
  ChartConfigState,
  LoadingState,
  ViewMode,
  ChartType,
  ParamConfig,
  CumulativeDataItem,
  PeriodDataItem
} from '../types/solarData';
import AutoLogin from './AutoLogin'; // Import AutoLogin component

// Extended interface for daily data with cumulative fields
interface ExtendedDailyDataItem extends Omit<DailyDataItem, 'value' | 'formattedValue'> {
  value: number;
  formattedValue: string;
  dailyKwh?: number;
  cumulativeKwh?: number;
  formattedCumulativeKwh?: string;
  growth?: string;
  isEnergyParameter?: boolean;
  isFirstPeriod?: boolean;
  calculation?: string;
  periodProductionKwh?: number;
}

const CombinedAreaChart: React.FC = () => {
  // Context
  const { psKey, setPsKey } = useDeviceContext();
  
  // Main state
  const [viewMode, setViewMode] = useState<'minute' | 'daily' | 'monthly' | 'yearly'>('minute');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState({
    login: false,
    minute: false,
    daily: false,
    monthly: false,
    yearly: false,
    device: false
  });
  const [error, setError] = useState<string>('');
  
  // Data state
  const [minuteData, setMinuteData] = useState<MinuteDataResponse | null>(null);
  const [dailyData, setDailyData] = useState<HistoricalDataResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<HistoricalDataResponse | null>(null);
  const [yearlyData, setYearlyData] = useState<HistoricalDataResponse | null>(null);
  const [deviceData, setDeviceData] = useState<DevicePoint | null>(null);
  
  // Form states
  const [minuteForm, setMinuteForm] = useState({
    ps_key_list: psKey || '1589518_1_1_1',
    points: 'p5,p6,p18,p21,p24',
    start_time_stamp: '',
    end_time_stamp: '',
    minute_interval: 10,
    is_get_data_acquisition_time: '1',
    lang: '_en_US'
  });

  const [dailyForm, setDailyForm] = useState({
    ps_key: psKey || '1589518_1_1_1',
    data_point: 'p2',
    start_date: '',
    end_date: '',
    data_type: '2',
    query_type: '1',
    order: '0'
  });

  const [monthlyForm, setMonthlyForm] = useState({
    ps_key: psKey || '1589518_1_1_1',
    data_point: 'p2',
    start_year: '',
    start_month: '',
    end_year: '',
    end_month: '',
    data_type: '2',
    query_type: '2',
    order: '0'
  });

  const [yearlyForm, setYearlyForm] = useState({
    ps_key: psKey || '1589518_1_1_1',
    data_point: 'p2',
    start_year: '',
    end_year: '',
    data_type: '2',
    query_type: '3',
    order: '0'
  });

  // UI states
  const [selectedParameter, setSelectedParameter] = useState('p24');
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // NEW: Cumulative conversion mode for daily data
  const [conversionMode, setConversionMode] = useState<'cumulative' | 'period'>('period');
  
  // Date/Time states
  const [dateTime, setDateTime] = useState({
    startDate: '',
    startTime: '08:00',
    endDate: '',
    endTime: '18:00'
  });
  
  const [dailyDateRange, setDailyDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const [monthRange, setMonthRange] = useState({
    startYear: '2025',
    startMonth: '01',
    endYear: '2025',
    endMonth: '12'
  });

  const [yearRange, setYearRange] = useState({
    startYear: '2022',
    endYear: '2025'
  });

  // Chart config
  const [chartConfig, setChartConfig] = useState({
    showGrid: true,
    showPoints: true,
    gradient: true,
    animate: true,
    strokeWidth: 2
  });

  // Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const shortMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const shortDayNames = [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ];

  // Handle token change from AutoLogin component
  const handleTokenChange = (newToken: string) => {
    setToken(newToken);
  };

  // Handle device data change from AutoLogin component
  const handleDeviceDataChange = (deviceData: DevicePoint | null) => {
    setDeviceData(deviceData);
  };

  // Update PS Key from context and fetch device data if available
  useEffect(() => {
    if (psKey) {
      setMinuteForm(prev => ({ ...prev, ps_key_list: psKey }));
      setDailyForm(prev => ({ ...prev, ps_key: psKey }));
      setMonthlyForm(prev => ({ ...prev, ps_key: psKey }));
      setYearlyForm(prev => ({ ...prev, ps_key: psKey }));
    }
  }, [psKey]);

  // Initialize dates on mount
  useEffect(() => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Format dates for inputs (YYYY-MM-DD)
    const formatDateForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Format time for inputs (HH:MM)
    const formatTimeForInput = (date: Date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    
    const today = formatDateForInput(now);
    const twoHoursAgoDate = formatDateForInput(twoHoursAgo);
    const twoHoursAgoTime = formatTimeForInput(twoHoursAgo);
    const sevenDaysAgoDate = formatDateForInput(sevenDaysAgo);
    
    // Set default date/time for minute view
    setDateTime({
      startDate: twoHoursAgoDate,
      startTime: twoHoursAgoTime,
      endDate: today,
      endTime: formatTimeForInput(now)
    });

    // Set default date range for daily view (last 7 days)
    setDailyDateRange({
      startDate: sevenDaysAgoDate,
      endDate: today
    });

    // Set daily form dates
    setDailyForm(prev => ({
      ...prev,
      start_date: formatDateForAPI(new Date(sevenDaysAgoDate), '1'),
      end_date: formatDateForAPI(new Date(today), '1')
    }));

    // Convert to timestamp format for minute data API
    const convertToTimestamp = (dateStr: string, timeStr: string): string => {
      const datePart = dateStr.replace(/-/g, '');
      const timePart = timeStr.replace(/:/g, '');
      return `${datePart}${timePart}00`; // Seconds always 00
    };
    
    const startTimestamp = convertToTimestamp(twoHoursAgoDate, twoHoursAgoTime);
    const endTimestamp = convertToTimestamp(today, formatTimeForInput(now));
    
    setMinuteForm(prev => ({
      ...prev,
      start_time_stamp: startTimestamp,
      end_time_stamp: endTimestamp
    }));

    // Set default month range for monthly view (current year)
    const currentYear = now.getFullYear().toString();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    
    setMonthRange({
      startYear: currentYear,
      startMonth: '01',
      endYear: currentYear,
      endMonth: currentMonth
    });

    setMonthlyForm(prev => ({
      ...prev,
      start_year: currentYear,
      start_month: '01',
      end_year: currentYear,
      end_month: currentMonth
    }));

    // Set default year range for yearly view (last 4 years)
    setYearRange({
      startYear: (parseInt(currentYear) - 3).toString(),
      endYear: currentYear
    });

    setYearlyForm(prev => ({
      ...prev,
      start_year: (parseInt(currentYear) - 3).toString(),
      end_year: currentYear
    }));
  }, []);

  // Format date for API based on query_type
  const formatDateForAPI = (date: Date, queryType: string): string => {
    const year = date.getFullYear();
    
    switch (queryType) {
      case '1': // Daily: YYYYMMDD
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
      case '2': // Monthly: YYYYMM
        return `${year}${String(date.getMonth() + 1).padStart(2, '0')}`;
      case '3': // Yearly: YYYY
        return `${year}`;
      default: return `${year}`;
    }
  };

  // Format date from API for display
  const formatDateFromAPI = (dateStr: string, queryType: string): string => {
    switch (queryType) {
      case '1': // Daily: YYYYMMDD -> YYYY-MM-DD
        return `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
      case '2': // Monthly: YYYYMM -> YYYY-MM
        return `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}`;
      case '3': // Yearly: YYYY
        return dateStr;
      default: return dateStr;
    }
  };

  // Convert date/time to timestamp for minute data
  const convertToTimestamp = (date: string, time: string): string => {
    if (!date || !time) return '';
    
    // Ensure time has minutes
    let formattedTime = time;
    if (!formattedTime.includes(':')) {
      formattedTime = `${formattedTime}:00`;
    }
    
    const [hours, minutes] = formattedTime.split(':');
    const formattedDate = date.replace(/-/g, '');
    return `${formattedDate}${hours.padStart(2, '0')}${minutes.padStart(2, '0')}00`; // Seconds always 00
  };

  // Update minute form when date/time changes
  useEffect(() => {
    if (dateTime.startDate && dateTime.startTime && dateTime.endDate && dateTime.endTime) {
      const startTimestamp = convertToTimestamp(dateTime.startDate, dateTime.startTime);
      const endTimestamp = convertToTimestamp(dateTime.endDate, dateTime.endTime);
      
      setMinuteForm(prev => ({
        ...prev,
        start_time_stamp: startTimestamp,
        end_time_stamp: endTimestamp
      }));
    }
  }, [dateTime]);

  // Update daily form when date range changes
  useEffect(() => {
    if (dailyDateRange.startDate && dailyDateRange.endDate) {
      const startDate = new Date(dailyDateRange.startDate);
      const endDate = new Date(dailyDateRange.endDate);
      
      setDailyForm(prev => ({
        ...prev,
        start_date: formatDateForAPI(startDate, '1'),
        end_date: formatDateForAPI(endDate, '1')
      }));
    }
  }, [dailyDateRange]);

  // Update monthly form when month range changes
  useEffect(() => {
    if (monthRange.startYear && monthRange.startMonth && monthRange.endYear && monthRange.endMonth) {
      setMonthlyForm(prev => ({
        ...prev,
        start_year: monthRange.startYear,
        start_month: monthRange.startMonth,
        end_year: monthRange.endYear,
        end_month: monthRange.endMonth
      }));
    }
  }, [monthRange]);

  // Update yearly form when year range changes
  useEffect(() => {
    if (yearRange.startYear && yearRange.endYear) {
      setYearlyForm(prev => ({
        ...prev,
        start_year: yearRange.startYear,
        end_year: yearRange.endYear
      }));
    }
  }, [yearRange]);

  // Fetch minute data
  const fetchMinuteData = async () => {
    if (!token) {
      setError('No login token available. Please login first.');
      return;
    }

    if (!minuteForm.start_time_stamp || !minuteForm.end_time_stamp) {
      setError('Please set valid start and end times');
      return;
    }

    setLoading(prev => ({ ...prev, minute: true }));
    setError('');

    try {
      const requestBody = {
        token: token,
        ps_key_list: minuteForm.ps_key_list.split(',').map(s => s.trim()),
        points: minuteForm.points,
        start_time_stamp: minuteForm.start_time_stamp,
        end_time_stamp: minuteForm.end_time_stamp,
        minute_interval: Number(minuteForm.minute_interval),
        is_get_data_acquisition_time: minuteForm.is_get_data_acquisition_time,
        lang: minuteForm.lang
      };

      console.log('Fetching minute data with:', requestBody);

      const response = await fetch('http://localhost:3000/api/solar/minute-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: MinuteDataResponse = await response.json();
      
      console.log('Minute data response:', result);
      
      if (result.result_code === "1") {
        setMinuteData(result);
        setError('');
      } else {
        setError(`API Error: ${result.result_msg}`);
        setMinuteData(null);
      }
    } catch (err: any) {
      console.error('Minute data fetch error:', err);
      setError(`Fetch error: ${err.message || 'Unknown error'}`);
      setMinuteData(null);
    } finally {
      setLoading(prev => ({ ...prev, minute: false }));
    }
  };

  // Fetch daily data
  const fetchDailyData = async () => {
    if (!token) {
      setError('No login token available. Please login first.');
      return;
    }

    if (!dailyForm.start_date || !dailyForm.end_date) {
      setError('Please set valid start and end dates');
      return;
    }

    setLoading(prev => ({ ...prev, daily: true }));
    setError('');

    try {
      const requestBody = {
        token: token,
        ps_key_list: [dailyForm.ps_key],
        data_point: dailyForm.data_point,
        start_time: dailyForm.start_date,
        end_time: dailyForm.end_date,
        data_type: dailyForm.data_type,
        query_type: dailyForm.query_type,
        order: dailyForm.order
      };

      console.log('Fetching daily data with:', requestBody);

      const response = await fetch('http://localhost:3000/api/solar/historical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: HistoricalDataResponse = await response.json();
      
      console.log('Daily data response:', result);
      
      if (result.result_code === "1") {
        setDailyData(result);
        setError('');
      } else {
        setError(`API Error: ${result.result_msg}`);
        setDailyData(null);
      }
    } catch (err: any) {
      console.error('Daily data fetch error:', err);
      setError(`Fetch error: ${err.message || 'Unknown error'}`);
      setDailyData(null);
    } finally {
      setLoading(prev => ({ ...prev, daily: false }));
    }
  };

  // Fetch monthly data
  const fetchMonthlyData = async () => {
    if (!token) {
      setError('No login token available');
      return;
    }

    setLoading(prev => ({ ...prev, monthly: true }));
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/solar/historical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          ps_key_list: [monthlyForm.ps_key],
          data_point: monthlyForm.data_point,
          start_time: `${monthlyForm.start_year}${monthlyForm.start_month}`,
          end_time: `${monthlyForm.end_year}${monthlyForm.end_month}`,
          data_type: monthlyForm.data_type,
          query_type: monthlyForm.query_type,
          order: monthlyForm.order
        })
      });

      const result: HistoricalDataResponse = await response.json();
      
      if (result.result_code === "1") {
        setMonthlyData(result);
      } else {
        setError('API Error: ' + result.result_msg);
      }
    } catch (err) {
      setError('Fetch error: ' + (err as Error).message);
    } finally {
      setLoading(prev => ({ ...prev, monthly: false }));
    }
  };

  // Fetch yearly data
  const fetchYearlyData = async () => {
    if (!token) {
      setError('No login token available');
      return;
    }

    setLoading(prev => ({ ...prev, yearly: true }));
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/solar/historical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          ps_key_list: [yearlyForm.ps_key],
          data_point: yearlyForm.data_point,
          start_time: yearlyForm.start_year,
          end_time: yearlyForm.end_year,
          data_type: yearlyForm.data_type,
          query_type: yearlyForm.query_type,
          order: yearlyForm.order
        })
      });

      const result: HistoricalDataResponse = await response.json();
      
      if (result.result_code === "1") {
        setYearlyData(result);
      } else {
        setError('API Error: ' + result.result_msg);
      }
    } catch (err) {
      setError('Fetch error: ' + (err as Error).message);
    } finally {
      setLoading(prev => ({ ...prev, yearly: false }));
    }
  };

  // Format minute data for chart
  const formatMinuteData = () => {
    if (!minuteData || !minuteData.result_data) {
      console.log('No minute data available');
      return [];
    }
    
    const psKey = Object.keys(minuteData.result_data)[0];
    if (!psKey) {
      console.log('No PS key in minute data');
      return [];
    }
    
    const dataArray = minuteData.result_data[psKey];
    if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
      console.log('Empty minute data array');
      return [];
    }
    
    console.log(`Formatting ${dataArray.length} minute data points`);
    
    return dataArray.map((item, index) => {
      const time = item.time_stamp;
      let hour = '00';
      let minute = '00';
      
      if (time && time.length >= 12) {
        hour = time.slice(8, 10);
        minute = time.slice(10, 12);
      }
      
      return {
        time: `${hour}:${minute}`,
        fullTime: time,
        date: time?.slice(0, 8) || '',
        p5: parseFloat(item.p5 || '0'),
        p6: parseFloat(item.p6 || '0'),
        p18: parseFloat(item.p18 || '0'),
        p21: parseFloat(item.p21 || '0'),
        p24: parseFloat(item.p24 || '0'),
        [selectedParameter]: parseFloat(item[selectedParameter] || '0')
      };
    });
  };

  // UPDATED: Format cumulative data from API (raw Wh to kWh)
  const formatCumulativeData = (): CumulativeDataItem[] => {
    if (!dailyData || !dailyData.result_data) {
      console.log('No daily data available');
      return [];
    }
    
    const psKey = Object.keys(dailyData.result_data)[0];
    if (!psKey) {
      console.log('No PS key in daily data');
      return [];
    }
    
    const dataPoint = Object.keys(dailyData.result_data[psKey])[0];
    const dataArray = dailyData.result_data[psKey][dataPoint];
    
    if (!dataArray || dataArray.length === 0) return [];

    // Sort data by timestamp chronologically
    const sortedData = [...dataArray].sort((a, b) => a.time_stamp.localeCompare(b.time_stamp));

    return sortedData.map((item, index) => {
      const timestamp = item.time_stamp;
      const formattedDate = formatDateFromAPI(timestamp, '1');
      const valueKey = Object.keys(item).find(key => key !== 'time_stamp');
      
      if (!valueKey) {
        return {
          timestamp,
          date: formattedDate,
          originalWh: 0,
          cumulativeKwh: 0,
          cumulativeWh: 0,
          period: 'Daily',
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
        period: 'Daily',
        isFirstPeriod: index === 0
      };
    });
  };

  // UPDATED: Convert cumulative to period production with FIRST PERIOD AS 0
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
          period: 'Daily',
          growth: 0, // No growth for first period
          calculation: 'First day: Production = 0 kWh (no previous day to compare)',
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
        period: 'Daily',
        growth,
        calculation: `${current.cumulativeKwh.toFixed(2)} kWh - ${previous.cumulativeKwh.toFixed(2)} kWh = ${safePeriodKwh.toFixed(2)} kWh`,
        isFirstPeriod: false
      };
    });
  };

  // Use useMemo for efficient period data calculation
  const periodData = useMemo(() => {
    if (viewMode !== 'daily') return [];
    const cumulativeData = formatCumulativeData();
    console.log('Cumulative Data for Conversion:', cumulativeData);
    const result = convertCumulativeToPeriodProduction(cumulativeData);
    console.log('Period Data with First Period as 0:', result);
    return result;
  }, [dailyData, viewMode]);

  // UPDATED: Format daily data for chart - APPLIED CUMULATIVE CONVERSION LOGIC
  const formatDailyData = (): ExtendedDailyDataItem[] => {
    if (!dailyData || !dailyData.result_data) {
      console.log('No daily data available');
      return [];
    }
    
    const psKey = Object.keys(dailyData.result_data)[0];
    if (!psKey) {
      console.log('No PS key in daily data');
      return [];
    }
    
    const dataPoint = Object.keys(dailyData.result_data[psKey])[0];
    const dataArray = dailyData.result_data[psKey][dataPoint];
    
    if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
      console.log('Empty daily data array');
      return [];
    }
    
    // First, sort the data by date to ensure chronological order
    const sortedData = [...dataArray].sort((a, b) => {
      const aDate = a.time_stamp;
      const bDate = b.time_stamp;
      if (aDate < bDate) return -1;
      if (aDate > bDate) return 1;
      return 0;
    });

    const today = new Date().toISOString().split('T')[0];
    const isEnergyParam = ['p2', 'p87'].includes(dailyForm.data_point);
    
    // If not an energy parameter or in cumulative mode, use simple conversion
    if (!isEnergyParam || conversionMode === 'cumulative') {
      const result: ExtendedDailyDataItem[] = [];
      
      sortedData.forEach((item, index) => {
        const timestamp = item.time_stamp;
        const formattedDate = formatDateFromAPI(timestamp, '1');
        const date = new Date(formattedDate);
        const dayOfWeek = date.getDay();
        const valueKey = Object.keys(item).find(key => key !== 'time_stamp');
        
        if (!valueKey) return;

        const rawValue = item[valueKey];
        const dailyValue = parseFloat(rawValue);
        
        // For energy parameters in cumulative mode, show kWh conversion
        const dailyValueKwh = isEnergyParam ? dailyValue / 1000 : dailyValue;
        
        // For cumulative mode, calculate cumulative sum
        let cumulativeKwh = 0;
        if (conversionMode === 'cumulative' && isEnergyParam) {
          const previousCumulative = index > 0 ? result[index - 1].cumulativeKwh || 0 : 0;
          cumulativeKwh = previousCumulative + dailyValueKwh;
        }

        const dataItem: ExtendedDailyDataItem = {
          date: formattedDate,
          value: dailyValueKwh,
          formattedValue: dailyValueKwh.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }),
          rawValue,
          timestamp,
          formattedDate: `${shortDayNames[dayOfWeek]} ${formattedDate.split('-')[2]}`,
          dayOfWeek: dayNames[dayOfWeek],
          isToday: formattedDate === today,
          growth: '',
          dailyKwh: dailyValueKwh,
          cumulativeKwh,
          formattedCumulativeKwh: cumulativeKwh.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }),
          isEnergyParameter: isEnergyParam,
          isFirstPeriod: index === 0
        };
        
        result.push(dataItem);
      });

      return result.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    }
    
    // For period mode with energy parameters, use period data
    return periodData.map((item, index) => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      
      return {
        date: item.date,
        value: item.periodProductionKwh,
        formattedValue: item.periodProductionKwh.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        rawValue: item.originalWh.toString(),
        timestamp: item.timestamp,
        formattedDate: `${shortDayNames[dayOfWeek]} ${item.date.split('-')[2]}`,
        dayOfWeek: dayNames[dayOfWeek],
        isToday: item.date === today,
        growth: item.growth !== undefined ? item.growth.toString() : '',
        dailyKwh: item.periodProductionKwh,
        cumulativeKwh: item.cumulativeKwh,
        formattedCumulativeKwh: item.cumulativeKwh.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        isEnergyParameter: isEnergyParam,
        isFirstPeriod: item.isFirstPeriod,
        calculation: item.calculation,
        periodProductionKwh: item.periodProductionKwh
      };
    });
  };

  // UPDATED: Format monthly data for chart - APPLIED CUMULATIVE AND Wh TO kWh LOGIC
  const formatMonthlyData = (): MonthlyDataItem[] => {
    if (!monthlyData || !monthlyData.result_data) return [];
    
    const psKey = Object.keys(monthlyData.result_data)[0];
    if (!psKey) return [];
    
    const dataPoint = Object.keys(monthlyData.result_data[psKey])[0];
    const dataArray = monthlyData.result_data[psKey][dataPoint];
    
    if (!dataArray || dataArray.length === 0) return [];

    // First, sort the data by timestamp to ensure chronological order
    const sortedData = [...dataArray].sort((a, b) => {
      const aDate = a.time_stamp;
      const bDate = b.time_stamp;
      if (aDate < bDate) return -1;
      if (aDate > bDate) return 1;
      return 0;
    });

    const result: MonthlyDataItem[] = [];
    let previousCumulativeKwh = 0; // Track previous cumulative in kWh

    sortedData.forEach((item, index) => {
      const timestamp = item.time_stamp;
      const year = timestamp.slice(0, 4);
      const monthNum = parseInt(timestamp.slice(4, 6));
      const valueKey = Object.keys(item).find(key => key !== 'time_stamp');

      if (!valueKey) return;

      // Get the raw cumulative value from API (in Wh)
      const cumulativeValueWh = parseFloat(item[valueKey]);
      
      // STEP 1: Convert from Wh to kWh by dividing by 1000
      const cumulativeValueKwh = cumulativeValueWh / 1000;

      // STEP 2: Calculate monthly production in kWh:
      // Monthly kWh = Current Cumulative kWh - Previous Cumulative kWh
      const monthlyKwh = cumulativeValueKwh - previousCumulativeKwh;

      // Calculate growth percentage based on monthly kWh values
      let growth = '';
      if (index > 0 && result[index - 1].monthlyKwh > 0) {
        const previousMonthlyKwh = result[index - 1].monthlyKwh;
        const growthPercentage = ((monthlyKwh - previousMonthlyKwh) / previousMonthlyKwh) * 100;
        growth = growthPercentage.toFixed(1);
      }

      // Create the data item
      const dataItem: MonthlyDataItem = {
        month: timestamp,
        year,
        monthNum,
        monthlyKwh: monthlyKwh,
        cumulativeKwh: cumulativeValueKwh,
        formattedMonthlyKwh: monthlyKwh.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        rawValue: item[valueKey],
        monthName: monthNames[monthNum - 1],
        date: `${shortMonthNames[monthNum - 1]} ${year}`,
        shortDate: `${shortMonthNames[monthNum - 1]} '${year.slice(2)}`,
        growth,
        // For backward compatibility
        value: monthlyKwh,
        kwhValue: monthlyKwh,
        formattedValue: monthlyKwh.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      };

      result.push(dataItem);
      previousCumulativeKwh = cumulativeValueKwh; // Update for next iteration
    });

    // Sort by year and month
    return result.sort((a, b) => {
      if (a.year !== b.year) return parseInt(a.year) - parseInt(b.year);
      return a.monthNum - b.monthNum;
    });
  };

  // UPDATED: Format yearly data for chart - APPLIED CUMULATIVE AND Wh TO kWh LOGIC
  const formatYearlyData = (): YearlyDataItem[] => {
    if (!yearlyData || !yearlyData.result_data) return [];
    
    const psKey = Object.keys(yearlyData.result_data)[0];
    if (!psKey) return [];
    
    const dataPoint = Object.keys(yearlyData.result_data[psKey])[0];
    const dataArray = yearlyData.result_data[psKey][dataPoint];
    
    if (!dataArray || dataArray.length === 0) return [];

    // First, sort the data by year to ensure chronological order
    const sortedData = [...dataArray].sort((a, b) => {
      const aYear = parseInt(a.time_stamp);
      const bYear = parseInt(b.time_stamp);
      return aYear - bYear;
    });

    const result: YearlyDataItem[] = [];
    let previousCumulativeKwh = 0; // Track previous cumulative in kWh

    sortedData.forEach((item, index) => {
      const year = item.time_stamp;
      const valueKey = Object.keys(item).find(key => key !== 'time_stamp');

      if (!valueKey) return;

      // Get the raw cumulative value from API (in Wh)
      const cumulativeValueWh = parseFloat(item[valueKey]);
      
      // STEP 1: Convert from Wh to kWh by dividing by 1000
      const cumulativeValueKwh = cumulativeValueWh / 1000;

      // STEP 2: Calculate yearly production in kWh:
      // Yearly kWh = Current Cumulative kWh - Previous Cumulative kWh
      const yearlyKwh = cumulativeValueKwh - previousCumulativeKwh;

      // Calculate growth percentage based on yearly kWh values
      let growth = '';
      if (index > 0 && result[index - 1].monthlyKwh > 0) {
        const previousYearlyKwh = result[index - 1].monthlyKwh;
        const growthPercentage = ((yearlyKwh - previousYearlyKwh) / previousYearlyKwh) * 100;
        growth = growthPercentage.toFixed(1);
      }

      // Create the data item
      const dataItem: YearlyDataItem = {
        year,
        monthlyKwh: yearlyKwh, // This is actually yearly total, keeping name for consistency
        cumulativeKwh: cumulativeValueKwh,
        formattedMonthlyKwh: yearlyKwh.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        rawValue: item[valueKey],
        growth,
        formattedYear: year,
        // For backward compatibility
        value: yearlyKwh,
        kwhValue: yearlyKwh,
        formattedValue: yearlyKwh.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      };

      result.push(dataItem);
      previousCumulativeKwh = cumulativeValueKwh; // Update for next iteration
    });

    return result.sort((a, b) => parseInt(a.year) - parseInt(b.year));
  };

  // Get parameter configuration
  const getParamConfig = (param: string) => {
    const configs = {
      p5: { label: 'PV2 Voltage', unit: 'V', icon: Zap, color: '#8884d8', gradient: '#8884d822' },
      p6: { label: 'PV1 Current', unit: 'A', icon: Activity, color: '#82ca9d', gradient: '#82ca9d22' },
      p18: { label: 'Grid Voltage', unit: 'V', icon: Gauge, color: '#ffc658', gradient: '#ffc65822' },
      p21: { label: 'Output Current', unit: 'A', icon: Wind, color: '#ff7300', gradient: '#ff730022' },
      p24: { label: 'Output Power', unit: 'W', icon: Battery, color: '#0088fe', gradient: '#0088fe22' },
      p2: { label: 'Total Energy', unit: 'kWh', icon: Battery, color: '#10B981', gradient: '#10B98122' },
      p1: { label: 'Total Power', unit: 'W', icon: Zap, color: '#3B82F6', gradient: '#3B82F622' },
      p25: { label: 'Temperature', unit: '°C', icon: Thermometer, color: '#EC4899', gradient: '#EC489922' },
      p14: { label: 'Grid Voltage', unit: 'V', icon: Gauge, color: '#9C27B0', gradient: '#9C27B022' },
      p87: { label: 'Today Energy', unit: 'kWh', icon: Sun, color: '#FF9800', gradient: '#FF980022' }
    };
    
    return configs[param as keyof typeof configs] || { 
      label: param, 
      unit: '', 
      icon: Activity, 
      color: '#6B7280',
      gradient: '#6B728022'
    };
  };

  // UPDATED: Calculate statistics - APPLIED CUMULATIVE AND Wh TO kWh LOGIC
  const calculateStats = () => {
    if (viewMode === 'minute') {
      const data = formatMinuteData();
      if (data.length === 0) return null;
      
      const values = data.map(d => d[selectedParameter as keyof typeof data[0]] as number);
      const max = Math.max(...values);
      const min = Math.min(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      
      return {
        max,
        min,
        avg,
        sum,
        count: values.length,
        unit: getParamConfig(selectedParameter).unit
      };
    } else if (viewMode === 'daily') {
      const data = formatDailyData();
      if (data.length === 0) return null;
      
      const values = data.map(d => d.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      const maxItem = data.find(d => d.value === max);
      const minItem = data.find(d => d.value === min);
      
      // Get cumulative total if it's an energy parameter
      const totalCumulativeKwh = data.length > 0 && data[0].isEnergyParameter 
        ? data[data.length - 1].cumulativeKwh || 0 
        : 0;
      
      // Calculate growth for period mode
      let totalGrowth = 0;
      const isEnergyParam = data[0]?.isEnergyParameter || false;
      
      if (conversionMode === 'cumulative' && isEnergyParam) {
        const cumulativeData = formatCumulativeData();
        if (cumulativeData.length >= 2) {
          const firstValue = cumulativeData[0].cumulativeKwh;
          const lastValue = cumulativeData[cumulativeData.length - 1].cumulativeKwh;
          totalGrowth = firstValue > 0 ? ((lastValue - firstValue) / firstValue * 100) : 0;
        }
      } else if (conversionMode === 'period' && isEnergyParam) {
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
        max,
        min,
        avg,
        sum,
        count: values.length,
        maxDate: maxItem ? maxItem.date : '',
        minDate: minItem ? minItem.date : '',
        totalCumulativeKwh,
        totalGrowth,
        nonZeroPeriods: values.filter(v => v > 0).length,
        firstValue: values[0] || 0,
        lastValue: values[values.length - 1] || 0,
        unit: getParamConfig(dailyForm.data_point).unit
      };
    } else if (viewMode === 'monthly') {
      const data = formatMonthlyData();
      if (data.length === 0) return null;

      const monthlyKwhValues = data.map(d => d.monthlyKwh);
      const sum = monthlyKwhValues.reduce((a, b) => a + b, 0);
      const avg = sum / monthlyKwhValues.length;
      const max = Math.max(...monthlyKwhValues);
      const min = Math.min(...monthlyKwhValues);
      const maxMonth = data.find(d => d.monthlyKwh === max);
      const minMonth = data.find(d => d.monthlyKwh === min);

      // Calculate monthly growth based on kWh production (last vs second last)
      let monthlyGrowth = 0;
      if (data.length > 1) {
        const lastMonthValue = data[data.length - 1].monthlyKwh;
        const secondLastMonthValue = data[data.length - 2].monthlyKwh;
        monthlyGrowth = secondLastMonthValue > 0
          ? ((lastMonthValue - secondLastMonthValue) / secondLastMonthValue * 100)
          : 0;
      }

      // Get cumulative totals in kWh
      const totalCumulativeKwh = data.length > 0 ? data[data.length - 1].cumulativeKwh : 0;

      return {
        sum,
        avg,
        max,
        min,
        maxMonth: maxMonth ? `${maxMonth.monthName} ${maxMonth.year}` : '',
        minMonth: minMonth ? `${minMonth.monthName} ${minMonth.year}` : '',
        count: monthlyKwhValues.length,
        monthlyGrowth: monthlyGrowth.toFixed(1),
        totalCumulativeKwh,
        unit: getParamConfig(monthlyForm.data_point).unit
      };
    } else {
      const data = formatYearlyData();
      if (data.length === 0) return null;

      const yearlyKwhValues = data.map(d => d.monthlyKwh); // This is yearly total kWh
      const sum = yearlyKwhValues.reduce((a, b) => a + b, 0);
      const avg = sum / yearlyKwhValues.length;
      const max = Math.max(...yearlyKwhValues);
      const min = Math.min(...yearlyKwhValues);
      const maxYearItem = data.find(d => d.monthlyKwh === max);
      const minYearItem = data.find(d => d.monthlyKwh === min);

      // Calculate yearly growth based on kWh production (last vs second last)
      let yearlyGrowth = 0;
      if (data.length > 1) {
        const lastYearValue = data[data.length - 1].monthlyKwh;
        const secondLastYearValue = data[data.length - 2].monthlyKwh;
        yearlyGrowth = secondLastYearValue > 0
          ? ((lastYearValue - secondLastYearValue) / secondLastYearValue * 100)
          : 0;
      }

      // Get cumulative totals in kWh
      const totalCumulativeKwh = data.length > 0 ? data[data.length - 1].cumulativeKwh : 0;

      return {
        sum,
        avg,
        max,
        min,
        maxYear: maxYearItem ? maxYearItem.year : '',
        minYear: minYearItem ? minYearItem.year : '',
        count: yearlyKwhValues.length,
        yearlyGrowth: yearlyGrowth.toFixed(1),
        totalCumulativeKwh,
        unit: getParamConfig(yearlyForm.data_point).unit
      };
    }
  };

  // UPDATED: Custom Tooltip component for daily data
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      if (viewMode === 'daily' && data.isEnergyParameter) {
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
                      {data.rawValue?.toLocaleString() || (data.value * 1000).toLocaleString()} Wh
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Daily Production:</span>
                    <span className={`font-semibold ${data.isFirstPeriod ? 'text-gray-500' : 'text-green-600'} ml-2`}>
                      {data.periodProductionKwh?.toFixed(2) || data.value?.toFixed(2)} kWh
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cumulative to Date:</span>
                    <span className="font-semibold text-blue-600">
                      {data.cumulativeKwh?.toFixed(2)} kWh
                    </span>
                  </div>
                  {data.growth !== undefined && !data.isFirstPeriod && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Growth:</span>
                      <span className={`font-semibold ${parseFloat(data.growth) > 0 ? 'text-green-600' : parseFloat(data.growth) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {parseFloat(data.growth) > 0 ? '↑' : parseFloat(data.growth) < 0 ? '↓' : '→'} {Math.abs(parseFloat(data.growth))}%
                      </span>
                    </div>
                  )}
                </>
              )}
              
              {data.isFirstPeriod && conversionMode === 'period' && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Info className="w-3 h-3" />
                    <span>First day production set to 0 (no previous day to compare)</span>
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
      
      // Default tooltip for other modes
      return (
        <div className="bg-white p-3 rounded-lg shadow border border-gray-200">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-700">
            {payload[0].name}: {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  // UPDATED: Export data - APPLIED CUMULATIVE AND Wh TO kWh LOGIC
  const exportData = () => {
    if (viewMode === 'minute') {
      const data = formatMinuteData();
      if (data.length === 0) {
        setError('No data to export');
        return;
      }
      
      const headers = ['Time', 'Date', ...minuteForm.points.split(',').map(p => getParamConfig(p).label)];
      const csvContent = [
        headers.join(','),
        ...data.map(row => {
          const values = minuteForm.points.split(',').map(p => row[p as keyof typeof row]);
          return `${row.time},${row.date},${values.join(',')}`;
        })
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `minute-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else if (viewMode === 'daily') {
      const data = formatDailyData();
      if (data.length === 0) {
        setError('No data to export');
        return;
      }
      
      const isEnergy = data[0]?.isEnergyParameter || false;
      const headers = isEnergy 
        ? conversionMode === 'cumulative'
          ? ['Date', 'Day', 'Cumulative (kWh)', 'Cumulative (Wh)', 'Period Type', 'Is First Period']
          : ['Date', 'Day', 'Daily Production (kWh)', 'Cumulative (kWh)', 'Growth %', 'Calculation', 'Original (Wh)', 'Is First Period']
        : ['Date', 'Day', 'Value', 'Raw Value'];
      
      const csvContent = [
        headers.join(','),
        ...(isEnergy 
          ? (conversionMode === 'cumulative'
            ? formatCumulativeData().map(row => 
                `${row.date},${dayNames[new Date(row.date).getDay()]},${row.cumulativeKwh.toFixed(2)},${row.originalWh},Daily,${row.isFirstPeriod ? 'Yes' : 'No'}`
              )
            : periodData.map(row => 
                `${row.date},${dayNames[new Date(row.date).getDay()]},${row.periodProductionKwh.toFixed(2)},${row.cumulativeKwh.toFixed(2)},${row.growth || 0},${row.calculation},${row.originalWh},${row.isFirstPeriod ? 'Yes' : 'No'}`
              )
            )
          : data.map(row => 
              `${row.date},${row.dayOfWeek},${row.value},${row.rawValue}`
            )
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-${conversionMode}-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else if (viewMode === 'monthly') {
      const data = formatMonthlyData();
      if (data.length === 0) {
        setError('No data to export');
        return;
      }
      
      const headers = ['Year', 'Month', 'Monthly Production (kWh)', 'Cumulative Energy (kWh)', 'Growth %', 'Raw Value (Wh)'];
      const csvContent = [
        headers.join(','),
        ...data.map(row => {
          return [
            row.year,
            row.monthName,
            row.monthlyKwh.toFixed(2),
            row.cumulativeKwh.toFixed(2),
            row.growth ? `${row.growth}%` : '0%',
            row.rawValue
          ].join(',');
        })
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly-energy-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else {
      const data = formatYearlyData();
      if (data.length === 0) {
        setError('No data to export');
        return;
      }
      
      const headers = ['Year', 'Yearly Production (kWh)', 'Cumulative Energy (kWh)', 'Growth %', 'Raw Value (Wh)'];
      const csvContent = [
        headers.join(','),
        ...data.map(row => {
          return [
            row.year,
            row.monthlyKwh.toFixed(2),
            row.cumulativeKwh.toFixed(2),
            row.growth ? `${row.growth}%` : '0%',
            row.rawValue
          ].join(',');
        })
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yearly-energy-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  // Quick presets for minute data
  const applyMinutePreset = (preset: 'today' | 'yesterday' | 'last2hours' | 'last24hours') => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    const formatDateForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const formatTimeForInput = (date: Date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    
    switch (preset) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        break;
      case 'yesterday':
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() - 1);
        endDate.setHours(23, 59, 0, 0);
        break;
      case 'last2hours':
        startDate.setHours(now.getHours() - 2);
        endDate = new Date();
        break;
      case 'last24hours':
        startDate.setDate(now.getDate() - 1);
        endDate = new Date();
        break;
    }
    
    setDateTime({
      startDate: formatDateForInput(startDate),
      startTime: formatTimeForInput(startDate),
      endDate: formatDateForInput(endDate),
      endTime: formatTimeForInput(endDate)
    });
  };

  // Quick presets for daily data
  const applyDailyPreset = (preset: 'week' | 'month' | '3months' | '6months' | 'year') => {
    const now = new Date();
    const start = new Date();
    
    switch (preset) {
      case 'week': start.setDate(now.getDate() - 7); break;
      case 'month': start.setMonth(now.getMonth() - 1); break;
      case '3months': start.setMonth(now.getMonth() - 3); break;
      case '6months': start.setMonth(now.getMonth() - 6); break;
      case 'year': start.setFullYear(now.getFullYear() - 1); break;
    }
    
    const formatForDisplay = (date: Date) => date.toISOString().split('T')[0];
    setDailyDateRange({
      startDate: formatForDisplay(start),
      endDate: formatForDisplay(now)
    });
  };

  // Quick presets for monthly data
  const applyMonthPreset = (preset: 'thisYear' | 'lastYear' | 'last6months' | 'yearToDate') => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    switch (preset) {
      case 'thisYear':
        setMonthRange({
          startYear: currentYear.toString(),
          startMonth: '01',
          endYear: currentYear.toString(),
          endMonth: currentMonth.toString().padStart(2, '0')
        });
        break;
      case 'lastYear':
        setMonthRange({
          startYear: (currentYear - 1).toString(),
          startMonth: '01',
          endYear: (currentYear - 1).toString(),
          endMonth: '12'
        });
        break;
      case 'last6months':
        let startMonth = currentMonth - 5;
        let startYear = currentYear;
        if (startMonth < 1) {
          startMonth += 12;
          startYear -= 1;
        }
        setMonthRange({
          startYear: startYear.toString(),
          startMonth: startMonth.toString().padStart(2, '0'),
          endYear: currentYear.toString(),
          endMonth: currentMonth.toString().padStart(2, '0')
        });
        break;
      case 'yearToDate':
        setMonthRange({
          startYear: currentYear.toString(),
          startMonth: '01',
          endYear: currentYear.toString(),
          endMonth: currentMonth.toString().padStart(2, '0')
        });
        break;
    }
  };

  // Quick presets for yearly data
  const applyYearPreset = (preset: 'last5years' | 'last10years' | 'decade' | 'allYears') => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    switch (preset) {
      case 'last5years':
        setYearRange({
          startYear: (currentYear - 4).toString(),
          endYear: currentYear.toString()
        });
        break;
      case 'last10years':
        setYearRange({
          startYear: (currentYear - 9).toString(),
          endYear: currentYear.toString()
        });
        break;
      case 'decade':
        const decadeStart = Math.floor(currentYear / 10) * 10;
        setYearRange({
          startYear: decadeStart.toString(),
          endYear: (decadeStart + 9).toString()
        });
        break;
      case 'allYears':
        setYearRange({
          startYear: '2020',
          endYear: currentYear.toString()
        });
        break;
    }
  };

  // UPDATED: Render chart based on view mode - APPLIED CUMULATIVE AND Wh TO kWh LOGIC
  const renderChart = () => {
    let data: any[] = [];
    let paramConfig: any = {};
    
    if (viewMode === 'minute') {
      data = formatMinuteData();
      paramConfig = getParamConfig(selectedParameter);
    } else if (viewMode === 'daily') {
      data = formatDailyData();
      paramConfig = getParamConfig(dailyForm.data_point);
    } else if (viewMode === 'monthly') {
      data = formatMonthlyData();
      paramConfig = getParamConfig(monthlyForm.data_point);
    } else {
      data = formatYearlyData();
      paramConfig = getParamConfig(yearlyForm.data_point);
    }
    
    console.log(`Rendering ${viewMode} chart with ${data.length} data points`);
    
    if (data.length === 0) {
      return (
        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No data available for chart</p>
            <p className="text-sm text-gray-400 mt-2">
              {viewMode === 'minute' ? 'Load minute data to visualize' : 
               viewMode === 'daily' ? 'Load daily data to visualize' : 
               viewMode === 'monthly' ? 'Load monthly data to visualize' :
               'Load yearly data to visualize'}
            </p>
          </div>
        </div>
      );
    }

    // Prepare chart data based on view mode
    let chartData = data;
    if (viewMode === 'daily') {
      chartData = data.map((item: ExtendedDailyDataItem) => ({
        ...item,
        name: item.formattedDate,
        value: item.value,
        cumulative: item.cumulativeKwh,
        growth: item.growth,
        isEnergyParameter: item.isEnergyParameter,
        isFirstPeriod: item.isFirstPeriod,
        calculation: item.calculation,
        periodProductionKwh: item.periodProductionKwh
      }));
    } else if (viewMode === 'monthly') {
      chartData = data.map((item: MonthlyDataItem) => ({
        ...item,
        name: item.shortDate,
        value: item.monthlyKwh, // Use monthlyKwh for chart
        cumulative: item.cumulativeKwh,
        monthIndex: parseInt(item.year) * 12 + item.monthNum
      })).sort((a: any, b: any) => a.monthIndex - b.monthIndex);
    } else if (viewMode === 'yearly') {
      chartData = data.map((item: YearlyDataItem) => ({
        ...item,
        name: item.year,
        value: item.monthlyKwh, // Use monthlyKwh (yearly total) for chart
        cumulative: item.cumulativeKwh
      }));
    }

    const xAxisDataKey = viewMode === 'minute' ? 'time' : 'name';
    const dataKey = viewMode === 'minute' ? selectedParameter : 'value';

    return (
      <div className={`relative ${isFullScreen ? 'fixed inset-0 z-50 bg-white p-8' : ''}`}>
        {isFullScreen && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setIsFullScreen(false)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <div style={{ height: isFullScreen ? '70vh' : '500px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={paramConfig.color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={paramConfig.color} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={xAxisDataKey} 
                  angle={viewMode === 'monthly' ? -45 : 0}
                  textAnchor={viewMode === 'monthly' ? 'end' : 'middle'}
                  height={viewMode === 'monthly' ? 60 : 40}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => value.toLocaleString()}
                  label={{ 
                    value: `${paramConfig.label} (${paramConfig.unit})`, 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 10,
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip 
                  content={viewMode === 'daily' && chartData[0]?.isEnergyParameter ? <CustomTooltip /> : undefined}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    if (viewMode === 'daily' && props.payload?.isEnergyParameter) {
                      // Handled by CustomTooltip component
                      return [value, name];
                    }
                    if (viewMode === 'monthly' || viewMode === 'yearly') {
                      const payload = props.payload;
                      return [
                        <>
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              {value.toLocaleString(undefined, { maximumFractionDigits: 2 })} {paramConfig.unit}
                            </p>
                            {payload.cumulative && (
                              <p className="text-sm text-blue-600">
                                Cumulative: {payload.cumulative.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh
                              </p>
                            )}
                            {payload.growth && parseFloat(payload.growth) !== 0 && (
                              <p className={`text-sm ${parseFloat(payload.growth) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Growth: {parseFloat(payload.growth) > 0 ? '+' : ''}{payload.growth}%
                              </p>
                            )}
                          </div>
                        </>,
                        name
                      ];
                    }
                    return [
                      <span key="value" className="font-semibold">
                        {value.toLocaleString(undefined, { maximumFractionDigits: 2 })} {paramConfig.unit}
                      </span>,
                      name
                    ];
                  }}
                  labelFormatter={(label) => {
                    if (viewMode === 'minute') {
                      const item = chartData.find((d: any) => d.time === label);
                      return `Time: ${label}${item?.date ? ` (${item.date})` : ''}`;
                    } else if (viewMode === 'daily') {
                      const item = chartData.find((d: any) => d.name === label);
                      return `Date: ${item?.date || label}`;
                    } else if (viewMode === 'monthly') {
                      const item = chartData.find((d: any) => d.name === label);
                      return `Month: ${item?.monthName || label}`;
                    } else {
                      return `Year: ${label}`;
                    }
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey={dataKey}
                  name={`${paramConfig.label} (${paramConfig.unit})`}
                  stroke={paramConfig.color}
                  strokeWidth={chartConfig.strokeWidth}
                  fill={chartConfig.gradient ? "url(#colorValue)" : paramConfig.color}
                  fillOpacity={chartConfig.gradient ? 1 : 0.3}
                  dot={chartConfig.showPoints ? { strokeWidth: 2, r: 3 } : false}
                  activeDot={{ r: 6 }}
                  isAnimationActive={chartConfig.animate}
                />
                {(viewMode === 'daily' && conversionMode === 'period' && chartData[0]?.value === 0 && chartData[0]?.isFirstPeriod) && (
                  <ReferenceLine 
                    x={chartData[0].name}
                    stroke="#6B7280"
                    strokeDasharray="3 3"
                    label={{ 
                      value: 'First day: 0 kWh', 
                      position: 'top',
                      fill: '#6B7280',
                      fontSize: 12
                    }}
                  />
                )}
                {(viewMode === 'daily' || viewMode === 'monthly' || viewMode === 'yearly') && (
                  <Brush dataKey="name" height={30} stroke={paramConfig.color} />
                )}
              </AreaChart>
            ) : chartType === 'line' ? (
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={xAxisDataKey} 
                  angle={viewMode === 'monthly' ? -45 : 0}
                  textAnchor={viewMode === 'monthly' ? 'end' : 'middle'}
                  height={viewMode === 'monthly' ? 60 : 40}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => value.toLocaleString()}
                  label={{ 
                    value: `${paramConfig.label} (${paramConfig.unit})`, 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 10,
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip 
                  content={viewMode === 'daily' && chartData[0]?.isEnergyParameter ? <CustomTooltip /> : undefined}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    if (viewMode === 'daily' && props.payload?.isEnergyParameter) {
                      // Handled by CustomTooltip component
                      return [value, name];
                    }
                    if (viewMode === 'monthly' || viewMode === 'yearly') {
                      const payload = props.payload;
                      return [
                        <>
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              {value.toLocaleString(undefined, { maximumFractionDigits: 2 })} {paramConfig.unit}
                            </p>
                            {payload.cumulative && (
                              <p className="text-sm text-blue-600">
                                Cumulative: {payload.cumulative.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh
                              </p>
                            )}
                            {payload.growth && parseFloat(payload.growth) !== 0 && (
                              <p className={`text-sm ${parseFloat(payload.growth) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Growth: {parseFloat(payload.growth) > 0 ? '+' : ''}{payload.growth}%
                              </p>
                            )}
                          </div>
                        </>,
                        name
                      ];
                    }
                    return [
                      <span key="value" className="font-semibold">
                        {value.toLocaleString(undefined, { maximumFractionDigits: 2 })} {paramConfig.unit}
                      </span>,
                      name
                    ];
                  }}
                  labelFormatter={(label) => {
                    if (viewMode === 'minute') {
                      const item = chartData.find((d: any) => d.time === label);
                      return `Time: ${label}${item?.date ? ` (${item.date})` : ''}`;
                    } else if (viewMode === 'daily') {
                      const item = chartData.find((d: any) => d.name === label);
                      return `Date: ${item?.date || label}`;
                    } else if (viewMode === 'monthly') {
                      const item = chartData.find((d: any) => d.name === label);
                      return `Month: ${item?.monthName || label}`;
                    } else {
                      return `Year: ${label}`;
                    }
                  }}
                />
                <Legend />
                <Area 
                  type="linear" 
                  dataKey={dataKey}
                  name={`${paramConfig.label} (${paramConfig.unit})`}
                  stroke={paramConfig.color}
                  strokeWidth={chartConfig.strokeWidth}
                  fill={paramConfig.color}
                  fillOpacity={0.3}
                  dot={chartConfig.showPoints ? { strokeWidth: 2, r: 3 } : false}
                  activeDot={{ r: 6 }}
                  isAnimationActive={chartConfig.animate}
                />
                {(viewMode === 'daily' || viewMode === 'monthly' || viewMode === 'yearly') && (
                  <Brush dataKey="name" height={30} stroke={paramConfig.color} />
                )}
              </AreaChart>
            ) : (
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={paramConfig.color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={paramConfig.color} stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={xAxisDataKey} 
                  angle={viewMode === 'monthly' ? -45 : 0}
                  textAnchor={viewMode === 'monthly' ? 'end' : 'middle'}
                  height={viewMode === 'monthly' ? 60 : 40}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => value.toLocaleString()}
                  label={{ 
                    value: `${paramConfig.label} (${paramConfig.unit})`, 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 10,
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip 
                  content={viewMode === 'daily' && chartData[0]?.isEnergyParameter ? <CustomTooltip /> : undefined}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    if (viewMode === 'daily' && props.payload?.isEnergyParameter) {
                      // Handled by CustomTooltip component
                      return [value, name];
                    }
                    if (viewMode === 'monthly' || viewMode === 'yearly') {
                      const payload = props.payload;
                      return [
                        <>
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              {value.toLocaleString(undefined, { maximumFractionDigits: 2 })} {paramConfig.unit}
                            </p>
                            {payload.cumulative && (
                              <p className="text-sm text-blue-600">
                                Cumulative: {payload.cumulative.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh
                              </p>
                            )}
                            {payload.growth && parseFloat(payload.growth) !== 0 && (
                              <p className={`text-sm ${parseFloat(payload.growth) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Growth: {parseFloat(payload.growth) > 0 ? '+' : ''}{payload.growth}%
                              </p>
                            )}
                          </div>
                        </>,
                        name
                      ];
                    }
                    return [
                      <span key="value" className="font-semibold">
                        {value.toLocaleString(undefined, { maximumFractionDigits: 2 })} {paramConfig.unit}
                      </span>,
                      name
                    ];
                  }}
                  labelFormatter={(label) => {
                    if (viewMode === 'minute') {
                      const item = chartData.find((d: any) => d.time === label);
                      return `Time: ${label}${item?.date ? ` (${item.date})` : ''}`;
                    } else if (viewMode === 'daily') {
                      const item = chartData.find((d: any) => d.name === label);
                      return `Date: ${item?.date || label}`;
                    } else if (viewMode === 'monthly') {
                      const item = chartData.find((d: any) => d.name === label);
                      return `Month: ${item?.monthName || label}`;
                    } else {
                      return `Year: ${label}`;
                    }
                  }}
                />
                <Legend />
                <Area 
                  type="linear" 
                  dataKey={dataKey}
                  name={`${paramConfig.label} (${paramConfig.unit})`}
                  stroke={paramConfig.color}
                  strokeWidth={chartConfig.strokeWidth}
                  fill="url(#colorBar)"
                  fillOpacity={0.8}
                  dot={chartConfig.showPoints ? { strokeWidth: 2, r: 3 } : false}
                  activeDot={{ r: 6 }}
                  isAnimationActive={chartConfig.animate}
                />
                {(viewMode === 'daily' || viewMode === 'monthly' || viewMode === 'yearly') && (
                  <Brush dataKey="name" height={30} stroke={paramConfig.color} />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // UPDATED: Render statistics - APPLIED CUMULATIVE AND Wh TO kWh LOGIC
  const renderStats = () => {
    const stats = calculateStats();
    if (!stats) return null;

    let paramConfig = { unit: '', label: '' };
    if (viewMode === 'minute') {
      paramConfig = getParamConfig(selectedParameter);
    } else if (viewMode === 'daily') {
      paramConfig = getParamConfig(dailyForm.data_point);
    } else if (viewMode === 'monthly') {
      paramConfig = getParamConfig(monthlyForm.data_point);
    } else {
      paramConfig = getParamConfig(yearlyForm.data_point);
    }

    // For daily view with energy parameters
    if (viewMode === 'daily' && stats.totalCumulativeKwh) {
      const dailyData = formatDailyData();
      const isEnergyParam = dailyData[0]?.isEnergyParameter || false;
      
      if (isEnergyParam) {
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Maximum</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-500">{paramConfig.unit}</p>
              {stats.maxDate && (
                <p className="text-xs text-gray-400 mt-1">{stats.maxDate}</p>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />
                <span className="text-sm text-gray-600">Minimum</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-500">{paramConfig.unit}</p>
              {stats.minDate && (
                <p className="text-xs text-gray-400 mt-1">{stats.minDate}</p>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">
                  {conversionMode === 'cumulative' ? 'Latest Cumulative' : 'Total Production'}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {conversionMode === 'cumulative' 
                  ? stats.totalCumulativeKwh.toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : stats.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-500">
                {conversionMode === 'cumulative' ? 'kWh' : paramConfig.unit}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600">Days Analyzed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
              <p className="text-sm text-gray-500">
                Non-zero: {stats.nonZeroPeriods}
              </p>
            </div>
          </div>
        );
      }
    }

    // For monthly and yearly views
    if (viewMode === 'monthly' || viewMode === 'yearly') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">Maximum</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500">{paramConfig.unit}</p>
            {stats.maxMonth && (
              <p className="text-xs text-gray-400 mt-1">{stats.maxMonth}</p>
            )}
            {stats.maxYear && (
              <p className="text-xs text-gray-400 mt-1">{stats.maxYear}</p>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />
              <span className="text-sm text-gray-600">Minimum</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500">{paramConfig.unit}</p>
            {stats.minMonth && (
              <p className="text-xs text-gray-400 mt-1">{stats.minMonth}</p>
            )}
            {stats.minYear && (
              <p className="text-xs text-gray-400 mt-1">{stats.minYear}</p>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">Total Production</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500">{paramConfig.unit}</p>
            {stats.totalCumulativeKwh && (
              <p className="text-xs text-blue-600 mt-1">
                Cumulative: {stats.totalCumulativeKwh.toFixed(2)} kWh
              </p>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-600">
                {viewMode === 'monthly' ? 'Monthly Growth' : 'Yearly Growth'}
              </span>
            </div>
            <p className={`text-2xl font-bold ${
              parseFloat(viewMode === 'monthly' ? stats.monthlyGrowth : stats.yearlyGrowth || '0') > 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {parseFloat(viewMode === 'monthly' ? stats.monthlyGrowth : stats.yearlyGrowth || '0') > 0 ? '+' : ''}
              {(viewMode === 'monthly' ? stats.monthlyGrowth : stats.yearlyGrowth) || '0'}%
            </p>
            <p className="text-sm text-gray-500">
              {viewMode === 'monthly' ? 'vs previous month' : 'vs previous year'}
            </p>
          </div>
        </div>
      );
    }

    // For daily view with non-energy parameters or minute view
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">Maximum</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500">{paramConfig.unit}</p>
          {stats.maxDate && (
            <p className="text-xs text-gray-400 mt-1">{stats.maxDate}</p>
          )}
          {stats.maxMonth && (
            <p className="text-xs text-gray-400 mt-1">{stats.maxMonth}</p>
          )}
          {stats.maxYear && (
            <p className="text-xs text-gray-400 mt-1">{stats.maxYear}</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />
            <span className="text-sm text-gray-600">Minimum</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500">{paramConfig.unit}</p>
          {stats.minDate && (
            <p className="text-xs text-gray-400 mt-1">{stats.minDate}</p>
          )}
          {stats.minMonth && (
            <p className="text-xs text-gray-400 mt-1">{stats.minMonth}</p>
          )}
          {stats.minYear && (
            <p className="text-xs text-gray-400 mt-1">{stats.minYear}</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">Average</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500">{paramConfig.unit}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-600">Data Points</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
          <p className="text-sm text-gray-500">samples</p>
        </div>
      </div>
    );
  };

  // Get fetch function based on view mode
  const getFetchFunction = () => {
    switch (viewMode) {
      case 'minute': return fetchMinuteData;
      case 'daily': return fetchDailyData;
      case 'monthly': return fetchMonthlyData;
      case 'yearly': return fetchYearlyData;
      default: return fetchMinuteData;
    }
  };

  // Get loading state based on view mode
  const getLoadingState = () => {
    switch (viewMode) {
      case 'minute': return loading.minute;
      case 'daily': return loading.daily;
      case 'monthly': return loading.monthly;
      case 'yearly': return loading.yearly;
      default: return false;
    }
  };

  return (
    <div className={`min-h-screen ${isFullScreen ? 'overflow-hidden' : 'bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6'}`}>
      {!isFullScreen && (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <ArrowUpDown className="w-8 h-8 text-blue-600" />
                  Combined Data Analytics
                  {(viewMode === 'daily' || viewMode === 'monthly' || viewMode === 'yearly') && (
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Wh→kWh then Calculate Production
                    </span>
                  )}
                  {viewMode === 'daily' && conversionMode === 'period' && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      First day = 0 kWh
                    </span>
                  )}
                </h1>
                <p className="text-gray-600 mt-2">
                  {viewMode === 'daily' 
                    ? conversionMode === 'period'
                      ? 'API data in Wh → Convert to kWh (÷1000) → Daily Production = Current Cumulative - Previous Cumulative (First day = 0 kWh)'
                      : 'API data in Wh → Convert to kWh (÷1000) → Show Cumulative Energy'
                    : viewMode === 'monthly' || viewMode === 'yearly'
                    ? 'API data in Wh → Convert to kWh (÷1000) → Production = Current Cumulative - Previous Cumulative'
                    : 'Switch between minute, daily, monthly, and yearly area graphs with datetime selection'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Conversion Mode Toggle for Daily View */}
                {viewMode === 'daily' && (
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setConversionMode('period')}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          conversionMode === 'period'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Daily Production
                      </button>
                      <button
                        onClick={() => setConversionMode('cumulative')}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          conversionMode === 'cumulative'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Cumulative
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Token Status from AutoLogin */}
                {token && (
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-900">Logged In</p>
                      <p className="text-xs text-gray-500 truncate">Token: {token.substring(0, 20)}...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
                <button
                  onClick={() => setViewMode('minute')}
                  className={`px-6 py-3 rounded-md font-medium transition flex items-center gap-2 ${
                    viewMode === 'minute'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  Minute Data
                </button>
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-6 py-3 rounded-md font-medium transition flex items-center gap-2 ${
                    viewMode === 'daily'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  Daily Data
                  {viewMode === 'daily' && (
                    <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                      kWh Calc
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-6 py-3 rounded-md font-medium transition flex items-center gap-2 ${
                    viewMode === 'monthly'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  Monthly Data
                  {viewMode === 'monthly' && (
                    <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                      kWh Calc
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setViewMode('yearly')}
                  className={`px-6 py-3 rounded-md font-medium transition flex items-center gap-2 ${
                    viewMode === 'yearly'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <CalendarDays className="w-5 h-5" />
                  Yearly Data
                  {viewMode === 'yearly' && (
                    <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                      kWh Calc
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Current Selection Info */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Device</span>
                <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                  {psKey || 'Not selected'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                {viewMode === 'minute' ? (
                  <>
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Time Range</span>
                    <span className="text-sm text-gray-900">
                      {dateTime.startDate} {dateTime.startTime} - {dateTime.endDate} {dateTime.endTime}
                    </span>
                  </>
                ) : viewMode === 'daily' ? (
                  <>
                    <Sun className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Date Range</span>
                    <span className="text-sm text-gray-900">
                      {dailyDateRange.startDate} - {dailyDateRange.endDate}
                    </span>
                  </>
                ) : viewMode === 'monthly' ? (
                  <>
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Month Range</span>
                    <span className="text-sm text-gray-900">
                      {monthNames[parseInt(monthRange.startMonth) - 1]} {monthRange.startYear} - {monthNames[parseInt(monthRange.endMonth) - 1]} {monthRange.endYear}
                    </span>
                  </>
                ) : (
                  <>
                    <CalendarDays className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Year Range</span>
                    <span className="text-sm text-gray-900">
                      {yearRange.startYear} - {yearRange.endYear}
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Activity className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Parameter</span>
                <span className="text-sm text-gray-900">
                  {viewMode === 'minute' 
                    ? getParamConfig(selectedParameter).label
                    : viewMode === 'daily'
                    ? getParamConfig(dailyForm.data_point).label
                    : viewMode === 'monthly'
                    ? getParamConfig(monthlyForm.data_point).label
                    : getParamConfig(yearlyForm.data_point).label}
                </span>
              </div>

              {/* Serial Number Display */}
              {deviceData && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Cpu className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">SN</span>
                  <span className="text-sm text-gray-900 font-mono">
                    {deviceData.device_sn}
                  </span>
                </div>
              )}

              {/* Conversion Mode Display */}
              {viewMode === 'daily' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Calculator className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700">Conversion</span>
                  <span className="text-sm text-gray-900">
                    {conversionMode === 'cumulative' ? 'Wh → kWh' : 'Cumulative → Daily'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Panel - Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* AutoLogin Component */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Server className="w-5 h-5 text-gray-600" />
                  Authentication & Device
                </h3>
                <AutoLogin 
                  onTokenChange={handleTokenChange}
                  onDeviceDataChange={handleDeviceDataChange}
                />
              </div>

              {/* Configuration Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  {viewMode === 'minute' ? 'Minute Data Config' : 
                   viewMode === 'daily' ? 'Daily Data Config' : 
                   viewMode === 'monthly' ? 'Monthly Data Config' :
                   'Yearly Data Config'}
                </h3>
                
                {viewMode === 'minute' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={dateTime.startDate}
                          onChange={(e) => setDateTime(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={dateTime.startTime}
                          onChange={(e) => setDateTime(prev => ({ ...prev, startTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          step="60"
                        />
                        <p className="text-xs text-gray-500 mt-1">Seconds: 00</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={dateTime.endDate}
                          onChange={(e) => setDateTime(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={dateTime.endTime}
                          onChange={(e) => setDateTime(prev => ({ ...prev, endTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          step="60"
                        />
                        <p className="text-xs text-gray-500 mt-1">Seconds: 00</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minute Interval
                      </label>
                      <select
                        value={minuteForm.minute_interval}
                        onChange={(e) => setMinuteForm(prev => ({ ...prev, minute_interval: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">60 minutes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Parameter
                      </label>
                      <select
                        value={selectedParameter}
                        onChange={(e) => setSelectedParameter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        <option value="p24">Output Power (p24)</option>
                        <option value="p5">PV2 Voltage (p5)</option>
                        <option value="p6">PV1 Current (p6)</option>
                        <option value="p18">Grid Voltage (p18)</option>
                        <option value="p21">Output Current (p21)</option>
                      </select>
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Presets
                      </label>
                     
                    </div>
                  </div>
                ) : viewMode === 'daily' ? (
                  <div className="space-y-4">
                    {/* Conversion Mode Selection */}
                    <div>
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
                          <p className="font-semibold">Daily Production</p>
                          <p className="text-xs text-gray-500">Current - Previous calculation</p>
                          <div className="text-xs text-gray-600 mt-1">
                            Formula: P = C<sub>n</sub> - C<sub>n-1</sub>
                          </div>
                          <div className="text-xs text-amber-600 mt-1">
                            First day = 0 kWh
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={dailyDateRange.startDate}
                          onChange={(e) => setDailyDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={dailyDateRange.endDate}
                          onChange={(e) => setDailyDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Point
                      </label>
                      <select
                        value={dailyForm.data_point}
                        onChange={(e) => setDailyForm(prev => ({ ...prev, data_point: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        <option value="p2">Total Energy (p2) - kWh Calculation</option>
                        <option value="p1">Total Power (p1)</option>
                        <option value="p24">Output Power (p24)</option>
                        <option value="p18">Grid Voltage (p18)</option>
                        <option value="p21">Output Current (p21)</option>
                        <option value="p25">Temperature (p25)</option>
                        <option value="p87">Today Energy (p87) - kWh Calculation</option>
                        <option value="p14">Grid Voltage (p14)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {['p2', 'p87'].includes(dailyForm.data_point) 
                          ? 'Will calculate cumulative energy and growth' 
                          : 'No cumulative calculation'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Type
                      </label>
                      <select
                        value={dailyForm.data_type}
                        onChange={(e) => setDailyForm(prev => ({ ...prev, data_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        <option value="2">Peak Values</option>
                        <option value="4">Total Values</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {dailyForm.data_type === '2' ? 'Returns peak values for each day' : 'Returns total values for each day'}
                      </p>
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Presets
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => applyDailyPreset('week')}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          Last Week
                        </button>
                        <button
                          onClick={() => applyDailyPreset('month')}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          Last Month
                        </button>
                        <button
                          onClick={() => applyDailyPreset('3months')}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          Last 3 Months
                        </button>
                        <button
                          onClick={() => applyDailyPreset('year')}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          Last Year
                        </button>
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'monthly' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Month
                        </label>
                        <select
                          value={monthRange.startMonth}
                          onChange={(e) => setMonthRange(prev => ({ ...prev, startMonth: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                              {monthNames[i]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Year
                        </label>
                        <select
                          value={monthRange.startYear}
                          onChange={(e) => setMonthRange(prev => ({ ...prev, startYear: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = new Date().getFullYear() - 5 + i;
                            return (
                              <option key={year} value={year.toString()}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Month
                        </label>
                        <select
                          value={monthRange.endMonth}
                          onChange={(e) => setMonthRange(prev => ({ ...prev, endMonth: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                              {monthNames[i]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Year
                        </label>
                        <select
                          value={monthRange.endYear}
                          onChange={(e) => setMonthRange(prev => ({ ...prev, endYear: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = new Date().getFullYear() - 5 + i;
                            return (
                              <option key={year} value={year.toString()}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Point
                      </label>
                      <select
                        value={monthlyForm.data_point}
                        onChange={(e) => setMonthlyForm(prev => ({ ...prev, data_point: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        <option value="p2">Total Energy (p2) - kWh Calculation</option>
                        <option value="p1">Total Power (p1)</option>
                        <option value="p24">Output Power (p24)</option>
                        <option value="p18">Grid Voltage (p18)</option>
                        <option value="p21">Output Current (p21)</option>
                        <option value="p25">Temperature (p25)</option>
                      </select>
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Presets
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => applyMonthPreset('thisYear')}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          This Year
                        </button>
                        <button
                          onClick={() => applyMonthPreset('lastYear')}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          Last Year
                        </button>
                        <button
                          onClick={() => applyMonthPreset('last6months')}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          Last 6 Months
                        </button>
                        <button
                          onClick={() => applyMonthPreset('yearToDate')}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          Year to Date
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Year
                        </label>
                        <select
                          value={yearRange.startYear}
                          onChange={(e) => setYearRange(prev => ({ ...prev, startYear: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                          {Array.from({ length: 15 }, (_, i) => {
                            const year = new Date().getFullYear() - 10 + i;
                            return (
                              <option key={year} value={year.toString()}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Year
                        </label>
                        <select
                          value={yearRange.endYear}
                          onChange={(e) => setYearRange(prev => ({ ...prev, endYear: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                          {Array.from({ length: 15 }, (_, i) => {
                            const year = new Date().getFullYear() - 10 + i;
                            return (
                              <option key={year} value={year.toString()}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Point
                      </label>
                      <select
                        value={yearlyForm.data_point}
                        onChange={(e) => setYearlyForm(prev => ({ ...prev, data_point: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        <option value="p2">Total Energy (p2) - kWh Calculation</option>
                        <option value="p1">Total Power (p1)</option>
                        <option value="p24">Output Power (p24)</option>
                        <option value="p18">Grid Voltage (p18)</option>
                        <option value="p21">Output Current (p21)</option>
                        <option value="p25">Temperature (p25)</option>
                        <option value="p87">Today Energy (p87)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Type
                      </label>
                      <select
                        value={yearlyForm.data_type}
                        onChange={(e) => setYearlyForm(prev => ({ ...prev, data_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        <option value="2">Peak Values</option>
                        <option value="4">Total Values</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {yearlyForm.data_type === '2' ? 'Returns yearly peak values' : 'Returns yearly total values'}
                      </p>
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Presets
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => applyYearPreset('last5years')}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          Last 5 Years
                        </button>
                        <button
                          onClick={() => applyYearPreset('last10years')}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          Last 10 Years
                        </button>
                        <button
                          onClick={() => applyYearPreset('decade')}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          Current Decade
                        </button>
                        <button
                          onClick={() => applyYearPreset('allYears')}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          All Years
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fetch Button */}
                <button
                  onClick={getFetchFunction()}
                  disabled={getLoadingState() || !token}
                  className={`w-full mt-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    getLoadingState() || !token
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {getLoadingState() ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {viewMode === 'minute' ? 'Loading Minute Data...' : 
                       viewMode === 'daily' ? 'Loading Daily Data...' : 
                       viewMode === 'monthly' ? 'Loading Monthly Data...' :
                       'Loading Yearly Data...'}
                    </>
                  ) : (
                    <>
                      {viewMode === 'minute' ? <Clock className="w-5 h-5" /> :
                       viewMode === 'daily' ? <Sun className="w-5 h-5" /> :
                       viewMode === 'monthly' ? <Calendar className="w-5 h-5" /> :
                       <CalendarDays className="w-5 h-5" />}
                      {viewMode === 'minute' ? 'Fetch Minute Data' : 
                       viewMode === 'daily' ? 'Fetch Daily Data' : 
                       viewMode === 'monthly' ? 'Fetch Monthly Data' :
                       'Fetch Yearly Data'}
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

                {/* Debug info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-1">Data Info:</p>
                  <p className="text-xs text-gray-600">
                    {viewMode === 'minute' ? `Data Points: ${minuteData ? formatMinuteData().length : 0}` :
                     viewMode === 'daily' ? `Data Points: ${dailyData ? formatDailyData().length : 0}` :
                     viewMode === 'monthly' ? `Data Points: ${monthlyData ? formatMonthlyData().length : 0}` :
                     `Data Points: ${yearlyData ? formatYearlyData().length : 0}`}
                  </p>
                  {viewMode === 'minute' && (
                    <>
                      <p className="text-xs text-gray-600">
                        Start: {minuteForm.start_time_stamp || 'Not set'}
                      </p>
                      <p className="text-xs text-gray-600">
                        End: {minuteForm.end_time_stamp || 'Not set'}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Chart Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  Chart Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chart Type
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setChartType('area')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                          chartType === 'area'
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <TrendingUp className="w-4 h-4" />
                        Area
                      </button>
                      <button
                        onClick={() => setChartType('line')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                          chartType === 'line'
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <LineChartIcon className="w-4 h-4" />
                        Line
                      </button>
                      <button
                        onClick={() => setChartType('bar')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                          chartType === 'bar'
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                        Bar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Show Grid</span>
                      <button
                        onClick={() => setChartConfig(prev => ({ ...prev, showGrid: !prev.showGrid }))}
                        className={`w-12 h-6 rounded-full transition ${
                          chartConfig.showGrid ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transform transition ${
                          chartConfig.showGrid ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Show Points</span>
                      <button
                        onClick={() => setChartConfig(prev => ({ ...prev, showPoints: !prev.showPoints }))}
                        className={`w-12 h-6 rounded-full transition ${
                          chartConfig.showPoints ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transform transition ${
                          chartConfig.showPoints ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Use Gradient</span>
                      <button
                        onClick={() => setChartConfig(prev => ({ ...prev, gradient: !prev.gradient }))}
                        className={`w-12 h-6 rounded-full transition ${
                          chartConfig.gradient ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transform transition ${
                          chartConfig.gradient ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Animations</span>
                      <button
                        onClick={() => setChartConfig(prev => ({ ...prev, animate: !prev.animate }))}
                        className={`w-12 h-6 rounded-full transition ${
                          chartConfig.animate ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transform transition ${
                          chartConfig.animate ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stroke Width: {chartConfig.strokeWidth}px
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={chartConfig.strokeWidth}
                      onChange={(e) => setChartConfig(prev => ({ ...prev, strokeWidth: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
             

              {/* Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5" ref={chartContainerRef}>
                {renderChart()}
              </div>

              {/* Statistics */}
              {renderStats()}

              {/* Data Table */}
              {((viewMode === 'minute' && minuteData) || 
                (viewMode === 'daily' && dailyData) || 
                (viewMode === 'monthly' && monthlyData) ||
                (viewMode === 'yearly' && yearlyData)) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {viewMode === 'minute' ? 'Minute Data Table' : 
                     viewMode === 'daily' ? 'Daily Data Table' : 
                     viewMode === 'monthly' ? 'Monthly Data Table' :
                     'Yearly Data Table'}
                  </h3>
                  
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          {viewMode === 'minute' ? (
                            <>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Time</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Output Power (W)</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">PV2 Voltage (V)</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">PV1 Current (A)</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Grid Voltage (V)</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Output Current (A)</th>
                            </>
                          ) : viewMode === 'daily' ? (
                            (() => {
                              const data = formatDailyData();
                              const isEnergy = data[0]?.isEnergyParameter || false;
                              return (
                                <>
                                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Date</th>
                                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Day</th>
                                  {isEnergy ? (
                                    conversionMode === 'cumulative' ? (
                                      <>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Cumulative (kWh)</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Cumulative (Wh)</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Period Type</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Status</th>
                                      </>
                                    ) : (
                                      <>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Production (kWh)</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Cumulative (kWh)</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Growth %</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Calculation</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Status</th>
                                      </>
                                    )
                                  ) : (
                                    <>
                                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Value</th>
                                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Raw Value</th>
                                    </>
                                  )}
                                </>
                              );
                            })()
                          ) : viewMode === 'monthly' ? (
                            <>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Month</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Monthly Production (kWh)</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Cumulative (kWh)</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Raw API Value (Wh)</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Monthly Growth</th>
                            </>
                          ) : (
                            <>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Year</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Yearly Production (kWh)</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Cumulative (kWh)</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Raw API Value (Wh)</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Yearly Growth</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {viewMode === 'minute' ? (
                          formatMinuteData().map((row, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">{row.time}</td>
                              <td className="py-3 px-4">{row.p24.toFixed(2)}</td>
                              <td className="py-3 px-4">{row.p5.toFixed(2)}</td>
                              <td className="py-3 px-4">{row.p6.toFixed(2)}</td>
                              <td className="py-3 px-4">{row.p18.toFixed(2)}</td>
                              <td className="py-3 px-4">{row.p21.toFixed(2)}</td>
                            </tr>
                          ))
                        ) : viewMode === 'daily' ? (
                          (() => {
                            const data = formatDailyData();
                            const isEnergy = data[0]?.isEnergyParameter || false;
                            
                            return data.map((row, index) => (
                              <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 ${row.isFirstPeriod ? 'bg-gray-50' : ''}`}>
                                <td className="py-3 px-4">
                                  {row.date}
                                  {row.isFirstPeriod && (
                                    <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                      First
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span>{row.dayOfWeek}</span>
                                    {row.isToday && (
                                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                        Today
                                      </span>
                                    )}
                                  </div>
                                </td>
                                {isEnergy ? (
                                  conversionMode === 'cumulative' ? (
                                    <>
                                      <td className="py-3 px-4 text-sm text-blue-700 font-semibold">
                                        {row.cumulativeKwh?.toFixed(2) || '0'}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-800">
                                        {row.rawValue?.toLocaleString() || '0'}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-600">
                                        Daily
                                      </td>
                                      <td className="py-3 px-4">
                                        {row.isFirstPeriod ? (
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
                                      <td className={`py-3 px-4 text-sm font-semibold ${row.isFirstPeriod ? 'text-gray-500' : 'text-green-700'}`}>
                                        {row.periodProductionKwh?.toFixed(2) || row.value?.toFixed(2) || '0'}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-blue-700">
                                        {row.cumulativeKwh?.toFixed(2) || '0'}
                                      </td>
                                      <td className="py-3 px-4">
                                        {row.growth && parseFloat(row.growth) !== 0 && !row.isFirstPeriod ? (
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                            parseFloat(row.growth) > 0
                                              ? 'bg-green-100 text-green-800'
                                              : parseFloat(row.growth) < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                          }`}>
                                            {parseFloat(row.growth) > 0 ? '↑' : parseFloat(row.growth) < 0 ? '↓' : '→'} {Math.abs(parseFloat(row.growth))}
                                          </span>
                                        ) : (
                                          <span className="text-sm text-gray-400">—</span>
                                        )}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                                        {row.calculation || '—'}
                                      </td>
                                      <td className="py-3 px-4">
                                        {row.isFirstPeriod ? (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                            First day: 0 kWh
                                          </span>
                                        ) : (
                                          <span className="text-sm text-gray-400">—</span>
                                        )}
                                      </td>
                                    </>
                                  )
                                ) : (
                                  <>
                                    <td className="py-3 px-4">{row.formattedValue}</td>
                                    <td className="py-3 px-4 font-mono text-sm">{row.rawValue}</td>
                                  </>
                                )}
                              </tr>
                            ));
                          })()
                        ) : viewMode === 'monthly' ? (
                          formatMonthlyData().map((row, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-600">
                                      {shortMonthNames[row.monthNum - 1]}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{row.monthName}</p>
                                    <p className="text-sm text-gray-500">{row.year}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-bold text-gray-900 text-lg">
                                  {row.formattedMonthlyKwh}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Monthly kWh
                                </p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-bold text-blue-700 text-lg">
                                  {row.cumulativeKwh.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500">Cumulative kWh</p>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-bold text-gray-700 text-sm">
                                    {parseFloat(row.rawValue).toLocaleString()} Wh
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    API raw value
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {row.growth && parseFloat(row.growth) !== 0 && (
                                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                                    parseFloat(row.growth) > 0
                                      ? 'bg-green-100 text-green-800'
                                      : parseFloat(row.growth) < 0
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    <TrendingUp className={`w-4 h-4 mr-1 ${
                                      parseFloat(row.growth) > 0 ? 'text-green-600' : 'text-red-600'
                                    }`} />
                                    {parseFloat(row.growth) > 0 ? '+' : ''}{row.growth}%
                                  </div>
                                )}
                                {(!row.growth || parseFloat(row.growth) === 0) && (
                                  <span className="text-sm text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          formatYearlyData().map((row, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-600">
                                      {row.year}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">Year {row.year}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-bold text-gray-900 text-lg">
                                  {row.formattedMonthlyKwh}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Yearly kWh
                                </p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-bold text-blue-700 text-lg">
                                  {row.cumulativeKwh.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500">Cumulative kWh</p>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-bold text-gray-700 text-sm">
                                    {parseFloat(row.rawValue).toLocaleString()} Wh
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    API raw value
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {row.growth && parseFloat(row.growth) !== 0 && (
                                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                                    parseFloat(row.growth) > 0
                                      ? 'bg-green-100 text-green-800'
                                      : parseFloat(row.growth) < 0
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    <TrendingUp className={`w-4 h-4 mr-1 ${
                                      parseFloat(row.growth) > 0 ? 'text-green-600' : 'text-red-600'
                                    }`} />
                                    {parseFloat(row.growth) > 0 ? '+' : ''}{row.growth}%
                                  </div>
                                )}
                                {(!row.growth || parseFloat(row.growth) === 0) && (
                                  <span className="text-sm text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {isFullScreen && renderChart()}
    </div>
  );
};

export default CombinedAreaChart;