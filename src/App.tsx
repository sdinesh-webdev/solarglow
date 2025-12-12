import React from 'react';
import LoginDisplay from './components/LoginDisplay';
import DeviceData from './components/DeviceData';
import HistoricalDataChart from './components/HistoricalDataChart';
import MinuteDataChart from './components/MinutedataChart';
import SimpleMonthData from './components/MonthlyenergyAnalytics';
import YearlyEnergyData from './components/YearlyEnergyData';
import { DeviceProvider } from './context/DeviceContext';

const App: React.FC = () => {
  return (
   <DeviceProvider>
     <div>
      <h1>Solar Cloud API Integration</h1>
      <LoginDisplay />
      <DeviceData />
      <HistoricalDataChart />
      <MinuteDataChart />
      <SimpleMonthData />
      <YearlyEnergyData />
    </div>
   </DeviceProvider>
  );
};

export default App;