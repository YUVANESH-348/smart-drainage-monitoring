import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 8000
});

export const api = {
  getStatus: (params = {}) => client.get('/status', { params }).then((res) => res.data),
  getLatestReading: (params = {}) => client.get('/readings/latest', { params }).then((res) => res.data),
  getReadings: (params = {}) => client.get('/readings', { params }).then((res) => res.data),
  getTrend: (params = {}) => client.get('/readings/trend', { params }).then((res) => res.data),
  getAnalytics: (params = {}) => client.get('/analytics', { params }).then((res) => res.data)
};

export default api;
