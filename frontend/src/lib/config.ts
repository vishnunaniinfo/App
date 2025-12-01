import { Config } from '../types';

// Configuration object
export const config: Config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  appName: import.meta.env.VITE_APP_NAME || 'Xavira Lead Engine',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VALIDATE: '/auth/validate',
  },
  // Users
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    GET: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    STATS: (id: string) => `/users/${id}/stats`,
    TEAM_PERFORMANCE: '/users/team/performance',
    RESET_PASSWORD: (id: string) => `/users/${id}/reset-password`,
    TOGGLE_STATUS: (id: string) => `/users/${id}/toggle-status`,
    BULK_STATUS: '/users/bulk/status',
    BULK_DELETE: '/users/bulk/delete',
  },
  // Projects
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    GET: (id: string) => `/projects/${id}`,
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
  },
  // Leads
  LEADS: {
    LIST: '/leads',
    CREATE: '/leads',
    GET: (id: string) => `/leads/${id}`,
    UPDATE: (id: string) => `/leads/${id}`,
    DELETE: (id: string) => `/leads/${id}`,
    ACTIVITIES: (id: string) => `/leads/${id}/activities`,
    MOVE_STAGE: (id: string) => `/leads/${id}/move-stage`,
  },
  // Pipeline
  PIPELINE: {
    STAGES: '/pipeline/stages',
    BOARD: '/pipeline/board',
    MOVE: '/pipeline/move',
  },
  // Automation
  AUTOMATION: {
    SEQUENCES: '/automation/sequences',
    CREATE_SEQUENCE: '/automation/sequences',
    GET_SEQUENCE: (id: string) => `/automation/sequences/${id}`,
    UPDATE_SEQUENCE: (id: string) => `/automation/sequences/${id}`,
    DELETE_SEQUENCE: (id: string) => `/automation/sequences/${id}`,
    PREVIEW_SEQUENCE: (id: string) => `/automation/sequences/${id}/preview`,
  },
  // Templates
  TEMPLATES: {
    LIST: '/templates',
    CREATE: '/templates',
    GET: (id: string) => `/templates/${id}`,
    UPDATE: (id: string) => `/templates/${id}`,
    DELETE: (id: string) => `/templates/${id}`,
    PREVIEW: (id: string) => `/templates/${id}/preview`,
  },
  // WhatsApp
  WHATSAPP: {
    CONFIG: '/whatsapp/config',
    SEND: '/whatsapp/send',
    SEND_BULK: '/whatsapp/send-bulk',
    LOGS: '/whatsapp/logs',
  },
  // Dashboard
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
    METRICS: '/dashboard/metrics',
    TIMELINE: '/dashboard/timeline',
  },
  // Public webhooks
  PUBLIC: {
    LEAD_WEBHOOK: '/public/webhook/lead',
    WHATSAPP_WEBHOOK: '/public/webhook/whatsapp',
  },
  // Utility
  HEALTH: '/health',
  DOCS: '/api-docs',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

// File upload limits
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ALLOWED_CSV_TYPES: ['text/csv', 'application/csv'],
} as const;

// Date formats
export const DATE_FORMATS = {
  API: 'YYYY-MM-DD',
  API_DATETIME: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm',
  DISPLAY_TIME: 'HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
} as const;

// Timezones
export const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Shanghai', label: 'China Standard Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { value: 'Australia/Sydney', label: 'Sydney' },
] as const;

