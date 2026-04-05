// Dynamic API URL configuration
// This ensures the app works both on localhost and when accessed from other devices

const getApiBaseUrl = () => {
  // Use relative paths for API calls - this works in all environments
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiEndpoint = (path) => {
  return `${API_BASE_URL}/api${path}`;
};
