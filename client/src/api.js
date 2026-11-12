import axios from 'axios';

// withCredentials sends the session cookie with every request
const api = axios.create({ baseURL: '/api', withCredentials: true });

// Turn any API error into a readable message
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || (err?.request && !err.response ? 'Cannot reach the server.' : fallback);

export default api;
