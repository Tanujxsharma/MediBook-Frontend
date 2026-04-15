import { getAuthToken } from './auth';

const API_GATEWAY = 'http://localhost:8087';

export const fetchApi = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_GATEWAY}${endpoint}`, {
    ...options,
    headers,
  });

  const responseText = await response.text();
  let responseData = null;

  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
  }

  if (!response.ok) {
    const message =
      typeof responseData === 'object' && responseData?.message
        ? responseData.message
        : `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }

  return responseData;
};
