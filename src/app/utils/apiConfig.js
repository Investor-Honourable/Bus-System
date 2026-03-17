// Dynamic API URL configuration
// This ensures the app works both on localhost and when accessed from other devices

const getApiBaseUrl = () => {
  // In production, use relative paths
  if (import.meta.env.PROD) {
    return '';
  }
  
  // In development, use the current host
  const protocol = window.location.protocol;
  const host = window.location.hostname;
  
  // Check if we're accessing via network IP (not localhost)
  if (host !== 'localhost' && host !== '127.0.0.1') {
    // Accessing from another device - use network IP
    return `${protocol}//${host}`;
  }
  
  // Local development - use localhost
  return 'http://localhost';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiEndpoint = (path) => {
  return `${API_BASE_URL}/Bus_system/api${path}`;
};
