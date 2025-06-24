const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin
  : 'http://localhost:3001';

const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? window.location.origin
  : 'http://localhost:3001';

export { API_BASE_URL, SOCKET_URL };
