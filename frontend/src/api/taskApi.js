import axios from 'axios';

const taskAPI = axios.create({
  baseURL: 'http://localhost:5003',
  headers: {
    'Content-Type': 'application/json',
  },
});

taskAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.authorization = token;
  }
  return config;
});

export default taskAPI;
