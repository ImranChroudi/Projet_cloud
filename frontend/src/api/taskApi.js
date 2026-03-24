import axios from 'axios';

const taskAPI = axios.create({
  baseURL: 'http://localhost:5003',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default taskAPI;