// Currencies
export const CURRENCIES = [
  { value: 'USD', symbol: '$', name: 'US Dollar' },
  { value: 'EUR', symbol: '€', name: 'Euro' },
  { value: 'GBP', symbol: '£', name: 'British Pound' },
  { value: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { value: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { value: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
] as const;

// Lead stages
export const LEAD_STAGES = [
  { value: 'NEW', label: 'New', color: 'bg-gray-100 text-gray-800' },
  { value: 'CONTACTED', label: 'Contacted', color: 'bg-blue-100 text-blue-800' },
  { value: 'HOT', label: 'Hot', color: 'bg-amber-100 text-amber-800' },
  { value: 'VISITING', label: 'Visiting', color: 'bg-purple-100 text-purple-800' },
  { value: 'BOOKED', label: 'Booked', color: 'bg-green-100 text-green-800' },
  { value: 'LOST', label: 'Lost', color: 'bg-red-100 text-red-800' },
] as const;

// User roles
export const USER_ROLES = [
  { value: 'ADMIN', label: 'Admin', description: 'Full access to all features and settings' },
  { value: 'MANAGER', label: 'Manager', description: 'Manage team, projects, leads, and automation' },
  { value: 'AGENT', label: 'Agent', description: 'Manage assigned leads and basic features' },
] as const;

// Lead sources
export const LEAD_SOURCES = [
  { value: 'website', label: 'Website', icon: 'globe' },
  { value: 'facebook', label: 'Facebook Ads', icon: 'facebook' },
  { value: 'instagram', label: 'Instagram', icon: 'instagram' },
  { value: 'google', label: 'Google Ads', icon: 'google' },
  { value: 'referral', label: 'Referral', icon: 'users' },
  { value: 'manual', label: 'Manual Entry', icon: 'pencil' },
  { value: 'email', label: 'Email', icon: 'envelope' },
  { value: 'phone', label: 'Phone', icon: 'phone' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
  { value: 'other', label: 'Other', icon: 'more-horizontal' },
] as const;

// WhatsApp providers
export const WHATSAPP_PROVIDERS = [
  { value: 'TWILIO', label: 'Twilio', description: 'Official WhatsApp Business API' },
  { value: 'ULTRAMSG', label: 'UltraMsg', description: 'Third-party WhatsApp service' },
  { value: 'MOCK', label: 'Mock', description: 'Development/testing only' },
] as const;

// Activity types
export const ACTIVITY_TYPES = [
  { value: 'NOTE', label: 'Note', icon: 'sticky-note', color: 'blue' },
  { value: 'CALL', label: 'Call', icon: 'phone', color: 'green' },
  { value: 'EMAIL', label: 'Email', icon: 'envelope', color: 'purple' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: 'whatsapp', color: 'green' },
  { value: 'STAGE_CHANGE', label: 'Stage Change', icon: 'arrow-right', color: 'orange' },
  { value: 'ASSIGNMENT', label: 'Assignment', icon: 'user-plus', color: 'indigo' },
] as const;

// Message status
export const MESSAGE_STATUS = [
  { value: 'PENDING', label: 'Pending', color: 'gray' },
  { value: 'QUEUED', label: 'Queued', color: 'yellow' },
  { value: 'SENT', label: 'Sent', color: 'blue' },
  { value: 'DELIVERED', label: 'Delivered', color: 'green' },
  { value: 'READ', label: 'Read', color: 'emerald' },
  { value: 'FAILED', label: 'Failed', color: 'red' },
  { value: 'REPLIED', label: 'Replied', color: 'purple' },
] as const;

// Automation triggers
export const AUTOMATION_TRIGGERS = [
  { value: 'LEAD_CREATED', label: 'Lead Created', description: 'When a new lead is created' },
  { value: 'STAGE_CHANGED', label: 'Stage Changed', description: 'When a lead stage changes' },
  { value: 'MANUAL', label: 'Manual', description: 'Triggered manually' },
] as const;

// Business hours
export const BUSINESS_HOURS = {
  START_OPTIONS: Array.from({ length: 24 }, (_, i) => ({
    value: i.toString().padStart(2, '0') + ':00',
    label: `${i.toString().padStart(2, '0')}:00`,
  })),
  END_OPTIONS: Array.from({ length: 24 }, (_, i) => ({
    value: i.toString().padStart(2, '0') + ':00',
    label: `${i.toString().padStart(2, '0')}:00`,
  })),
  DAYS: [
    { value: 'MONDAY', label: 'Monday', short: 'Mon' },
    { value: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
    { value: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
    { value: 'THURSDAY', label: 'Thursday', short: 'Thu' },
    { value: 'FRIDAY', label: 'Friday', short: 'Fri' },
    { value: 'SATURDAY', label: 'Saturday', short: 'Sat' },
    { value: 'SUNDAY', label: 'Sunday', short: 'Sun' },
  ],
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'xavira_access_token',
  REFRESH_TOKEN: 'xavira_refresh_token',
  USER: 'xavira_user',
  BUILDER: 'xavira_builder',
  THEME: 'xavira_theme',
  PREFERENCES: 'xavira_preferences',
  LAST_VISIT: 'xavira_last_visit',
  ONBOARDING_COMPLETED: 'xavira_onboarding_completed',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  OFFLINE_ERROR: 'You appear to be offline. Please check your connection.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
  REGISTER_SUCCESS: 'Registration successful!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  LEAD_CREATED: 'Lead created successfully!',
  LEAD_UPDATED: 'Lead updated successfully!',
  LEAD_DELETED: 'Lead deleted successfully!',
  PROJECT_CREATED: 'Project created successfully!',
  PROJECT_UPDATED: 'Project updated successfully!',
  PROJECT_DELETED: 'Project deleted successfully!',
  USER_CREATED: 'User created successfully!',
  USER_UPDATED: 'User updated successfully!',
  USER_DELETED: 'User deleted successfully!',
  TEMPLATE_CREATED: 'Template created successfully!',
  TEMPLATE_UPDATED: 'Template updated successfully!',
  TEMPLATE_DELETED: 'Template deleted successfully!',
  AUTOMATION_CREATED: 'Automation sequence created successfully!',
  AUTOMATION_UPDATED: 'Automation sequence updated successfully!',
  AUTOMATION_DELETED: 'Automation sequence deleted successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

// Navigation routes
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  LEADS: '/leads',
  LEAD_DETAIL: (id: string) => `/leads/${id}`,
  PIPELINE: '/pipeline',
  AUTOMATION: '/automation',
  TEMPLATES: '/templates',
  USERS: '/users',
  SETTINGS: '/settings',
} as const;

// Theme
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export default config;