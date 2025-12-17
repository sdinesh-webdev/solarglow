// Interfaces
export interface MinuteDataPoint {
  time_stamp: string;
  p5?: string;
  p6?: string;
  p18?: string;
  p21?: string;
  p24?: string;
  pST001?: string;
  [key: string]: string | undefined;
}

export interface MinuteDataResponse {
  req_serial_num: string;
  result_code: string;
  result_msg: string;
  result_data: {
    [ps_key: string]: MinuteDataPoint[];
  };
}

export interface HistoricalDataPoint {
  [key: string]: string;
  time_stamp: string;
}

export interface HistoricalDataResponse {
  req_serial_num: string;
  result_code: string;
  result_msg: string;
  result_data: {
    [ps_key: string]: {
      [data_point: string]: HistoricalDataPoint[];
    };
  };
}

// UPDATED: Modified interfaces to include cumulative and monthly kWh calculations
export interface MonthlyDataItem {
  month: string;
  year: string;
  monthNum: number;
  monthlyKwh: number; // Monthly production in kWh (after subtraction)
  cumulativeKwh: number; // Cumulative value in kWh (after conversion from Wh)
  formattedMonthlyKwh: string;
  rawValue: string;
  monthName: string;
  date: string;
  shortDate: string;
  growth?: string; // Growth percentage from previous month's monthly value
  value?: number; // For backward compatibility
  kwhValue?: number; // For backward compatibility
  formattedValue?: string; // For backward compatibility
}

export interface MinuteDataRow {
  time: string;
  p24: number;
  p5: number;
  p6: number;
  p18: number;
  p21: number;
}

export interface DailyDataRow {
  date: string;
  dayOfWeek: string;
  formattedValue: string;
  rawValue: string;
  isEnergyParameter?: boolean;
  isFirstPeriod?: boolean;
  isToday?: boolean;
  cumulativeKwh?: number;
  periodProductionKwh?: number;
  growth?: string;
  calculation?: string;
}

export interface MonthlyDataRow {
  monthName: string;
  year: string;
  monthNum: number;
  formattedMonthlyKwh: string;
  cumulativeKwh: number;
  rawValue: string;
  growth?: string;
}

export interface YearlyDataRow {
  year: string;
  formattedMonthlyKwh: string;
  cumulativeKwh: number;
  rawValue: string;
  growth?: string;
}

export interface DataTableProps {
  viewMode: 'minute' | 'daily' | 'monthly' | 'yearly';
  minuteData: any;
  dailyData: any;
  monthlyData: any;
  yearlyData: any;
  conversionMode: 'cumulative' | 'period';
}

export interface DailyDataItem {
  date: string;
  value: number;
  formattedValue: string;
  rawValue: string;
  timestamp: string;
  formattedDate: string;
  dayOfWeek: string;
  isToday?: boolean;
}

// UPDATED: Modified interface to include cumulative calculations
export interface YearlyDataItem {
  year: string;
  monthlyKwh: number; // Yearly total of monthly kWh production
  cumulativeKwh: number; // Cumulative value at end of year in kWh
  formattedMonthlyKwh: string;
  rawValue: string;
  growth?: string; // Growth percentage from previous year
  value?: number; // For backward compatibility
  kwhValue?: number; // For backward compatibility
  formattedValue?: string; // For backward compatibility
  formattedYear: string;
}

export interface LoginResponse {
  result_code: string;
  result_msg: string;
  result_data: {
    token: string;
    user_name: string;
    email: string;
    [key: string]: any;
  } | null;
}

export interface DevicePoint {
  ps_key: string;
  uuid: number;
  p1: string | null;
  p2: string | null;
  p4: string | null;
  p5: string | null;
  p6: string | null;
  p14: string | null;
  p15: string | null;
  p16: string | null;
  p17: string | null;
  p18: string | null;
  p19: string | null;
  p20: string | null;
  p21: string | null;
  p22: string | null;
  p23: string | null;
  p24: string | null;
  p25: string | null;
  p26: string | null;
  p27: string | null;
  p43: string | null;
  p87: string | null;
  p88: string | null;
  device_name: string;
  device_sn: string;
  dev_status: number;
  dev_fault_status: number;
  device_time: string;
  communication_dev_sn: string;
}

