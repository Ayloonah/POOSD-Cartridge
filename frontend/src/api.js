const BASE_URL = 'http://localhost:5000/api';

export const api = {
  
  // get()
  get: async (endpoint, token = null) => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: headers,
    });
  },

  // post()
  post: async (endpoint, body, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });
  },

  // put()
  put: async (endpoint, body, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(body),
    });
  },

  // patch() 
  patch: async (endpoint, body, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(body),
    });
  },

  // delete()
  delete: async (endpoint, token = null) => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: headers,
    });
  }
};