import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Server Error';
    if (!error.response) {
      message = 'Network Error';
    } else if (error.response.status === 401) {
      message = 'Session Expired';
    } else if (error.response.status === 400) {
      const serverMessage = error.response.data?.message || '';
      const lowerServerMsg = serverMessage.toLowerCase();
      if (lowerServerMsg.includes('duplicate email') || lowerServerMsg.includes('email already exists') || lowerServerMsg.includes('email registration')) {
        message = 'Duplicate Email';
      } else if (lowerServerMsg.includes('duplicate phone') || lowerServerMsg.includes('phone already exists') || lowerServerMsg.includes('phone number')) {
        message = 'Duplicate Phone Number';
      } else {
        message = serverMessage || 'Invalid Input';
      }
    } else if (error.response.status === 409) {
      const serverMessage = error.response.data?.message || '';
      const lowerServerMsg = serverMessage.toLowerCase();
      if (lowerServerMsg.includes('email')) {
        message = 'Duplicate Email';
      } else if (lowerServerMsg.includes('phone')) {
        message = 'Duplicate Phone Number';
      } else {
        message = 'Duplicate Entry';
      }
    } else {
      message = 'Server Error';
    }
    
    const customError = new Error(message);
    customError.status = error.response?.status;
    customError.response = error.response || { data: {} };
    if (!customError.response.data) {
      customError.response.data = {};
    }
    customError.response.data.message = message;
    
    return Promise.reject(customError);
  }
);

export default api;
