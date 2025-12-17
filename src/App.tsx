import React from 'react';
import CombinedAreaChart from './components/Combined/CombinedAreaChart';

import { DeviceProvider } from './context/DeviceContext';

const App: React.FC = () => {
  return (
    <DeviceProvider>
      <div className='w-dvw p-5'>
      
        <CombinedAreaChart />
      </div>
    </DeviceProvider>
  );
};

export default App;