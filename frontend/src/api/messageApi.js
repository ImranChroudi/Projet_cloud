import axios from 'axios';

const messageApi = axios.create({
  baseURL: 'http://localhost:3003',
  headers:{
    'Content-Type': 'application/json',
    authorization : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YjU5NDc1NzYyYmVjZjdmMjlkZjUzOSIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20iLCJpYXQiOjE3NzM1ODI2ODZ9.qrzLr2wqXBNLjJPDiSDzsf-WpRhknXVf70RF1KkhYEo"
  }
});

export default messageApi;
