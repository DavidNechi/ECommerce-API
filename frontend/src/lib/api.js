const API_BASAE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4001";

async function request(endpoint, options = {}) {
    const response = await fetch(`${API_BASAE_URL}${endpoint}`, {
        credentials: 'include',
        headers: {
             'Content-Type': 'application/json',
             ...(options.headers || {}),
        },
        ...options,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : null;

    if(!response.ok) {
        const message = (isJson && payload.message) || response.statusText || 'An error occurred';

        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        throw error;
    }
    
    return payload;
}

export const api = {
    get: (endpoint) => request(endpoint, { method: 'GET' }),
    post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body || {}) }),
    put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body || {}) }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
}