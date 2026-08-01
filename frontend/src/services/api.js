const BASE_URL = '/api/v1';

let authToken = localStorage.getItem('token') || null;

export const setAuthHeader = (token) => {
  authToken = token;
};

const getHeaders = (customHeaders = {}) => {
  const headers = {};
  
  // Do not set Content-Type if we're sending FormData (browser does it automatically)
  if (!(customHeaders['Content-Type'] === 'multipart/form-data')) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Remove multi-part header to let the browser set boundary correctly
  const filteredHeaders = { ...headers, ...customHeaders };
  if (filteredHeaders['Content-Type'] === 'multipart/form-data') {
    delete filteredHeaders['Content-Type'];
  }
  
  return filteredHeaders;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.detail || 'HTTP request failed');
    error.status = response.status;
    error.response = { data: errorData };
    throw error;
  }
  
  // Return parsed JSON
  return { data: await response.json() };
};

export const api = {
  get: async (url, options = {}) => {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      method: 'GET',
      headers: getHeaders(options.headers || {}),
    });
    return handleResponse(response);
  },
  
  post: async (url, body, options = {}) => {
    let requestBody = body;
    if (body && !(body instanceof FormData)) {
      requestBody = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      method: 'POST',
      headers: getHeaders(options.headers || {}),
      body: requestBody,
    });
    return handleResponse(response);
  },
  
  put: async (url, body, options = {}) => {
    let requestBody = body;
    if (body && !(body instanceof FormData)) {
      requestBody = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      method: 'PUT',
      headers: getHeaders(options.headers || {}),
      body: requestBody,
    });
    return handleResponse(response);
  },
  
  delete: async (url, options = {}) => {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      method: 'DELETE',
      headers: getHeaders(options.headers || {}),
    });
    return handleResponse(response);
  }
};
