import React from 'react';
import DeviceData from './components/DeviceData';
import CombinedAreaChart from './components/CombinedAreaChart';
import MonthlyEnergyAnalytics from './components/MonthlyenergyAnalytics';
import CumulativeEnergyDisplay from './components/CumulativeEnergyDisplay';
import HistoricalDataChart from './components/HistoricalDataChart';
import { DeviceProvider } from './context/DeviceContext';

const App: React.FC = () => {
  return (
    <DeviceProvider>
      <div className='w-dvw p-5'>
        <DeviceData />
        <MonthlyEnergyAnalytics />
        <CumulativeEnergyDisplay />
        <CombinedAreaChart />
        <HistoricalDataChart />
      </div>
    </DeviceProvider>
  );
};

export default App;