import axios from 'axios';

const reportApi = axios.create({
  baseURL: 'http://localhost:5000/api/reports',
  headers: {
    'Content-Type': 'application/json',
  },
});

reportApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.authorization = token;
  }
  return config;
});

export default reportApi;
