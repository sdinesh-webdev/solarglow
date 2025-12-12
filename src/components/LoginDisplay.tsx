import React, { useState, useEffect } from 'react';

interface LoginSuccessData {
  user_master_org_id: string;
  mobile_tel: string | null;
  user_name: string;
  language: string;
  token: string;
  err_times: string;
  user_id: string;
  login_state: string;
  disable_time: string | null;
  country_name: string;
  user_account: string;
  user_master_org_name: string;
  email: string;
  country_id: string;
}

interface LoginResponse {
  req_serial_num?: string; // Optional because error responses don't have it
  result_code: string;
  result_msg: string;
  result_data: LoginSuccessData | null;
}

interface LoginError {
  error: string;
  details?: any;
}

const LoginDisplay: React.FC = () => {
  const [responseData, setResponseData] = useState<LoginResponse | null>(null);
  const [error, setError] = useState<LoginError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    
    try {
      const response = await fetch('http://localhost:3000/api/solar/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_account: 'sahoo@rbpindia.com',
          user_password: 'rbpindia@2025'
        })
      });

      const data: LoginResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setResponseData(data);
      
      // Check if the API returned an error in its response
      if (data.result_code !== "1") {
        setError({
          error: `API Error: ${data.result_msg}`,
          details: data
        });
      }
      
      console.log('Login response:', data);
    } catch (err: any) {
      setError({
        error: err.message,
        details: err
      });
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on component mount
  useEffect(() => {
    handleLogin();
  }, []);

  const handleRefresh = () => {
    handleLogin();
  };

  if (loading) {
    return (
      <div>
        <h2>Solar Cloud Login</h2>
        <p>Loading login data... (Attempt: {retryCount})</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Solar Cloud Login Response</h2>
      
      <button onClick={handleRefresh} style={{ marginBottom: '20px' }}>
        Retry Login
      </button>
      
      {error && (
        <div>
          <h3>Error Occurred:</h3>
          <p><strong>Error Message:</strong> {error.error}</p>
          {error.details && (
            <div>
              <h4>Error Details:</h4>
              <pre>{JSON.stringify(error.details, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
      
      {responseData && !error && (
        <div>
          <h3>API Response</h3>
          <p><strong>Result Code:</strong> {responseData.result_code}</p>
          <p><strong>Result Message:</strong> {responseData.result_msg}</p>
          {responseData.req_serial_num && (
            <p><strong>Request ID:</strong> {responseData.req_serial_num}</p>
          )}
          
          {/* Safely check if result_data exists before accessing its properties */}
          {responseData.result_data ? (
            <div>
              <h4>User Data:</h4>
              <p><strong>User ID:</strong> {responseData.result_data.user_id}</p>
              <p><strong>Name:</strong> {responseData.result_data.user_name}</p>
              <p><strong>Email:</strong> {responseData.result_data.email}</p>
              <p><strong>Account:</strong> {responseData.result_data.user_account}</p>
              <p><strong>Organization:</strong> {responseData.result_data.user_master_org_name}</p>
              <p><strong>Country:</strong> {responseData.result_data.country_name}</p>
              <p><strong>Language:</strong> {responseData.result_data.language}</p>
              <p><strong>Token (first 20 chars):</strong> {responseData.result_data.token.substring(0, 20)}...</p>
            </div>
          ) : (
            <p>No user data returned from API</p>
          )}
          
          <div>
            <h4>Full Response JSON:</h4>
            <pre>{JSON.stringify(responseData, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginDisplay;