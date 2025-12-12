// types/inverter.ts
export interface DevicePoint {
  ps_key: string;
  uuid: number;
  p1: string | null;  // Total Power
  p2: string | null;  // Total Energy
  p4: string | null;  // PV1 Voltage
  p5: string | null;  // PV2 Voltage
  p6: string | null;  // PV1 Current
  p14: string | null; // Grid Voltage
  p18: string | null; // Grid Frequency
  p21: string | null; // Output Current
  p24: string | null; // Output Power
  p25: string | null; // Temperature
  p26: string | null; // Operation Hours
  p27: string | null; // Power Factor
  p43: string | null; // PV1 Power
  p87: string | null; // Today Energy
  p88: string | null; // Total Energy (alternative)
  device_name: string;
  device_sn: string;
  dev_status: number;
  dev_fault_status: number;
  device_time: string;
  communication_dev_sn: string;
  [key: string]: any;
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

export interface GraphDataPoint {
  timestamp: Date;
  time: string;
  power: number;      // p1
  voltage: number;    // p14
  current: number;    // p21
  frequency: number;  // p18
  temperature: number; // p25
  outputPower: number; // p24
  pvPower: number;    // p43
  todayEnergy: number; // p87
}