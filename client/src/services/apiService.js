import axios from 'axios';
import { loggingService } from './loggingService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    loggingService.logError(error, { type: 'request_interceptor' });
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;

        case 403:
          console.error('Access forbidden:', data.message);
          break;

        case 404:
          console.error('Resource not found:', error.config.url);
          break;

        case 500:
          console.error('Server error:', data.message);
          break;
      }

      loggingService.logError(error, {
        type: 'api_error',
        status,
        url: error.config.url,
        method: error.config.method
      });
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server');
      loggingService.logError(error, { type: 'no_response' });
    } else {
      // Request setup error
      console.error('Request error:', error.message);
      loggingService.logError(error, { type: 'request_setup' });
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Content APIs
export const contentAPI = {
  generate: (params) => api.post('/content/generate', params),
  generateDaily: () => api.post('/content/generate-daily'),
  getAll: (filters) => api.get('/content', { params: filters }),
  getById: (id) => api.get(`/content/${id}`),
  approve: (id) => api.post(`/content/${id}/approve`),
  reject: (id, reason) => api.post(`/content/${id}/reject`, { reason }),
  schedule: (id, scheduledTime) => api.post(`/content/${id}/schedule`, { scheduled_time: scheduledTime }),
  publish: (id) => api.post(`/content/${id}/publish`),
  delete: (id) => api.delete(`/content/${id}`),
};

// Analytics APIs
export const analyticsAPI = {
  getDashboard: () => api.get('/candidate/dashboard'),
  getOverview: (days) => api.get('/analytics/overview', { params: { days } }),
  getPerformance: () => api.get('/analytics/performance'),
  getSentiment: (candidateId, dateRange) => api.get(`/analytics/sentiment/${candidateId}`, { params: dateRange }),
  getCompetitor: (candidateId) => api.get(`/analytics/competitor/${candidateId}`),
  getPredictions: (candidateId) => api.get(`/analytics/predictions/${candidateId}`),
  getEngagement: (candidateId, dateRange) => api.get(`/analytics/engagement/${candidateId}`, { params: dateRange }),
};

// Campaign APIs
export const campaignAPI = {
  getAll: () => api.get('/campaigns'),
  getById: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  getMetrics: (id) => api.get(`/campaigns/${id}/metrics`),
};

// Social Media APIs
export const socialAPI = {
  getMentions: (filters) => api.get('/social/mentions', { params: filters }),
  analyzeSentiment: (comment, language) => api.post('/social/analyze-sentiment', { comment, language }),
  markAsRead: (id) => api.put(`/social/mentions/${id}/read`),
  schedulePosts: (posts) => api.post('/social/schedule', posts),
  getScheduledPosts: () => api.get('/social/scheduled'),
  publishNow: (contentId, platforms) => api.post('/social/publish', { contentId, platforms }),
  getAccounts: () => api.get('/social/accounts'),
  connectAccount: (platform, credentials) => api.post(`/social/connect/${platform}`, credentials),
  disconnectAccount: (platform) => api.delete(`/social/disconnect/${platform}`),
};

// Mentions/Monitoring APIs
export const mentionsAPI = {
  getAll: (filters) => api.get('/social/mentions', { params: filters }),
  getById: (id) => api.get(`/social/mentions/${id}`),
  respond: (id, response) => api.post(`/social/mentions/${id}/respond`, { response }),
  markAsRead: (id) => api.put(`/social/mentions/${id}/read`),
  getSentimentTrends: () => api.get('/social/sentiment-trends'),
};

// Team APIs
export const teamAPI = {
  getMembers: () => api.get('/team/members'),
  invite: (email, role) => api.post('/team/invite', { email, role }),
  updateRole: (memberId, role) => api.put(`/team/members/${memberId}/role`, { role }),
  remove: (memberId) => api.delete(`/team/members/${memberId}`),
};

// Subscription/Billing APIs
export const billingAPI = {
  getSubscription: () => api.get('/billing/subscription'),
  updateSubscription: (plan) => api.post('/billing/subscription', { plan }),
  getBillingHistory: () => api.get('/billing/history'),
  getUsage: () => api.get('/billing/usage'),
};

// Admin APIs
export const adminAPI = {
  getAllUsers: (filters) => api.get('/admin/users', { params: filters }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getSystemStats: () => api.get('/admin/stats'),
  getAIUsage: () => api.get('/admin/ai-usage'),
};

export default api;
