// components/MinuteDataChart.tsx - Updated to access ps_key from context
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDeviceContext } from '../context/DeviceContext'; // Add this import

interface MinuteDataPoint {
  time_stamp: string;
  p5?: string;
  p6?: string;
  p18?: string;
  p21?: string;
  p24?: string;
  pST001?: string;
  [key: string]: string | undefined;
}

interface MinuteDataResponse {
  req_serial_num: string;
  result_code: string;
  result_msg: string;
  result_data: {
    [ps_key: string]: MinuteDataPoint[];
  };
}

const MinuteDataChart: React.FC = () => {
  // Get ps_key from context
  const { psKey } = useDeviceContext(); // Add this line
  
  // State for data
  const [data, setData] = useState<MinuteDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedParameter, setSelectedParameter] = useState('p24');
  const [token, setToken] = useState('');
  
  // Form states for minute data
  const [formData, setFormData] = useState({
    ps_key_list: psKey || '1589518_1_1_1', // Use psKey from context
    points: 'p5,p6,p18,p21,p24',
    start_time_stamp: '20251211080000',
    end_time_stamp: '20251211105000',
    minute_interval: 10,
    is_get_data_acquisition_time: '1',
    lang: '_en_US'
  });

  // Update formData when psKey changes
  useEffect(() => {
    if (psKey) {
      setFormData(prev => ({
        ...prev,
        ps_key_list: psKey
      }));
    }
  }, [psKey]);

  // Auto-login on component mount
  useEffect(() => {
    handleLogin();
  }, []);

  // Login function
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/solar/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_account: 'sahoo@rbpindia.com',
          user_password: 'rbpindia@2025'
        })
      });
      
      const result = await response.json();
      if (result.result_code === "1") {
        setToken(result.result_data.token);
        console.log('Login successful');
        console.log('Using ps_key from context:', psKey);
      } else {
        setError('Login failed: ' + result.result_msg);
      }
    } catch (err) {
      setError('Login error: ' + (err as Error).message);
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

  // Format date to YYYYMMDD
  const getTodayDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  };

  // Format date to YYYYMMDDHHmmss from 2 hours ago
  const getTwoHoursAgo = () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const year = twoHoursAgo.getFullYear();
    const month = String(twoHoursAgo.getMonth() + 1).padStart(2, '0');
    const day = String(twoHoursAgo.getDate()).padStart(2, '0');
    const hours = String(twoHoursAgo.getHours()).padStart(2, '0');
    const minutes = String(twoHoursAgo.getMinutes()).padStart(2, '0');
    const seconds = String(twoHoursAgo.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  };

  // Fetch minute data
  const fetchMinuteData = async () => {
    if (!token) {
      setError('No login token available');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/solar/minute-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          ps_key_list: formData.ps_key_list.split(',').map(s => s.trim()),
          points: formData.points,
          start_time_stamp: formData.start_time_stamp,
          end_time_stamp: formData.end_time_stamp,
          minute_interval: Number(formData.minute_interval),
          is_get_data_acquisition_time: formData.is_get_data_acquisition_time,
          lang: formData.lang
        })
      });

      const result: MinuteDataResponse = await response.json();
      
      if (result.result_code === "1") {
        setData(result);
      } else {
        setError('API Error: ' + result.result_msg);
      }
    } catch (err) {
      setError('Fetch error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Format time from YYYYMMDDHHmmss to HH:mm
  const formatTime = (timestamp: string) => {
    return timestamp.slice(8, 10) + ':' + timestamp.slice(10, 12);
  };

  // Get formatted data for the chart
  const getChartData = () => {
    if (!data || !data.result_data) return [];
    
    const psKey = Object.keys(data.result_data)[0];
    if (!psKey) return [];
    
    return data.result_data[psKey].map(item => ({
      time: formatTime(item.time_stamp),
      p24: parseFloat(item.p24 || '0'),
      p5: parseFloat(item.p5 || '0'),
      p6: parseFloat(item.p6 || '0'),
      p18: parseFloat(item.p18 || '0'),
      p21: parseFloat(item.p21 || '0')
    }));
  };

  // Get parameter label
  const getParamLabel = (param: string) => {
    const labels: { [key: string]: string } = {
      p5: 'PV2 Voltage (V)',
      p6: 'PV1 Current (A)',
      p18: 'Grid Voltage (V)',
      p21: 'Output Current (A)',
      p24: 'Output Power (W)'
    };
    return labels[param] || param;
  };

  // Get parameter color
  const getParamColor = (param: string) => {
    const colors: { [key: string]: string } = {
      p5: '#8884d8',  // Purple
      p6: '#82ca9d',  // Green
      p18: '#ffc658', // Yellow
      p21: '#ff7300', // Orange
      p24: '#0088fe'  // Blue
    };
    return colors[param] || '#8884d8';
  };

  // Calculate statistics
  const getStats = () => {
    const chartData = getChartData();
    if (chartData.length === 0) return null;
    
    const values = chartData.map(item => item[selectedParameter as keyof typeof chartData[0]] as number);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const total = values.reduce((a, b) => a + b, 0);
    
    return { max, min, avg, total, count: values.length };
  };

  const stats = getStats();
  const chartData = getChartData();

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Inverter Minute Data (10-minute intervals)</h1>
      
      {/* Display current ps_key from context */}
      <div style={{ 
        background: '#e8f5e9', 
        padding: '10px', 
        borderRadius: '5px',
        marginBottom: '20px',
        color: 'black'
      }}>
        <p><strong>Current PS Key from DeviceData:</strong> {psKey || 'Not shared yet'}</p>
        <p><small>This value is automatically shared from the DeviceData component</small></p>
      </div>
      
      {/* Controls and Form */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '5px',
        marginBottom: '20px',
        color: 'black'
      }}>
        <h3>Fetch Minute Data</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              PS Key List:
            </label>
            <input
              type="text"
              name="ps_key_list"
              value={formData.ps_key_list}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px' }}
              placeholder="Enter PS Key"
            />
            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
              Auto-filled from DeviceData: {psKey ? psKey : 'No PS Key shared yet'}
            </small>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Points to Fetch:
            </label>
            <input
              type="text"
              name="points"
              value={formData.points}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px' }}
              placeholder="e.g., p5,p6,p18,p21,p24"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Start Time (YYYYMMDDHHmmss):
            </label>
            <input
              type="text"
              name="start_time_stamp"
              value={formData.start_time_stamp}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px' }}
              placeholder="YYYYMMDDHHmmss"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              End Time (YYYYMMDDHHmmss):
            </label>
            <input
              type="text"
              name="end_time_stamp"
              value={formData.end_time_stamp}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px' }}
              placeholder="YYYYMMDDHHmmss"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Minute Interval:
            </label>
            <select
              name="minute_interval"
              value={formData.minute_interval}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Language:
            </label>
            <input
              type="text"
              name="lang"
              value={formData.lang}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label>Select Parameter to Display: </label>
            <select 
              value={selectedParameter} 
              onChange={(e) => setSelectedParameter(e.target.value)}
              style={{ padding: '5px', marginLeft: '10px' }}
            >
              <option value="p24">Output Power (p24)</option>
              <option value="p5">PV2 Voltage (p5)</option>
              <option value="p6">PV1 Current (p6)</option>
              <option value="p18">Grid Voltage (p18)</option>
              <option value="p21">Output Current (p21)</option>
            </select>
          </div>
          
          <button 
            onClick={fetchMinuteData} 
            disabled={loading || !token}
            style={{ 
              padding: '8px 16px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Loading...' : 'Fetch Minute Data'}
          </button>
          
          <button 
            onClick={handleLogin} 
            style={{ 
              padding: '8px 16px', 
              background: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px' 
            }}
          >
            Refresh Token
          </button>
          
          {/* Quick Time Presets */}
          <button 
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                start_time_stamp: getTwoHoursAgo(),
                end_time_stamp: getTodayDateTime()
              }));
            }}
            style={{ 
              padding: '8px 16px', 
              background: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px' 
            }}
          >
            Last 2 Hours
          </button>
        </div>
        
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <span>Token: {token ? `${token.substring(0, 30)}...` : 'Not logged in'}</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '5px', color: 'black' }}>
            <div style={{ fontSize: '12px', color: '#1976d2' }}>Maximum</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.max.toFixed(1)}</div>
          </div>
          
          <div style={{ background: '#f3e5f5', padding: '15px', borderRadius: '5px', color: 'black' }}>
            <div style={{ fontSize: '12px', color: '#7b1fa2' }}>Minimum</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.min.toFixed(1)}</div>
          </div>
          
          <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '5px', color: 'black' }}>
            <div style={{ fontSize: '12px', color: '#2e7d32' }}>Average</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.avg.toFixed(1)}</div>
          </div>
          
          <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '5px', color: 'black' }}>
            <div style={{ fontSize: '12px', color: '#f57c00' }}>Data Points</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.count}</div>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2>{getParamLabel(selectedParameter)} over Time</h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="time" 
                  stroke="#666"
                  tick={{ fill: '#666' }}
                />
                <YAxis 
                  stroke="#666"
                  tick={{ fill: '#666' }}
                  label={{ 
                    value: getParamLabel(selectedParameter),
                    angle: -90,
                    position: 'insideLeft',
                    offset: -10
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '5px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey={selectedParameter}
                  stroke={getParamColor(selectedParameter)}
                  fill={getParamColor(selectedParameter)}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  dot={{ strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table */}
      {chartData.length > 0 && (
        <div>
          <h3>Detailed Data</h3>
          <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f5f5f5' }}>
                <tr>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Time</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Output Power (W)</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>PV2 Voltage (V)</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>PV1 Current (A)</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Grid Voltage (V)</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Output Current (A)</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, index) => (
                  <tr key={index}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.time}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.p24}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.p5}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.p6}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.p18}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.p21}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw JSON */}
      {data && (
        <details style={{ marginTop: '30px' }}>
          <summary style={{ cursor: 'pointer', color: '#007bff' }}>View Raw JSON Response</summary>
          <pre style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            overflow: 'auto',
            maxHeight: '300px',
            fontSize: '12px',
            border: '1px solid #dee2e6',
            borderRadius: '5px',
            marginTop: '10px',
            color: 'black'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default MinuteDataChart;