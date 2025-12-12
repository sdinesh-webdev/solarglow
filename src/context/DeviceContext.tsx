import react, { createContext, useState, useContext, ReactNode } from 'react';


interface DevicePoint {
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

interface DeviceContextType {
    deviceData: DevicePoint | null;
    setDeviceData: (data: DevicePoint | null) => void;
    psKey: string | null;
    setPsKey: (key: string) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const useDeviceContext = () => {
    const context = useContext(DeviceContext);
    if (!context) {
        throw new Error('useDeviceContext must be used within DeviceProvider');
    }
    return context;
};

interface DeviceProviderProps {
    children: ReactNode;
}

export const DeviceProvider: react.FC<DeviceProviderProps> = ({ children }) => {
    const [deviceData, setDeviceData] = useState<DevicePoint | null>(null);
    const [psKey, setPsKey] = useState<string | null>(null);

    return (
        <DeviceContext.Provider value={{ deviceData, setDeviceData, psKey, setPsKey}}>
            {children}
        </DeviceContext.Provider>
    )
}