export interface DeviceDataResponse {
  req_serial_num: string;
  result_code: string;
  result_msg: string;
  result_data: {
    fail_sn_list: any[];
    device_point_list: Array<{
      device_point: DevicePoint;
    }>;
  };
}

// Form state types
export interface MinuteFormState {
  ps_key_list: string;
  points: string;
  start_time_stamp: string;
  end_time_stamp: string;
  minute_interval: number;
  is_get_data_acquisition_time: string;
  lang: string;
}

export interface DailyFormState {
  ps_key: string;
  data_point: string;
  start_date: string;
  end_date: string;
  data_type: string;
  query_type: string;
  order: string;
}

export interface MonthlyFormState {
  ps_key: string;
  data_point: string;
  start_year: string;
  start_month: string;
  end_year: string;
  end_month: string;
  data_type: string;
  query_type: string;
  order: string;
}

export interface YearlyFormState {
  ps_key: string;
  data_point: string;
  start_year: string;
  end_year: string;
  data_type: string;
  query_type: string;
  order: string;
}

// UI state types
export interface DateTimeState {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export interface DailyDateRangeState {
  startDate: string;
  endDate: string;
}

export interface MonthRangeState {
  startYear: string;
  startMonth: string;
  endYear: string;
  endMonth: string;
}

export interface YearRangeState {
  startYear: string;
  endYear: string;
}

export interface ChartConfigState {
  showGrid: boolean;
  showPoints: boolean;
  gradient: boolean;
  animate: boolean;
  strokeWidth: number;
}

export interface LoadingState {
  login: boolean;
  minute: boolean;
  daily: boolean;
  monthly: boolean;
  yearly: boolean;
  device: boolean;
}

// Parameter configuration type
export interface ParamConfig {
  label: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
}

// Chart data point types
export interface MinuteChartDataPoint {
  time: string;
  fullTime: string;
  date: string;
  p5: number;
  p6: number;
  p18: number;
  p21: number;
  p24: number;
  [key: string]: number | string;
}

export interface DailyChartDataPoint {
  name: string;
  value: number;
  date: string;
  dayOfWeek: string;
  isToday?: boolean;
}

export interface MonthlyChartDataPoint {
  name: string;
  value: number;
  cumulative: number;
  monthIndex: number;
  monthName: string;
  year: string;
  growth?: string;
}

export interface YearlyChartDataPoint {
  name: string;
  value: number;
  cumulative: number;
  year: string;
  growth?: string;
}

// Statistics types
export interface MinuteStats {
  max: number;
  min: number;
  avg: number;
  sum: number;
  count: number;
  unit: string;
}

export interface DailyStats {
  max: number;
  min: number;
  avg: number;
  sum: number;
  count: number;
  maxDate: string;
  minDate: string;
  unit: string;
}

export interface MonthlyStats {
  sum: number;
  avg: number;
  max: number;
  min: number;
  maxMonth: string;
  minMonth: string;
  count: number;
  monthlyGrowth: string;
  trendSlope: string;
  totalCumulativeKwh: number;
  unit: string;
}

export interface YearlyStats {
  sum: number;
  avg: number;
  max: number;
  min: number;
  maxYear: string;
  minYear: string;
  count: number;
  yearlyGrowth: string;
  totalCumulativeKwh: number;
  unit: string;
}

export interface CumulativeDataItem {
  timestamp: string;
  date: string;
  originalWh: number; // API value in Wh
  cumulativeKwh: number; // Converted to kWh
  cumulativeWh: number; // Original in Wh (for reference)
  period: string;
  isFirstPeriod: boolean; // Flag to identify first period
}

export interface PeriodDataItem {
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

export type ViewMode = 'minute' | 'daily' | 'monthly' | 'yearly';
export type ChartType = 'area' | 'line' | 'bar';