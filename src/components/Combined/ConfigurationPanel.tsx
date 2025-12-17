// components/ConfigurationPanel.tsx
import React from 'react';
import { 
  Settings, 
  AlertCircle, 
  Clock, 
  Sun, 
  Calendar, 
  CalendarDays,
} from 'lucide-react';

interface ConfigurationPanelProps {
  viewMode: 'minute' | 'daily' | 'monthly' | 'yearly';
  conversionMode: 'cumulative' | 'period';
  setConversionMode: (mode: 'cumulative' | 'period') => void;
  
  // Minute data props
  dateTime: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  };
  setDateTime: React.Dispatch<React.SetStateAction<{
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  }>>;
  minuteForm: {
    minute_interval: number;
  };
  setMinuteForm: React.Dispatch<React.SetStateAction<any>>;
  selectedParameter: string;
  setSelectedParameter: (param: string) => void;
  
  // Daily data props
  dailyDateRange: {
    startDate: string;
    endDate: string;
  };
  setDailyDateRange: React.Dispatch<React.SetStateAction<{
    startDate: string;
    endDate: string;
  }>>;
  dailyForm: {
    data_point: string;
    data_type: string;
  };
  setDailyForm: React.Dispatch<React.SetStateAction<any>>;
  applyDailyPreset: (preset: 'week' | 'month' | '3months' | 'year') => void;
  
  // Monthly data props
  monthRange: {
    startYear: string;
    startMonth: string;
    endYear: string;
    endMonth: string;
  };
  setMonthRange: React.Dispatch<React.SetStateAction<{
    startYear: string;
    startMonth: string;
    endYear: string;
    endMonth: string;
  }>>;
  monthlyForm: {
    data_point: string;
  };
  setMonthlyForm: React.Dispatch<React.SetStateAction<any>>;
  applyMonthPreset: (preset: 'thisYear' | 'lastYear' | 'last6months' | 'yearToDate') => void;
  
  // Yearly data props
  yearRange: {
    startYear: string;
    endYear: string;
  };
  setYearRange: React.Dispatch<React.SetStateAction<{
    startYear: string;
    endYear: string;
  }>>;
  yearlyForm: {
    data_point: string;
    data_type: string;
  };
  setYearlyForm: React.Dispatch<React.SetStateAction<any>>;
  applyYearPreset: (preset: 'last5years' | 'last10years' | 'decade' | 'allYears') => void;
  
  // Common props
  token: string;
  loading: any;
  error: string;
  getFetchFunction: () => () => void;
  getLoadingState: () => boolean;
  minuteData: any;
  dailyData: any;
  monthlyData: any;
  yearlyData: any;
  formatMinuteData: () => any[];
  formatDailyData: () => any[];
  formatMonthlyData: () => any[];
  formatYearlyData: () => any[];
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  viewMode,
 
  dateTime,
  setDateTime,
  minuteForm,
  setMinuteForm,
  selectedParameter,
  setSelectedParameter,
  dailyDateRange,
  setDailyDateRange,
  dailyForm,
  setDailyForm,

  monthRange,
  setMonthRange,
  monthlyForm,
  setMonthlyForm,

  yearRange,
  setYearRange,
  yearlyForm,
  setYearlyForm,

  token,
  error,
  getFetchFunction,
  getLoadingState,
}) => {
  return (
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

          {/* <div>
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
          </div> */}
        </div>
      ) : viewMode === 'daily' ? (
        <div className="space-y-4">
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

    </div>
  );
};

export default ConfigurationPanel;