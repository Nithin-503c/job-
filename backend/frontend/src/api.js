// Thin fetch wrapper for the JOB+ backend. Keeps the JWT in localStorage and
// attaches it to every request automatically.

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const TOKEN_KEY = 'jobplus_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // no JSON body
  }

  if (!res.ok) {
    const message = (data && data.message) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  registerInitiate: (payload) => request('/auth/register/initiate', { method: 'POST', body: payload }),
  registerVerify: (payload) => request('/auth/register/verify', { method: 'POST', body: payload }),
  registerResend: (email) => request('/auth/register/resend', { method: 'POST', body: { email } }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
  updateProfile: (payload) => request('/auth/profile', { method: 'PUT', body: payload }),
  uploadPhoto: (file) => {
    const form = new FormData();
    form.append('photo', file);
    return request('/auth/photo', { method: 'POST', body: form, isForm: true });
  },

  // Jobs
  listJobs: () => request('/jobs'),
  listMyJobs: () => request('/jobs/mine'),
  listAppliedJobs: () => request('/jobs/applied'),
  getJob: (id) => request(`/jobs/${id}`),
  createJob: (payload) => request('/jobs', { method: 'POST', body: payload }),

  // Applications
  applyToJob: (jobId, message) => request(`/jobs/${jobId}/apply`, { method: 'POST', body: { message } }),
  getApplicationsForJob: (jobId) => request(`/jobs/${jobId}/applications`),
  getMyApplicationForJob: (jobId) => request(`/jobs/${jobId}/my-application`),
  acceptApplication: (applicationId) => request(`/applications/${applicationId}/accept`, { method: 'POST' }),

  // Completion & payment
  markJobDone: (jobId) => request(`/jobs/${jobId}/complete`, { method: 'POST' }),
  getPaymentQr: (jobId) => request(`/jobs/${jobId}/qr`),
  rateJob: (jobId, rating, feedback) => request(`/jobs/${jobId}/rate`, { method: 'POST', body: { rating, feedback } }),
};
