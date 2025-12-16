import react, { createContext, useState, useContext, ReactNode } from 'react';
import { DevicePoint } from '../types/solarData';


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